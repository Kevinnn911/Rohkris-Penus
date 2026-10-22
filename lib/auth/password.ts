import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

/**
 * Hash kata sandi dengan scrypt (bawaan Node.js — tanpa dependensi native,
 * aman untuk hosting cPanel).
 *
 * Format tersimpan: "scrypt$N$r$p$saltBase64$hashBase64".
 * Parameter disimpan bersama hash agar bisa dinaikkan kelak tanpa
 * mematahkan hash lama.
 */

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const MAX_MEM = 64 * 1024 * 1024;

function scrypt(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, { N: n, r, p, maxmem: MAX_MEM }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, N, R, P);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, nRaw, rRaw, pRaw, saltRaw = "", hashRaw = ""] = parts;
  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (![n, r, p].every((value) => Number.isInteger(value) && value > 0)) return false;

  const expected = Buffer.from(hashRaw, "base64");
  const actual = await scrypt(password, Buffer.from(saltRaw, "base64"), n, r, p);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/**
 * Hash palsu untuk menyamakan waktu respons saat email tidak terdaftar,
 * sehingga penyerang tidak bisa menebak email mana yang memiliki akun.
 */
export const DUMMY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";
