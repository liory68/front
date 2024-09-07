import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import PlayerCircle from './PlayerCircle';
import * as PartySocket from "partykit/client";

function GameRoom({ host }) {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerName = searchParams.get('name');
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [question, setQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [penalty, setPenalty] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = new PartySocket.PartySocket({
      host: host,
      room: gameId
    });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [host, gameId]);

  const joinGame = useCallback(() => {
    if (playerName && !currentPlayer && socket) {
      const playerData = { name: playerName, color: getRandomColor() };
      socket.send(JSON.stringify({ type: 'joinGame', payload: { gameId, ...playerData } }));
    }
  }, [gameId, playerName, currentPlayer, socket]);

  useEffect(() => {
    if (socket) {
      joinGame();

      socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'playerJoined':
            setPlayers(data.players);
            break;
          case 'gameJoined':
            setCurrentPlayer(data.player);
            setQuestion(data.currentQuestion.question);
            break;
          case 'newQuestion':
            setQuestion(data.question.question);
            setUserAnswer('');
            break;
          case 'playerUpdated':
            setPlayers(data.players);
            break;
          case 'gameEnded':
            setGameEnded(true);
            setLeaderboard(data.leaderboard);
            break;
          // Handle other message types
        }
      });
    }
  }, [socket, joinGame]);

  useEffect(() => {
    if (penalty > 0) {
      const timer = setTimeout(() => {
        setPenalty(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [penalty]);

  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    if (currentPlayer && penalty === 0) {
      socket.send(JSON.stringify({ type: 'submitAnswer', payload: { gameId, playerId: currentPlayer._id, answer: parseInt(userAnswer) } }));
    }
  };

  const handlePlayAgain = () => {
    socket.send(JSON.stringify({ type: 'playAgain', payload: { gameId } }));
  };

  if (gameEnded) {
    return (
      <div className="game-container">
        <h2>Game Over</h2>
        <h3>Leaderboard</h3>
        <ul className="leaderboard">
          {leaderboard.map((player, index) => (
            <li key={player._id}>
              {index + 1}. {player.name} - {player.score} points
            </li>
          ))}
        </ul>
        <button onClick={handlePlayAgain} className="play-again-btn">Play Again</button>
      </div>
    );
  }

  return (
    <div className="game-container">
      <h2>Game Room: {gameId}</h2>
      <div className="game-area">
        <h3>Current Question:</h3>
        <p className="question">{question}</p>
        <form onSubmit={handleAnswerSubmit} className="answer-form">
          <input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Enter your answer"
            className="answer-input"
            disabled={penalty > 0}
          />
          <button type="submit" className="submit-answer-btn" disabled={penalty > 0}>
            {penalty > 0 ? `Wait ${penalty}s` : 'Submit Answer'}
          </button>
        </form>
      </div>
      <div className="player-list">
        {players.map(player => (
          <PlayerCircle
            key={player._id}
            player={player}
            currentPlayer={currentPlayer}
            feedback={feedback}
            penalty={penalty}
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