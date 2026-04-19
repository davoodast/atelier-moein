/**
 * generate-icons.js
 * Creates PWA icons and favicon using pure Node.js (no external dependencies).
 * Run with: node scripts/generate-icons.js
 */
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 ──────────────────────────────────────────────────────────────────
function makeCRCTable() {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
}
const CRC_TABLE = makeCRCTable();
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xFF];
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG builder ────────────────────────────────────────────────────────────
function pngChunk(type, data) {
  const len  = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const tb   = Buffer.from(type, 'ascii');
  const crcV = Buffer.alloc(4); crcV.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([len, tb, data, crcV]);
}

function createPNG(width, height, r, g, b) {
  // Build raw RGBA scanlines (filter byte 0 = None per row)
  const raw = Buffer.alloc((1 + width * 4) * height);
  for (let y = 0; y < height; y++) {
    const base = y * (1 + width * 4);
    raw[base] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const i = base + 1 + x * 4;
      raw[i] = r; raw[i+1] = g; raw[i+2] = b; raw[i+3] = 255;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width,  0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── ICO builder (wraps PNG) ────────────────────────────────────────────────
function createICO(size, r, g, b) {
  const png = createPNG(size, size, r, g, b);
  const iconDir  = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0); // reserved
  iconDir.writeUInt16LE(1, 2); // type: ICO
  iconDir.writeUInt16LE(1, 4); // image count
  const dirEntry = Buffer.alloc(16);
  dirEntry[0] = size >= 256 ? 0 : size; // width  (0 = 256)
  dirEntry[1] = size >= 256 ? 0 : size; // height (0 = 256)
  dirEntry[2] = 0;                       // color count
  dirEntry[3] = 0;                       // reserved
  dirEntry.writeUInt16LE(1,  4);         // planes
  dirEntry.writeUInt16LE(32, 6);         // bit count
  dirEntry.writeUInt32LE(png.length, 8); // bytes in image
  dirEntry.writeUInt32LE(22, 12);        // offset (6 + 16)
  return Buffer.concat([iconDir, dirEntry, png]);
}

// ── Main ───────────────────────────────────────────────────────────────────
const ROOT      = path.join(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'public', 'icons');
fs.mkdirSync(ICONS_DIR, { recursive: true });

// Purple brand color: #7c3aed → RGB(124, 58, 237)
const R = 124, G = 58, B = 237;

const files = [
  { file: path.join(ICONS_DIR, 'icon-192x192.png'), data: createPNG(192, 192, R, G, B) },
  { file: path.join(ICONS_DIR, 'icon-512x512.png'), data: createPNG(512, 512, R, G, B) },
  { file: path.join(ICONS_DIR, 'icon-180x180.png'), data: createPNG(180, 180, R, G, B) }, // Apple touch
  { file: path.join(ROOT, 'public', 'favicon.ico'), data: createICO(32, R, G, B) },
];

for (const { file, data } of files) {
  fs.writeFileSync(file, data);
  console.log(`  ✓ ${path.relative(ROOT, file)}  (${data.length} bytes)`);
}
console.log('\nIcons generated successfully!');
