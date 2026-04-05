/**
 * VoiceFlow Chrome Extension Icon Generator
 * Run: node create-icons.js
 * Creates 16x16, 48x48, 128x128 PNG icons
 * Design: Bold microphone icon optimized for Chrome toolbar visibility
 */

const fs = require("fs");
const zlib = require("zlib");

function createPNG(width, height, drawFunc) {
  const pixels = new Uint8Array(width * height * 4);
  drawFunc(pixels, width, height);

  const rawData = Buffer.alloc((1 + width * 4) * height);
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const srcOffset = (y * width + x) * 4;
      const dstOffset = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstOffset] = pixels[srcOffset];
      rawData[dstOffset + 1] = pixels[srcOffset + 1];
      rawData[dstOffset + 2] = pixels[srcOffset + 2];
      rawData[dstOffset + 3] = pixels[srcOffset + 3];
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = createChunk("IHDR", (() => {
    const buf = Buffer.alloc(13);
    buf.writeUInt32BE(width, 0);
    buf.writeUInt32BE(height, 4);
    buf[8] = 8;
    buf[9] = 6;
    buf[10] = 0;
    buf[11] = 0;
    buf[12] = 0;
    return buf;
  })());

  const idat = createChunk("IDAT", compressed);
  const iend = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) crc = (crc >>> 1) ^ 0xedb88320;
      else crc = crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function setPixel(pixels, width, x, y, r, g, b, a = 255) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || x >= width || y < 0) return;
  const height = pixels.length / (width * 4);
  if (y >= height) return;
  const offset = (y * width + x) * 4;
  const srcA = a / 255;
  const dstA = pixels[offset + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA > 0) {
    pixels[offset] = Math.round((r * srcA + pixels[offset] * dstA * (1 - srcA)) / outA);
    pixels[offset + 1] = Math.round((g * srcA + pixels[offset + 1] * dstA * (1 - srcA)) / outA);
    pixels[offset + 2] = Math.round((b * srcA + pixels[offset + 2] * dstA * (1 - srcA)) / outA);
    pixels[offset + 3] = Math.round(outA * 255);
  }
}

function fillCircle(pixels, width, cx, cy, radius, r, g, b, a = 255) {
  for (let dy = -radius - 1; dy <= radius + 1; dy++) {
    for (let dx = -radius - 1; dx <= radius + 1; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        const edge = radius - dist;
        const alpha = edge < 1 ? Math.round(edge * a) : a;
        setPixel(pixels, width, cx + dx, cy + dy, r, g, b, alpha);
      }
    }
  }
}

function fillRoundedRect(pixels, width, x, y, w, h, radius, r, g, b, a = 255) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      let inside = false;
      if (dx >= radius && dx < w - radius) inside = true;
      else if (dy >= radius && dy < h - radius) inside = true;
      else {
        const corners = [
          [radius, radius],
          [w - radius - 1, radius],
          [radius, h - radius - 1],
          [w - radius - 1, h - radius - 1],
        ];
        for (const [cx, cy] of corners) {
          const dist = Math.sqrt((dx - cx) ** 2 + (dy - cy) ** 2);
          if (dist <= radius) { inside = true; break; }
        }
      }
      if (inside) setPixel(pixels, width, x + dx, y + dy, r, g, b, a);
    }
  }
}

function fillRect(pixels, width, x, y, w, h, r, g, b, a = 255) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(pixels, width, x + dx, y + dy, r, g, b, a);
    }
  }
}

// Draw arc (U-shape around mic)
function drawArc(pixels, width, cx, cy, outerR, innerR, r, g, b, a = 255) {
  for (let dy = -outerR - 1; dy <= outerR + 1; dy++) {
    for (let dx = -outerR - 1; dx <= outerR + 1; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= outerR && dist >= innerR && dy > 0) {
        const edgeOuter = outerR - dist;
        const edgeInner = dist - innerR;
        const edge = Math.min(edgeOuter, edgeInner);
        const alpha = edge < 1 ? Math.round(edge * a) : a;
        setPixel(pixels, width, cx + dx, cy + dy, r, g, b, alpha);
      }
    }
  }
}

