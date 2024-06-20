const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const path = require('node:path');
const { Server } = require('socket.io');
let bodyParser = require('body-parser');

const UserStorage = require('./storage/UserStore');
const SessionStorage = require('./storage/SessionStore');

const sessionStorage = new SessionStorage();//Stockage Session
const userStorage = new UserStorage();//Stockage User

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
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
function isLogin(req, res, next) {
  // Check if the requesting user is marked as admin in database
  let isLogin = sessionStorage.findSession(req.session.sessionID);
  if (isLogin) {
    next();
  } else {
    res.redirect('/');
  }
}
  */
async function findUser(id) {
  return await userStorage.findUser(id)
}
function saveUser(socket) {
  let idAvatarRandom = Math.ceil(Math.random() * (9 - 1) + 1);

  socket.avatarID = idAvatarRandom;

  let users = {
    id: socket.userID,
    username: socket.username,
    avatarID: idAvatarRandom,
    createdAt: Date.now()
  };

  userStorage.saveUser(socket.sessionID,
    users
  );
}
/***************************
 * MIDDLEWARE IO SESSION
 */
io.use((socket, next) => {
  //console.log(socket.handshake.headers);
  const sessionID = socket.handshake.auth.sessionID;
  console.log('48) sessionID', sessionID, sessionStorage.findAllSession());
  if (sessionID) {
    // Cherche si une session est dans le sessionStorage
    const session = sessionStorage.findSession(sessionID);
    console.log('52) session', session);
    if (session) {
      // Définition des ids de session
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      socket.username = session.username;
      userStorage.updateUser(sessionID, session);
      return next();
    }
  }

  const usename = socket.handshake.auth.username;

  console.log('user', usename, socket.handshake.auth);
  if (!usename) {
    console.error('81 TROW');
    return next(new Error("invalide username"));
  }

  // Initialise une nouvelle session
  socket.sessionID = uniqUUID();
  socket.userID = uniqUUID();
  socket.username = usename;
  saveUser(socket);
  next();
})


app.use('/:slug',
  (req, res, next) => {
    console.log(req.sessionID);
    if (req.params.slug == "authentication") console.log("test param detected");
    next();
  },
);
//*********************************************ROUTER  */
/*
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './public_html', 'index.html'));
});

app.get('/test', (req, res) => {
  res.render('test', { youAreUsingPug: true, pageTitle: "ma page tyest", fooz: true });
});
*/
app.get('/', (req, res) => {
  // console.log(req, res);
  res.render('index', { titlePage: "TchatGo", home: true, chatRoomList: chatRoomList });
});

app.post('/authentication', (req, res) => {
  console.log('req.body.username', req.body.username);
  let sessionID = uniqUUID();
  let userID = uniqUUID();

  const EXPIRE_MS = 3600;
  var optionsCookie = {
    maxAge: EXPIRE_MS,
    // domain: 'localhost:8000',
    expires: new Date(Date.now() + EXPIRE_MS)
  };

  res.cookie('username', req.body.username, optionsCookie)
  res.cookie('sessionID', sessionID, optionsCookie)
  res.redirect('/')
});

app.get('/channel/:channel', (req, res) => {
  res.render('index', { titlePage: `TchatGo ${req.params.channel}`, activeChannel: req.params.channel.replace('-', ''), chatRoomList: chatRoomList });
});

function uniqUUID() {
  const stringRand = Math.random().toString(36).substring(2, 36);
  return stringRand + Math.floor(Math.random() * Date.now()).toString(36);
}

/**********************
 * IO CONNECTION
 */
io.on('connection', async (socket) => {
  console.log(`${socket.username ?? socket.id}  s'est connecté`);
  const isUser = await findUser(socket.sessionID);

  let emitResponse = {
    avatarID: socket.avatarID,
    sessionID: socket.sessionID,
    userID: socket.userID,
    username: socket.username
  }

  console.log('131) isUser', isUser);
  if (!isUser) {
    // Sauvgarde de l'utilisateur
    let idAvatarRandom = Math.ceil(Math.random() * (9 - 1) + 1);

    socket.avatarID = idAvatarRandom;

    let users = {
      id: socket.userID,
      username: socket.username,
      avatarID: idAvatarRandom,
      createdAt: Date.now()
    };

    userStorage.saveUser(socket.sessionID,
      users
    );
    emitResponse = {
      avatarID: idAvatarRandom,
      sessionID: socket.sessionID,
      userID: users.id,
      username: users.username
    }
  } else {
    emitResponse = {
      avatarID: isUser.avatarID,
      sessionID: isUser.sessionID,
      userID: isUser.userID,
      username: isUser.username
    }
  }
  console.log('connectionUser', emitResponse)

  // Détails session users
  socket.emit('CSession', emitResponse);

  socket.on('STyping', () => {
    socket.broadcast.emit('CTyping', `${socket.userID} est en train d'écrire...`);
  });

  socket.on('SStopTyping', () => {
    socket.broadcast.emit('CStopTyping');
  });

  socket.on('SMessage', (data) => {
    console.log('173) dataSMessage', data);
    historyMessageRoom = [...historyMessageRoom, { id: data.id, username: data.username, msg: data.message, room: data.chatRoom, createdAt: data.createdAt }];
    io.emit('CMessage', { msg: data.message, username: data.username, id: socket.userID });
  });

  socket.on('disconnect', async () => {
    //DEBUG console.log(socket.rooms);
    const matchingSockets = await io.in(socket.userID).fetchSockets();
    const isDisconnected = matchingSockets.length === 0;
    //DEBUG console.log('isDisconnected', isDisconnected);
    if (isDisconnected) {
      //DEBUG console.log('matchingSockets', matchingSockets);
      // notification
      socket.broadcast.emit("CUserDisconnected", socket.username);
      // Enregistrement des informations users dans la session réferencer par socket.sessionID
      sessionStorage.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        avatarID: socket.avatarID,
        connected: false,
        createdAt: Date.now()
      });
    }
    console.log(`${socket.username ?? socket.id} s'est déconnecté`);
  });

  // On écoute les entrées dans les salles
  socket.on("SJoinRoom", (room) => {

    // On update l'utilisateur losqu'il entre dans le sallon
    userStorage.updateUser(socket.sessionID,
      {
        room: room,
      }
    );
    const rooms = io.of(`/`).adapter.rooms;
    const sids = io.of("/").adapter.sids;
    //DEBUG console.log(rooms, sids, userStorage.findAllUser());
    // On va récuperer tous les utilisateurs
    const historyUsersRoom = userStorage.findAllUser();
    console.log('212) historyUsersRoom', historyUsersRoom);
    // On trie les utilisateurs celon la salle de chat active sur le client
    let usersRoom = historyUsersRoom.map((user => user)).filter(userRoom => userRoom.room === room);
    console.log('215) usersRoom', usersRoom);
    // On emet le signal CAddUser avec les données users au format serialisé.
    socket.emit("CAddUser", { users: JSON.stringify(usersRoom) });


    // Réstitution des message stocker dans le tableau d'objet messages
    //DEBUG console.log('historyMessageRoom.length', historyMessageRoom.length, historyMessageRoom)
    if (historyMessageRoom.length > 0) {

      let messageRoom = historyMessageRoom.map((value => value)).filter(historyMessage => historyMessage.room === room);
      console.log('messageRoom', messageRoom);
      // On emet le signal CHistoryMessage, envoie les messages celon la salle de chat active sur le client
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