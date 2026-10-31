import { useEffect, useRef } from "react";
import { drawArena } from "../game/arenaRenderer.js";

export function useArenaRenderer(canvasRef, gameState) {
  const gameStateRef = useRef(gameState);
  const previousHpRef = useRef(gameState.players.map((player) => player.hp));
  const hitUntilRef = useRef([0, 0]);

  useEffect(() => {
    const now = performance.now();
    gameState.players.forEach((player) => {
      const previousHp = previousHpRef.current[player.index];
      if (player.hp < previousHp) hitUntilRef.current[player.index] = now + 480;
      previousHpRef.current[player.index] = player.hp;
    });
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrame;
    function render(timestamp) {
      drawArena(ctx, gameStateRef.current, hitUntilRef.current, timestamp);
      animationFrame = window.requestAnimationFrame(render);
    }

    animationFrame = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [canvasRef]);
}
