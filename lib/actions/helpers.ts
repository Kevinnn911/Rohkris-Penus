import "server-only";

import { revalidatePath } from "next/cache";

import type { AdminContext } from "@/lib/auth/guard";

/** Bentuk hasil seragam untuk seluruh Server Action. */
export type ActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export function gagal(message: string, fieldErrors?: Record<string, string[]>): ActionResult {
  return { ok: false, message, fieldErrors };
}

export function sukses(message: string, id?: string): ActionResult {
  return { ok: true, message, id };
}

/**
 * Menyegarkan cache halaman publik setelah perubahan konten.
 * Dipanggil setiap kali admin membuat/mengubah/menghapus agar website publik
 * menampilkan data terbaru tanpa deploy ulang (PRD §14.8).
 */
export function revalidateKonten(jenis: "event" | "berita" | "galeri" | "pengumuman" | "pengaturan") {
  revalidatePath("/", "page");
  revalidatePath("/sitemap.xml");

  switch (jenis) {
    case "event":
      revalidatePath("/kegiatan");
      revalidatePath("/kegiatan/[slug]", "page");
      revalidatePath("/jadwal");
      break;
    case "berita":
      revalidatePath("/berita");
      revalidatePath("/berita/[slug]", "page");
      break;
    case "galeri":
      revalidatePath("/dokumentasi");
      revalidatePath("/kegiatan/[slug]", "page");
      break;
    case "pengumuman":
      break;
    case "pengaturan":
      revalidatePath("/tentang");
      revalidatePath("/kontak");
      revalidatePath("/privasi");
      break;
  }

  revalidatePath("/admin", "layout");
}

/**
 * Menerjemahkan error MySQL menjadi pesan Bahasa Indonesia yang bisa dipahami.
 * Detail teknis hanya dicatat di log server, tidak pernah ditampilkan.
 */
export function pesanErrorDatabase(error: unknown): string {
  const e = (error ?? {}) as { code?: string; errno?: number; message?: string };
  console.error("Error database:", e.code ?? "", e.message ?? "");
  switch (e.code) {
    case "ER_DUP_ENTRY":
      return "Slug sudah dipakai konten lain. Gunakan slug yang berbeda.";
    case "ER_NO_REFERENCED_ROW_2":
    case "ER_NO_REFERENCED_ROW":
      return "Data terkait tidak ditemukan. Periksa kembali pilihan kegiatan.";
    case "ER_CHECK_CONSTRAINT_VIOLATED":
      return "Data tidak memenuhi aturan validasi database. Periksa kembali isian Anda.";
    case "ER_DATA_TOO_LONG":
      return "Ada isian yang terlalu panjang. Persingkat lalu coba lagi.";
    case "ER_TABLEACCESS_DENIED_ERROR":
    case "ER_DBACCESS_DENIED_ERROR":
      return "Akun database tidak memiliki izin untuk tindakan ini.";
    case "ECONNREFUSED":
    case "PROTOCOL_CONNECTION_LOST":
    case "ER_ACCESS_DENIED_ERROR":
      return "Database tidak dapat dihubungi. Coba lagi beberapa saat lagi.";
    default:
      return "Perubahan gagal disimpan. Silakan coba lagi.";
  }
}

/** Metadata penulis untuk jejak perubahan. */
export function jejakPerubahan(context: AdminContext, baru: boolean) {
  return baru
    ? { created_by: context.admin.id, updated_by: context.admin.id }
    : { updated_by: context.admin.id };
}
