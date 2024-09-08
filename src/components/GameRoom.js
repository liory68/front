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
      newSocket.send(JSON.stringify({ 
        type: 'joinGame', 
        payload: { gameId, name: playerName, color: getRandomColor() } 
      }));
    });

    newSocket.addEventListener('message', (event) => {
      console.log("Received message:", event.data);
      try {
        const data = JSON.parse(event.data);
        console.log("Parsed data:", data);
        handleJsonMessage(data);
      } catch (error) {
        console.error("Error parsing message:", error);
        console.log("Received plain text message:", event.data);
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
      case 'gameJoined':
        console.log("Game joined, setting current player and question");
        setCurrentPlayer(data.player);
        setCurrentQuestion(data.currentQuestion);
        break;
      case 'playerList':
        console.log("Updating player list");
        setPlayers(data.players);
        break;
      case 'newQuestion':
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
        <p className="question">{currentQuestion.question}</p>
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
      </div>
      <div className="player-list">
        {players.map(player => (
          <PlayerCircle
            key={player.id}
            player={player}
            isCurrentPlayer={currentPlayer && player.id === currentPlayer.id}
          />
        ))}
      </div>
    </div>
  );
}

function getRandomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}

export default GameRoom;