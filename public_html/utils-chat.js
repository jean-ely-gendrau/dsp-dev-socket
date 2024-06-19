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

document.addEventListener("DOMContentLoaded", function () {

  const socket = io();
  const sessionID = localStorage.getItem("sessionID");

  if (sessionID) {
    this.usernameAlreadySelected = true;
    socket.auth = { sessionID };
    socket.connect();
  } else {
    $('#ModalConnect').modal('show')
  }

  const form = document.getElementById("form");
  const input = document.getElementById("input");
  const messages = document.getElementById("messages");
  const usersList = document.getElementById("usersList");
  const typingIndicator = document.getElementById("typingIndicator");

  let typingTimeout;

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
    if (users) {
      let user = JSON.parse(users);
      console.log(user);
      usersList.innerHTML = "";
      user.forEach(user => {
        const item = document.createElement('li');
        item.setAttribute('class', "person");
        item.setAttribute('data-chat', user.id);

        item.innerHTML = `<div class="user">
                      <img
                        src="https://www.bootdey.com/img/Content/avatar/avatar${user.avatarID}.png"
                        alt="${socket.userID}"
                      />
                        <span class="status busy"></span>
                      </div>
                      <p class="name-time">
                        <span class="name">${socket.userID}</span>
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
  input.addEventListener("input", handleTyping);

  // Gérer l'envoi des messages
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // Sélection du chat en cours
    const chatRoomSelect =
      document.querySelector("#navtabs li.active").dataset.room;

    if (input.value) {
      console.log(chatRoomSelect);
      socket.emit("SMessage", {
        id: socket.userID,
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
  socket.on("CSession", ({ sessionID, userID }) => {
    // On attache sessionID pour la prochaine re-connexion
    socket.auth = { sessionID };
    // save id session
    localStorage.setItem("sessionID", sessionID);

    socket.userID = userID;
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
    const bubbleDate = new Date().toLocaleTimeString("fr-FR");
    const item = document.createElement("li");

    console.log(data, socket.userID);
    let messageUser = `<div class="d-flex align-items-center ${data.id !== socket.userID ? "flex-row" : "flex-row-reverse"
      }">${socket.userID} quitte la salle de discution</div>`;

    // On prépare l'affichage du côter droit du tchat pour l'utilisateur du chat et disconnecte est false
    if (data.id === socket.userID && !disconnect) {
      bubbleColor = "text-warning";
      bubbleInfos = "text-secondary";
      item.classList.add("chat-right");
      messageUser = `<div class="chat-avatar">
                      <img src="https://www.bootdey.com/img/Content/avatar/avatar3.png" alt="${data.id}">
                      <div class="chat-name">${data.id}</div>
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
                          <img src="https://www.bootdey.com/img/Content/avatar/avatar5.png" alt="${data.id}">
                        <div class="chat-name">${data.id}</div>
                    </div>`;
      // item.innerHTML +='<span class="badge rounded-pill bg-danger rounded-circle float-start">&nbsp;</span>';
    }

    item.innerHTML = messageUser;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
  }
});
