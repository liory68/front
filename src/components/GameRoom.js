import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import PlayerCircle from './PlayerCircle';

function GameRoom({ socket }) {
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

  const joinGame = useCallback(() => {
    if (playerName && !currentPlayer) {
      const playerData = { name: playerName, color: getRandomColor() };
      socket.emit('joinGame', gameId, playerData, (response) => {
        if (response.success) {
          setCurrentPlayer(response.player);
          setQuestion(response.question.question);
        } else {
          alert('Failed to join game: ' + (response.error || 'Unknown error'));
        }
      });
    }
  }, [gameId, playerName, currentPlayer, socket]);

  useEffect(() => {
    joinGame();

    socket.on('playerList', (updatedPlayers) => {
      setPlayers(updatedPlayers);
      // Check if the current player is still in the game
      if (currentPlayer && !updatedPlayers.some(p => p._id === currentPlayer._id)) {
        setCurrentPlayer(null);
        // Optionally, redirect to home or show a message
      }
    });

    socket.on('newQuestion', (newQuestion) => {
      setQuestion(newQuestion.question);
      setUserAnswer('');
    });

    socket.on('gameEnded', (finalLeaderboard) => {
      setGameEnded(true);
      setLeaderboard(finalLeaderboard);
    });

    return () => {
      socket.off('playerList');
      socket.off('newQuestion');
      socket.off('gameEnded');
    };
  }, [socket, currentPlayer, gameId, playerName, joinGame]);

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
      socket.emit('submitAnswer', {
        gameId,
        playerId: currentPlayer._id,
        answer: parseInt(userAnswer)
      }, (response) => {
        if (response.success) {
          setFeedback(response.correct ? 'correct' : 'incorrect');
          if (!response.correct) {
            setPenalty(5);
          }
          setTimeout(() => setFeedback(null), 1000);
        }
        setUserAnswer('');
      });
    }
  };

  const handlePlayAgain = () => {
    socket.emit('playAgain', gameId, (response) => {
      if (response.success) {
        setGameEnded(false);
        setQuestion(response.question.question);
      } else {
        alert('Failed to start new game: ' + (response.error || 'Unknown error'));
      }
    });
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