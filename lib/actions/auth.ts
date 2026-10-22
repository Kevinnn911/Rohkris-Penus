// File: lib/actions/auth.ts

"use server";

import { redirect } from "next/navigation";

import { gagal, type ActionResult } from "@/lib/actions/helpers";
import {
  clearAdminGateCookie,
  hasAdminGateAccess,
  isGateKeyValid,
  setAdminGateCookie,
} from "@/lib/auth/gate";
import { DUMMY_HASH, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  destroySession,
  getClientIp,
  isLoginThrottled,
  recordLoginAttempt,
} from "@/lib/auth/session";
import { execute, nowDb, queryOne } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";
import { loginSchema } from "@/lib/validation/schemas";

/**
 * Login admin.
 *
 * Catatan keamanan (prompt §8.10):
 *  - Gerbang admin dilindungi kunci UUID rahasia (anti-tebak URL).
 *  - Pesan kegagalan sengaja TIDAK membedakan "email tidak terdaftar" dan
 *    "kata sandi salah", dan waktu respons disamakan memakai hash palsu,
 *    agar tidak membocorkan email mana yang punya akun.
 *  - Percobaan gagal dibatasi per email dan per IP (anti tebak kata sandi).
 *  - Akun nonaktif tidak bisa login; requireAdmin() tetap memeriksa ulang
 *    status aktif pada setiap permintaan.
 */
export async function masuk(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const secretKey = String(formData.get("secret_key") ?? "");
  const hasGate = (await hasAdminGateAccess()) || isGateKeyValid(secretKey);

  if (!hasGate) {
    return gagal("Akses panel admin tidak diizinkan.");
  }

  const hasil = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!hasil.success) {
    return gagal("Email atau kata sandi tidak valid.");
  }

  if (!isDatabaseConfigured()) {
    return gagal("Website belum terhubung ke database. Hubungi pengelola website.");
  }

  const email = hasil.data.email.trim().toLowerCase();
  const ip = await getClientIp();

  if (await isLoginThrottled(email, ip)) {
    return gagal("Terlalu banyak percobaan masuk. Tunggu 15 menit lalu coba lagi.");
  }

  const admin = await queryOne<{ id: string; password_hash: string; is_active: boolean }>(
    "SELECT id, password_hash, is_active FROM admin_users WHERE email = ?",
    [email],
  );

  // Selalu jalankan verifikasi (dengan hash palsu bila email tidak ada)
  // agar lama respons tidak membocorkan keberadaan akun.
  const cocok = await verifyPassword(hasil.data.password, admin?.password_hash ?? DUMMY_HASH);

  if (!admin || !cocok || !admin.is_active) {
    await recordLoginAttempt(email, ip, false);
    // Pesan umum — tidak menyebut apakah email terdaftar.
    return gagal("Email atau kata sandi salah.");
  }

  if (secretKey && isGateKeyValid(secretKey)) {
    await setAdminGateCookie(secretKey);
  }

  await recordLoginAttempt(email, ip, true);
  await execute("UPDATE admin_users SET last_login_at = ? WHERE id = ?", [nowDb(), admin.id]);
  await createSession(admin.id);

  redirect("/admin");
}

export async function keluar(): Promise<void> {
  await destroySession();
  await clearAdminGateCookie();
  redirect("/");
}
