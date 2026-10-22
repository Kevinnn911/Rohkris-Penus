import "server-only";

import { nowDb, query, queryOne } from "@/lib/db";
import type {
  AnnouncementRow,
  EventRow,
  MediaItemRow,
  NewsPostRow,
  SiteSettings,
} from "@/lib/db/types";
import { isDatabaseConfigured } from "@/lib/env";

/**
 * Query untuk halaman publik.
 *
 * Semua fungsi di sini menyaring `status = 'published'` secara eksplisit.
 * MySQL tidak memiliki Row Level Security, sehingga filter di file inilah
 * SATU-SATUNYA pembatas apa yang terlihat publik. Jangan menambah query
 * publik tanpa filter status.
 *
 * Bila database belum dikonfigurasi atau gagal dihubungi, fungsi
 * mengembalikan hasil kosong agar halaman menampilkan empty/error state,
 * bukan error mentah.
 */

export interface PublicDataResult<T> {
  data: T;
  /** True bila terjadi kegagalan koneksi/kueri — pemanggil menampilkan ErrorState. */
  failed: boolean;
}

function emptyResult<T>(fallback: T): PublicDataResult<T> {
  return { data: fallback, failed: false };
}

/** Menjalankan query daftar; kegagalan dicatat di log server dan ditandai `failed`. */
async function daftar<T>(sql: string, params: unknown[] = []): Promise<PublicDataResult<T[]>> {
  if (!isDatabaseConfigured()) return emptyResult([]);
  try {
    return { data: await query<T>(sql, params), failed: false };
  } catch (error) {
    console.error("Query publik gagal:", (error as Error).message);
    return { data: [], failed: true };
  }
}

/** Varian yang hanya mengembalikan array (untuk pemanggil yang tidak menampilkan ErrorState). */
async function daftarSaja<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await daftar<T>(sql, params)).data;
}

async function satu<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    return await queryOne<T>(sql, params);
  } catch (error) {
    console.error("Query publik gagal:", (error as Error).message);
    return null;
  }
}

/** "LIMIT n" yang aman — angka saja, tidak pernah dari input pengguna. */
function limitClause(limit?: number): string {
  return limit && Number.isInteger(limit) && limit > 0 ? ` LIMIT ${limit}` : "";
}

// MySQL mengurutkan NULL paling awal pada ASC; "x IS NULL" di depan
// meniru perilaku "nulls last" dari versi Postgres.

export async function getFeaturedEvents(limit = 3): Promise<PublicDataResult<EventRow[]>> {
  return daftar<EventRow>(
    `SELECT * FROM events
      WHERE status = 'published' AND is_featured = 1
      ORDER BY start_at IS NULL, start_at ASC${limitClause(limit)}`,
  );
}

/**
 * Kegiatan mendatang: belum selesai, diurutkan dari yang terdekat.
 * Sama dengan isPastEvent() di lib/events/status.ts: acuannya end_at, atau
 * start_at bila end_at kosong. Kegiatan yang tanggalnya belum ditentukan
 * (TBD) ikut tampil di urutan terakhir — dipakai bagian "Belum Dijadwalkan".
 */
export async function getUpcomingEvents(limit?: number): Promise<PublicDataResult<EventRow[]>> {
  return daftar<EventRow>(
    `SELECT * FROM events
      WHERE status = 'published'
        AND (COALESCE(end_at, start_at) >= ? OR COALESCE(end_at, start_at) IS NULL)
      ORDER BY start_at IS NULL, start_at ASC${limitClause(limit)}`,
    [nowDb()],
  );
}

/** Kegiatan yang sudah lewat — arsip (acuan sama dengan isPastEvent). */
export async function getPastEvents(limit?: number): Promise<PublicDataResult<EventRow[]>> {
  return daftar<EventRow>(
    `SELECT * FROM events
      WHERE status = 'published' AND COALESCE(end_at, start_at) < ?
      ORDER BY start_at IS NULL, start_at DESC${limitClause(limit)}`,
    [nowDb()],
  );
}

