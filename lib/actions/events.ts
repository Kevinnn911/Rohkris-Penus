"use server";

import { z } from "zod";

import { requireAdminForAction } from "@/lib/auth/guard";
import {
  gagal,
  jejakPerubahan,
  pesanErrorDatabase,
  revalidateKonten,
  sukses,
  type ActionResult,
} from "@/lib/actions/helpers";
import { fromDatetimeLocalValue } from "@/lib/format/date";
import { hapusBerkasJikaTakTerpakai } from "@/lib/uploads";
import { buildInsert, buildUpdate, execute, newId, nowDb, queryOne } from "@/lib/db";
import { eventFormSchema } from "@/lib/validation/schemas";

/**
 * Server Action untuk kegiatan.
 *
 * Setiap aksi memanggil requireAdminForAction() SENDIRI. Tidak ada yang
 * mengandalkan proteksi layout — permintaan ke Server Action bisa datang
 * langsung tanpa melewati halaman admin.
 */

function ambilData(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    category: String(formData.get("category") ?? "Lainnya"),
    summary: String(formData.get("summary") ?? ""),
    description: String(formData.get("description") ?? ""),
    cover_image_url: String(formData.get("cover_image_url") ?? ""),
    start_at: String(formData.get("start_at") ?? ""),
    end_at: String(formData.get("end_at") ?? ""),
    location: String(formData.get("location") ?? ""),
    event_mode: String(formData.get("event_mode") ?? "tbd"),
    registration_url: String(formData.get("registration_url") ?? ""),
    registration_open_at: String(formData.get("registration_open_at") ?? ""),
    registration_close_at: String(formData.get("registration_close_at") ?? ""),
    registration_status: String(formData.get("registration_status") ?? "not_open"),
    cost_info: String(formData.get("cost_info") ?? ""),
    dress_code: String(formData.get("dress_code") ?? ""),
    participant_rules: String(formData.get("participant_rules") ?? ""),
    contact_info: String(formData.get("contact_info") ?? ""),
    resource_url: String(formData.get("resource_url") ?? ""),
    is_featured: formData.get("is_featured") === "on",
    status: String(formData.get("status") ?? "draft"),
  };
}

/** Mengubah hasil validasi menjadi baris database (waktu WIB → UTC). */
function keBarisDatabase(parsed: z.output<typeof eventFormSchema>) {
  return {
    title: parsed.title,
    slug: parsed.slug,
    category: parsed.category,
    summary: parsed.summary,
    description: parsed.description,
    cover_image_url: parsed.cover_image_url,
    start_at: fromDatetimeLocalValue(parsed.start_at),
    end_at: fromDatetimeLocalValue(parsed.end_at),
    location: parsed.location,
    event_mode: parsed.event_mode,
    registration_url: parsed.registration_url,
    registration_open_at: fromDatetimeLocalValue(parsed.registration_open_at),
    registration_close_at: fromDatetimeLocalValue(parsed.registration_close_at),
    registration_status: parsed.registration_status,
    cost_info: parsed.cost_info,
    dress_code: parsed.dress_code,
    participant_rules: parsed.participant_rules,
    contact_info: parsed.contact_info,
    resource_url: parsed.resource_url,
    is_featured: parsed.is_featured,
    status: parsed.status,
  };
}

export async function buatEvent(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  const hasil = eventFormSchema.safeParse(ambilData(formData));
  if (!hasil.success) {
    const { fieldErrors } = z.flattenError(hasil.error);
    return gagal("Periksa kembali isian yang ditandai.", fieldErrors as Record<string, string[]>);
  }

  const baris = keBarisDatabase(hasil.data);
  const id = newId();

  try {
    const { sql, params } = buildInsert("events", {
      id,
      ...baris,
      ...jejakPerubahan(auth.context, true),
      published_at: baris.status === "published" ? nowDb() : null,
    });
    await execute(sql, params);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }

  revalidateKonten("event");
  return sukses("Kegiatan berhasil disimpan.", id);
}

/** published_at pertama kali dipertahankan; diisi saat pertama diterbitkan. */
async function tentukanPublishedAt(id: string, status: string): Promise<string | null> {
  const sebelumnya = await queryOne<{ published_at: string | null }>(
    "SELECT published_at FROM events WHERE id = ?",
    [id],
  );
  if (status === "published") return sebelumnya?.published_at ?? nowDb();
  return sebelumnya?.published_at ?? null;
}

export async function perbaruiEvent(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  const hasil = eventFormSchema.safeParse(ambilData(formData));
  if (!hasil.success) {
    const { fieldErrors } = z.flattenError(hasil.error);
    return gagal("Periksa kembali isian yang ditandai.", fieldErrors as Record<string, string[]>);
  }

  const baris = keBarisDatabase(hasil.data);

  const berkasLama =
    (await queryOne<{ url: string | null }>("SELECT cover_image_url AS url FROM events WHERE id = ?", [id]).catch(
      () => null,
    ))?.url ?? null;

  try {
    const publishedAt = await tentukanPublishedAt(id, baris.status);
    const { sql, params } = buildUpdate(
      "events",
      { ...baris, ...jejakPerubahan(auth.context, false), published_at: publishedAt },
      id,
    );
    await execute(sql, params);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }

  // Poster/foto yang diganti dihapus dari disk bila tak lagi dipakai.
  await hapusBerkasJikaTakTerpakai(berkasLama);

  revalidateKonten("event");
  return sukses("Perubahan kegiatan berhasil disimpan.");
}

/** Mengubah status publikasi (publish / unpublish / arsip / batal). */
export async function ubahStatusEvent(
  id: string,
  status: "draft" | "published" | "archived" | "cancelled",
): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  if (!["draft", "published", "archived", "cancelled"].includes(status)) {
    return gagal("Status tidak valid.");
  }

  try {
    const publishedAt = await tentukanPublishedAt(id, status);
    await execute("UPDATE events SET status = ?, updated_by = ?, published_at = ? WHERE id = ?", [
      status,
      auth.context.admin.id,
      publishedAt,
      id,
    ]);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }

  revalidateKonten("event");

  const pesan: Record<string, string> = {
    draft: "Kegiatan dikembalikan menjadi draft.",
    published: "Kegiatan berhasil diterbitkan.",
    archived: "Kegiatan dipindahkan ke arsip.",
    cancelled: "Kegiatan ditandai sebagai dibatalkan.",
  };
  return sukses(pesan[status] ?? "Status kegiatan diperbarui.");
}

export async function ubahUnggulanEvent(id: string, unggulan: boolean): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  try {
    await execute("UPDATE events SET is_featured = ?, updated_by = ? WHERE id = ?", [
      unggulan ? 1 : 0,
      auth.context.admin.id,
      id,
    ]);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }

  revalidateKonten("event");
  return sukses(
    unggulan ? "Kegiatan ditandai sebagai unggulan." : "Kegiatan dilepas dari unggulan.",
  );
}

export async function hapusEvent(id: string): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  let berkasLama: string | null = null;
  try {
    berkasLama =
      (await queryOne<{ url: string | null }>("SELECT cover_image_url AS url FROM events WHERE id = ?", [id]))?.url ??
      null;
    await execute("DELETE FROM events WHERE id = ?", [id]);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }
  // Berkas unggahan ikut dihapus bila tak lagi dipakai konten lain.
  await hapusBerkasJikaTakTerpakai(berkasLama);

  revalidateKonten("event");
  return sukses("Kegiatan berhasil dihapus.");
}
