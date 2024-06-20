function secondsToTime(e) {
  const date = Date.now() - e;
  const h = Math.floor(date / 3600)
    .toString()
    .padStart(2, "0"),
    m = Math.floor((date % 3600) / 60)
      .toString()
      .padStart(2, "0"),
    s = Math.floor(date % 60)
      .toString()
      .padStart(2, "0");

  //   return h + ':' + m + ':' + s;
  return `${h}:${m}:${s}`;
}
const getClientSideCookie = (name) => {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];

}

async function fetchApi({ route, data }) {
  const response = await fetch(`http://${window.location.servername}${route}`, {
    method: "POST", // or 'PUT'
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(Object.fromEntries(data)),
  });
  const sessionID = await response.json();
  return sessionID;
}

let notification = `<div class="toast-container position-absolute top-0 end-0 p-3">
                      <div class="toast align-items-center" role="alert" aria-live="assertive" aria-atomic="true">
                        <div class="d-flex">
                          <div class="toast-body">
                          %MESSAGE%
                        </div>
                          <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                        </div>
                      </div>
                    </div>`;

function onUsernameSelection(username) {
  let usernameAlreadySelected = true;
  socket.auth = { username };
  socket.connect();
}

document.addEventListener("DOMContentLoaded", function () {

  const socket = io();

  socket.on("connect_error", (err) => {
    if (err.message === "invalid username") {
      usernameAlreadySelected = false;
    }
  });

  socket.onAny((event, ...args) => {
    console.log('event arg', event, args);
  });
  const username = getClientSideCookie('username');
  const sessionID = localStorage.getItem("sessionID") ?? getClientSideCookie('sessionID');
  console.log(sessionID);
  if (sessionID) {
    this.usernameAlreadySelected = true;
    socket.auth = { sessionID, username };

    const form = document.getElementById("form");
    const input = document.getElementById("input");
    const messages = document.getElementById("messages");
    const usersList = document.getElementById("usersList");
    const typingIndicator = document.getElementById("typingIndicator");

    let typingTimeout;


    socket.connect();

    // Connecter l'arrivant au chat general
    socket.on("connect", () => {
      console.log('connect');

      // On émet un message d'entrée dans une salle
      socket.emit("SJoinRoom", active);

      // REPRENDRE ICI DANS LES TEMPLATE 
      // LA STRUCTUR à été repris avec pugs certain fichier reste à convertir

      // Il faut place ce text et ajoute les notication de join au tchat ainsi que rajouter une boucle sur connect 
      // afin de joindre tous les tchat déjà join lors d'un refresh 
    });


    socket.on("CAddUser", ({ users }) => {
      if (users && usersList) {
        let user = JSON.parse(users);
        console.log('user', user);
        usersList.innerHTML = "";
        user.forEach(user => {
          const item = document.createElement('li');
          item.setAttribute('class', "person");
          item.setAttribute('data-chat', user.username);

          item.innerHTML = `<div class="user">
                      <img
                        src="https://www.bootdey.com/img/Content/avatar/avatar${user.avatarID}.png"
                        alt="${socket.username}"
                      />
                        <span class="status busy"></span>
                      </div>
                      <p class="name-time">
                        <span class="name">${socket.username}</span>
                        <span class="time">${secondsToTime(new Date())}</span>
                      </p>
                      `;

          usersList.appendChild(item);
          console.log(socket.userID);
        });
      }
    })

    // Gérer l'affichage et l'émission des indicateurs de frappe
    function handleTyping() {
      if (input.value.trim() === "") {
        clearTimeout(typingTimeout);
        socket.emit("SStopTyping");
        typingIndicator.classList.remove("d-block");
        typingIndicator.classList.add("d-none");
      } else {
        if (!typingTimeout) {
          socket.emit("STyping");
        }
      }
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit("SStopTyping");
        typingIndicator.classList.remove("d-block");
        typingIndicator.classList.add("d-none");
      }, 5000);
    }

    // Attacher l'écouteur de frappe sur l'input
    input?.addEventListener("input", handleTyping);

    // Gérer l'envoi des messages
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      // Sélection du chat en cours
      const chatRoomSelect =
        document.querySelector("#navtabs li.active").dataset.room;

      if (input.value) {
        console.log(socket.auth);
        socket.emit("SMessage", {
          id: socket.userID,
          avatarID: socket.avatarID,
          username: socket.username,
          message: input.value,
          chatRoom: chatRoomSelect,
          createdAt: new Date(),
        });
        input.value = "";
        clearTimeout(typingTimeout);
        socket.emit("SStopTyping");
      }
    });

    // Gérer la notification de déconnexion
    socket.on("CUserDisconnected", (data) => {
      // Envoie une message au personne abonné à l'évenement 
      messagePush({}, true);
    });

    // Gérer la réception d'historiques des messages
    socket.on("CHistoryMessage", (data) => {
      let history = JSON.parse(data.history);
      if (history.length > 0) {
        history.forEach((history) => messagePush(history));
      }
      console.log(history);
    });


    // Reception de session
    socket.on("CSession", ({ sessionID, userID, username, avatarID }) => {
      // On attache sessionID pour la prochaine re-connexion
      socket.auth = { sessionID, username };
      // save id session
      console.log(sessionID, userID, username, avatarID);
      localStorage.setItem("sessionID", sessionID);

      socket.userID = userID;
      socket.username = username;
      socket.avatarID = avatarID;
    });

    // Sélection de tous les onglets tabs et parcours des élément
    // Sur chaque élément on écoute l'événement click
    /*
      document.querySelectorAll("#navtabs li").forEach((tab) => {
        tab.addEventListener("click", function () {
          // On vérifie si la class active n'est pas présente et que dataset.action n'existe pas
          if (!this.classList.contains("active") && !this.dataset.action) {
            // Sélection du précedant élément actif
            const actif = document.querySelector("#navtabs li.active");
            // Suppréssion de la class activ sur le précédant élément
            actif?.classList.remove("active");
            // On passe actif l'élément sélectionné
            this?.classList.add("active");
            // On sélectionne et vide l'élément message
            document.querySelector("#messages").innerHTML = "";
            // On quitte le thcat en cours (dataset)
            socket.emit("SLeaveRoom", actif.dataset.room);
            // On join le chat selectionné (dataset)
            socket.emit("SJoinRoom", this.dataset.room);
          }
          // Si on sélection onglet home
          else if (this.dataset.action === "panel") {
            // Sélection du précedant élément actif
            const actif = document.querySelector("#navtabs li.active");
            // Suppréssion de la class activ sur le précédant élément
            actif?.classList.remove("active");
            // On passe actif l'élément sélectionné
            this?.classList.add("active");
            //console.log(tab);
          }
        });
     
      });
    */
    // Recevoir des messages des autres clients
    socket.on("CMessage", (data) => {
      console.log('cdata', data);
      messagePush(data);
    });

    // Recevoir des indicateurs de frappe d'autres clients
    socket.on("CTyping", function (message) {
      typingIndicator.classList.remove("d-none");
      typingIndicator.classList.add("d-block");
      typingIndicator.innerText = message;
    });

    // Arrêter d'afficher l'indicateur de frappe
    socket.on("CStopTyping", function () {
      typingIndicator.classList.remove("d-block");
      typingIndicator.classList.add("d-none");
    });

    // fonctionnalité d'envoie de message
    function messagePush(data, disconnect = false) {
      if (messages) {
        const bubbleDate = new Date().toLocaleTimeString("fr-FR");
        const item = document.createElement("li");

        console.log(data, socket.userID);
        let messageUser = `<div class="d-flex align-items-center ${data.id !== socket.userID ? "flex-row" : "flex-row-reverse"
          }">${socket.username} quitte la salle de discution</div>`;

        // On prépare l'affichage du côter droit du tchat pour l'utilisateur du chat et disconnecte est false
        if (data.id === socket.userID && !disconnect) {
          bubbleColor = "text-warning";
          bubbleInfos = "text-secondary";
          item.classList.add("chat-right");
          messageUser = `<div class="chat-avatar">
                      <img src="https://www.bootdey.com/img/Content/avatar/avatar${data.avatarID}.png" alt="${data.username}">
                      <div class="chat-name">${data.username}</div>
                      </div>
                      <div class="chat-text">${data.msg}</div>
                      <div class="chat-hour">${secondsToTime(Date.now())}<span class="fa fa-check-circle"></span></div>`;
          // item.innerHTML +='<span class="badge rounded-pill bg-success rounded-circle float-start">&nbsp;</span>';
        }
        // On prépare l'affichage du côter gauche du tchat si disconnecte est false
        else if (!disconnect) {
          bubbleColor = "text-primary";
          bubbleInfos = "text-secondary";
          item.classList.add("chat-left");
          messageUser = `<div class="chat-hour">${secondsToTime(Date.now())} <span class="fa fa-check-circle"></span></div>
                        <div class="chat-text">${data.msg}</div>
                        <div class="chat-avatar">
                          <img src="https://www.bootdey.com/img/Content/avatar/avatar${data.avatarID}.png" alt="${data.username}">
                        <div class="chat-name">${data.username}</div>
                    </div>`;
          // item.innerHTML +='<span class="badge rounded-pill bg-danger rounded-circle float-start">&nbsp;</span>';
        }

        item.innerHTML = messageUser;
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
      }
    }

  }
  else {
    /********************
     * LOGIN
     */
    $('#ModalConnect').modal('show');
    const buttonConnect = document.getElementById('sendFormConnect');
    const formConnect = document.getElementById('formConnect');
    console.log(buttonConnect, formConnect)
    if (buttonConnect && formConnect) {
      buttonConnect?.addEventListener("submit", function (e) {
        e.preventDefault();
        const data = new FormData(e.target);

        formConnect.submit();
      });

    }
  }

});
