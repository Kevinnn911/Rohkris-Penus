/**
 * Hanya unggahan lokal ("/uploads/...") yang lewat optimizer gambar Next.js.
 * URL eksternal ditampilkan apa adanya agar server tidak memproses gambar
 * dari host sembarangan (lihat images.localPatterns di next.config.ts).
 */
export function perluTanpaOptimasi(src: string | null | undefined): boolean {
  return !src?.startsWith("/uploads/");
}
