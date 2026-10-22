// File: scripts/generate-favicons.mjs

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

async function makeIco(buffers, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // format: 1 = ICO
  header.writeUInt16LE(sizes.length, 4); // count

  let offset = 6 + sizes.length * 16;
  const entries = [];

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const buf = buffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 = 256)
    entry.writeUInt8(0, 2); // color palette count (0 = no palette)
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset to image data
    entries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...entries, ...buffers]);
}

async function main() {
  const projectRoot = process.cwd();
  const sourceLogo = path.join(projectRoot, "Logo.png");

  console.log("Membaca Logo.png dari:", sourceLogo);
  const metadata = await sharp(sourceLogo).metadata();
  console.log("Dimensi asli:", metadata.width, "x", metadata.height);

  // Pusat logo: centerX=627, centerY=600 dengan margin proporsional
  const cropSize = 1120;
  const left = Math.max(0, Math.min(metadata.width - cropSize, Math.round(627 - cropSize / 2)));
  const top = Math.max(0, Math.min(metadata.height - cropSize, Math.round(600 - cropSize / 2)));

  // Radius sudut melengkung proporsional (22% ala squircle modern app icon)
  const cornerRadius = Math.round(cropSize * 0.22);
  const roundedMask = Buffer.from(
    `<svg width="${cropSize}" height="${cropSize}">` +
      `<rect x="0" y="0" width="${cropSize}" height="${cropSize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#ffffff"/>` +
      `</svg>`,
  );

  // Pastikan alpha channel disertakan dan terapkan mask sudut melengkung (smooth rounded corners)
  const croppedBuffer = await sharp(sourceLogo)
    .extract({
      left,
      top,
      width: cropSize,
      height: cropSize,
    })
    .ensureAlpha()
    .toBuffer();

  const roundedBaseBuffer = await sharp(croppedBuffer)
    .composite([{ input: roundedMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const baseImage = sharp(roundedBaseBuffer);

  // Hasilkan buffer untuk ICO (16x16, 32x32, 48x48)
  const icoSizes = [16, 32, 48];
  const icoPngBuffers = await Promise.all(
    icoSizes.map((s) => baseImage.clone().resize(s, s).png().toBuffer())
  );
  const icoBuffer = await makeIco(icoPngBuffers, icoSizes);

  // Hasilkan buffer PNG ukuran spesifik
  const png32 = await baseImage.clone().resize(32, 32).png().toBuffer();
  const png180 = await baseImage.clone().resize(180, 180).png().toBuffer();
  const png192 = await baseImage.clone().resize(192, 192).png().toBuffer();
  const png512 = await baseImage.clone().resize(512, 512).png().toBuffer();

  // Daftar target file
  const outputs = [
    // Next.js App Router file-based metadata
    { file: path.join(projectRoot, "app", "favicon.ico"), data: icoBuffer },
    { file: path.join(projectRoot, "app", "icon.png"), data: png32 },
    { file: path.join(projectRoot, "app", "apple-icon.png"), data: png180 },

    // Static assets di folder public/
    { file: path.join(projectRoot, "public", "favicon.ico"), data: icoBuffer },
    { file: path.join(projectRoot, "public", "icon.png"), data: png32 },
    { file: path.join(projectRoot, "public", "apple-icon.png"), data: png180 },
    { file: path.join(projectRoot, "public", "icon-192.png"), data: png192 },
    { file: path.join(projectRoot, "public", "icon-512.png"), data: png512 },
    { file: path.join(projectRoot, "public", "Logo.png"), data: png512 },
  ];

  for (const { file, data } of outputs) {
    await fs.writeFile(file, data);
    console.log("Berhasil membuat:", path.relative(projectRoot, file), `(${data.length} bytes)`);
  }

  console.log("Semua aset favicon dan ikon aplikasi berhasil dibuat.");
}

main().catch((err) => {
  console.error("Gagal membuat favicon:", err);
  process.exit(1);
});
