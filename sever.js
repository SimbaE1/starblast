// server.js

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve everything in the "public" folder as static
app.use(express.static('public'));

// Data structure to hold each player's position
// Key: socket.id, Value: { x, y }
let players = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Initialize this player's position
  players[socket.id] = {
    x: 100, // default x
    y: 100, // default y
  };

  // Notify this new client of all current players
  socket.emit('currentPlayers', players);

  // Notify other clients about this new player
  socket.broadcast.emit('newPlayer', {
    id: socket.id,
    x: players[socket.id].x,
    y: players[socket.id].y,
  });

  // Listen for movement updates from this player
  socket.on('playerMoved', (data) => {
    // Update the server’s record of the player’s position
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
    }
    // Broadcast the movement to all other clients
    socket.broadcast.emit('playerMoved', {
      id: socket.id,
      x: data.x,
      y: data.y,
    });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    // Remove this player from our players object
    delete players[socket.id];
    // Let everyone else know
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});