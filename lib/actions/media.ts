"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import { requireAdminForAction } from "@/lib/auth/guard";
import {
  gagal,
  pesanErrorDatabase,
  revalidateKonten,
  sukses,
  type ActionResult,
} from "@/lib/actions/helpers";
import { fromDatetimeLocalValue } from "@/lib/format/date";
import { hapusBerkasJikaTakTerpakai } from "@/lib/uploads";
import { buildInsert, buildUpdate, execute, newId, queryOne } from "@/lib/db";
import { getUploadDir } from "@/lib/env";
import {
  detectImageType,
  mediaFormSchema,
  safeFileName,
  validateUploadFile,
} from "@/lib/validation/schemas";

function ambilData(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    caption: String(formData.get("caption") ?? ""),
    alt_text: String(formData.get("alt_text") ?? ""),
    media_url: String(formData.get("media_url") ?? ""),
    media_type: String(formData.get("media_type") ?? "image"),
    event_id: String(formData.get("event_id") ?? ""),
    taken_at: String(formData.get("taken_at") ?? ""),
    sort_order: String(formData.get("sort_order") ?? "0"),
    status: String(formData.get("status") ?? "draft"),
  };
}

export async function buatMedia(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  const hasil = mediaFormSchema.safeParse(ambilData(formData));
  if (!hasil.success) {
    const { fieldErrors } = z.flattenError(hasil.error);
    return gagal("Periksa kembali isian yang ditandai.", fieldErrors as Record<string, string[]>);
  }

  try {
    const { sql, params } = buildInsert("media_items", {
      id: newId(),
      ...hasil.data,
      taken_at: fromDatetimeLocalValue(hasil.data.taken_at),
      created_by: auth.context.admin.id,
    });
    await execute(sql, params);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }

  revalidateKonten("galeri");
  return sukses("Dokumentasi berhasil ditambahkan.");
}

export async function perbaruiMedia(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  const hasil = mediaFormSchema.safeParse(ambilData(formData));
  if (!hasil.success) {
    const { fieldErrors } = z.flattenError(hasil.error);
    return gagal("Periksa kembali isian yang ditandai.", fieldErrors as Record<string, string[]>);
  }

  const berkasLama =
    (await queryOne<{ url: string | null }>("SELECT media_url AS url FROM media_items WHERE id = ?", [id]).catch(
      () => null,
    ))?.url ?? null;

  try {
    const { sql, params } = buildUpdate(
      "media_items",
      { ...hasil.data, taken_at: fromDatetimeLocalValue(hasil.data.taken_at) },
      id,
    );
    await execute(sql, params);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }

  // Poster/foto yang diganti dihapus dari disk bila tak lagi dipakai.
  await hapusBerkasJikaTakTerpakai(berkasLama);

  revalidateKonten("galeri");
  return sukses("Perubahan dokumentasi berhasil disimpan.");
}

export async function ubahStatusMedia(
  id: string,
  status: "draft" | "published" | "archived",
): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  if (!["draft", "published", "archived"].includes(status)) {
    return gagal("Status tidak valid.");
  }

  try {
    await execute("UPDATE media_items SET status = ? WHERE id = ?", [status, id]);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }

  revalidateKonten("galeri");
  return sukses("Status dokumentasi diperbarui.");
}

export async function hapusMedia(id: string): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  let berkasLama: string | null = null;
  try {
    berkasLama =
      (await queryOne<{ url: string | null }>("SELECT media_url AS url FROM media_items WHERE id = ?", [id]))?.url ??
      null;
    await execute("DELETE FROM media_items WHERE id = ?", [id]);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }
  // Berkas unggahan ikut dihapus bila tak lagi dipakai konten lain.
  await hapusBerkasJikaTakTerpakai(berkasLama);

  revalidateKonten("galeri");
  return sukses("Dokumentasi berhasil dihapus.");
}

/**
 * Menyimpan berkas unggahan ke folder hosting (UPLOAD_DIR).
 *
 * Validasi di server: tipe MIME yang dilaporkan browser, ukuran, DAN isi
 * berkas (magic bytes) — sehingga berkas berbahaya yang diganti namanya
 * menjadi .jpg tetap ditolak. Nama berkas dibuat ulang dan ekstensinya
 * ditentukan dari isi, bukan dari nama asli.
 * Mengembalikan URL publik relatif ("/uploads/...").
 */
export async function unggahBerkas(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return gagal("Pilih berkas gambar terlebih dahulu.");
  }

  const cek = validateUploadFile({ type: file.type, size: file.size });
  if (!cek.ok) return gagal(cek.message);

  const isi = Buffer.from(await file.arrayBuffer());
  const jenis = detectImageType(isi);
  if (!jenis) {
    return gagal("Isi berkas bukan gambar JPG, PNG, WebP, atau AVIF yang valid.");
  }

  // Nama unik: waktu + potongan UUID; ekstensi mengikuti isi berkas.
  const suffix = `${Date.now().toString(36)}-${newId().slice(0, 8)}`;
  const namaDasar = safeFileName(file.name, suffix).replace(/\.[a-z0-9]+$/, "");
  const namaAman = `${namaDasar}.${jenis.ext}`;

  const sekarang = new Date();
  const subfolder = `${sekarang.getUTCFullYear()}/${String(sekarang.getUTCMonth() + 1).padStart(2, "0")}`;
  const folder = path.join(getUploadDir(), subfolder);

  try {
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, namaAman), isi, { flag: "wx" });
  } catch (error) {
    console.error("Gagal menyimpan unggahan:", (error as Error).message);
    return gagal("Berkas gagal diunggah. Periksa izin folder unggahan di hosting.");
  }

  return sukses(`/uploads/${subfolder}/${namaAman}`);
}
