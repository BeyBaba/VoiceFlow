/**
 * VoiceFlow Chrome Extension Icon Generator
 * Run: node create-icons.js
 * Creates 16x16, 48x48, 128x128 PNG icons
 */

const fs = require("fs");
const zlib = require("zlib");

function createPNG(width, height, drawFunc) {
  // Create RGBA pixel buffer
  const pixels = new Uint8Array(width * height * 4);

  // Draw using the provided function
  drawFunc(pixels, width, height);

  // Build raw image data (filter byte 0 + RGBA per row)
  const rawData = Buffer.alloc((1 + width * 4) * height);
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const srcOffset = (y * width + x) * 4;
      const dstOffset = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstOffset] = pixels[srcOffset];     // R
      rawData[dstOffset + 1] = pixels[srcOffset + 1]; // G
      rawData[dstOffset + 2] = pixels[srcOffset + 2]; // B
      rawData[dstOffset + 3] = pixels[srcOffset + 3]; // A
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // Build PNG file
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = createChunk("IHDR", (() => {
    const buf = Buffer.alloc(13);
    buf.writeUInt32BE(width, 0);
    buf.writeUInt32BE(height, 4);
    buf[8] = 8; // bit depth
    buf[9] = 6; // color type: RGBA
    buf[10] = 0; // compression
    buf[11] = 0; // filter
    buf[12] = 0; // interlace
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

// CRC32 for PNG
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Set pixel helper
function setPixel(pixels, width, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0) return;
  const offset = (y * width + x) * 4;
  // Alpha blend
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

// Draw filled circle
function fillCircle(pixels, width, cx, cy, radius, r, g, b, a = 255) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(pixels, width, Math.round(cx + dx), Math.round(cy + dy), r, g, b, a);
      }
    }
  }
}

// Draw filled rounded rect
function fillRoundedRect(pixels, width, x, y, w, h, radius, r, g, b, a = 255) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      let inside = false;
      const px = x + dx;
      const py = y + dy;

      if (dx >= radius && dx < w - radius) inside = true;
      else if (dy >= radius && dy < h - radius) inside = true;
      else {
        // Check corner circles
        const corners = [
          [radius, radius],
          [w - radius - 1, radius],
          [radius, h - radius - 1],
          [w - radius - 1, h - radius - 1],
        ];
        for (const [cx, cy] of corners) {
          const dist = Math.sqrt((dx - cx) ** 2 + (dy - cy) ** 2);
          if (dist <= radius) {
            inside = true;
            break;
          }
        }
      }

      if (inside) setPixel(pixels, width, px, py, r, g, b, a);
    }
  }
}

// Draw filled rect
function fillRect(pixels, width, x, y, w, h, r, g, b, a = 255) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(pixels, width, x + dx, y + dy, r, g, b, a);
    }
  }
}

// Draw VoiceFlow icon
function drawIcon(pixels, width, height) {
  const s = width / 128; // scale factor

  // Background: teal gradient (simplified as solid)
  const cornerR = Math.round(28 * s);
  fillRoundedRect(pixels, width, 0, 0, width, height, cornerR, 15, 118, 110); // #0F766E

  // Add slight gradient effect with purple in bottom-right
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gradientStrength = ((x + y) / (width + height)) * 0.4;
      const offset = (y * width + x) * 4;
      if (pixels[offset + 3] > 0) {
        pixels[offset] = Math.round(pixels[offset] * (1 - gradientStrength) + 79 * gradientStrength);
        pixels[offset + 1] = Math.round(pixels[offset + 1] * (1 - gradientStrength) + 70 * gradientStrength);
        pixels[offset + 2] = Math.round(pixels[offset + 2] * (1 - gradientStrength) + 229 * gradientStrength);
      }
    }
  }

  // Microphone body (white)
  const micW = Math.round(24 * s);
  const micH = Math.round(36 * s);
  const micX = Math.round((width - micW) / 2);
  const micY = Math.round(22 * s);
  const micR = Math.round(12 * s);

  // Mic body rounded rect
  fillRoundedRect(pixels, width, micX, micY, micW, micH, micR, 255, 255, 255);

  // Mic arc (U shape around mic)
  const arcCX = width / 2;
  const arcCY = Math.round(52 * s);
  const arcOuterR = Math.round(26 * s);
  const arcInnerR = Math.round(22 * s);

  for (let dy = -arcOuterR; dy <= arcOuterR; dy++) {
    for (let dx = -arcOuterR; dx <= arcOuterR; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= arcOuterR && dist >= arcInnerR && dy > -4 * s) {
        setPixel(pixels, width, Math.round(arcCX + dx), Math.round(arcCY + dy), 255, 255, 255);
      }
    }
  }

  // Stem (vertical line below mic)
  const stemW = Math.round(4 * s);
  const stemX = Math.round((width - stemW) / 2);
  const stemY = Math.round(78 * s);
  const stemH = Math.round(16 * s);
  fillRect(pixels, width, stemX, stemY, stemW, stemH, 255, 255, 255);

  // Base (horizontal line at bottom)
  const baseW = Math.round(28 * s);
  const baseH = Math.round(4 * s);
  const baseX = Math.round((width - baseW) / 2);
  const baseY = Math.round(92 * s);
  fillRoundedRect(pixels, width, baseX, baseY, baseW, baseH, Math.round(2 * s), 255, 255, 255);
}

// Generate icons
const sizes = [16, 48, 128];

for (const size of sizes) {
  const png = createPNG(size, size, drawIcon);
  fs.writeFileSync(`icons/icon${size}.png`, png);
  console.log(`Created icons/icon${size}.png (${png.length} bytes)`);
}

console.log("\nDone! Icons created in icons/ folder.");
