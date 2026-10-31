import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const initialPlayers = [
  { id: "preview-player-1", index: 0, name: "Player 1", x: 145, y: 260, hp: 100 },
  { id: "preview-player-2", index: 1, name: "Player 2", x: 755, y: 260, hp: 100 },
];

const blankInput = () => ({ up: false, down: false, left: false, right: false, shoot: false });

const keyActions = {
  w: "up", arrowup: "up",
  a: "left", arrowleft: "left",
  s: "down", arrowdown: "down",
  d: "right", arrowright: "right",
  " ": "shoot",
};

export function useArenaGame() {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const playerIndexRef = useRef(null);
  const inputRef = useRef(blankInput());
  const [gameState, setGameState] = useState({
    status: "connecting",
    roomCode: null,
    playerIndex: null,
    result: null,
    players: initialPlayers,
    bullets: [],
  });

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SOCKET_SERVER_URL
      || (import.meta.env.DEV
        ? `${window.location.protocol}//${window.location.hostname}:3001`
        : window.location.origin);
    const socket = io(serverUrl);
    socketRef.current = socket;

    const onConnect = () => setGameState((current) => ({ ...current, status: "idle" }));
    const onRoomWaiting = ({ roomCode, playerIndex = 0, players }) => {
      playerIndexRef.current = playerIndex;
      setGameState((current) => ({
        ...current,
        status: "waiting",
        roomCode,
        playerIndex,
        result: null,
        players: players ?? current.players,
      }));
    };
    const onRoomStarted = ({ roomCode, playerIndex }) => {
      playerIndexRef.current = playerIndex;
      inputRef.current = blankInput();
      setGameState((current) => ({ ...current, status: "playing", roomCode, playerIndex, result: null }));
    };
    const onGameState = ({ players, bullets }) => {
      setGameState((current) => ({ ...current, players, bullets }));
    };
    const onOpponentLeft = () => {
      playerIndexRef.current = 0;
      inputRef.current = blankInput();
      setGameState((current) => ({
        ...current,
        status: "waiting",
        playerIndex: 0,
        players: initialPlayers,
        bullets: [],
      }));
    };
    const onGameOver = ({ result }) => {
      playerIndexRef.current = null;
      inputRef.current = blankInput();
      setGameState((current) => ({ ...current, status: "game-over", result }));
    };
    const onDisconnect = () => {
      playerIndexRef.current = null;
      inputRef.current = blankInput();
      setGameState((current) => ({ ...current, status: "connecting", roomCode: null, playerIndex: null, result: null }));
    };
    const onConnectError = () => setGameState((current) => ({ ...current, status: "error" }));

    socket.on("connect", onConnect);
    socket.on("room-waiting", onRoomWaiting);
    socket.on("room-started", onRoomStarted);
    socket.on("game-state", onGameState);
    socket.on("opponent-left", onOpponentLeft);
    socket.on("game-over", onGameOver);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    function updateInput(event, pressed) {
      if (playerIndexRef.current === null) return;
      const action = keyActions[event.key.toLowerCase()];
      if (!action) return;
      event.preventDefault();
      if (inputRef.current[action] === pressed) return;

      inputRef.current = { ...inputRef.current, [action]: pressed };
      socket.emit("player-input", inputRef.current);
    }

    function onKeyDown(event) { updateInput(event, true); }
    function onKeyUp(event) { updateInput(event, false); }
    function onBlur() {
      inputRef.current = blankInput();
      socket.emit("player-input", inputRef.current);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const requestRoom = useCallback((event, value) => new Promise((resolve) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      resolve({ ok: false, error: "server-unavailable" });
      return;
    }
    if (value === undefined) socket.emit(event, resolve);
    else socket.emit(event, value, resolve);
  }), []);

  const createRoom = useCallback((name) => requestRoom("create-room", { name }), [requestRoom]);
  const joinRoom = useCallback((roomCode, name) => requestRoom("join-room", { roomCode, name }), [requestRoom]);
  const leaveRoom = useCallback(async () => {
    const result = await requestRoom("leave-room");
    if (result.ok) {
      playerIndexRef.current = null;
      inputRef.current = blankInput();
      setGameState((current) => ({
        ...current,
        status: "idle",
        roomCode: null,
        playerIndex: null,
        players: initialPlayers,
        bullets: [],
      }));
    }
    return result;
  }, [requestRoom]);

  const resetFinishedGame = useCallback(() => {
    playerIndexRef.current = null;
    inputRef.current = blankInput();
    setGameState((current) => ({
      ...current,
      status: "idle",
      roomCode: null,
      playerIndex: null,
      result: null,
      players: initialPlayers,
      bullets: [],
    }));
  }, []);

  const hp = gameState.players.map((player) => player.hp);
  const statusText = {
    connecting: "Connecting to game server",
    idle: "Ready to play",
    waiting: "Waiting for an opponent",
    playing: `Player ${(gameState.playerIndex ?? 0) + 1} · In game`,
    "game-over": "Match complete",
    error: "Game server unavailable",
  }[gameState.status];

  return { canvasRef, gameState, hp, statusText, createRoom, joinRoom, leaveRoom, resetFinishedGame };
}
