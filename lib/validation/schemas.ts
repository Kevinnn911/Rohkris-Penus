import { z } from "zod";

import { EVENT_CATEGORIES } from "@/lib/db/types";

/**
 * Skema validasi dipakai bersama oleh form (client) dan Server Action (server).
 * Server SELALU memvalidasi ulang — validasi client hanya demi pengalaman
 * pengguna dan tidak pernah dianggap tepercaya.
 *
 * Catatan Zod v4: pesan kustom memakai `{ error: ... }` (bukan `message`),
 * dan format string tersedia di tingkat atas (z.url(), z.email()).
 */

/** URL opsional yang wajib HTTPS bila diisi. */
const httpsUrlOptional = z
  .string()
  .trim()
  .max(2000, { error: "Tautan terlalu panjang (maksimal 2000 karakter)." })
  .refine(
    (value) => {
      if (value === "") return true;
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    },
    { error: "Tautan harus berupa URL lengkap yang diawali https://" },
  )
  .transform((value) => (value === "" ? null : value))
  .nullable();

/**
 * Path berkas unggahan lokal ("/uploads/2026/10/nama-berkas.jpg").
 * Hanya karakter aman — tanpa "..", spasi, atau query string.
 */
export const UPLOAD_PATH_PATTERN = /^\/uploads\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:jpg|png|webp|avif)$/;

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** URL gambar opsional: https:// eksternal ATAU berkas unggahan lokal. */
const imageUrlOptional = z
  .string()
  .trim()
  .max(2000, { error: "Tautan terlalu panjang (maksimal 2000 karakter)." })
  .refine((value) => value === "" || isHttpsUrl(value) || UPLOAD_PATH_PATTERN.test(value), {
    error: "Gambar harus berupa unggahan atau URL lengkap yang diawali https://",
  })
  .transform((value) => (value === "" ? null : value))
  .nullable();

const slugSchema = z
  .string()
  .trim()
  .min(3, { error: "Slug minimal 3 karakter." })
  .max(120, { error: "Slug maksimal 120 karakter." })
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    error: "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.",
  });

