// Renders the shareable Atlas Score card to an offscreen <canvas> and
// triggers a PNG download. Drawn natively (no screenshot library) so the
// export matches the reference card format exactly: ticker, date, ring
// gauge, and six pillar tiles with progress bars.

const CARD_WIDTH = 704;
const CARD_HEIGHT = 856;
const SCALE = 2; // 2x for crisp output

const COLOR_GOOD = '#1a7f37'; // score >= 70
const COLOR_MID = '#f0b90b';  // 40 - 69
const COLOR_BAD = '#c0392b';  // < 40
const COLOR_MID_TEXT = '#e0a800';
const COLOR_TRACK = '#1c2530';
const COLOR_TEXT = '#111827';
const COLOR_MUTED = '#6b7280';
const COLOR_BORDER = '#e5e7eb';
const COLOR_TILE_BG = '#f8fafc';

const FONT_DISPLAY = "'Outfit', 'Inter', sans-serif";

function scoreColor(score, forText = false) {
  if (score >= 70) return COLOR_GOOD;
  if (score >= 40) return forText ? COLOR_MID_TEXT : COLOR_MID;
  return COLOR_BAD;
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function drawRing(ctx, centerX, centerY, radius, score) {
  const lineWidth = 15;
  const startAngle = -Math.PI / 2; // 12 o'clock
  const sweep = (score / 100) * Math.PI * 2;

  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  ctx.strokeStyle = COLOR_TRACK;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = scoreColor(score);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, startAngle + sweep);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = scoreColor(score, true);
  ctx.font = `700 52px ${FONT_DISPLAY}`;
  ctx.fillText(String(score), centerX, centerY + 8);

  ctx.fillStyle = COLOR_MUTED;
  ctx.font = `500 19px ${FONT_DISPLAY}`;
  ctx.fillText('/100', centerX, centerY + 38);
}

function drawPillarTile(ctx, x, y, width, height, pillar) {
  const pad = 22;

  ctx.fillStyle = COLOR_TILE_BG;
  ctx.strokeStyle = COLOR_BORDER;
  ctx.lineWidth = 1.5;
  roundedRect(ctx, x, y, width, height, 14);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = COLOR_TEXT;
  ctx.font = `700 21px ${FONT_DISPLAY}`;
  ctx.fillText(pillar.label, x + pad, y + 42);

  ctx.textAlign = 'right';
  ctx.fillStyle = pillar.score === null ? COLOR_MUTED : scoreColor(pillar.score, true);
  ctx.font = `700 30px ${FONT_DISPLAY}`;
  ctx.fillText(pillar.score === null ? '—' : String(pillar.score), x + width - pad, y + 45);

  const barY = y + height - 34;
  const barWidth = width - pad * 2;
  const barHeight = 11;

  ctx.fillStyle = COLOR_TRACK;
  roundedRect(ctx, x + pad, barY, barWidth, barHeight, barHeight / 2);
  ctx.fill();

  if (pillar.score !== null && pillar.score > 0) {
    const fillWidth = Math.max(barHeight, (pillar.score / 100) * barWidth);
    ctx.fillStyle = scoreColor(pillar.score);
    roundedRect(ctx, x + pad, barY, fillWidth, barHeight, barHeight / 2);
    ctx.fill();
  }
}

async function renderScoreCard(result) {
  // Make sure Outfit/Inter are available to the canvas before drawing.
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH * SCALE;
  canvas.height = CARD_HEIGHT * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.strokeStyle = COLOR_BORDER;
  ctx.lineWidth = 2;
  roundedRect(ctx, 4, 4, CARD_WIDTH - 8, CARD_HEIGHT - 8, 26);
  ctx.stroke();

  // Header: ticker + as-of date
  ctx.textAlign = 'center';
  ctx.fillStyle = COLOR_TEXT;
  ctx.font = `800 42px ${FONT_DISPLAY}`;
  ctx.fillText(result.ticker, CARD_WIDTH / 2, 96);

  ctx.fillStyle = COLOR_MUTED;
  ctx.font = `500 21px ${FONT_DISPLAY}`;
  ctx.fillText(formatDate(result.as_of), CARD_WIDTH / 2, 130);

  ctx.strokeStyle = COLOR_BORDER;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(72, 162);
  ctx.lineTo(CARD_WIDTH - 72, 162);
  ctx.stroke();

  // Composite ring gauge
  drawRing(ctx, CARD_WIDTH / 2, 272, 74, result.composite_score);

  ctx.textAlign = 'center';
  ctx.fillStyle = COLOR_MUTED;
  ctx.font = `500 25px ${FONT_DISPLAY}`;
  ctx.fillText('Atlas Score', CARD_WIDTH / 2, 396);

  // Pillar tiles: 2 columns x 3 rows
  const tileWidth = 292;
  const tileHeight = 106;
  const gap = 20;
  const gridX = (CARD_WIDTH - tileWidth * 2 - gap) / 2;
  const gridY = 452;

  result.pillars.forEach((pillar, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    drawPillarTile(
      ctx,
      gridX + col * (tileWidth + gap),
      gridY + row * (tileHeight + gap),
      tileWidth,
      tileHeight,
      pillar
    );
  });

  return canvas;
}

export async function downloadScoreCard(result) {
  const canvas = await renderScoreCard(result);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Atlas-Score-${result.ticker}-${result.as_of}.png`;
  link.click();
  URL.revokeObjectURL(url);
}
