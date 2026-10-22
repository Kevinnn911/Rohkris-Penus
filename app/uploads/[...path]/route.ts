import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { getUploadDir } from "@/lib/env";
import { detectImageType } from "@/lib/validation/schemas";

/**
 * Menyajikan berkas unggahan admin dari UPLOAD_DIR di "/uploads/...".
 *
 * Folder `public/` tidak dipakai karena Next.js hanya membaca isinya saat
 * build — berkas yang diunggah setelah website berjalan tidak akan muncul.
 *
 * Keamanan:
 *  - Path dinormalisasi dan WAJIB berada di dalam UPLOAD_DIR (anti "../").
 *  - Hanya gambar yang lolos pemeriksaan magic bytes yang disajikan, dengan
 *    Content-Type dari isi berkas dan header nosniff.
 */

const MAX_BYTES = 10 * 1024 * 1024;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  if (!segments?.length || segments.some((s) => s === ".." || s.includes("\\") || s.startsWith("."))) {
    return new Response("Tidak ditemukan", { status: 404 });
  }

  const root = path.resolve(getUploadDir());
  const target = path.resolve(root, ...segments);
  if (!target.startsWith(root + path.sep)) {
    return new Response("Tidak ditemukan", { status: 404 });
  }

  try {
    const info = await stat(target);
    if (!info.isFile() || info.size > MAX_BYTES) {
      return new Response("Tidak ditemukan", { status: 404 });
    }

    const isi = await readFile(target);
    const jenis = detectImageType(isi);
    if (!jenis) return new Response("Tidak ditemukan", { status: 404 });

    return new Response(new Uint8Array(isi), {
      headers: {
        "Content-Type": jenis.mime,
        "Content-Length": String(isi.length),
        // Nama berkas unik per unggahan, jadi aman di-cache lama.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response("Tidak ditemukan", { status: 404 });
  }
}
