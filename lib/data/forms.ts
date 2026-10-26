import "server-only";

import { query, queryOne } from "@/lib/db";
import type {
  EventFormRow,
  EventFormVersionRow,
  EventRow,
  FormResponseFileRow,
  FormResponseRow,
} from "@/lib/db/types";
import { getAdminSecretKey, isDatabaseConfigured } from "@/lib/env";
import { EDIT_TOKEN_PATTERN, deriveFormSecret, hashEditToken, signFormToken } from "@/lib/forms/token";
import { parseDefinition } from "@/lib/forms/definition-schema";
import type { InternalFormSummary } from "@/lib/events/status";
import type { FormDefinition, FormSettings, StoredAnswers } from "@/lib/forms/types";

/**
 * Query formulir internal.
 *
 * Fungsi "admin" WAJIB dipanggil setelah requireAdmin()/requireAdminForAction().
 * Fungsi publik hanya mengembalikan formulir milik kegiatan yang sudah
 * published (diperiksa pemanggil lewat getEventBySlug).
 */

/** Definisi dari kolom JSON. Definisi rusak dianggap tidak ada (dicatat di log). */
export function readDefinition(raw: string | null | undefined): FormDefinition | null {
  if (!raw) return null;
  try {
    const hasil = parseDefinition(JSON.parse(raw));
    if (hasil.ok) return hasil.definition;
    console.error("Definisi formulir tidak valid:", hasil.issues[0]?.message);
  } catch (error) {
    console.error("Definisi formulir rusak:", (error as Error).message);
  }
  return null;
}

/** Jawaban tersimpan (JSON). Nilai rusak → objek kosong agar tampilan tidak crash. */
export function readAnswers(raw: string | null | undefined): StoredAnswers {
  if (!raw) return {};
  try {
    const v: unknown = JSON.parse(raw);
    return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as StoredAnswers) : {};
  } catch {
    return {};
  }
}

export function settingsFromRow(row: EventFormRow): FormSettings {
  return {
    quota: row.quota,
    collectEmail: row.collect_email,
    limitOnePerEmail: row.limit_one_per_email,
    allowEdit: row.allow_edit,
    sendConfirmation: row.send_confirmation,
    confirmationMessage: row.confirmation_message,
    consentText: row.consent_text,
  };
}

export function summaryFromRow(row: Pick<EventFormRow, "question_count" | "quota" | "response_count">): InternalFormSummary {
  return { questionCount: row.question_count, quota: row.quota, responseCount: row.response_count };
}

export async function getFormByEventId(eventId: string): Promise<EventFormRow | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    return await queryOne<EventFormRow>("SELECT * FROM event_forms WHERE event_id = ?", [eventId]);
  } catch (error) {
    console.error("Query formulir gagal:", (error as Error).message);
    return null;
  }
}

/**
 * Menempelkan ringkasan formulir internal ke daftar kegiatan (satu query
 * tambahan, hanya untuk kegiatan bermode internal). Kegiatan eksternal tidak
 * disentuh, sehingga tampilan lama tetap bekerja bila tabel belum dimigrasi.
 */
export async function lampirkanFormulir<T extends Pick<EventRow, "id" | "registration_mode">>(
  events: T[],
): Promise<Array<T & { form: InternalFormSummary | null }>> {
  const internal = events.filter((e) => e.registration_mode === "internal").map((e) => e.id);
  const peta = new Map<string, InternalFormSummary>();
  if (internal.length > 0 && isDatabaseConfigured()) {
    try {
      const rows = await query<Pick<EventFormRow, "event_id" | "question_count" | "quota" | "response_count">>(
        `SELECT event_id, question_count, quota, response_count FROM event_forms
          WHERE event_id IN (${internal.map(() => "?").join(", ")})`,
        internal,
      );
      for (const row of rows) peta.set(row.event_id, summaryFromRow(row));
    } catch (error) {
      console.error("Query ringkasan formulir gagal:", (error as Error).message);
    }
  }
  return events.map((e) => ({ ...e, form: peta.get(e.id) ?? null }));
}

