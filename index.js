const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

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
io.on('connection', (socket) => {
  console.log(`${socket.id}  s'est connecté`);

  socket.on('STyping', () => {
    socket.broadcast.emit('CTyping', `${socket.id} est en train d'écrire...`);
  });

  socket.on('SStopTyping', () => {
    socket.broadcast.emit('CStopTyping');
  });

  socket.on('SMessage', (data) => {
    // console.log('data', data);
    historyMessageRoom = [...historyMessageRoom, { id: socket.id, msg: data.message, room: data.chatRoom, createdAt: data.createdAt }];
    io.emit('CMessage', { msg: data.message, id: socket.id });
  });

  socket.on('disconnect', () => {
    // console.log(socket.rooms);
    console.log(`${socket.id} s'est déconnecté`);
  });

  // On écoute les entrées dans les salles
  socket.on("SJoinRoom", (room) => {
    // On entre dans la salle demandée
    //console.log('room', room);

    // Réstitution des message stocker dans le tableau d'objet messages
    //console.log('historyMessageRoom.length', historyMessageRoom.length, historyMessageRoom)
    if (historyMessageRoom.length > 0) {

      let messageRoom = historyMessageRoom.map((value => value)).filter(historyMessage => historyMessage.room === room);
      // console.log(messageRoom);
      // Réstitution des messages celon la salle de chat active par le client
      socket.emit("CHistoryMessage", { history: JSON.stringify(messageRoom) });
    }
    // Joindre la salle de chat
    socket.join(room);
    //console.log(socket.rooms);
  });

  // On écoute les sorties dans les salles
  socket.on("SleaveRoom", (room) => {
    // On entre dans la salle demandée
    socket.leave(room);
    console.log(socket.rooms);
  });
});


server.listen(8000, () => {
  console.log('server running at http://localhost:8000');
});