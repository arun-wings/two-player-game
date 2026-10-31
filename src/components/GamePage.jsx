import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "./Header.jsx";
import Scoreboard from "./Scoreboard.jsx";
import Arena from "./Arena.jsx";
import ControlsFooter from "./ControlsFooter.jsx";
import { getRoomErrorMessage } from "../game/roomMessages.js";

function GamePage({ canvasRef, gameState, statusText, leaveRoom, resetFinishedGame }) {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (gameState.status !== "game-over") return undefined;

    const timer = window.setTimeout(() => {
      resetFinishedGame();
      navigate("/", { replace: true });
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [gameState.status, navigate, resetFinishedGame]);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy the room code. Select and copy it manually.");
    }
  }

  async function handleLeaveRoom() {
    const result = await leaveRoom();
    if (!result.ok) {
      setError(getRoomErrorMessage(result.error));
      return;
    }
    navigate("/");
  }

  function handleReturnHome() {
    resetFinishedGame();
    navigate("/", { replace: true });
  }

  if (!/^\d{4}$/.test(roomCode)) {
    return (
      <main className="app">
        <Header statusText={statusText} />
        <section className="room-message-card">
          <h2>Invalid room code</h2>
          <p>Room codes have four digits. Create a room or join with a valid code.</p>
          <Link className="primary-button button-link" to="/">Back to home</Link>
        </section>
      </main>
    );
  }

  if (gameState.roomCode !== roomCode) {
    return (
      <main className="app">
        <Header statusText={statusText} />
        <section className="room-message-card">
          <h2>Room not joined</h2>
          <p>Use the home page to create a room or enter this four-digit code to join.</p>
          <Link className="primary-button button-link" to="/">Go to room options</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <Header statusText={statusText} />
      <section className="room-banner">
        <div className="room-code-details">
          <span className="player-name">ROOM CODE · SHARE WITH YOUR FRIEND</span>
          <strong className="room-code-display">{roomCode}</strong>
          <p>{gameState.status === "waiting" ? "Waiting for the other player to join…" : "Both players are connected. Have fun!"}</p>
        </div>
        <div className="room-actions">
          <button className="secondary-button" type="button" onClick={handleCopyCode}>{copied ? "Copied" : "Copy code"}</button>
          <button className="text-button" type="button" onClick={handleLeaveRoom}>Leave room</button>
        </div>
      </section>

      {error && <p className="error-message" role="alert">{error}</p>}
      <Scoreboard players={gameState.players} />
      <Arena canvasRef={canvasRef} gameState={gameState} />
      <ControlsFooter />
      {gameState.status === "game-over" && (
        <div className="game-over-backdrop">
          <section className="game-over-popup" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
            <span className="eyebrow">MATCH COMPLETE</span>
            <h2 id="game-over-title">{gameState.result === "win" ? "You won!" : "You lose"}</h2>
            <p>Returning to the home page…</p>
            <button className="primary-button" type="button" onClick={handleReturnHome}>Go to home now</button>
          </section>
        </div>
      )}
    </main>
  );
}

export default GamePage;
