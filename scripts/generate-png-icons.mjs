import fs from 'node:fs';
import zlib from 'node:zlib';

// Minimal pure-Node PNG encoder
function createPng(width, height, drawFn) {
  const bytesPerPixel = 4;
  const rawData = Buffer.alloc(height * (1 + width * bytesPerPixel));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * bytesPerPixel);
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression: Deflate
  ihdrData[11] = 0; // Filter: Adaptive
  ihdrData[12] = 0; // Interlace: None

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', deflated);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Drawing function for Palmos Icon: Obsidian background with Verdigris & Magenta emblem
function drawPalmosIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxRadius = w / 2;

  // Background base (#0E1015)
  let r = 14;
  let g = 16;
  let b = 21;
  let a = 255;

  // Corner rounding for standard (non-maskable) icon
  if (!isMaskable) {
    const cornerRadius = w * 0.22;
    const qx = Math.max(0, Math.abs(x - cx) - (cx - cornerRadius));
    const qy = Math.max(0, Math.abs(y - cy) - (cy - cornerRadius));
    if (Math.sqrt(qx * qx + qy * qy) > cornerRadius) {
      return [0, 0, 0, 0]; // Transparent outside rounded squircle
    }
  }

  // Outer radial ring / energy halo
  const ringDist = Math.abs(dist - w * 0.35);
  if (ringDist < w * 0.015) {
    // Verdigris ring (#20B2AA)
    r = 32; g = 178; b = 170;
  }

  // Central symbol: Stylized Prompt P / Chevron motif
  const nx = (x - cx) / (w * 0.4);
  const ny = (y - cy) / (h * 0.4);

  // Chevron shape: x in [-0.4, 0.4], y in [-0.4, 0.4]
  // Vertical stem of P
  if (nx >= -0.4 && nx <= -0.15 && ny >= -0.45 && ny <= 0.45) {
    r = 32; g = 178; b = 170; // #20B2AA
  }
  // Top loop of P / chevron upper arc
  if (nx >= -0.15 && nx <= 0.35 && ny >= -0.45 && ny <= 0.05) {
    const loopDx = nx - 0.05;
    const loopDy = ny - (-0.2);
    const loopDist = Math.sqrt(loopDx * loopDx + loopDy * loopDy);
    if (loopDist <= 0.3 && (loopDist >= 0.1 || ny <= -0.35 || ny >= -0.05)) {
      // Magenta highlight gradient (#E0218A)
      r = 224; g = 33; b = 138;
    }
  }

  // Prompt cursor underscore (_)
  if (nx >= 0.05 && nx <= 0.45 && ny >= 0.3 && ny <= 0.42) {
    r = 245; g = 255; b = 250; // #F5FFFA
  }

  return [r, g, b, a];
}

// Generate PNGs
const sizes = [
  { file: 'public/pwa-192x192.png', size: 192, maskable: false },
  { file: 'public/pwa-512x512.png', size: 512, maskable: false },
  { file: 'public/pwa-maskable-512x512.png', size: 512, maskable: true },
  { file: 'public/apple-touch-icon.png', size: 180, maskable: false },
];

for (const { file, size, maskable } of sizes) {
  const buf = createPng(size, size, (x, y, w, h) => drawPalmosIcon(x, y, w, h, maskable));
  fs.writeFileSync(file, buf);
  console.log(`Generated ${file} (${size}x${size})`);
}
