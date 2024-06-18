const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const SessionStorage = require('./SessionStore');
const sessionStorage = new SessionStorage();
const app = express();
const server = createServer(app);
const io = new Server(server, {});

let historyMessageRoom = [];

app.use(express.static(__dirname + '/'));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});
/*
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});
*/

io.use((socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  //DEBUG console.log('sessionID', sessionID, sessionStorage.findAllSession());
  if (sessionID) {
    // Cherche si une session est dans le sessionStorage
    const session = sessionStorage.findSession(sessionID);
    //DEBUG console.log('session', session);
    if (session) {
      // Définition des ids de session
      socket.sessionID = sessionID;
      socket.userId = session.userID;
      socket.username = session.username;
      return next();
    }
  }

  const usename = 'default';
  //socket.handshake.auth.username;

  if (!usename) {
    return next(new Error("invalide username"));
  }

  // Initialise une nouvelle session
  socket.sessionID = Math.floor(Math.random() * Date.now()).toString(4);;
  socket.userID = Math.floor(Math.random() * Date.now()).toString(4);;
  socket.username = usename;
  next();
})

io.on('connection', (socket) => {
  console.log(`${socket.userID}  s'est connecté`);

  // Détails session users
  socket.emit('session', {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  socket.on('STyping', () => {
    socket.broadcast.emit('CTyping', `${socket.userID} est en train d'écrire...`);
  });

  socket.on('SStopTyping', () => {
    socket.broadcast.emit('CStopTyping');
  });

  socket.on('SMessage', (data) => {
    console.log('data', data);
    historyMessageRoom = [...historyMessageRoom, { id: socket.userID, msg: data.message, room: data.chatRoom, createdAt: data.createdAt }];
    io.emit('CMessage', { msg: data.message, id: socket.userID });
  });

  socket.on('disconnect', async () => {
    //DEBUG console.log(socket.rooms);
    const matchingSockets = await io.in(socket.userID).fetchSockets();
    const isDisconnected = matchingSockets.length === 0;
    //DEBUG console.log('isDisconnected', isDisconnected);
    if (isDisconnected) {
      //DEBUG console.log('matchingSockets', matchingSockets);
      // notification
      socket.broadcast.emit("CUserDisconnected", socket.userID);
      // Enregistrement des informations users dans la session réferencer par socket.sessionID
      sessionStorage.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: false,
      });
    }
    console.log(`${socket.userID} s'est déconnecté`);
  });

  // On écoute les entrées dans les salles
  socket.on("SJoinRoom", (room) => {
    // On entre dans la salle demandée
    //console.log('room', room);

    // Réstitution des message stocker dans le tableau d'objet messages
    //console.log('historyMessageRoom.length', historyMessageRoom.length, historyMessageRoom)
    if (historyMessageRoom.length > 0) {

      let messageRoom = historyMessageRoom.map((value => value)).filter(historyMessage => historyMessage.room === room);
      console.log(messageRoom);
      // Réstitution des messages celon la salle de chat active par le client
      socket.emit("CHistoryMessage", { history: JSON.stringify(messageRoom) });
    }
    // Joindre la salle de chat
    socket.join(room);
    //console.log(socket.rooms);
  });

  // On écoute les sorties dans les salles
  socket.on("SleaveRoom", (room) => {
    // On quitte la salle demandée
    socket.leave(room);
    //DEBUG console.log(socket.rooms);
  });
});


server.listen(8000, () => {
  console.log('server running at http://localhost:8000');
});