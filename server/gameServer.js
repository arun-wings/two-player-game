import { randomInt, randomUUID } from "node:crypto";

const WIDTH = 900;
const HEIGHT = 520;
const TICK_RATE = 30;
const MOVE_SPEED = 240;
const BULLET_SPEED = 520;
const BULLET_DAMAGE = 10;
const FIRE_COOLDOWN = 350;
const PLAYER_RADIUS = 22;
const BULLET_WIDTH = 12;
const BULLET_HEIGHT = 4;
const INPUT_KEYS = ["up", "down", "left", "right", "shoot"];

const blankInput = () => ({ up: false, down: false, left: false, right: false, shoot: false });
const normalizePlayerName = (value) => typeof value === "string"
  ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().replace(/\s+/g, " ").slice(0, 20)
  : "";

function createPlayer(index, name) {
  return {
    id: randomUUID(),
    index,
    name,
    x: index === 0 ? 145 : WIDTH - 145,
    y: HEIGHT / 2,
    hp: 100,
    radius: PLAYER_RADIUS,
  };
}

function resetRoom(room, names = room.playerNames) {
  room.playerNames = [names[0] || "Player 1", names[1] || "Player 2"];
  room.players = [createPlayer(0, room.playerNames[0]), createPlayer(1, room.playerNames[1])];
  room.inputs = [blankInput(), blankInput()];
  room.cooldowns = [0, 0];
  room.bullets = [];
}

function createRoom(code, creator, creatorName) {
  const room = {
    code,
    playerIds: [creator.id],
    playerNames: [creatorName, "Player 2"],
    players: [],
    inputs: [],
    cooldowns: [],
    bullets: [],
  };
  resetRoom(room, room.playerNames);
  return room;
}

function gameState(room) {
  return {
    players: room.players.map(({ id, index, name, x, y, hp }) => ({ id, index, name, x, y, hp })),
    bullets: room.bullets.map(({ x, y, direction }) => ({ x, y, direction })),
  };
}

function movePlayer(player, input, deltaSeconds) {
  let dx = Number(input.right) - Number(input.left);
  let dy = Number(input.down) - Number(input.up);
  const length = Math.hypot(dx, dy) || 1;
  dx /= length;
  dy /= length;

  const minX = player.index === 0 ? player.radius : WIDTH / 2 + player.radius;
  const maxX = player.index === 0 ? WIDTH / 2 - player.radius : WIDTH - player.radius;
  player.x = Math.max(minX, Math.min(maxX, player.x + dx * MOVE_SPEED * deltaSeconds));
  player.y = Math.max(player.radius, Math.min(HEIGHT - player.radius, player.y + dy * MOVE_SPEED * deltaSeconds));
}

function fireBullet(room, player, opponent) {
  const direction = opponent.x >= player.x ? 1 : -1;
  room.bullets.push({
    x: player.x + direction * (player.radius + BULLET_WIDTH / 2),
    y: player.y,
    direction,
    ownerIndex: player.index,
    targetIndex: opponent.index,
  });
}

function bulletHitsTarget(bullet, target, oldX) {
  const closestX = Math.max(Math.min(oldX, bullet.x), Math.min(Math.max(oldX, bullet.x), target.x));
  return Math.hypot(target.x - closestX, target.y - bullet.y) <= target.radius + BULLET_HEIGHT / 2;
}

function updateRoom(room, deltaSeconds, io, finishRoom) {
  const deltaMilliseconds = deltaSeconds * 1000;
  for (let index = 0; index < 2; index += 1) {
    const player = room.players[index];
    const input = room.inputs[index];
    movePlayer(player, input, deltaSeconds);
    room.cooldowns[index] = Math.max(0, room.cooldowns[index] - deltaMilliseconds);

    if (input.shoot && room.cooldowns[index] === 0) {
      fireBullet(room, player, room.players[1 - index]);
      room.cooldowns[index] = FIRE_COOLDOWN;
    }
  }

  for (let index = room.bullets.length - 1; index >= 0; index -= 1) {
    const bullet = room.bullets[index];
    const oldX = bullet.x;
    bullet.x += bullet.direction * BULLET_SPEED * deltaSeconds;
    const target = room.players[bullet.targetIndex];

    if (bulletHitsTarget(bullet, target, oldX)) {
      target.hp = Math.max(0, target.hp - BULLET_DAMAGE);
      room.bullets.splice(index, 1);
      if (target.hp === 0) {
        io.to(room.code).emit("game-state", gameState(room));
        finishRoom(room, target.index);
        return;
      }
    } else if (bullet.x < 0 || bullet.x > WIDTH) {
      room.bullets.splice(index, 1);
    }
  }

  io.to(room.code).emit("game-state", gameState(room));
}