export async function getAllPublishedEvents(): Promise<PublicDataResult<EventRow[]>> {
  return daftar<EventRow>(
    `SELECT * FROM events WHERE status = 'published'
      ORDER BY start_at IS NULL, start_at DESC`,
  );
}

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  return satu<EventRow>("SELECT * FROM events WHERE slug = ? AND status = 'published'", [slug]);
}

/** Kegiatan terkait (mis. dari berita) — hanya bila sudah published. */
export async function getPublishedEventById(id: string): Promise<EventRow | null> {
  return satu<EventRow>("SELECT * FROM events WHERE id = ? AND status = 'published'", [id]);
}

/** Slug kegiatan published — untuk sitemap dan generateStaticParams. */
export async function getPublishedEventSlugs(): Promise<
  Array<Pick<EventRow, "slug" | "updated_at">>
> {
  return daftarSaja("SELECT slug, updated_at FROM events WHERE status = 'published'");
}

export async function getRelatedEvents(
  event: Pick<EventRow, "id" | "category">,
  limit = 3,
): Promise<EventRow[]> {
  return daftarSaja<EventRow>(
    `SELECT * FROM events
      WHERE status = 'published' AND category = ? AND id <> ?
      ORDER BY start_at IS NULL, start_at DESC${limitClause(limit)}`,
    [event.category, event.id],
  );
}

/**
 * Media published; bila terkait kegiatan, kegiatannya juga harus published
 * (aturan yang dulu ditegakkan RLS media_items_select_public).
 */
const MEDIA_PUBLIK = `
  m.status = 'published'
  AND (m.event_id IS NULL OR EXISTS (
    SELECT 1 FROM events e WHERE e.id = m.event_id AND e.status = 'published'
  ))`;

export async function getPublishedMedia(limit?: number): Promise<PublicDataResult<MediaItemRow[]>> {
  return daftar<MediaItemRow>(
    `SELECT m.* FROM media_items m
      WHERE ${MEDIA_PUBLIK}
      ORDER BY m.sort_order ASC, m.created_at DESC${limitClause(limit)}`,
  );
}

export async function getMediaForEvent(eventId: string): Promise<MediaItemRow[]> {
  return daftarSaja<MediaItemRow>(
    `SELECT m.* FROM media_items m
      WHERE ${MEDIA_PUBLIK} AND m.event_id = ?
      ORDER BY m.sort_order ASC`,
    [eventId],
  );
}

export async function getPublishedNews(limit?: number): Promise<PublicDataResult<NewsPostRow[]>> {
  return daftar<NewsPostRow>(
    `SELECT * FROM news_posts WHERE status = 'published'
      ORDER BY published_at IS NULL, published_at DESC${limitClause(limit)}`,
  );
}

export async function getNewsBySlug(slug: string): Promise<NewsPostRow | null> {
  return satu<NewsPostRow>("SELECT * FROM news_posts WHERE slug = ? AND status = 'published'", [slug]);
}

export async function getPublishedNewsSlugs(): Promise<
  Array<Pick<NewsPostRow, "slug" | "updated_at">>
> {
  return daftarSaja("SELECT slug, updated_at FROM news_posts WHERE status = 'published'");
}

/** Pengumuman yang sedang tayang (published dan dalam masa tayang). */
export async function getActiveAnnouncements(): Promise<AnnouncementRow[]> {
  const sekarang = nowDb();
  return daftarSaja<AnnouncementRow>(
    `SELECT * FROM announcements
      WHERE status = 'published'
        AND (starts_at IS NULL OR starts_at <= ?)
        AND (ends_at IS NULL OR ends_at >= ?)
      ORDER BY priority DESC
      LIMIT 3`,
    [sekarang, sekarang],
  );
}

export type { SiteSettings } from "@/lib/db/types";

/** Pengaturan situs sebagai objek key → value. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await daftarSaja<{ key: string; value: string | null }>(
    "SELECT `key`, value FROM site_settings",
  );

  const settings: SiteSettings = {};
  for (const row of rows) {
    if (row.value) settings[row.key] = row.value;
  }
  return settings;
}
