import React from 'react';

function PlayerCircle({ player, isCurrentPlayer }) {
  return (
    <div 
      className={`player-circle ${isCurrentPlayer ? 'current-player' : ''}`} 
      style={{ backgroundColor: player.color }}
    >
      <span className="player-name">{player.name}</span>
      <span className="player-score">{player.score}</span>
    </div>
  );
}

export default PlayerCircle;