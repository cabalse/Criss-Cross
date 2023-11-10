const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const PORT = 3000;

const NEW_CONNECTION = "newConnection";
const CONNECTED = "connected";
const VERIFIED = "verified";
const FAILED = "failed";
const DISCONNECTED = "disconnected";

const WAITING = "waiting";
const OPPONENT_FOUND = "opponentFound";
const WAIT_FOR_OPPONENT = "waitForOpponent";
const MAKE_MOVE = "makeMove";

let connections = [];
let game = {
  gameStatus: "",
  turn: 0,
  player1: null,
  player2: null,
  board: [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ],
};

const corsConfig = {
  cors: {
    origin: "*",
  },
};

function updateConnection(id, user, status) {
  connections = connections.map((connection) => {
    if (connection.id === id) {
      let newConnection = { ...connection };
      if (user !== undefined) newConnection.user = user;
      if (status !== undefined) newConnection.status = status;
      return { ...newConnection };
    }
    return connection;
  });
}

function removeConnection(id) {
  connections = connections.filter((connection) => connection.id !== id);
}

function initGame() {
  game.status = "playing";
  game.player1 = connections[0];
  game.player2 = connections[1];
  game.turn = 1;
  game.board = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, corsConfig);

app.options("*", cors());

io.on("connection", (socket) => {
  if (connections.length > 2) {
    io.to(socket.id).emit("fullServer");
    socket.disconnect();
    return;
  }

  connections.push({ user: "NAN", id: socket.id, status: NEW_CONNECTION });
  io.to(socket.id).emit("verify");

  socket.on("verify", (data) => {
    if (data.pwd == "1234") {
      updateConnection(socket.id, data.user, VERIFIED);
      io.to(socket.id).emit("verified");
      if (connections.length === 1) {
        io.to(socket.id).emit("gameStatus", WAITING);
      } else {
        io.emit("gameStatus", OPPONENT_FOUND);
        initGame();
        io.to(game.player1.id).emit("player", 1);
        io.to(game.player2.id).emit("player", 2);
        io.to(game.player1.id).emit("gameStatus", MAKE_MOVE);
        io.to(game.player2.id).emit("gameStatus", WAIT_FOR_OPPONENT);
      }
      console.log(connections);
    } else {
      // Failed verification
      io.to(socket.id).emit("denied");
    }
  });

  socket.on("makeMove", (data) => {
    game.board[data.row - 1][data.col - 1] = data.player;
    io.emit("board", game.board);
    if (data.player === 1) {
      io.to(game.player1.id).emit("gameStatus", WAIT_FOR_OPPONENT);
      io.to(game.player2.id).emit("gameStatus", MAKE_MOVE);
    } else {
      io.to(game.player1.id).emit("gameStatus", MAKE_MOVE);
      io.to(game.player2.id).emit("gameStatus", WAIT_FOR_OPPONENT);
    }
  });

  socket.on("disconnect", () => {
    removeConnection(socket.id);
    console.log("Removed connection", socket.id);
    console.log(connections);
  });
});

app.use(cors(corsConfig));

app.get("/api", (req, res) => {
  res.send("Hello World");
});

httpServer.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
