import "server-only";

import { unlink } from "node:fs/promises";
import path from "node:path";

import { query } from "@/lib/db";
import { getUploadDir } from "@/lib/env";
import { UPLOAD_PATH_PATTERN } from "@/lib/validation/schemas";

/**
 * Menghapus berkas unggahan lokal yang sudah tidak dipakai lagi.
 *
 * Aman dipanggil dengan nilai apa pun:
 *  - URL eksternal / kosong diabaikan.
 *  - Path harus cocok dengan UPLOAD_PATH_PATTERN dan berada di dalam
 *    UPLOAD_DIR (anti path traversal).
 *  - Berkas TIDAK dihapus bila masih dirujuk konten lain (poster yang sama
 *    bisa dipakai kegiatan, berita, dan galeri sekaligus).
 * Kegagalan hanya dicatat di log; tidak pernah menggagalkan aksi admin.
 */
export async function hapusBerkasJikaTakTerpakai(
  ...urls: Array<string | null | undefined>
): Promise<void> {
  for (const url of new Set(urls)) {
    if (!url || !UPLOAD_PATH_PATTERN.test(url)) continue;

    try {
      const rujukan = await query<{ n: number }>(
        `SELECT
           (SELECT COUNT(*) FROM events      WHERE cover_image_url = ?) +
           (SELECT COUNT(*) FROM news_posts  WHERE cover_image_url = ?) +
           (SELECT COUNT(*) FROM media_items WHERE media_url = ?) AS n`,
        [url, url, url],
      );
      if (Number(rujukan[0]?.n ?? 0) > 0) continue;

      const root = path.resolve(getUploadDir());
      const target = path.resolve(root, ...url.replace(/^\/uploads\//, "").split("/"));
      if (!target.startsWith(root + path.sep)) continue;

      await unlink(target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("Gagal menghapus berkas unggahan:", (error as Error).message);
      }
    }
  }
}