export function attachGameServer(io) {
  const rooms = new Map();
  const connectedSockets = io.sockets.sockets;

  function finishRoom(room, loserIndex) {
    rooms.delete(room.code);
    room.playerIds.forEach((playerId, index) => {
      const socket = connectedSockets.get(playerId);
      if (!socket) return;
      socket.leave(room.code);
      socket.data.roomCode = null;
      socket.data.playerIndex = null;
      socket.emit("game-over", { result: index === loserIndex ? "lose" : "win" });
    });
  }

  function emitRoomWaiting(socket, room) {
    socket.emit("room-waiting", {
      roomCode: room.code,
      playerIndex: 0,
      players: gameState(room).players,
    });
  }

  function detachPlayer(socket, { notifyOpponent = true } = {}) {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;

    const playerIndex = room.playerIds.indexOf(socket.id);
    if (playerIndex === -1) return;
    socket.leave(room.code);
    socket.data.roomCode = null;
    socket.data.playerIndex = null;

    if (room.playerIds.length === 1) {
      rooms.delete(room.code);
      return;
    }

    const opponentId = room.playerIds[1 - playerIndex];
    const opponent = connectedSockets.get(opponentId);
    if (!opponent) {
      rooms.delete(room.code);
      return;
    }

    opponent.leave(room.code);
    const opponentName = room.players[1 - playerIndex].name;
    room.playerIds = [opponent.id];
    resetRoom(room, [opponentName, "Player 2"]);
    opponent.data.roomCode = room.code;
    opponent.data.playerIndex = 0;
    opponent.join(room.code);
    if (notifyOpponent) opponent.emit("opponent-left");
    emitRoomWaiting(opponent, room);
  }

  function assignRoom(socket, room, playerIndex) {
    socket.data.roomCode = room.code;
    socket.data.playerIndex = playerIndex;
    socket.join(room.code);
  }

  io.on("connection", (socket) => {
    socket.data.roomCode = null;
    socket.data.playerIndex = null;

    socket.on("create-room", (payload = {}, reply = () => {}) => {
      if (socket.data.roomCode) return reply({ ok: false, error: "already-in-room" });
      const name = normalizePlayerName(payload.name);
      if (!name) return reply({ ok: false, error: "invalid-name" });

      let code;
      for (let attempt = 0; attempt < 10000; attempt += 1) {
        const candidate = String(randomInt(0, 10000)).padStart(4, "0");
        if (!rooms.has(candidate)) {
          code = candidate;
          break;
        }
      }
      if (!code) return reply({ ok: false, error: "rooms-unavailable" });

      const room = createRoom(code, socket, name);
      rooms.set(code, room);
      assignRoom(socket, room, 0);
      emitRoomWaiting(socket, room);
      reply({ ok: true, roomCode: code });
    });

    socket.on("join-room", (payload = {}, reply = () => {}) => {
      if (socket.data.roomCode) return reply({ ok: false, error: "already-in-room" });
      const code = String(payload.roomCode ?? "").trim();
      if (!/^\d{4}$/.test(code)) return reply({ ok: false, error: "invalid-code" });
      const name = normalizePlayerName(payload.name);
      if (!name) return reply({ ok: false, error: "invalid-name" });

      const room = rooms.get(code);
      if (!room) return reply({ ok: false, error: "room-not-found" });
      if (room.playerIds.length >= 2) return reply({ ok: false, error: "room-full" });

      const playerIndex = room.playerIds.length;
      room.playerIds.push(socket.id);
      room.playerNames[playerIndex] = name;
      resetRoom(room, room.playerNames);
      assignRoom(socket, room, playerIndex);
      room.playerIds.forEach((playerId, index) => {
        connectedSockets.get(playerId)?.emit("room-started", { roomCode: room.code, playerIndex: index });
      });
      io.to(room.code).emit("game-state", gameState(room));
      reply({ ok: true, roomCode: code, playerIndex });
    });

    socket.on("leave-room", (reply = () => {}) => {
      detachPlayer(socket);
      reply({ ok: true });
    });

    socket.on("player-input", (input = {}) => {
      const room = rooms.get(socket.data.roomCode);
      const playerIndex = socket.data.playerIndex;
      if (!room || room.playerIds.length !== 2 || room.playerIds[playerIndex] !== socket.id) return;
      room.inputs[playerIndex] = Object.fromEntries(INPUT_KEYS.map((key) => [key, input[key] === true]));
    });

    socket.on("disconnect", () => detachPlayer(socket));
  });

  setInterval(() => {
    for (const room of rooms.values()) {
      if (room.playerIds.length === 2) updateRoom(room, 1 / TICK_RATE, io, finishRoom);
    }
  }, 1000 / TICK_RATE);
}
