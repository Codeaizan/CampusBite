// Script to generate placeholder PWA icons
// Run with: node scripts/generate-icons.mjs

import { writeFileSync, mkdirSync } from 'fs';

function createPNG(size) {
  // Minimal valid PNG with orange (#FF8C00) fill
  // PNG header + IHDR + IDAT + IEND

  const width = size;
  const height = size;

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);   // width
  ihdrData.writeUInt32BE(height, 4);  // height
  ihdrData.writeUInt8(8, 8);          // bit depth
  ihdrData.writeUInt8(2, 9);          // color type (RGB)
  ihdrData.writeUInt8(0, 10);         // compression
  ihdrData.writeUInt8(0, 11);         // filter
  ihdrData.writeUInt8(0, 12);         // interlace

  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT: raw pixel data (no compression, stored blocks)
  // Each row: filter byte (0) + RGB pixels
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const offset = y * rowSize;
    rawData[offset] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 3;
      rawData[px] = 0xFF;     // R
      rawData[px + 1] = 0x8C; // G
      rawData[px + 2] = 0x00; // B
    }
  }

  // Compress with deflate (store method - no compression for simplicity)
  const deflated = deflateStore(rawData);
  const idat = createChunk('IDAT', deflated);

  // IEND
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcInput);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function deflateStore(data) {
  // zlib header (CMF=0x78, FLG=0x01 → no compression, check bits ok)
  const header = Buffer.from([0x78, 0x01]);

  // Split into 65535-byte blocks (max store block size)
  const maxBlock = 65535;
  const blocks = [];
  let offset = 0;

  while (offset < data.length) {
    const remaining = data.length - offset;
    const blockLen = Math.min(remaining, maxBlock);
    const isLast = (offset + blockLen >= data.length);

    const blockHeader = Buffer.alloc(5);
    blockHeader.writeUInt8(isLast ? 1 : 0, 0);
    blockHeader.writeUInt16LE(blockLen, 1);
    blockHeader.writeUInt16LE(blockLen ^ 0xFFFF, 3);

    blocks.push(blockHeader);
    blocks.push(data.subarray(offset, offset + blockLen));
    offset += blockLen;
  }

  // Adler32 checksum
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE(((b << 16) | a) >>> 0, 0);

  return Buffer.concat([header, ...blocks, adler]);
}

// Generate icons
mkdirSync('public/icons', { recursive: true });

const png192 = createPNG(192);
writeFileSync('public/icons/icon-192.png', png192);
console.log(`Created icon-192.png (${png192.length} bytes)`);

const png512 = createPNG(512);
writeFileSync('public/icons/icon-512.png', png512);
console.log(`Created icon-512.png (${png512.length} bytes)`);
