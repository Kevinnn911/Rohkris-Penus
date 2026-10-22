import "server-only";

import { query, queryOne } from "@/lib/db";
import type {
  AdminUser,
  AnnouncementRow,
  EventRow,
  MediaItemRow,
  NewsPostRow,
} from "@/lib/db/types";

/**
 * Query untuk panel admin.
 *
 * Pemanggil WAJIB sudah memanggil requireAdmin() lebih dulu — tanpa RLS,
 * pemeriksaan itulah yang mencegah data draft terbaca orang lain.
 * Kegagalan query dicatat di log server dan menghasilkan daftar kosong.
 */

async function aman<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("Query admin gagal:", (error as Error).message);
    return fallback;
  }
}

export async function getSemuaEvent(): Promise<EventRow[]> {
  return aman(() => query<EventRow>("SELECT * FROM events ORDER BY start_at IS NULL, start_at DESC"), []);
}

export async function getEventById(id: string): Promise<EventRow | null> {
  return aman(() => queryOne<EventRow>("SELECT * FROM events WHERE id = ?", [id]), null);
}

export async function getSemuaBerita(): Promise<NewsPostRow[]> {
  return aman(() => query<NewsPostRow>("SELECT * FROM news_posts ORDER BY created_at DESC"), []);
}

export async function getBeritaById(id: string): Promise<NewsPostRow | null> {
  return aman(() => queryOne<NewsPostRow>("SELECT * FROM news_posts WHERE id = ?", [id]), null);
}

export async function getSemuaMedia(): Promise<MediaItemRow[]> {
  return aman(
    () => query<MediaItemRow>("SELECT * FROM media_items ORDER BY sort_order ASC, created_at DESC"),
    [],
  );
}

export async function getMediaById(id: string): Promise<MediaItemRow | null> {
  return aman(() => queryOne<MediaItemRow>("SELECT * FROM media_items WHERE id = ?", [id]), null);
}

export async function getSemuaPengumuman(): Promise<AnnouncementRow[]> {
  return aman(
    () => query<AnnouncementRow>("SELECT * FROM announcements ORDER BY priority DESC, created_at DESC"),
    [],
  );
}

export async function getPengumumanById(id: string): Promise<AnnouncementRow | null> {
  return aman(() => queryOne<AnnouncementRow>("SELECT * FROM announcements WHERE id = ?", [id]), null);
}

/** Daftar admin — kolom password_hash TIDAK pernah ikut dipilih. */
export async function getSemuaAdmin(): Promise<AdminUser[]> {
  return aman(
    () =>
      query<AdminUser>(
        `SELECT id, email, role, display_name, is_active, last_login_at, created_at, updated_at
           FROM admin_users ORDER BY created_at ASC`,
      ),
    [],
  );
}

/** Daftar ringkas event untuk dropdown relasi. */
export async function getPilihanEvent(): Promise<Array<{ id: string; title: string }>> {
  return aman(
    () =>
      query<{ id: string; title: string }>(
        "SELECT id, title FROM events ORDER BY start_at IS NULL, start_at DESC LIMIT 200",
      ),
    [],
  );
}

export interface RingkasanDashboard {
  totalEvent: number;
  eventPublished: number;
  eventDraft: number;
  eventMendatang: number;
  totalBerita: number;
  beritaDraft: number;
  totalMedia: number;
  mediaDraft: number;
}

export async function getRingkasanDashboard(): Promise<RingkasanDashboard> {
  const [events, berita, media] = await Promise.all([
    getSemuaEvent(),
    getSemuaBerita(),
    getSemuaMedia(),
  ]);

  const sekarang = Date.now();

  return {
    totalEvent: events.length,
    eventPublished: events.filter((e) => e.status === "published").length,
    eventDraft: events.filter((e) => e.status === "draft").length,
    eventMendatang: events.filter((e) => {
      if (e.status !== "published") return false;
      const acuan = e.end_at ?? e.start_at;
      return acuan ? new Date(acuan).getTime() >= sekarang : false;
    }).length,
    totalBerita: berita.length,
    beritaDraft: berita.filter((n) => n.status === "draft").length,
    totalMedia: media.length,
    mediaDraft: media.filter((m) => m.status === "draft").length,
  };
}