/** Teks opsional: string kosong disimpan sebagai NULL, bukan "". */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} maksimal ${max} karakter.` })
    .transform((value) => (value === "" ? null : value))
    .nullable();

/** datetime-local dari form admin (ditafsirkan sebagai WIB di layer aksi). */
const optionalDatetimeLocal = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value), {
    error: "Format tanggal tidak valid.",
  })
  .transform((value) => (value === "" ? null : value))
  .nullable();

export const eventFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, { error: "Judul kegiatan minimal 3 karakter." })
      .max(200, { error: "Judul kegiatan maksimal 200 karakter." }),
    slug: slugSchema,
    category: z.enum(EVENT_CATEGORIES, { error: "Pilih kategori kegiatan." }),
    summary: optionalText(300, "Ringkasan"),
    description: optionalText(20000, "Deskripsi"),
    cover_image_url: imageUrlOptional,
    start_at: optionalDatetimeLocal,
    end_at: optionalDatetimeLocal,
    location: optionalText(200, "Lokasi"),
    event_mode: z.enum(["offline", "online", "hybrid", "tbd"], {
      error: "Pilih format kegiatan.",
    }),
    registration_url: httpsUrlOptional,
    registration_open_at: optionalDatetimeLocal,
    registration_close_at: optionalDatetimeLocal,
    registration_status: z.enum(["not_open", "open", "closed", "external_only"], {
      error: "Pilih status pendaftaran.",
    }),
    // Bawaan "external" = perilaku lama (sama dengan DEFAULT kolom di database).
    registration_mode: z
      .enum(["external", "internal"], { error: "Pilih jenis formulir pendaftaran." })
      .default("external"),
    cost_info: optionalText(500, "Informasi biaya"),
    dress_code: optionalText(300, "Dress code"),
    participant_rules: optionalText(2000, "Ketentuan peserta"),
    contact_info: optionalText(500, "Kontak panitia"),
    resource_url: httpsUrlOptional,
    is_featured: z.boolean(),
    status: z.enum(["draft", "published", "archived", "cancelled"], {
      error: "Pilih status publikasi.",
    }),
  })
  .refine(
    (data) => !data.start_at || !data.end_at || data.end_at >= data.start_at,
    {
      error: "Waktu selesai tidak boleh lebih awal dari waktu mulai.",
      path: ["end_at"],
    },
  )
  .refine(
    (data) =>
      !data.registration_open_at ||
      !data.registration_close_at ||
      data.registration_close_at >= data.registration_open_at,
    {
      error: "Penutupan pendaftaran tidak boleh lebih awal dari pembukaan.",
      path: ["registration_close_at"],
    },
  )
  .refine(
    // Jangan biarkan admin menerbitkan "pendaftaran dibuka" tanpa tautan.
    // Formulir internal tidak butuh tautan luar.
    (data) =>
      data.registration_mode === "internal" ||
      data.registration_status !== "open" ||
      Boolean(data.registration_url),
    {
      error:
        "Isi tautan pendaftaran bila status pendaftaran dibuka, atau ubah statusnya.",
      path: ["registration_url"],
    },
  )
  .refine(
    // "Tanpa pendaftaran / langsung hadir" tidak masuk akal untuk formulir internal.
    (data) => data.registration_mode !== "internal" || data.registration_status !== "external_only",
    {
      error: "Formulir internal butuh status “Dibuka”, “Belum dibuka”, atau “Ditutup”.",
      path: ["registration_status"],
    },
  );

export type EventFormValues = z.input<typeof eventFormSchema>;
export type EventFormParsed = z.output<typeof eventFormSchema>;

export const newsFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { error: "Judul berita minimal 3 karakter." })
    .max(200, { error: "Judul berita maksimal 200 karakter." }),
  slug: slugSchema,
  excerpt: optionalText(300, "Ringkasan"),
  body: optionalText(50000, "Isi berita"),
  cover_image_url: imageUrlOptional,
  event_id: z.string().uuid({ error: "Kegiatan tidak valid." }).nullable().or(z.literal("").transform(() => null)),
  status: z.enum(["draft", "published", "archived"], { error: "Pilih status publikasi." }),
});

export type NewsFormValues = z.input<typeof newsFormSchema>;

export const mediaFormSchema = z.object({
  title: optionalText(200, "Judul"),
  caption: optionalText(500, "Keterangan"),
  alt_text: z
    .string()
    .trim()
    .min(3, { error: "Teks alternatif wajib diisi agar gambar dapat diakses." })
    .max(300, { error: "Teks alternatif maksimal 300 karakter." }),
  media_url: z
    .string()
    .trim()
    .min(1, { error: "Tautan media wajib diisi." })
    .refine((value) => isHttpsUrl(value) || UPLOAD_PATH_PATTERN.test(value), {
      error: "Media harus berupa unggahan atau URL https://",
    }),
  media_type: z.enum(["image", "video", "document"], { error: "Pilih jenis media." }),
  event_id: z.string().uuid({ error: "Kegiatan tidak valid." }).nullable().or(z.literal("").transform(() => null)),
  taken_at: optionalDatetimeLocal,
  sort_order: z.coerce
    .number()
    .int({ error: "Urutan harus bilangan bulat." })
    .min(0, { error: "Urutan minimal 0." })
    .max(9999, { error: "Urutan maksimal 9999." }),
  status: z.enum(["draft", "published", "archived"], { error: "Pilih status publikasi." }),
});

export type MediaFormValues = z.input<typeof mediaFormSchema>;

export const announcementFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, { error: "Judul pengumuman minimal 3 karakter." })
      .max(200, { error: "Judul pengumuman maksimal 200 karakter." }),
    body: optionalText(5000, "Isi pengumuman"),
    starts_at: optionalDatetimeLocal,
    ends_at: optionalDatetimeLocal,
    priority: z.coerce
      .number()
      .int({ error: "Prioritas harus bilangan bulat." })
      .min(0, { error: "Prioritas minimal 0." })
      .max(100, { error: "Prioritas maksimal 100." }),
    status: z.enum(["draft", "published", "archived"], { error: "Pilih status publikasi." }),
  })
  .refine((data) => !data.starts_at || !data.ends_at || data.ends_at >= data.starts_at, {
    error: "Tanggal berakhir tidak boleh lebih awal dari tanggal mulai.",
    path: ["ends_at"],
  });

export type AnnouncementFormValues = z.input<typeof announcementFormSchema>;

export const loginSchema = z.object({
  email: z.email({ error: "Masukkan alamat email yang valid." }),
  password: z.string().min(8, { error: "Kata sandi minimal 8 karakter." }),
});

export type LoginValues = z.infer<typeof loginSchema>;

/** Pengaturan situs — semua opsional agar admin bisa mengisi bertahap. */
export const siteSettingsSchema = z.object({
  site_tagline: optionalText(200, "Tagline"),
  site_description: optionalText(500, "Deskripsi singkat"),
  contact_email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.email().safeParse(v).success, {
      error: "Masukkan alamat email yang valid.",
    })
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  contact_phone: optionalText(50, "Nomor telepon"),
  school_info: optionalText(500, "Keterangan sekolah"),
  instagram_url: httpsUrlOptional,
  youtube_url: httpsUrlOptional,
  tiktok_url: httpsUrlOptional,
  whatsapp_url: httpsUrlOptional,
  footer_note: optionalText(300, "Catatan footer"),
  about_vision: optionalText(2000, "Visi"),
  about_mission: optionalText(2000, "Misi"),
  about_values: optionalText(2000, "Nilai"),
  about_body: optionalText(10000, "Tentang Rohkris"),
});

export type SiteSettingsValues = z.input<typeof siteSettingsSchema>;

/** Membuat slug URL-aman dari judul. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

/** Batas unggahan media (prompt §8.11). */
export const UPLOAD_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"] as const,
} as const;

export function validateUploadFile(file: {
  type: string;
  size: number;
}): { ok: true } | { ok: false; message: string } {
  if (!UPLOAD_LIMITS.allowedImageTypes.includes(file.type as never)) {
    return {
      ok: false,
      message: "Format gambar harus JPG, PNG, WebP, atau AVIF.",
    };
  }
  if (file.size > UPLOAD_LIMITS.maxBytes) {
    return { ok: false, message: "Ukuran berkas maksimal 5 MB." };
  }
  return { ok: true };
}

/**
 * Mengenali jenis gambar dari isi berkas (magic bytes), bukan dari nama
 * atau MIME yang dikirim browser — keduanya bisa dipalsukan.
 */
export function detectImageType(
  bytes: Uint8Array,
): { ext: "jpg" | "png" | "webp" | "avif"; mime: string } | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return { ext: "png", mime: "image/png" };
  }
  const ascii = (start: number, end: number) => String.fromCharCode(...b.slice(start, end));
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return { ext: "webp", mime: "image/webp" };
  }
  if (b.length >= 12 && ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) {
    return { ext: "avif", mime: "image/avif" };
  }
  return null;
}

/** Membuat nama berkas yang aman untuk storage. */
export function safeFileName(originalName: string, uniqueSuffix: string): string {
  const ext = (originalName.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = originalName
    .replace(/\.[^.]*$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "berkas";

  return ext ? `${base}-${uniqueSuffix}.${ext}` : `${base}-${uniqueSuffix}`;
}
