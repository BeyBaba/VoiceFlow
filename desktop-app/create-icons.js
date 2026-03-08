// Generate high-quality anti-aliased icons using SDF (Signed Distance Fields)
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function createPNG(width, height, drawFunc) {
  const channels = 4;
  const rawData = Buffer.alloc(height * (1 + width * channels));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * channels)] = 0;
    for (let x = 0; x < width; x++) {
      const offset = y * (1 + width * channels) + 1 + x * channels;
      const [r, g, b, a] = drawFunc(x, y, width, height);
      rawData[offset] = Math.max(0, Math.min(255, Math.round(r)));
      rawData[offset + 1] = Math.max(0, Math.min(255, Math.round(g)));
      rawData[offset + 2] = Math.max(0, Math.min(255, Math.round(b)));
      rawData[offset + 3] = Math.max(0, Math.min(255, Math.round(a)));
    }
  }
  const compressed = zlib.deflateSync(rawData);
  function crc32(buf) {
    let crc = 0xffffffff;
    const table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeData));
    return Buffer.concat([len, typeData, crc]);
  }
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", Buffer.alloc(0))]);
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
function sdfRoundedRect(px, py, cx, cy, halfW, halfH, radius) {
  const dx = Math.abs(px - cx) - halfW + radius;
  const dy = Math.abs(py - cy) - halfH + radius;
  return Math.sqrt(Math.max(dx, 0) ** 2 + Math.max(dy, 0) ** 2) + Math.min(Math.max(dx, dy), 0) - radius;
}
function sdfCircle(px, py, cx, cy, r) {
  return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2) - r;
}
function sdfCapsule(px, py, ax, ay, bx, by, r) {
  const pax = px - ax, pay = py - ay;
  const bax = bx - ax, bay = by - ay;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  return Math.sqrt((pax - bax * h) ** 2 + (pay - bay * h) ** 2) - r;
}

function drawAppIcon(x, y, w, h) {
  const s = w, cx = s / 2, cy = s / 2;
  const aa = Math.max(1, s / 128);
  const margin = s * 0.06;
  const rectHalf = s / 2 - margin;
  const cornerR = s * 0.22;
  const bgDist = sdfRoundedRect(x, y, cx, cy, rectHalf, rectHalf, cornerR);
  if (bgDist > aa) return [0, 0, 0, 0];
  const bgAlpha = 1.0 - smoothstep(-aa, aa, bgDist);
  const t = ((x - margin) + (y - margin)) / ((s - 2 * margin) * 2);
  let r = 15 + (79 - 15) * t;
  let g = 118 + (70 - 118) * t;
  let b = 110 + (229 - 110) * t;
  const glow = Math.max(0, 1 - (y - margin) / (s * 0.5)) * 0.12;
  r += glow * 200; g += glow * 200; b += glow * 200;
  const micW = s * 0.13, micH = s * 0.22, micCy = cy - s * 0.06;
  const micDist = sdfRoundedRect(x, y, cx, micCy, micW, micH, micW);
  if (micDist < aa) {
    const ma = 1.0 - smoothstep(-aa, aa, micDist);
    r = r * (1 - ma) + 255 * ma; g = g * (1 - ma) + 255 * ma; b = b * (1 - ma) + 255 * ma;
  }
  const arcCy = micCy + micH * 0.15;
  const arcR = s * 0.2, arcT = s * 0.032;
  const arcDist = Math.abs(sdfCircle(x, y, cx, arcCy, arcR)) - arcT;
  if (arcDist < aa && y > arcCy) {
    const ar = (1.0 - smoothstep(-aa, aa, arcDist)) * 0.95;
    r = r * (1 - ar) + 255 * ar; g = g * (1 - ar) + 255 * ar; b = b * (1 - ar) + 255 * ar;
  }
  const standTop = arcCy + arcR, standBot = standTop + s * 0.09;
  const standDist = sdfCapsule(x, y, cx, standTop, cx, standBot, arcT);
  if (standDist < aa) {
    const sr = (1.0 - smoothstep(-aa, aa, standDist)) * 0.9;
    r = r * (1 - sr) + 255 * sr; g = g * (1 - sr) + 255 * sr; b = b * (1 - sr) + 255 * sr;
  }
  const baseY = standBot, baseW = s * 0.1;
  const baseDist = sdfCapsule(x, y, cx - baseW, baseY, cx + baseW, baseY, arcT);
  if (baseDist < aa) {
    const br = (1.0 - smoothstep(-aa, aa, baseDist)) * 0.9;
    r = r * (1 - br) + 255 * br; g = g * (1 - br) + 255 * br; b = b * (1 - br) + 255 * br;
  }
  return [r, g, b, bgAlpha * 255];
}

function drawTrayIcon(x, y, w, h) {
  const s = w, cx = s / 2, cy = s / 2;
  const aa = Math.max(0.7, s / 24);
  const bgDist = sdfCircle(x, y, cx, cy, s * 0.44);
  if (bgDist > aa) return [0, 0, 0, 0];
  const bgAlpha = 1.0 - smoothstep(-aa, aa, bgDist);
  const t = (x + y) / (s * 2);
  let r = 13 + t * 30, g = 148 + t * 30, b = 136 + t * 40;
  const micW = s * 0.14, micH = s * 0.2, micCy = cy - s * 0.06;
  const micDist = sdfRoundedRect(x, y, cx, micCy, micW, micH, micW);
  if (micDist < aa) {
    const ma = 1.0 - smoothstep(-aa, aa, micDist);
    r = r * (1 - ma) + 255 * ma; g = g * (1 - ma) + 255 * ma; b = b * (1 - ma) + 255 * ma;
  }
  const arcCy = micCy + micH * 0.15, arcR = s * 0.22, arcT = s * 0.055;
  const arcDist = Math.abs(sdfCircle(x, y, cx, arcCy, arcR)) - arcT / 2;
  if (arcDist < aa && y > arcCy) {
    const ar = (1.0 - smoothstep(-aa, aa, arcDist)) * 0.9;
    r = r * (1 - ar) + 255 * ar; g = g * (1 - ar) + 255 * ar; b = b * (1 - ar) + 255 * ar;
  }
  const standTop = arcCy + arcR, standBot = standTop + s * 0.08;
  const standDist = sdfCapsule(x, y, cx, standTop, cx, standBot, arcT / 2);
  if (standDist < aa) {
    const sr = (1.0 - smoothstep(-aa, aa, standDist)) * 0.85;
    r = r * (1 - sr) + 255 * sr; g = g * (1 - sr) + 255 * sr; b = b * (1 - sr) + 255 * sr;
  }
  return [r, g, b, bgAlpha * 255];
}

const assetsDir = path.join(__dirname, "assets");
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
fs.writeFileSync(path.join(assetsDir, "tray-icon.png"), createPNG(16, 16, drawTrayIcon));
console.log("tray-icon.png (16x16)");
fs.writeFileSync(path.join(assetsDir, "tray-icon@2x.png"), createPNG(32, 32, drawTrayIcon));
console.log("tray-icon@2x.png (32x32)");
[16, 32, 48, 64, 128, 256].forEach((size) => {
  fs.writeFileSync(path.join(assetsDir, `icon-${size}.png`), createPNG(size, size, drawAppIcon));
  console.log(`icon-${size}.png`);
});
console.log("\nDone!");
