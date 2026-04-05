/**
 * VoiceFlow Chrome Extension Icon Generator
 * Run: node create-icons.js
 * Creates 16x16, 48x48, 128x128 PNG icons
 * Design: Clean microphone on transparent/dark background - looks great in Chrome toolbar
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
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(pixels, width, cx + dx, cy + dy, r, g, b, a);
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

// Draw the default (inactive) icon: teal circle + white microphone
function drawIcon(pixels, width, height) {
  const s = width / 128;
  const cx = width / 2;
  const cy = height / 2;

  // Circle background with teal gradient
  const radius = Math.round(60 * s);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        // Smooth edge anti-aliasing
        const edge = radius - dist;
        const alpha = edge < 1 ? Math.round(edge * 255) : 255;
        // Gradient: teal top -> slightly darker bottom
        const t = (dy + radius) / (2 * radius);
        const r = Math.round(13 + t * 2);
        const g = Math.round(148 - t * 30);
        const b = Math.round(136 - t * 20);
        setPixel(pixels, width, cx + dx, cy + dy, r, g, b, alpha);
      }
    }
  }

  // White microphone
  const micW = Math.round(20 * s);
  const micH = Math.round(30 * s);
  const micX = Math.round((width - micW) / 2);
  const micY = Math.round(24 * s);
  const micR = Math.round(10 * s);

  // Mic body
  fillRoundedRect(pixels, width, micX, micY, micW, micH, micR, 255, 255, 255);

  // U-shaped arc around mic
  const arcCY = Math.round(50 * s);
  const arcOuterR = Math.round(22 * s);
  const arcInnerR = Math.round(18 * s);

  for (let dy = -arcOuterR; dy <= arcOuterR; dy++) {
    for (let dx = -arcOuterR; dx <= arcOuterR; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= arcOuterR && dist >= arcInnerR && dy > -2 * s) {
        setPixel(pixels, width, cx + dx, arcCY + dy, 255, 255, 255);
      }
    }
  }

  // Stem
  const stemW = Math.round(4 * s);
  const stemX = Math.round((width - stemW) / 2);
  const stemY = Math.round(72 * s);
  const stemH = Math.round(14 * s);
  fillRect(pixels, width, stemX, stemY, stemW, stemH, 255, 255, 255);

  // Base
  const baseW = Math.round(24 * s);
  const baseH = Math.round(4 * s);
  const baseX = Math.round((width - baseW) / 2);
  const baseY = Math.round(84 * s);
  fillRoundedRect(pixels, width, baseX, baseY, baseW, baseH, Math.round(2 * s), 255, 255, 255);
}

// Draw the active (recording) icon: red circle + white microphone
function drawActiveIcon(pixels, width, height) {
  const s = width / 128;
  const cx = width / 2;
  const cy = height / 2;

  // Red circle background
  const radius = Math.round(60 * s);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        const edge = radius - dist;
        const alpha = edge < 1 ? Math.round(edge * 255) : 255;
        const t = (dy + radius) / (2 * radius);
        const r = Math.round(239 - t * 20);
        const g = Math.round(68 - t * 20);
        const b = Math.round(68 - t * 10);
        setPixel(pixels, width, cx + dx, cy + dy, r, g, b, alpha);
      }
    }
  }

  // White microphone (same as default)
  const micW = Math.round(20 * s);
  const micH = Math.round(30 * s);
  const micX = Math.round((width - micW) / 2);
  const micY = Math.round(24 * s);
  const micR = Math.round(10 * s);
  fillRoundedRect(pixels, width, micX, micY, micW, micH, micR, 255, 255, 255);

  const arcCY = Math.round(50 * s);
  const arcOuterR = Math.round(22 * s);
  const arcInnerR = Math.round(18 * s);
  for (let dy = -arcOuterR; dy <= arcOuterR; dy++) {
    for (let dx = -arcOuterR; dx <= arcOuterR; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= arcOuterR && dist >= arcInnerR && dy > -2 * s) {
        setPixel(pixels, width, cx + dx, arcCY + dy, 255, 255, 255);
      }
    }
  }

  const stemW = Math.round(4 * s);
  const stemX = Math.round((width - stemW) / 2);
  const stemY = Math.round(72 * s);
  const stemH = Math.round(14 * s);
  fillRect(pixels, width, stemX, stemY, stemW, stemH, 255, 255, 255);

  const baseW = Math.round(24 * s);
  const baseH = Math.round(4 * s);
  const baseX = Math.round((width - baseW) / 2);
  const baseY = Math.round(84 * s);
  fillRoundedRect(pixels, width, baseX, baseY, baseW, baseH, Math.round(2 * s), 255, 255, 255);
}

// Generate icons
const sizes = [16, 48, 128];

for (const size of sizes) {
  // Default (inactive) icons
  const png = createPNG(size, size, drawIcon);
  fs.writeFileSync(`icons/icon${size}.png`, png);
  console.log(`Created icons/icon${size}.png (${png.length} bytes)`);

  // Active (recording) icons - red background
  const activePng = createPNG(size, size, drawActiveIcon);
  fs.writeFileSync(`icons/icon${size}-active.png`, activePng);
  console.log(`Created icons/icon${size}-active.png (${activePng.length} bytes)`);
}

console.log("\nDone! Icons created in icons/ folder.");
console.log("Default: teal circle + white mic");
console.log("Active: red circle + white mic");
