// File: scripts/pack-standalone.mjs

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const projectRoot = process.cwd();
const tempDir = path.join(projectRoot, "temp_next");
const zipOutput = path.join(projectRoot, "rohkris-next.zip");
const remoteRoot = "/home/pvote/rohkris";

console.log("Menyiapkan pengemasan build standalone siap-pakai untuk Linux cPanel...");

if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
if (fs.existsSync(zipOutput)) {
  fs.rmSync(zipOutput, { force: true });
}

fs.mkdirSync(tempDir, { recursive: true });

// 1. Salin seluruh isi .next dan public ke folder sementara
console.log("1. Menyalin .next dan public...");
fs.cpSync(path.join(projectRoot, ".next"), path.join(tempDir, ".next"), {
  recursive: true,
  dereference: true,
  filter: (src) => !src.includes(`${path.sep}cache`) && !src.includes(`${path.sep}dev`),
});

fs.cpSync(path.join(projectRoot, "public"), path.join(tempDir, "public"), {
  recursive: true,
  dereference: true,
});

// 2. Lengkapi isi direktori standalone: .next/static, public, dan .next/server
console.log("2. Melengkapi struktur folder standalone...");
const standaloneDir = path.join(tempDir, ".next", "standalone");
const standaloneNext = path.join(standaloneDir, ".next");
const standalonePublic = path.join(standaloneDir, "public");

fs.mkdirSync(standaloneNext, { recursive: true });
fs.mkdirSync(standalonePublic, { recursive: true });

// Salin static dan public
fs.cpSync(path.join(projectRoot, ".next", "static"), path.join(standaloneNext, "static"), {
  recursive: true,
  dereference: true,
});
fs.cpSync(path.join(projectRoot, "public"), standalonePublic, {
  recursive: true,
  dereference: true,
});

// Salin server lengkap dari .next/server ke standalone/.next/server
console.log("3. Memastikan seluruh route module dan chunk server lengkap...");
fs.cpSync(path.join(projectRoot, ".next", "server"), path.join(standaloneNext, "server"), {
  recursive: true,
  dereference: true,
});

// 3. Masukkan modul mysql2 riil (bukan symlink) ke seluruh target node_modules
console.log("4. Menyematkan dependensi mysql2 riil tanpa symlink...");
const realMysqlDir = path.join(projectRoot, "node_modules", "mysql2");
const targetNodeModules = [
  path.join(tempDir, ".next", "node_modules", "mysql2-3d80281e5ed34ca6"),
  path.join(standaloneDir, "node_modules", "mysql2-3d80281e5ed34ca6"),
  path.join(standaloneDir, "node_modules", "mysql2"),
  path.join(standaloneNext, "node_modules", "mysql2-3d80281e5ed34ca6"),
  path.join(standaloneNext, "node_modules", "mysql2"),
];

for (const target of targetNodeModules) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(realMysqlDir, target, { recursive: true, dereference: true });
}

// 4. Normalisasi path Windows (C:\Best Project\Rohkris) menjadi path Linux cPanel (/home/pvote/rohkris)
console.log("5. Menyesuaikan path absolut Windows ke Linux cPanel...");
const filesToNormalize = [
  path.join(standaloneDir, "server.js"),
  path.join(tempDir, ".next", "required-server-files.json"),
  path.join(tempDir, ".next", "required-server-files.js"),
  path.join(standaloneNext, "required-server-files.json"),
  path.join(standaloneNext, "required-server-files.js"),
];

const winPathEscaped = "C:\\\\Best Project\\\\Rohkris";
const winPathSlash = "C:/Best Project/Rohkris";
const winPathBackslash = "C:\\Best Project\\Rohkris";

for (const filePath of filesToNormalize) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8");
    content = content.replaceAll(winPathEscaped, remoteRoot);
    content = content.replaceAll(winPathSlash, remoteRoot);
    content = content.replaceAll(winPathBackslash, remoteRoot);

    // Pada required-server-files.json, ubah juga tanda backslash path menjadi forward slash
    if (filePath.endsWith(".json")) {
      content = content.replace(/"files":\s*\[([\s\S]*?)\]/, (_match, inner) => {
        const normalized = inner.replaceAll("\\\\", "/").replaceAll("\\", "/");
        return `"files":[${normalized}]`;
      });
    }

    fs.writeFileSync(filePath, content, "utf8");
    console.log(`  - Ternormalisasi: ${path.relative(tempDir, filePath)}`);
  }
}

// 5. Buat tmp/restart.txt untuk trigger reload LiteSpeed Passenger cPanel
fs.mkdirSync(path.join(tempDir, "tmp"), { recursive: true });
fs.writeFileSync(path.join(tempDir, "tmp", "restart.txt"), `${Date.now()}\n`, "utf8");

// 6. Kompresi ke rohkris-next.zip menggunakan tar.exe bawaan Windows (cepat & aman spasi)
console.log("6. Mengompresi arsip rohkris-next.zip...");
execSync(`tar.exe -a -c -f "${zipOutput}" -C "${tempDir}" .next public tmp`, { stdio: "inherit" });

fs.rmSync(tempDir, { recursive: true, force: true });

const stat = fs.statSync(zipOutput);
console.log(`Selesai! Berkas ${path.basename(zipOutput)} berhasil dibuat (${(stat.size / (1024 * 1024)).toFixed(2)} MB).`);

