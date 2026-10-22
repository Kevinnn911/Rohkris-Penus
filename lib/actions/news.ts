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
import { hapusBerkasJikaTakTerpakai } from "@/lib/uploads";
import { buildInsert, buildUpdate, execute, newId, nowDb, queryOne } from "@/lib/db";
import { newsFormSchema } from "@/lib/validation/schemas";

function ambilData(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    excerpt: String(formData.get("excerpt") ?? ""),
    body: String(formData.get("body") ?? ""),
    cover_image_url: String(formData.get("cover_image_url") ?? ""),
    event_id: String(formData.get("event_id") ?? ""),
    status: String(formData.get("status") ?? "draft"),
  };
}

export async function buatBerita(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  const hasil = newsFormSchema.safeParse(ambilData(formData));
  if (!hasil.success) {
    const { fieldErrors } = z.flattenError(hasil.error);
    return gagal("Periksa kembali isian yang ditandai.", fieldErrors as Record<string, string[]>);
  }

  const id = newId();
  try {
    const { sql, params } = buildInsert("news_posts", {
      id,
      ...hasil.data,
      ...jejakPerubahan(auth.context, true),
      published_at: hasil.data.status === "published" ? nowDb() : null,
    });
    await execute(sql, params);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }

  revalidateKonten("berita");
  return sukses("Berita berhasil disimpan.", id);
}

/** published_at pertama kali dipertahankan; diisi saat pertama diterbitkan. */
async function tentukanPublishedAt(id: string, status: string): Promise<string | null> {
  const sebelumnya = await queryOne<{ published_at: string | null }>(
    "SELECT published_at FROM news_posts WHERE id = ?",
    [id],
  );
  if (status === "published") return sebelumnya?.published_at ?? nowDb();
  return sebelumnya?.published_at ?? null;
}

export async function perbaruiBerita(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  const hasil = newsFormSchema.safeParse(ambilData(formData));
  if (!hasil.success) {
    const { fieldErrors } = z.flattenError(hasil.error);
    return gagal("Periksa kembali isian yang ditandai.", fieldErrors as Record<string, string[]>);
  }

  const berkasLama =
    (await queryOne<{ url: string | null }>("SELECT cover_image_url AS url FROM news_posts WHERE id = ?", [id]).catch(
      () => null,
    ))?.url ?? null;

  try {
    const publishedAt = await tentukanPublishedAt(id, hasil.data.status);
    const { sql, params } = buildUpdate(
      "news_posts",
      { ...hasil.data, ...jejakPerubahan(auth.context, false), published_at: publishedAt },
      id,
    );
    await execute(sql, params);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }

  // Poster/foto yang diganti dihapus dari disk bila tak lagi dipakai.
  await hapusBerkasJikaTakTerpakai(berkasLama);

  revalidateKonten("berita");
  return sukses("Perubahan berita berhasil disimpan.");
}

export async function ubahStatusBerita(
  id: string,
  status: "draft" | "published" | "archived",
): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  if (!["draft", "published", "archived"].includes(status)) {
    return gagal("Status tidak valid.");
  }

  try {
    const publishedAt = await tentukanPublishedAt(id, status);
    await execute("UPDATE news_posts SET status = ?, updated_by = ?, published_at = ? WHERE id = ?", [
      status,
      auth.context.admin.id,
      publishedAt,
      id,
    ]);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }

  revalidateKonten("berita");
  return sukses(
    status === "published" ? "Berita berhasil diterbitkan." : "Status berita diperbarui.",
  );
}

export async function hapusBerita(id: string): Promise<ActionResult> {
  const auth = await requireAdminForAction();
  if (!auth.ok) return gagal(auth.message);

  let berkasLama: string | null = null;
  try {
    berkasLama =
      (await queryOne<{ url: string | null }>("SELECT cover_image_url AS url FROM news_posts WHERE id = ?", [id]))?.url ??
      null;
    await execute("DELETE FROM news_posts WHERE id = ?", [id]);
  } catch (error) {
    return gagal(pesanErrorDatabase(error));
  }
  // Berkas unggahan ikut dihapus bila tak lagi dipakai konten lain.
  await hapusBerkasJikaTakTerpakai(berkasLama);

  revalidateKonten("berita");
  return sukses("Berita berhasil dihapus.");
}
