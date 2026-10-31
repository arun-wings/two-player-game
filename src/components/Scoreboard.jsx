import React from "react";
import PlayerCard from "./PlayerCard.jsx";

function Scoreboard({ players }) {
  return (
    <section className="scoreboard" aria-label="Player status">
      <PlayerCard player={players[0]} color="blue" />
      <PlayerCard player={players[1]} color="red" />
    </section>
  );
}

export default Scoreboard;
