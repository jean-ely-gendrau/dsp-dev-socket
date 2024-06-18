const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

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

  socket.on('SMessage', (message) => {
    io.emit('CMessage', { msg: message, id: socket.id });
  });

  socket.on('disconnect', () => {
    console.log(socket.rooms);
    console.log(`${socket.id} s'est déconnecté`);
  });

  // On écoute les entrées dans les salles
  socket.on("SJoinRoom", (room) => {
    // On entre dans la salle demandée
    socket.join(room);
    console.log(socket.rooms);
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