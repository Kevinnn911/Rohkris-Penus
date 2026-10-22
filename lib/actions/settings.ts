"use server";

import { z } from "zod";

import { requireAdminForAction, requireSuperAdmin } from "@/lib/auth/guard";
import {
  gagal,
  pesanErrorDatabase,
  revalidateKonten,
  sukses,
  type ActionResult,
} from "@/lib/actions/helpers";
import { hashPassword } from "@/lib/auth/password";
import { destroyAllSessionsFor } from "@/lib/auth/session";
import { execute, newId, transaction } from "@/lib/db";
import { siteSettingsSchema } from "@/lib/validation/schemas";

const KUNCI_PENGATURAN = [
  "site_tagline",
  "site_description",
  "contact_email",
  "contact_phone",
  "school_info",
  "instagram_url",
  "youtube_url",
  "tiktok_url",
  "whatsapp_url",
  "footer_note",
  "about_vision",
  "about_mission",
  "about_values",
  "about_body",
] as const;

export async function simpanPengaturan(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  const mentah = Object.fromEntries(
    KUNCI_PENGATURAN.map((kunci) => [kunci, String(formData.get(kunci) ?? "")]),
  );

  const hasil = siteSettingsSchema.safeParse(mentah);
  if (!hasil.success) {
    const { fieldErrors } = z.flattenError(hasil.error);
    return gagal("Periksa kembali isian yang ditandai.", fieldErrors as Record<string, string[]>);
  }

  try {
    await transaction(async (conn) => {
      for (const kunci of KUNCI_PENGATURAN) {
        await conn.execute(
          `INSERT INTO site_settings (id, \`key\`, value, updated_by) VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by)`,
          [newId(), kunci, hasil.data[kunci] ?? "", auth.context.admin.id],
        );
      }
    });
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }

  revalidateKonten("pengaturan");
  return sukses("Pengaturan situs berhasil disimpan.");
}

/** Menambah akun admin baru — hanya super admin. */
export async function tambahAdmin(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  // requireSuperAdmin() melakukan redirect bila bukan super admin.
  await requireSuperAdmin();

  const skema = z.object({
    email: z.email({ error: "Masukkan alamat email yang valid." }).max(254),
    display_name: z
      .string()
      .min(1, { error: "Nama tampilan wajib diisi." })
      .max(120, { error: "Nama tampilan maksimal 120 karakter." }),
    password: z
      .string()
      .min(10, { error: "Kata sandi awal minimal 10 karakter." })
      .max(200, { error: "Kata sandi terlalu panjang." }),
    role: z.enum(["super_admin", "admin", "editor"], { error: "Pilih peran yang valid." }),
  });

  const hasil = skema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    display_name: String(formData.get("display_name") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? "admin"),
  });

  if (!hasil.success) {
    const { fieldErrors } = z.flattenError(hasil.error);
    return gagal("Periksa kembali isian yang ditandai.", fieldErrors as Record<string, string[]>);
  }

  try {
    await execute(
      `INSERT INTO admin_users (id, email, password_hash, role, display_name, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        newId(),
        hasil.data.email,
        await hashPassword(hasil.data.password),
        hasil.data.role,
        hasil.data.display_name,
      ],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      return gagal("Email tersebut sudah terdaftar sebagai admin.", {
        email: ["Email sudah terdaftar."],
      });
    }
    return gagal(pesanErrorDatabase(error));
  }

  revalidateKonten("pengaturan");
  return sukses("Admin berhasil ditambahkan. Bagikan kata sandi awal secara langsung, bukan lewat grup.");
}

const PESAN_SUPER_TERAKHIR = "SUPER_ADMIN_TERAKHIR";

/**
 * Menjalankan perubahan pada admin sambil memastikan selalu tersisa minimal
 * satu super admin aktif (dulu ditegakkan trigger Postgres). Baris
 * super admin dikunci (FOR UPDATE) agar dua perubahan bersamaan tidak lolos.
 */
async function ubahAdminDenganPengaman(
  id: string,
  kolom: { is_active?: boolean; role?: "super_admin" | "admin" | "editor" },
): Promise<void> {
  await transaction(async (conn) => {
    const superAktif = await conn.query<{ id: string }>(
      "SELECT id FROM admin_users WHERE role = 'super_admin' AND is_active = 1 FOR UPDATE",
    );
    const daftarSuper = superAktif.map((row) => row.id);

    const kehilanganSuper =
      daftarSuper.includes(id) &&
      (kolom.is_active === false || (kolom.role !== undefined && kolom.role !== "super_admin"));

    if (kehilanganSuper && daftarSuper.length <= 1) {
      throw new Error(PESAN_SUPER_TERAKHIR);
    }

    const set: string[] = [];
    const nilai: unknown[] = [];
    if (kolom.is_active !== undefined) {
      set.push("is_active = ?");
      nilai.push(kolom.is_active ? 1 : 0);
    }
    if (kolom.role !== undefined) {
      set.push("role = ?");
      nilai.push(kolom.role);
    }
    await conn.execute(`UPDATE admin_users SET ${set.join(", ")} WHERE id = ?`, [...nilai, id]);
  });
}

/** Mengaktifkan/menonaktifkan admin — hanya super admin. */
export async function ubahStatusAdmin(id: string, aktif: boolean): Promise<ActionResult> {
  await requireSuperAdmin();

  try {
    await ubahAdminDenganPengaman(id, { is_active: aktif });
    // Admin yang dinonaktifkan langsung keluar dari semua perangkat.
    if (!aktif) await destroyAllSessionsFor(id);
  } catch (error) {
    if ((error as Error).message === PESAN_SUPER_TERAKHIR) {
      return gagal(
        "Tidak dapat menonaktifkan super admin terakhir. Tunjuk super admin lain terlebih dahulu.",
      );
    }
    return gagal(pesanErrorDatabase(error));
  }

  revalidateKonten("pengaturan");
  return sukses(aktif ? "Admin diaktifkan kembali." : "Akses admin dicabut.");
}

/** Mengubah peran admin — hanya super admin. */
export async function ubahPeranAdmin(
  id: string,
  role: "super_admin" | "admin" | "editor",
): Promise<ActionResult> {
  await requireSuperAdmin();

  if (!["super_admin", "admin", "editor"].includes(role)) {
    return gagal("Peran tidak valid.");
  }

  try {
    await ubahAdminDenganPengaman(id, { role });
  } catch (error) {
    if ((error as Error).message === PESAN_SUPER_TERAKHIR) {
      return gagal(
        "Tidak dapat menurunkan peran super admin terakhir. Tunjuk super admin lain terlebih dahulu.",
      );
    }
    return gagal(pesanErrorDatabase(error));
  }

  revalidateKonten("pengaturan");
  return sukses("Peran admin berhasil diperbarui.");
}
