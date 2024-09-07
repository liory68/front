import React from 'react';

function PlayerCircle({ player, currentPlayer, feedback, penalty }) {
  return (
    <div className="player-circle" style={{ backgroundColor: player.color }}>
      <span className="player-name">{player.name}</span>
      <span className="player-score">{player.score}</span>
      {feedback && currentPlayer._id === player._id && (
        <span className={`feedback ${feedback}`}>
          {feedback === 'correct' ? '✅' : '❌'}
        </span>
      )}
      {penalty > 0 && currentPlayer._id === player._id && (
        <span className="penalty-countdown">{penalty}s</span>
      )}
    </div>
  );
}

export default PlayerCircle;