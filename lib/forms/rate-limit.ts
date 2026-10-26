import "server-only";

import { headers } from "next/headers";

import { execute, query, toMysqlDatetime } from "@/lib/db";

/**
 * Pembatas laju formulir publik (tanpa login).
 *
 * Batasnya sengaja longgar: satu sekolah sering berbagi satu IP publik (NAT),
 * jadi puluhan siswa sah bisa mengirim dari IP yang sama. Pertahanan utama
 * terhadap bot adalah honeypot + token waktu render (lib/forms/token.ts).
 */

export type RateKind = "submit" | "edit" | "email";

const BATAS: Record<RateKind, { windowMs: number; perIp: number }> = {
  submit: { windowMs: 10 * 60 * 1000, perIp: 30 },
  edit: { windowMs: 10 * 60 * 1000, perIp: 30 },
  email: { windowMs: 24 * 60 * 60 * 1000, perIp: 200 },
};

/** Maks email konfirmasi ke satu alamat per 24 jam (mencegah formulir dipakai untuk spam). */
export const EMAIL_PER_ADDRESS_PER_DAY = 3;

/**
 * IP klien untuk pembatas laju. Memakai entri PALING KANAN x-forwarded-for
 * (yang ditambahkan proxy hosting), bukan entri pertama yang bisa diisi
 * sembarang oleh klien.
 */
export async function getFormClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  const ip = forwarded?.[forwarded.length - 1] || h.get("x-real-ip")?.trim() || "unknown";
  return ip.slice(0, 64);
}

export async function getUserAgent(): Promise<string | null> {
  const ua = (await headers()).get("user-agent");
  return ua ? ua.slice(0, 255) : null;
}

export async function isRateLimited(formId: string, kind: RateKind, ip: string): Promise<boolean> {
  const { windowMs, perIp } = BATAS[kind];
  const since = toMysqlDatetime(new Date(Date.now() - windowMs));
  const rows = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM form_rate_events WHERE form_id = ? AND kind = ? AND ip = ? AND created_at > ?",
    [formId, kind, ip, since],
  );
  return Number(rows[0]?.n ?? 0) >= perIp;
}

export async function countEmailsTo(emailNorm: string): Promise<number> {
  const since = toMysqlDatetime(new Date(Date.now() - BATAS.email.windowMs));
  const rows = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM form_rate_events WHERE kind = 'email' AND email_norm = ? AND created_at > ?",
    [emailNorm, since],
  );
  return Number(rows[0]?.n ?? 0);
}

export async function recordRateEvent(
  formId: string,
  kind: RateKind,
  ip: string,
  emailNorm: string | null = null,
): Promise<void> {
  await execute("INSERT INTO form_rate_events (form_id, kind, ip, email_norm) VALUES (?, ?, ?, ?)", [
    formId,
    kind,
    ip,
    emailNorm,
  ]);
  // Pangkas oportunistik (~1 dari 20 panggilan): riwayat > 2 hari tidak dipakai lagi.
  if (Math.random() < 0.05) {
    await execute("DELETE FROM form_rate_events WHERE created_at < ?", [
      toMysqlDatetime(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
    ]);
  }
}
