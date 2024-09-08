import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';
import PlayerCircle from './PlayerCircle';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://back-ten-lilac.vercel.app';

function GameRoom() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerName = searchParams.get('name');
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({ question: '', answer: null });
  const [userAnswer, setUserAnswer] = useState('');
  const [gameEnded, setGameEnded] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      upgrade: false,
      forceNew: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection Error:', error);
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('joinGame', { gameId, playerName });
    });

    newSocket.on('gameJoined', ({ player, currentQuestion }) => {
      setCurrentPlayer(player);
      setCurrentQuestion(currentQuestion);
    });

    newSocket.on('playerList', (players) => {
      setPlayers(players);
    });

    newSocket.on('newQuestion', (question) => {
      setCurrentQuestion(question);
      setUserAnswer('');
    });

    newSocket.on('gameEnded', (leaderboard) => {
      setGameEnded(true);
      setLeaderboard(leaderboard);
    });

    return () => newSocket.disconnect();
  }, [gameId, playerName]);

  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    if (socket) {
      socket.emit('submitAnswer', { gameId, answer: parseInt(userAnswer) });
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

export default GameRoom;