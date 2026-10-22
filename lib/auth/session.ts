import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { cookies, headers } from "next/headers";

import { execute, nowDb, query, queryOne, toMysqlDatetime } from "@/lib/db";

/**
 * Sesi login admin berbasis cookie + tabel admin_sessions.
 *
 * - Cookie hanya berisi token acak 32 byte; database menyimpan hash
 *   SHA-256-nya. Isi database yang bocor tidak dapat dipakai sebagai sesi.
 * - Cookie: httpOnly (tak terbaca JavaScript), sameSite=lax (menahan CSRF
 *   lintas situs), secure di produksi (hanya lewat HTTPS).
 * - Sesi berlaku 7 hari dan bisa dicabut kapan saja dari database
 *   (logout, admin dinonaktifkan).
 */

export const SESSION_COOKIE = "rohkris_sesi";
const SESSION_DAYS = 7;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(adminId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const userAgent = ((await headers()).get("user-agent") ?? "").slice(0, 255);

  await execute(
    "INSERT INTO admin_sessions (token_hash, admin_id, expires_at, user_agent) VALUES (?, ?, ?, ?)",
    [hashToken(token), adminId, toMysqlDatetime(expires), userAgent || null],
  );

  // Bersihkan sesi kedaluwarsa sesekali agar tabel tidak membengkak.
  await execute("DELETE FROM admin_sessions WHERE expires_at < ?", [nowDb()]);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

/** ID admin pemilik sesi yang masih berlaku, atau null. */
export async function getSessionAdminId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 128) return null;

  const row = await queryOne<{ admin_id: string }>(
    "SELECT admin_id FROM admin_sessions WHERE token_hash = ? AND expires_at > ?",
    [hashToken(token), nowDb()],
  );
  return row?.admin_id ?? null;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await execute("DELETE FROM admin_sessions WHERE token_hash = ?", [hashToken(token)]);
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Mencabut semua sesi milik seorang admin (mis. saat dinonaktifkan). */
export async function destroyAllSessionsFor(adminId: string): Promise<void> {
  await execute("DELETE FROM admin_sessions WHERE admin_id = ?", [adminId]);
}

// ---------------------------------------------------------------------
// Pembatas percobaan login
// ---------------------------------------------------------------------

const WINDOW_MINUTES = 15;
const MAX_FAILS_PER_EMAIL = 5;
const MAX_FAILS_PER_IP = 20;

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || h.get("x-real-ip") || "unknown").slice(0, 64);
}

/** True bila email/IP ini sudah terlalu sering gagal dalam 15 menit terakhir. */
export async function isLoginThrottled(email: string, ip: string): Promise<boolean> {
  const since = toMysqlDatetime(new Date(Date.now() - WINDOW_MINUTES * 60 * 1000));
  const [byEmail, byIp] = await Promise.all([
    query<{ n: number }>(
      "SELECT COUNT(*) AS n FROM login_attempts WHERE email = ? AND success = 0 AND created_at > ?",
      [email, since],
    ),
    query<{ n: number }>(
      "SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND success = 0 AND created_at > ?",
      [ip, since],
    ),
  ]);
  return Number(byEmail[0]?.n ?? 0) >= MAX_FAILS_PER_EMAIL || Number(byIp[0]?.n ?? 0) >= MAX_FAILS_PER_IP;
}

export async function recordLoginAttempt(email: string, ip: string, success: boolean): Promise<void> {
  await execute("INSERT INTO login_attempts (email, ip, success) VALUES (?, ?, ?)", [email, ip, success ? 1 : 0]);
  // Simpan riwayat 30 hari saja.
  await execute("DELETE FROM login_attempts WHERE created_at < ?", [
    toMysqlDatetime(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
  ]);
}
