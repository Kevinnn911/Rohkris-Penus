/**
 * Tipe baris database — dibuat manual agar selaras dengan database/schema.sql.
 *
 * Kolom waktu dikembalikan lapisan lib/db sebagai string ISO UTC
 * (contoh "2026-10-19T02:24:58.120Z") dan boolean sebagai true/false.
 * Jika skema berubah, perbarui file ini.
 */

export type AdminRole = "super_admin" | "admin" | "editor";
export type ContentStatus = "draft" | "published" | "archived";
export type EventStatus = ContentStatus | "cancelled";
export type EventMode = "offline" | "online" | "hybrid" | "tbd";
export type RegistrationStatus = "not_open" | "open" | "closed" | "external_only";
export type MediaType = "image" | "video" | "document";

export const EVENT_CATEGORIES = [
  "Natal",
  "Paskah",
  "Ibadah Rutin",
  "Persekutuan",
  "Retreat",
  "Pelayanan",
  "Aksi Sosial",
  "Lainnya",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export type AdminUser = {
  id: string;
  email: string;
  role: AdminRole;
  display_name: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export type EventRow = {
  id: string;
  title: string;
  slug: string;
  category: EventCategory;
  summary: string | null;
  description: string | null;
  cover_image_url: string | null;
  start_at: string | null;
  end_at: string | null;
  location: string | null;
  event_mode: EventMode;
  registration_url: string | null;
  registration_open_at: string | null;
  registration_close_at: string | null;
  registration_status: RegistrationStatus;
  cost_info: string | null;
  dress_code: string | null;
  participant_rules: string | null;
  contact_info: string | null;
  resource_url: string | null;
  is_featured: boolean;
  status: EventStatus;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export type MediaItemRow = {
  id: string;
  event_id: string | null;
  title: string | null;
  caption: string | null;
  alt_text: string;
  media_url: string;
  media_type: MediaType;
  taken_at: string | null;
  status: ContentStatus;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type NewsPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  cover_image_url: string | null;
  event_id: string | null;
  status: ContentStatus;
  published_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string | null;
  starts_at: string | null;
  ends_at: string | null;
  priority: number;
  status: ContentStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SiteSettingRow = {
  id: string;
  key: string;
  value: string | null;
  updated_by: string | null;
  updated_at: string;
}

/**
 * Pengaturan situs sebagai peta key → value.
 *
 * Didefinisikan di sini (bukan di lib/data/public.ts yang "server-only")
 * agar Client Component dapat mengimpor tipenya tanpa menyentuh modul server.
 */
export type SiteSettings = Record<string, string>
