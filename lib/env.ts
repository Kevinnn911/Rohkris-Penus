// File: lib/env.ts

/**
 * Akses environment variable yang aman dan terdokumentasi.
 *
 * PENTING — klasifikasi variabel (lihat .env.example dan README):
 *  - NEXT_PUBLIC_* : boleh terbaca di browser. Jangan pernah isi rahasia di sini.
 *  - DATABASE_*    : HANYA server. Tidak pernah diimpor dari komponen client.
 *  - ADMIN_SECRET_KEY : Kunci UUID rahasia untuk gerbang panel admin.
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/** Konfigurasi MySQL dari env. Melempar error yang jelas bila belum lengkap. */
export function getDatabaseConfig(): DatabaseConfig {
  const fromUrl = parseDatabaseUrl(process.env.DATABASE_URL);
  if (fromUrl) return fromUrl;

  const host = process.env.DATABASE_HOST;
  const user = process.env.DATABASE_USER;
  const database = process.env.DATABASE_NAME;

  if (!host || !user || !database) {
    throw new Error(
      "Konfigurasi database belum lengkap. Salin .env.example menjadi .env.local " +
        "lalu isi DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, dan DATABASE_NAME. " +
        "Lihat README bagian “Menyiapkan database MySQL”.",
    );
  }

  return {
    host,
    port: Number(process.env.DATABASE_PORT ?? 3306) || 3306,
    user,
    password: process.env.DATABASE_PASSWORD ?? "",
    database,
  };
}

function parseDatabaseUrl(raw: string | undefined): DatabaseConfig | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "mysql:") return null;
    return {
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
    };
  } catch {
    return null;
  }
}

/** True bila env database tersedia — dipakai untuk menampilkan pesan setup yang ramah. */
export function isDatabaseConfigured(): boolean {
  return Boolean(
    parseDatabaseUrl(process.env.DATABASE_URL) ||
      (process.env.DATABASE_HOST && process.env.DATABASE_USER && process.env.DATABASE_NAME),
  );
}

/** URL dasar situs untuk metadata SEO/Open Graph dan sitemap. */
export function getSiteUrl(): string {
  // `||` (bukan `??`): baris "NEXT_PUBLIC_SITE_URL=" yang dikosongkan di
  // .env terbaca sebagai string kosong dan harus dianggap "tidak diisi".
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ||
    (process.env.NODE_ENV === "production"
      ? "https://rohkrissmkpenus.web.id"
      : "http://localhost:3000");

  return raw.replace(/\/+$/, "");
}

/**
 * Folder penyimpanan berkas unggahan (poster & dokumentasi).
 * Default: "<folder aplikasi>/storage/uploads". Di cPanel sebaiknya diarahkan
 * ke folder di luar folder build agar tidak terhapus saat deploy ulang.
 */
export function getUploadDir(): string {
  return process.env.UPLOAD_DIR?.trim() || `${process.cwd()}/storage/uploads`;
}

/**
 * Kunci rahasia/UUID untuk mengakses gerbang login panel admin.
 * Mencegah siapapun mengakses /admin atau /admin/login tanpa kunci otorisasi.
 * Fail-closed: Mengembalikan string kosong bila tidak dikonfigurasi di environment.
 */
export function getAdminSecretKey(): string {
  return process.env.ADMIN_SECRET_KEY?.trim() || "";
}

