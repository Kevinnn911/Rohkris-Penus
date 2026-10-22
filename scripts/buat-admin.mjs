#!/usr/bin/env node
/**
 * Membuat (atau mengatur ulang kata sandi) akun admin langsung di database.
 *
 * Dipakai untuk admin PERTAMA, atau bila semua super admin lupa kata sandi.
 * Admin berikutnya cukup ditambahkan dari panel → Kelola Admin.
 *
 * Pemakaian (dari folder aplikasi, env database harus sudah terisi):
 *   npm run admin:buat
 * Skrip akan menanyakan email, nama, dan kata sandi (kata sandi tidak
 * ditampilkan di layar). Kata sandi TIDAK pernah diterima lewat argumen
 * agar tidak tersimpan di riwayat terminal.
 *
 * Format hash harus sama dengan lib/auth/password.ts.
 */

import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { stdin, stdout } from "node:process";

import mysql from "mysql2/promise";

// --- Muat .env.local / .env (tanpa dependensi tambahan) ------------------
for (const berkas of [".env.local", ".env"]) {
  if (!existsSync(berkas)) continue;
  for (const baris of readFileSync(berkas, "utf8").split(/\r?\n/)) {
    const cocok = baris.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!cocok || process.env[cocok[1]] !== undefined) continue;
    process.env[cocok[1]] = cocok[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

function konfigurasiDatabase() {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
    };
  }
  const { DATABASE_HOST, DATABASE_USER, DATABASE_NAME } = process.env;
  if (!DATABASE_HOST || !DATABASE_USER || !DATABASE_NAME) {
    console.error(
      "✗ Konfigurasi database belum lengkap. Isi DATABASE_HOST, DATABASE_USER, " +
        "DATABASE_PASSWORD, DATABASE_NAME di .env.local terlebih dahulu.",
    );
    process.exit(1);
  }
  return {
    host: DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 3306),
    user: DATABASE_USER,
    password: process.env.DATABASE_PASSWORD ?? "",
    database: DATABASE_NAME,
  };
}

function hashPassword(password) {
  const N = 16384;
  const r = 8;
  const p = 1;
  const salt = randomBytes(16);
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(`scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${key.toString("base64")}`);
    });
  });
}

// --- Pembaca input: terminal (TTY) maupun lewat pipe ----------------------
const antrean = [];
let sisa = "";
let penunggu = null;
let selesai = false;

function salurkan(chunk) {
  sisa += chunk;
  const baris = sisa.split(/\r?\n/);
  sisa = baris.pop() ?? "";
  antrean.push(...baris);
  if (penunggu && antrean.length) {
    const resolve = penunggu;
    penunggu = null;
    resolve(antrean.shift());
  }
}

stdin.setEncoding("utf8");
if (!stdin.isTTY) {
  stdin.on("data", salurkan);
  stdin.on("end", () => {
    selesai = true;
    if (sisa) antrean.push(sisa);
    if (penunggu) penunggu(antrean.shift() ?? "");
  });
}

function bacaBarisPipe() {
  if (antrean.length) return Promise.resolve(antrean.shift());
  if (selesai) return Promise.resolve("");
  return new Promise((resolve) => (penunggu = resolve));
}

/** Membaca satu baris; `rahasia` = ketikan tidak ditampilkan di layar. */
function tanya(pertanyaan, rahasia = false) {
  stdout.write(pertanyaan);

  if (!stdin.isTTY) {
    return bacaBarisPipe().then((jawaban) => {
      stdout.write("\n");
      return jawaban;
    });
  }

  return new Promise((resolve) => {
    const masukan = [];
    stdin.setRawMode(true);
    stdin.resume();
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          stdin.off("data", onData);
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write("\n");
          resolve(masukan.join(""));
          return;
        }
        if (ch === "\u0003") process.exit(130); // Ctrl+C
        if (ch === "\u007f" || ch === "\b") {
          if (masukan.length && !rahasia) stdout.write("\b \b");
          masukan.pop();
        } else {
          masukan.push(ch);
          if (!rahasia) stdout.write(ch);
        }
      }
    };
    stdin.on("data", onData);
  });
}

// --- Alur utama -------------------------------------------------------------
console.log("\n=== Buat / atur ulang akun admin Rohkris ===\n");

const email = (await tanya("Email admin        : ")).trim().toLowerCase();
const nama = (await tanya("Nama tampilan      : ")).trim();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("✗ Email tidak valid.");
  process.exit(1);
}
if (nama.length < 1 || nama.length > 120) {
  console.error("✗ Nama tampilan wajib diisi (maksimal 120 karakter).");
  process.exit(1);
}

const sandi = await tanya("Kata sandi (min 10): ", true);
const ulang = await tanya("Ulangi kata sandi  : ", true);
if (sandi.length < 10) {
  console.error("✗ Kata sandi minimal 10 karakter.");
  process.exit(1);
}
if (sandi !== ulang) {
  console.error("✗ Kata sandi tidak sama.");
  process.exit(1);
}

const koneksi = await mysql.createConnection({
  ...konfigurasiDatabase(),
  charset: "utf8mb4",
  timezone: "+00:00",
});
try {
  // Simpan waktu dalam UTC, sama seperti aplikasi (lib/db/index.ts).
  await koneksi.query("SET time_zone = '+00:00'");
  const hash = await hashPassword(sandi);
  const [ada] = await koneksi.query("SELECT id FROM admin_users WHERE email = ?", [email]);

  if (ada.length > 0) {
    await koneksi.query(
      "UPDATE admin_users SET password_hash = ?, display_name = ?, role = 'super_admin', is_active = 1 WHERE email = ?",
      [hash, nama, email],
    );
    // Keluarkan semua sesi lama akun ini.
    await koneksi.query("DELETE FROM admin_sessions WHERE admin_id = ?", [ada[0].id]);
    console.log(`\n✓ Akun ${email} diperbarui: kata sandi baru, peran super admin, status aktif.`);
  } else {
    await koneksi.query(
      "INSERT INTO admin_users (id, email, password_hash, role, display_name, is_active) VALUES (?, ?, ?, 'super_admin', ?, 1)",
      [randomUUID(), email, hash, nama],
    );
    console.log(`\n✓ Super admin ${email} berhasil dibuat.`);
  }
  console.log("  Masuk melalui /admin/login.\n");
} catch (error) {
  console.error("✗ Gagal menyimpan ke database:", error.message);
  process.exitCode = 1;
} finally {
  await koneksi.end();
}
