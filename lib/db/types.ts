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
/** Sumber formulir pendaftaran: tautan luar (Google Form) atau formulir internal. */
export type RegistrationMode = "external" | "internal";
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
  registration_mode: RegistrationMode;
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

export type FormEmailStatus = "none" | "pending" | "sent" | "failed";

/** Satu formulir internal per kegiatan. `definition` adalah JSON (lihat lib/forms/types.ts). */
export type EventFormRow = {
  id: string;
  event_id: string;
  definition: string;
  definition_hash: string;
  version: number;
  revision: number;
  question_count: number;
  response_count: number;
  quota: number | null;
  collect_email: boolean;
  limit_one_per_email: boolean;
  allow_edit: boolean;
  send_confirmation: boolean;
  confirmation_message: string | null;
  consent_text: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EventFormVersionRow = {
  form_id: string;
  version: number;
  definition: string;
  created_by: string | null;
  created_at: string;
};

/** Jawaban peserta. `answers` adalah JSON berkunci id pertanyaan. */
export type FormResponseRow = {
  id: string;
  form_id: string;
  form_version: number;
  respondent_email: string | null;
  email_norm: string | null;
  dedupe_key: string | null;
  answers: string;
  edit_token_hash: string | null;
  edit_count: number;
  email_status: FormEmailStatus;
  email_sent_at: string | null;
  ip: string | null;
  user_agent: string | null;
  submitted_at: string;
  edited_at: string | null;
};

export type FormResponseFileRow = {
  id: string;
  response_id: string;
  question_id: string;
  storage_key: string;
  original_name: string;
  mime: string;
  size_bytes: number;
  created_at: string;
};

/**
 * Kegiatan + ringkasan formulir internalnya (dilampirkan lapisan data untuk
 * kegiatan bermode internal; null bila belum dibuat / mode eksternal).
 */
export type EventWithForm = EventRow & {
  form?: { questionCount: number; quota: number | null; responseCount: number } | null;
};
