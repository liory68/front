import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import PartySocket from "partysocket";
import PlayerCircle from './PlayerCircle';

const PARTYKIT_HOST = process.env.REACT_APP_PARTYKIT_HOST || "backend-party.liory68.partykit.dev";

function GameRoom() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerName = searchParams.get('name');
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({ question: '', answer: null });
  const [userAnswer, setUserAnswer] = useState('');
  const [gameEnded, setGameEnded] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    console.log("Initializing socket with host:", PARTYKIT_HOST, "and room:", gameId);
    const newSocket = new PartySocket({
      host: PARTYKIT_HOST,
      room: gameId
    });

    newSocket.addEventListener('open', () => {
      console.log("Socket opened, sending joinGame message");
      const joinMessage = JSON.stringify({ 
        type: 'joinGame', 
        payload: { gameId, name: playerName, color: getRandomColor() } 
      });
      console.log("Sending join message:", joinMessage);
      newSocket.send(joinMessage);
    });

    newSocket.addEventListener('message', (event) => {
      console.log("Received message:", event.data);
      try {
        const data = JSON.parse(event.data);
        console.log("Parsed data:", data);
        handleJsonMessage(data);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [gameId, playerName]);

  const handleJsonMessage = (data) => {
    console.log("Handling JSON message:", data);
    switch (data.type) {
      case 'serverMessage':
        console.log("Server message:", data.message);
        break;
      case 'gameJoined':
        console.log("Game joined, setting current player and question");
        setCurrentPlayer(data.player);
        setCurrentQuestion(data.currentQuestion);
        break;
      case 'playerList':
        console.log("Updating player list", data.players);
        setPlayers(data.players);
        break;
      case 'newQuestion':
        console.log("New question received", data.question);
        setCurrentQuestion(data.question);
        setUserAnswer('');
        break;
      case 'gameEnded':
        setGameEnded(true);
        setLeaderboard(data.leaderboard);
        break;
      default:
        console.log("Unhandled message type:", data.type);
    }
  };

  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    if (socket) {
      socket.send(JSON.stringify({
        type: 'submitAnswer',
        payload: { gameId, answer: parseInt(userAnswer) }
      }));
    }
  };

  if (gameEnded) {
    return (
      <div className="game-container">
        <h2>Game Over</h2>
        <ul className="leaderboard">
          {leaderboard.map((player, index) => (
            <li key={player.id}>{index + 1}. {player.name} - {player.score} points</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="game-container">
      <h2>Game Room: {gameId}</h2>
      <div className="game-area">
        <h3>Current Question:</h3>
        <p className="question">{currentQuestion.question || "Waiting for question..."}</p>
        {currentQuestion.question && (
          <form onSubmit={handleAnswerSubmit} className="answer-form">
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Enter your answer"
              className="answer-input"
            />
            <button type="submit" className="submit-answer-btn">Submit Answer</button>
          </form>
        )}
      </div>
      <div className="player-list">
        {players.length > 0 ? (
          players.map(player => (
            <PlayerCircle
              key={player.id}
              player={player}
              isCurrentPlayer={currentPlayer && player.id === currentPlayer.id}
            />
          ))
        ) : (
          <p>Waiting for players to join...</p>
        )}
      </div>
      <div>
        <h3>Debug Info:</h3>
        <p>Current Player: {JSON.stringify(currentPlayer)}</p>
        <p>Players: {JSON.stringify(players)}</p>
        <p>Current Question: {JSON.stringify(currentQuestion)}</p>
      </div>
    </div>
  );
}

function getRandomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}

export default GameRoom;