// ============ 16px ICON (simplified for toolbar clarity) ============
function drawIcon16(pixels, width, height, bgR, bgG, bgB) {
  const cx = 8;
  const cy = 8;

  // Background circle - fills most of the 16x16 space
  fillCircle(pixels, width, cx, cy, 7, bgR, bgG, bgB);

  // Mic body (bold, simple rectangle with rounded top)
  fillRoundedRect(pixels, width, 6, 3, 4, 7, 2, 255, 255, 255);

  // U-arc
  drawArc(pixels, width, cx, 7, 5, 3, 255, 255, 255);

  // Stem
  fillRect(pixels, width, 7, 12, 2, 2, 255, 255, 255);

  // Base
  fillRect(pixels, width, 5, 13, 6, 1, 255, 255, 255);
}

// ============ 48px ICON ============
function drawIcon48(pixels, width, height, bgR, bgG, bgB) {
  const cx = 24;
  const cy = 24;

  // Background circle with gradient
  const radius = 22;
  for (let dy = -radius - 1; dy <= radius + 1; dy++) {
    for (let dx = -radius - 1; dx <= radius + 1; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        const edge = radius - dist;
        const alpha = edge < 1 ? Math.round(edge * 255) : 255;
        const t = (dy + radius) / (2 * radius);
        const r = Math.round(bgR + t * 5);
        const g = Math.round(bgG - t * 20);
        const b = Math.round(bgB - t * 15);
        setPixel(pixels, width, cx + dx, cy + dy, r, g, b, alpha);
      }
    }
  }

  // Mic body
  fillRoundedRect(pixels, width, 19, 9, 10, 14, 5, 255, 255, 255);

  // U-arc
  drawArc(pixels, width, cx, 19, 10, 7, 255, 255, 255);

  // Stem
  fillRect(pixels, width, 23, 29, 2, 5, 255, 255, 255);

  // Base
  fillRoundedRect(pixels, width, 18, 33, 12, 2, 1, 255, 255, 255);
}

// ============ 128px ICON ============
function drawIcon128(pixels, width, height, bgR, bgG, bgB) {
  const cx = 64;
  const cy = 64;

  // Background circle with gradient
  const radius = 60;
  for (let dy = -radius - 1; dy <= radius + 1; dy++) {
    for (let dx = -radius - 1; dx <= radius + 1; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        const edge = radius - dist;
        const alpha = edge < 1 ? Math.round(edge * 255) : 255;
        const t = (dy + radius) / (2 * radius);
        const r = Math.round(bgR + t * 5);
        const g = Math.round(bgG - t * 25);
        const b = Math.round(bgB - t * 18);
        setPixel(pixels, width, cx + dx, cy + dy, r, g, b, alpha);
      }
    }
  }

  // Mic body
  fillRoundedRect(pixels, width, 52, 24, 24, 36, 12, 255, 255, 255);

  // U-arc
  drawArc(pixels, width, cx, 52, 26, 21, 255, 255, 255);

  // Stem
  fillRect(pixels, width, 62, 78, 4, 14, 255, 255, 255);

  // Base
  fillRoundedRect(pixels, width, 50, 90, 28, 4, 2, 255, 255, 255);
}

// Teal colors (default)
const TEAL = { r: 13, g: 148, b: 136 };
// Red colors (active/recording)
const RED = { r: 239, g: 68, b: 68 };

// Size-specific draw functions
const drawFuncs = {
  16: drawIcon16,
  48: drawIcon48,
  128: drawIcon128,
};

// Generate icons
const sizes = [16, 48, 128];

for (const size of sizes) {
  const drawFunc = drawFuncs[size];

  // Default (inactive) icons - teal
  const png = createPNG(size, size, (px, w, h) => drawFunc(px, w, h, TEAL.r, TEAL.g, TEAL.b));
  fs.writeFileSync(`icons/icon${size}.png`, png);
  console.log(`Created icons/icon${size}.png (${png.length} bytes)`);

  // Active (recording) icons - red
  const activePng = createPNG(size, size, (px, w, h) => drawFunc(px, w, h, RED.r, RED.g, RED.b));
  fs.writeFileSync(`icons/icon${size}-active.png`, activePng);
  console.log(`Created icons/icon${size}-active.png (${activePng.length} bytes)`);
}

console.log("\nDone! Icons created in icons/ folder.");
console.log("Default: teal circle + white mic (optimized per size)");
console.log("Active: red circle + white mic (optimized per size)");
