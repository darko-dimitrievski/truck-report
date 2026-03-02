const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, size, size);

  // Amber rounded rect
  const pad = size * 0.12;
  ctx.fillStyle = '#e8a020';
  roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, size * 0.15);
  ctx.fill();

  // Truck SVG-like shape
  const s = size * 0.55;
  const x = (size - s) / 2;
  const y = (size - s * 0.7) / 2;

  // Cab
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(x + s * 0.45, y, s * 0.55, s * 0.55);
  // Trailer
  ctx.fillRect(x, y + s * 0.1, s * 0.5, s * 0.45);

  // Wheels
  ctx.beginPath();
  ctx.arc(x + s * 0.15, y + s * 0.62, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + s * 0.65, y + s * 0.62, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + s * 0.88, y + s * 0.62, s * 0.1, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

try {
  fs.writeFileSync(path.join(dir, 'icon-192.png'), drawIcon(192));
  fs.writeFileSync(path.join(dir, 'icon-512.png'), drawIcon(512));
  console.log('Icons generated!');
} catch (e) {
  console.log('Canvas not available, creating placeholder icons');
  // Create minimal 1x1 PNG as fallback
  const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(path.join(dir, 'icon-192.png'), png1x1);
  fs.writeFileSync(path.join(dir, 'icon-512.png'), png1x1);
}
