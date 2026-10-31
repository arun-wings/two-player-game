const WIDTH = 900;
const HEIGHT = 520;
const PLAYER_RADIUS = 22;
const HIT_FLASH_DURATION = 480;
const HIT_BLINK_RATE = 120;

function drawGrid(ctx) {
  ctx.strokeStyle = "rgba(130, 157, 201, 0.10)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function drawPlayer(ctx, player, hitUntil, timestamp) {
  const color = player.index === 0 ? "#4b9cff" : "#ff657c";
  const remainingFlash = hitUntil - timestamp;
  const isBlinkOn = remainingFlash > 0
    && Math.floor((HIT_FLASH_DURATION - remainingFlash) / HIT_BLINK_RATE) % 2 === 0;
  ctx.save();
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER_RADIUS + (isBlinkOn ? 16 : 10), 0, Math.PI * 2);
  ctx.fillStyle = remainingFlash > 0 ? `${color}${isBlinkOn ? "aa" : "0c"}` : `${color}22`;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(player.x, player.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.fillStyle = "#eaf2ff";
  ctx.font = "bold 12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`P${player.index + 1} · ${player.name || "Player"}`, player.x, player.y + 43, 100);
  ctx.restore();
}

function drawBullet(ctx, bullet) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(bullet.x - 6, bullet.y - 2, 12, 4);
}

export function drawArena(ctx, gameState, hitUntilByPlayer, timestamp) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawGrid(ctx);

  ctx.strokeStyle = "rgba(151, 176, 220, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, WIDTH - 2, HEIGHT - 2);
  ctx.strokeStyle = "#f5bd4f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 0);
  ctx.lineTo(WIDTH / 2, HEIGHT);
  ctx.stroke();

  gameState.bullets.forEach((bullet) => drawBullet(ctx, bullet));
  gameState.players.forEach((player) => drawPlayer(ctx, player, hitUntilByPlayer[player.index], timestamp));
}
