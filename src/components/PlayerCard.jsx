import React from "react";

function PlayerCard({ player, color }) {
  return (
    <div className={`player-card ${color}-card`}>
      <div className="player-identity">
        <span className="player-name">PLAYER {player.index + 1}</span>
        <span className="player-display-name">{player.name}</span>
      </div>
      <strong><span>{player.hp}</span> <small>HP</small></strong>
    </div>
  );
}

export default PlayerCard;
