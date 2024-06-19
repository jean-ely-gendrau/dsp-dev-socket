const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const path = require('node:path');
const { Server } = require('socket.io');

const UserStorage = require('./storage/UserStore');
const SessionStorage = require('./storage/SessionStore');

const sessionStorage = new SessionStorage();//Stockage Session
const userStorage = new UserStorage();//Stockage User

const app = express();
const server = createServer(app);
const io = new Server(server, {});

let historyMessageRoom = [];
let chatRoomList = [
  'Discution',
  'NodeJS',
  'ReactJS',
]
/****************************
 * ROUTEUR API
 */
app.set('view engine', 'pug');
app.use(express.static('public_html'));
/*
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './public_html', 'index.html'));
});

app.get('/test', (req, res) => {
  res.render('test', { youAreUsingPug: true, pageTitle: "ma page tyest", fooz: true });
});
*/
app.get('/', (req, res) => {
  res.render('index', { titlePage: "TchatGo", home: true, chatRoomList: chatRoomList });
});

app.get('/channel/:channel', (req, res) => {
  res.render('index', { titlePage: `TchatGo ${req.params.channel}`, activeChannel: req.params.channel.replace('-', ''), chatRoomList: chatRoomList });
});

/***************************
 * MIDDLEWARE IO SESSION
 */
io.use((socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  console.log('sessionID', sessionID, sessionStorage.findAllSession());
  if (sessionID) {
    // Cherche si une session est dans le sessionStorage
    const session = sessionStorage.findSession(sessionID);
    console.log('session', session);
    if (session) {
      // Définition des ids de session
      socket.sessionID = sessionID;
      socket.userID = session.userID;
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

/**********************
 * IO CONNECTION
 */
io.on('connection', (socket) => {
  console.log(`${socket.userID ?? socket.id}  s'est connecté`);

  idAvatarRandom = Math.ceil(Math.random() * (9 - 1) + 1);
  userStorage.saveUser(socket.sessionID,
    {
      id: socket.userID,
      avatarID: idAvatarRandom,
    }
  );
  // Détails session users
  socket.emit('CSession', {
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
    //DEBUG console.log('data', data);
    historyMessageRoom = [...historyMessageRoom, { id: data.id, msg: data.message, room: data.chatRoom, createdAt: data.createdAt }];
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
    console.log(`${socket.userID ?? socket.id} s'est déconnecté`);
  });

  // On écoute les entrées dans les salles
  socket.on("SJoinRoom", (room) => {

    const rooms = io.of(`/`).adapter.rooms;
    const sids = io.of("/").adapter.sids;
    console.log(rooms, sids, userStorage.findAllUser());
    socket.emit("CAddUser", { users: JSON.stringify(userStorage.findAllUser()) });
    // Réstitution des message stocker dans le tableau d'objet messages
    console.log('historyMessageRoom.length', historyMessageRoom.length, historyMessageRoom)
    if (historyMessageRoom.length > 0) {

      let messageRoom = historyMessageRoom.map((value => value)).filter(historyMessage => historyMessage.room === room);
      console.log('messageRoom', messageRoom);
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

/*****************
 * SERVER LISTEN
 */
server.listen(8000, () => {
  console.log('server running at http://localhost:8000');
});