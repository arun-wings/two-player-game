import React from "react";
import { useArenaRenderer } from "../hooks/useArenaRenderer.js";

function Arena({ canvasRef, gameState }) {
  useArenaRenderer(canvasRef, gameState);

  return (
    <section className="arena-wrap">
      <div className="arena-heading">
        <span>GAME ARENA</span>
        <span>Separate sides · Move: WASD / arrows · Fire: Space</span>
      </div>
      <canvas ref={canvasRef} width={900} height={520} aria-label="Two player game arena" />
    </section>
  );
}

export default Arena;
