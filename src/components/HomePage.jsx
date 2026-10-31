import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "./Header.jsx";
import { getRoomErrorMessage } from "../game/roomMessages.js";

function HomePage({ gameState, statusText, createRoom, joinRoom, leaveRoom }) {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreateRoom() {
    setError("");
    if (!playerName.trim()) {
      setError(getRoomErrorMessage("invalid-name"));
      return;
    }
    setBusy(true);
    const result = await createRoom(playerName.trim());
    setBusy(false);
    if (!result.ok) {
      setError(getRoomErrorMessage(result.error));
      return;
    }
    navigate(`/game/${result.roomCode}`);
  }

  async function handleJoinRoom(event) {
    event.preventDefault();
    setError("");
    if (!playerName.trim()) {
      setError(getRoomErrorMessage("invalid-name"));
      return;
    }
    if (!/^\d{4}$/.test(roomCode)) {
      setError(getRoomErrorMessage("invalid-code"));
      return;
    }

    setBusy(true);
    const result = await joinRoom(roomCode, playerName.trim());
    setBusy(false);
    if (!result.ok) {
      setError(getRoomErrorMessage(result.error));
      return;
    }
    navigate(`/game/${result.roomCode}`);
  }

  async function handleLeaveRoom() {
    setBusy(true);
    const result = await leaveRoom();
    setBusy(false);
    if (!result.ok) setError(getRoomErrorMessage(result.error));
  }

  return (
    <main className="app">
      <Header statusText={statusText} />
      <section className="home-intro">
        <p className="eyebrow">ONLINE MULTIPLAYER</p>
        <h2>Play with a friend</h2>
        <p>Create a private room and share its four-digit code, or enter a code your friend shared with you.</p>
      </section>

      <section className="name-entry">
        <label htmlFor="player-name">Your display name</label>
        <input
          id="player-name"
          maxLength={20}
          placeholder="Enter your name"
          value={playerName}
          onChange={(event) => setPlayerName(event.target.value.slice(0, 20))}
        />
        <p>Names can be the same; players are identified separately.</p>
      </section>

      {gameState.roomCode && (
        <section className="active-room-card">
          <div>
            <span className="player-name">YOU ARE ALREADY IN ROOM</span>
            <strong>{gameState.roomCode}</strong>
          </div>
          <div className="active-room-actions">
            <Link className="secondary-button" to={`/game/${gameState.roomCode}`}>Return to room</Link>
            <button className="text-button" type="button" onClick={handleLeaveRoom} disabled={busy}>Leave room</button>
          </div>
        </section>
      )}

      <section className="home-options" aria-label="Room options">
        <article className="home-card">
          <span className="option-number">01</span>
          <h3>Create a room</h3>
          <p>Get a new four-digit room code to share with the other player.</p>
          <button className="primary-button" type="button" onClick={handleCreateRoom} disabled={busy || Boolean(gameState.roomCode) || gameState.status === "connecting" || gameState.status === "error"}>
            {busy ? "Please wait…" : "Create room"}
          </button>
        </article>

        <article className="home-card">
          <span className="option-number">02</span>
          <h3>Join a room</h3>
          <p>Enter the four-digit code from the player who created the room.</p>
          <form className="room-code-form" onSubmit={handleJoinRoom}>
            <label htmlFor="room-code">Room code</label>
            <input
              id="room-code"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              placeholder="0000"
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
              aria-describedby={error ? "room-error" : undefined}
            />
            <button className="primary-button" type="submit" disabled={busy || Boolean(gameState.roomCode) || gameState.status === "connecting" || gameState.status === "error"}>
              {busy ? "Joining…" : "Join room"}
            </button>
          </form>
        </article>
      </section>

      {error && <p id="room-error" className="error-message" role="alert">{error}</p>}
    </main>
  );
}

export default HomePage;
