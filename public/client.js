// client.js

// Connect to our Socket.IO server
const socket = io();

// Store data about all players (including ourselves)
const players = {}; // { socketId: { x, y }, ... }

// Our canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// We’ll load the spaceship image
const spaceshipImg = new Image();
spaceshipImg.src = "images/spaceship.png";

// Our local player's movement speed and position
let myId = null;
let myX = 100;
let myY = 100;
const speed = 5;

// Listen for initial data about current players
socket.on("currentPlayers", (serverPlayers) => {
  for (const id in serverPlayers) {
    players[id] = serverPlayers[id];
  }
});

// Listen for a newly joined player
socket.on("newPlayer", (newPlayer) => {
  players[newPlayer.id] = { x: newPlayer.x, y: newPlayer.y };
});

// Listen for moves
socket.on("playerMoved", (data) => {
  if (players[data.id]) {
    players[data.id].x = data.x;
    players[data.id].y = data.y;
  }
});

// Listen for players leaving
socket.on("playerDisconnected", (id) => {
  delete players[id];
});

// We can figure out our own socket ID by checking who we are in the players object
socket.on("connect", () => {
  myId = socket.id;
});

// Handle keyboard input for movement
let keys = {};

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Main update loop
function update() {
  // Move my spaceship based on keys
  if (keys["ArrowLeft"] || keys["a"])  myX -= speed;
  if (keys["ArrowRight"] || keys["d"]) myX += speed;
  if (keys["ArrowUp"] || keys["w"])    myY -= speed;
  if (keys["ArrowDown"] || keys["s"])  myY += speed;

  // Limit movement to canvas boundaries (optional)
  myX = Math.max(0, Math.min(canvas.width - 50, myX)); 
  myY = Math.max(0, Math.min(canvas.height - 50, myY));

  // Update our local data
  if (myId) {
    players[myId] = { x: myX, y: myY };

    // Inform the server
    socket.emit("playerMoved", { x: myX, y: myY });
  }
}

// Draw all spaceships
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const id in players) {
    const ship = players[id];
    ctx.drawImage(spaceshipImg, ship.x, ship.y, 50, 50);
  }
}

// Game loop
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// Start the game loop after the image is loaded
spaceshipImg.onload = () => {
  requestAnimationFrame(gameLoop);
};