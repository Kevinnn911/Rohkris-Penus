// File: lib/auth/guard.ts

import { notFound, redirect } from "next/navigation";

import { hasAdminGateAccess } from "@/lib/auth/gate";
import { getSessionAdminId } from "@/lib/auth/session";
import { queryOne } from "@/lib/db";
import type { AdminRole, AdminUser } from "@/lib/db/types";
import { isDatabaseConfigured } from "@/lib/env";


/**
 * SATU-SATUNYA tempat keputusan otorisasi admin diambil.
 *
 * Aturan yang ditegakkan di sini (PRD §11, prompt §8):
 *  - Sesi diverifikasi di SERVER terhadap tabel admin_sessions — isi cookie
 *    hanyalah token acak; tanpa baris sesi yang berlaku, tidak ada akses.
 *  - Admin pemilik sesi harus berstatus AKTIF di admin_users. Admin yang
 *    dinonaktifkan langsung kehilangan hak pada request berikutnya.
 *  - Setiap Server Action memanggil ulang fungsi ini — tidak menumpang pada
 *    proteksi layout.
 *  - Bila belum login dan tidak memiliki izin gerbang (UUID rahasia), akses
 *    ke rute admin langsung dialihkan ke beranda (/) tanpa mengungkap
 *    keberadaan panel login.
 *
 * Catatan: MySQL tidak memiliki Row Level Security, jadi seluruh query
 * admin WAJIB didahului pemeriksaan ini, dan query publik WAJIB menyaring
 * status 'published' (lihat lib/data/public.ts).
 */

export interface AdminContext {
  email: string;
  admin: AdminUser;
}

/** Hasil pemeriksaan tanpa redirect — untuk pemanggil yang ingin menangani sendiri. */
export async function getAdminContext(): Promise<AdminContext | null> {
  // Tanpa konfigurasi database tidak ada sesi yang bisa diverifikasi.
  // Kembalikan null agar halaman menampilkan panduan setup, bukan error 500.
  if (!isDatabaseConfigured()) return null;

  try {
    const adminId = await getSessionAdminId();
    if (!adminId) return null;

    const admin = await queryOne<AdminUser>(
      `SELECT id, email, role, display_name, is_active, last_login_at, created_at, updated_at
         FROM admin_users WHERE id = ? AND is_active = 1`,
      [adminId],
    );
    if (!admin) return null;

    return { email: admin.email, admin };
  } catch (error) {
    console.error("Gagal memverifikasi sesi admin:", (error as Error).message);
    return null;
  }
}

/**
 * Wajib admin aktif. Bila belum masuk dan tidak memiliki izin gerbang,
 * sistem mengalihkan ke beranda (/) agar rute admin tetap rahasia.
 * Bila memiliki izin gerbang, pengguna dialihkan ke halaman login.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const context = await getAdminContext();
  if (!context) {
    const hasGate = await hasAdminGateAccess();
    if (!hasGate) {
      notFound();
    }
    redirect("/admin/login?error=unauthorized");

  }
  return context;
}

/** Wajib super admin — untuk pengelolaan daftar admin dan role. */
export async function requireSuperAdmin(): Promise<AdminContext> {
  const context = await requireAdmin();
  if (context.admin.role !== "super_admin") {
    redirect("/admin?error=forbidden");
  }
  return context;
}

/** Benar bila role termasuk yang diizinkan. Untuk cek halus di dalam aksi. */
export function hasRole(context: AdminContext, ...roles: AdminRole[]): boolean {
  return roles.includes(context.admin.role);
}

/**
 * Varian untuk Server Action: mengembalikan error terstruktur, bukan redirect,
 * supaya form dapat menampilkan pesan yang ramah.
 */
export async function requireAdminForAction(): Promise<
  { ok: true; context: AdminContext } | { ok: false; message: string }
> {
  const context = await getAdminContext();
  if (!context) {
    return {
      ok: false,
      message:
        "Sesi Anda sudah berakhir atau akun Anda tidak lagi aktif. Silakan masuk kembali.",
    };
  }
  return { ok: true, context };
}
