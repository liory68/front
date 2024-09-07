import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [gameMode, setGameMode] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const navigate = useNavigate();

  const handleCreateGame = () => {
    if (playerName.trim()) {
      const newGameId = Math.random().toString(36).substring(7);
      navigate(`/game/${newGameId}?name=${encodeURIComponent(playerName)}`);
    } else {
      alert('Please enter your name');
    }
  };

  const handleJoinGame = () => {
    if (playerName.trim() && gameId.trim()) {
      navigate(`/game/${gameId}?name=${encodeURIComponent(playerName)}`);
    } else {
      alert('Please enter both your name and the game ID');
    }
  };

  return (
    <div className="home-container">
      <h1>Math Game</h1>
      {!gameMode ? (
        <>
          <button onClick={() => setGameMode('create')} className="create-game-btn">Create New Game</button>
          <button onClick={() => setGameMode('join')} className="join-game-btn">Join Game</button>
        </>
      ) : (
        <form onSubmit={gameMode === 'create' ? handleCreateGame : handleJoinGame} className="game-form">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="player-name-input"
          />
          {gameMode === 'join' && (
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter Game ID"
              className="game-id-input"
            />
          )}
          <button type="submit" className="submit-btn">
            {gameMode === 'create' ? 'Create Game' : 'Join Game'}
          </button>
        </form>
      )}
    </div>
  );
}

export default Home;