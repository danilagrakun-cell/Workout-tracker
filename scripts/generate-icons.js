import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, bgColor, primaryColor, accentColor) {
  // Simple PNG creator using zlib deflated raw scanlines
  const bytesPerPixel = 4;
  const scanlineLength = 1 + width * bytesPerPixel;
  const rawData = Buffer.alloc(height * scanlineLength);

  const [bgR, bgG, bgB] = bgColor;
  const [prR, prG, prB] = primaryColor;
  const [acR, acG, acB] = accentColor;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * bytesPerPixel;

      // Draw background rounded box
      let r = bgR, g = bgG, b = bgB, a = 255;

      // Normalized coordinates -1 to 1
      const nx = (x / width) * 2 - 1;
      const ny = (y / height) * 2 - 1;

      // Dumbbell bar: ny between -0.12 and 0.12, nx between -0.5 and 0.5
      if (Math.abs(ny) <= 0.08 && Math.abs(nx) <= 0.6) {
        r = prR; g = prG; b = prB;
      }

      // Outer plates: nx between -0.6 and -0.45 or 0.45 and 0.6, ny between -0.4 and 0.4
      if ((Math.abs(nx + 0.45) <= 0.08 || Math.abs(nx - 0.45) <= 0.08) && Math.abs(ny) <= 0.42) {
        r = acR; g = acG; b = acB;
      }

      // Inner plates: nx between -0.3 and -0.2 or 0.2 and 0.3, ny between -0.3 and 0.3
      if ((Math.abs(nx + 0.28) <= 0.06 || Math.abs(nx - 0.28) <= 0.06) && Math.abs(ny) <= 0.32) {
        r = prR; g = prG; b = prB;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const makeChunk = (type, data) => {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    // CRC calculation
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc >>> 0, 8 + len);
    return buf;
  };

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation
function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

const iconsDir = path.resolve('public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const bg = [15, 23, 42]; // #0f172a
const primary = [56, 189, 248]; // #38bdf8
const accent = [37, 99, 235]; // #2563eb

const p192 = createPng(192, 192, bg, primary, accent);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), p192);

const p512 = createPng(512, 512, bg, primary, accent);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), p512);

fs.writeFileSync(path.resolve('public/apple-touch-icon.png'), p192);

console.log('Icons generated successfully!');
