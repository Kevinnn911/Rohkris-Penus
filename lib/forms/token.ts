/**
 * Token anti-spam formulir publik & token tautan ubah jawaban.
 *
 * Token formulir = HMAC atas "formId|version|issuedAt" yang disisipkan saat
 * halaman dirender. Kiriman ditolak bila token palsu, terlalu cepat (bot
 * mengisi dalam < 3 detik) atau kedaluwarsa (> 24 jam). Murni: rahasia & waktu
 * disuntikkan sehingga bisa diuji tanpa env.
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const FORM_TOKEN_MIN_AGE_MS = 3_000;
export const FORM_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function hmac(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

/** Kunci khusus formulir diturunkan dari rahasia aplikasi agar tidak dipakai ulang mentah-mentah. */
export function deriveFormSecret(appSecret: string): string {
  return hmac(appSecret, "rohkris:form-token:v1");
}

export function signFormToken(secret: string, formId: string, version: number, issuedAt: number): string {
  const payload = `${formId}.${version}.${issuedAt}`;
  return `${payload}.${hmac(secret, payload)}`;
}

export type FormTokenCheck =
  | { ok: true; version: number }
  | { ok: false; reason: "invalid" | "too_fast" | "expired" | "wrong_form" };

export function verifyFormToken(secret: string, token: string, formId: string, now: number): FormTokenCheck {
  const parts = token.split(".");
  if (parts.length !== 4) return { ok: false, reason: "invalid" };
  const [id, ver, at, sig] = parts as [string, string, string, string];
  const expected = hmac(secret, `${id}.${ver}.${at}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "invalid" };
  if (id !== formId) return { ok: false, reason: "wrong_form" };
  const issuedAt = Number(at);
  const version = Number(ver);
  if (!Number.isInteger(issuedAt) || !Number.isInteger(version)) return { ok: false, reason: "invalid" };
  const umur = now - issuedAt;
  if (umur < FORM_TOKEN_MIN_AGE_MS) return { ok: false, reason: "too_fast" };
  if (umur > FORM_TOKEN_MAX_AGE_MS) return { ok: false, reason: "expired" };
  return { ok: true, version };
}

/** Token tautan ubah jawaban: 32 byte acak (base64url). Yang disimpan hanya hash-nya. */
export function newEditToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashEditToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Bentuk token ubah yang sah (menolak input aneh sebelum menyentuh database). */
export const EDIT_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
