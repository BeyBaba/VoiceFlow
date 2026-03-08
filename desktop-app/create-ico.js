// Create a simple ICO file from PNG data
const fs = require("fs");
const path = require("path");

// Read all PNG icon sizes
const sizes = [16, 32, 48, 256];
const pngBuffers = sizes.map((s) => {
  return fs.readFileSync(path.join(__dirname, "assets", `icon-${s}.png`));
});

// ICO file format
function createICO(pngFiles) {
  const numImages = pngFiles.length;

  // Header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(numImages, 4); // Number of images

  // Calculate offsets
  const dirSize = numImages * 16;
  let dataOffset = 6 + dirSize;

  const dirEntries = [];
  const imageDataBuffers = [];

  for (let i = 0; i < numImages; i++) {
    const size = sizes[i];
    const pngData = pngFiles[i];

    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size; // Width (0 = 256)
    entry[1] = size >= 256 ? 0 : size; // Height (0 = 256)
    entry[2] = 0;  // Color palette
    entry[3] = 0;  // Reserved
    entry.writeUInt16LE(1, 4);  // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(pngData.length, 8);  // Size of image data
    entry.writeUInt32LE(dataOffset, 12);     // Offset to image data

    dirEntries.push(entry);
    imageDataBuffers.push(pngData);
    dataOffset += pngData.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageDataBuffers]);
}

const icoBuffer = createICO(pngBuffers);
fs.writeFileSync(path.join(__dirname, "assets", "icon.ico"), icoBuffer);
console.log("✅ icon.ico created from PNG files");
