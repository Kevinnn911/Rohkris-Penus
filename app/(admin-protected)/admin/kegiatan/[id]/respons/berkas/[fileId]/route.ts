import { getAdminContext } from "@/lib/auth/guard";
import { getResponseFileForEvent } from "@/lib/data/forms";
import { bacaBerkasFormulir } from "@/lib/forms/storage";

/**
 * Unduh berkas unggahan peserta — HANYA untuk admin yang masuk.
 * Berkas disimpan privat (FORM_UPLOAD_DIR) dan tidak pernah disajikan lewat
 * /uploads publik. Selalu sebagai lampiran + CSP sandbox agar berkas
 * (mis. PDF/HTML palsu) tidak bisa menjalankan skrip di origin situs.
 */
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const tidakDitemukan = () => new Response("Tidak ditemukan", { status: 404 });

/** Content-Disposition yang aman untuk nama berkas apa pun (RFC 6266 / 5987). */
function disposisi(nama: string): string {
  const ascii = nama.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nama)}`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const ctx = await getAdminContext();
  if (!ctx) return tidakDitemukan();

  const { id, fileId } = await params;
  if (!UUID.test(id) || !UUID.test(fileId)) return tidakDitemukan();

  const berkas = await getResponseFileForEvent(id, fileId).catch(() => null);
  if (!berkas) return tidakDitemukan();

  try {
    const isi = await bacaBerkasFormulir(berkas.storage_key);
    return new Response(new Uint8Array(isi), {
      headers: {
        "Content-Type": berkas.mime,
        "Content-Length": String(isi.length),
        "Content-Disposition": disposisi(berkas.original_name),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    console.error("Gagal membaca berkas formulir:", (error as Error).message);
    return tidakDitemukan();
  }
}