/** Satu kegiatan + ringkasan formulirnya. */
export async function lampirkanFormulirSatu<T extends Pick<EventRow, "id" | "registration_mode">>(
  event: T,
): Promise<T & { form: InternalFormSummary | null }> {
  const [hasil] = await lampirkanFormulir([event]);
  return hasil ?? { ...event, form: null };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function getFormVersions(formId: string): Promise<Map<number, FormDefinition>> {
  const rows = await query<EventFormVersionRow>(
    "SELECT form_id, version, definition, created_by, created_at FROM event_form_versions WHERE form_id = ?",
    [formId],
  );
  const peta = new Map<number, FormDefinition>();
  for (const row of rows) {
    const def = readDefinition(row.definition);
    if (def) peta.set(row.version, def);
  }
  return peta;
}

/** Semua respons, terbaru lebih dulu. */
export async function getResponses(formId: string): Promise<FormResponseRow[]> {
  return query<FormResponseRow>(
    "SELECT * FROM form_responses WHERE form_id = ? ORDER BY submitted_at DESC, id DESC",
    [formId],
  );
}

export async function getResponseFiles(formId: string): Promise<FormResponseFileRow[]> {
  return query<FormResponseFileRow>(
    `SELECT f.* FROM form_response_files f
       JOIN form_responses r ON r.id = f.response_id
      WHERE r.form_id = ?
      ORDER BY f.created_at ASC`,
    [formId],
  );
}

/** Berkas milik formulir kegiatan tertentu (untuk route unduh admin). */
export async function getResponseFileForEvent(
  eventId: string,
  fileId: string,
): Promise<FormResponseFileRow | null> {
  return queryOne<FormResponseFileRow>(
    `SELECT f.* FROM form_response_files f
       JOIN form_responses r ON r.id = f.response_id
       JOIN event_forms ef ON ef.id = r.form_id
      WHERE ef.event_id = ? AND f.id = ?`,
    [eventId, fileId],
  );
}

// ---------------------------------------------------------------------------
// Tautan ubah jawaban (publik, berbasis token rahasia)
// ---------------------------------------------------------------------------

/** Mencari respons dari token tautan ubah. Token disimpan sebagai hash sha256. */
export async function cariResponsDariToken(
  token: string,
): Promise<{ response: FormResponseRow; files: FormResponseFileRow[] } | null> {
  if (!EDIT_TOKEN_PATTERN.test(token) || !isDatabaseConfigured()) return null;
  const response = await queryOne<FormResponseRow>("SELECT * FROM form_responses WHERE edit_token_hash = ?", [
    hashEditToken(token),
  ]);
  if (!response) return null;
  const files = await query<FormResponseFileRow>("SELECT * FROM form_response_files WHERE response_id = ?", [
    response.id,
  ]);
  return { response, files };
}

/** Data yang aman dikirim ke halaman ubah (tanpa IP, user agent, atau hash token). */
export type ResponsUntukUbah = {
  formId: string;
  email: string | null;
  answers: StoredAnswers;
  files: Array<{ id: string; questionId: string; name: string; size: number }>;
};

export async function dataUntukUbah(token: string): Promise<ResponsUntukUbah | null> {
  const hasil = await cariResponsDariToken(token);
  if (!hasil) return null;
  return {
    formId: hasil.response.form_id,
    email: hasil.response.respondent_email,
    answers: readAnswers(hasil.response.answers),
    files: hasil.files.map((f) => ({ id: f.id, questionId: f.question_id, name: f.original_name, size: f.size_bytes })),
  };
}

/**
 * Token anti-spam untuk halaman formulir (waktu render ditandatangani).
 * Null bila ADMIN_SECRET_KEY belum diisi — formulir lalu tidak menerima kiriman.
 * `mundurMs` memajukan waktu terbit (dipakai halaman ubah jawaban agar
 * pemeriksaan "terlalu cepat" tidak menghalangi orang yang hanya mengoreksi satu isian).
 */
export function buatTokenFormulir(form: Pick<EventFormRow, "id" | "version">, mundurMs = 0): string | null {
  const secret = getAdminSecretKey();
  if (!secret) return null;
  return signFormToken(deriveFormSecret(secret), form.id, form.version, Date.now() - mundurMs);
}
