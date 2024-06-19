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
  }

  const form = document.getElementById("form");
  const input = document.getElementById("input");
  const messages = document.getElementById("messages");
  const typingIndicator = document.getElementById("typingIndicator");

  let typingTimeout;

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
      socket.emit("SMessage", {
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
    messagePush({}, true);
  });

  // Gérer la réception d'historiques des messages
  socket.on("CHistoryMessage", (data) => {
    let history = JSON.parse(data.history);
    if (history.length > 0) {
      history.forEach((history) => messagePush(history));
    }
    console.log(data);
  });

  // Connecter l'arrivant au chat general
  socket.on("connect", () => {
    // On émet un message d'entrée dans une salle
    socket.emit("SJoinRoom", "general");
  });

  // Reception de session
  socket.on("session", ({ sessionID, userID }) => {
    // On attache sessionID pour la prochaine re-connexion
    socket.auth = { sessionID };
    // save id session
    localStorage.setItem("sessionID", sessionID);

    socket.userID = userID;
  });

  // Sélection de tous les onglets tabs et parcours des élément
  // Sur chaque élément on écoute l'événement click
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

  // Recevoir des messages des autres clients
  socket.on("CMessage", (data) => {
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

    //  console.log(data);

    if (data.id === socket.userID) {
      bubbleColor = "text-warning";
      bubbleInfos = "text-secondary";
      item.classList.add("d-flex", "justify-content-end");
      // item.innerHTML +='<span class="badge rounded-pill bg-success rounded-circle float-start">&nbsp;</span>';
    } else {
      bubbleColor = "text-primary";
      bubbleInfos = "text-secondary";
      item.classList.add("d-flex", "justify-content-start");
      // item.innerHTML +='<span class="badge rounded-pill bg-danger rounded-circle float-start">&nbsp;</span>';
    }

    const bubbleChat = disconnect
      ? `<div class="d-flex align-items-center ${data.id !== socket.userID ? "flex-row" : "flex-row-reverse"
      }">utilisateur déconnecter</div>`
      : `<div class="d-flex align-items-center ${data.id !== socket.userID ? "flex-row" : "flex-row-reverse"
      }">
    <div class="img_cont">
    <img src="https://placehold.co/100x100" class="rounded-circle user_img">
    <span class="online_icon offline"></span>
  </div>
  <div class="user_info p-2">
    <span>${data.msg}</span>
    <p>${socket.id} >${Date.now()}</p>
  </div>
</div>`;

    item.innerHTML = bubbleChat;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
  }
});