import { useState, useEffect } from "react";
import socketIO from "socket.io-client";

// Connection status
const DISCONNECTED = "Disconnected";
const CONNECTED = "Connected";
const CONNECTING = "Connecting...";

// Game status
const WAITING = "Waiting for opponent";
const MAKEMOVE = "Make your move";
const OPPONENTMOVE = "Opponent is making a move";
const WINNER = "You are the winner";
const LOSER = "You are the loser";
const DRAW = "It's a draw";

const OPPONENT_FOUND = "opponentFound";
const WAIT_FOR_OPPONENT = "waitForOpponent";
const MAKE_MOVE = "makeMove";

const tableSquare = {
  width: "50px",
  height: "50px",
  border: "1px solid black",
};

function App() {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(DISCONNECTED);
  const [player, setPlayer] = useState(0);
  const [gameStatus, setGameStatus] = useState(WAITING);
  const [gameMessage, setGameMessage] = useState("... Connect ...");
  const [board, setBoard] = useState([
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]);

  const isConnected = () => {
    return connectionStatus === CONNECTED || connectionStatus === CONNECTING;
  };

  const makingMove = (row, col) => {
    if (gameStatus === MAKEMOVE) {
      setBoard((prevBoard) => {
        var newBoard = prevBoard.map(function (arr) {
          return arr.slice();
        });
        newBoard[row - 1][col - 1] = player;
        return newBoard;
      });
      socket.emit("makeMove", { player: player, row: row, col: col });
    }
  };

  const boardSquare = (row, col) => {
    switch (board[row - 1][col - 1]) {
      case 0:
        return "";
      case 1:
        return "X";
      case 2:
        return "O";
    }
  };

  useEffect(() => {
    if (isConnected()) {
      socket.on("verify", (data) => {
        socket.emit("verify", { user: "Jack", pwd: "1234" });
      });
      socket.on("verified", (data) => {
        setConnectionStatus(CONNECTED);
        setGameMessage(WAITING);
      });
      socket.on("denied", (data) => {
        socket.disconnect();
        setConnectionStatus(DISCONNECTED);
      });
      socket.on("player", (data) => {
        setPlayer(data);
      });
      socket.on("gameStatus", (data) => {
        switch (data) {
          case MAKE_MOVE:
            setGameStatus(MAKEMOVE);
            setGameMessage(MAKEMOVE);
            break;
          case WAIT_FOR_OPPONENT:
            setGameStatus(OPPONENTMOVE);
            setGameMessage(WAITING);
            break;
        }
      });
      socket.on("board", (data) => {
        setBoard(data);
      });
    }
  }, [socket]);

  var connect = () => {
    const sock = socketIO.connect("http://localhost:3000");
    setSocket(sock);
    setConnectionStatus(CONNECTING);
  };

  var disconnect = () => {
    socket.disconnect();
    setConnectionStatus(DISCONNECTED);
  };

  return (
    <>
      <div>
        <p>CRISS CROSS</p>
        <p>
          <button
            onClick={connect}
            disabled={connectionStatus === CONNECTED}
            style={{ marginRight: "10px" }}
          >
            Connect
          </button>
          <button
            onClick={disconnect}
            disabled={connectionStatus === DISCONNECTED}
            style={{ marginRight: "10px" }}
          >
            Disconnect
          </button>
          <span>
            [{player}] [{connectionStatus}]
          </span>
        </p>
        <div
          style={{
            border: "1px solid black",
            width: "300px",
            padding: "3px 5px 3px 5px",
          }}
        >
          {gameMessage}
        </div>
        <div>
          <table>
            <tbody>
              <tr>
                <td style={tableSquare} onClick={() => makingMove(1, 1)}>
                  {boardSquare(1, 1)}
                </td>
                <td style={tableSquare} onClick={() => makingMove(1, 2)}>
                  {boardSquare(1, 2)}
                </td>
                <td style={tableSquare} onClick={() => makingMove(1, 3)}>
                  {boardSquare(1, 3)}
                </td>
              </tr>
              <tr>
                <td style={tableSquare} onClick={() => makingMove(2, 1)}>
                  {boardSquare(2, 1)}
                </td>
                <td style={tableSquare} onClick={() => makingMove(2, 2)}>
                  {boardSquare(2, 2)}
                </td>
                <td style={tableSquare} onClick={() => makingMove(2, 3)}>
                  {boardSquare(2, 3)}
                </td>
              </tr>
              <tr>
                <td style={tableSquare} onClick={() => makingMove(3, 1)}>
                  {boardSquare(3, 1)}
                </td>
                <td style={tableSquare} onClick={() => makingMove(3, 2)}>
                  {boardSquare(3, 2)}
                </td>
                <td style={tableSquare} onClick={() => makingMove(3, 3)}>
                  {boardSquare(3, 3)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default App;
