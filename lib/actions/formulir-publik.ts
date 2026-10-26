"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";

import { execute, newId, nowDb, queryOne, transaction } from "@/lib/db";
import type { EventFormRow, EventRow } from "@/lib/db/types";
import { cariResponsDariToken, readDefinition, summaryFromRow } from "@/lib/data/forms";
import { getSiteSettings } from "@/lib/data/public";
import { isEmailConfigured, sendEmail } from "@/lib/email/mailer";
import { getAdminSecretKey, getSiteUrl } from "@/lib/env";
import { canEditResponse, getRegistrationState } from "@/lib/events/status";
import { buildConfirmationEmail } from "@/lib/forms/email-template";
import { detectFileType, sanitizeOriginalName } from "@/lib/forms/files";
import {
  EMAIL_PER_ADDRESS_PER_DAY,
  countEmailsTo,
  getFormClientIp,
  getUserAgent,
  isRateLimited,
  recordRateEvent,
} from "@/lib/forms/rate-limit";
import { hapusBerkasFormulir, simpanBerkasFormulir, storageKey } from "@/lib/forms/storage";
import {
  deriveFormSecret,
  hashEditToken,
  newEditToken,
  verifyFormToken,
} from "@/lib/forms/token";
import { FORM_LIMITS, allQuestions, type FormDefinition, type FileUploadQuestion, type StoredAnswers } from "@/lib/forms/types";
import { isValidEmail, normalizeEmail, validateSubmission } from "@/lib/forms/validate-answers";

/**
 * Server Action formulir internal PUBLIK (tanpa login).
 *
 * Pertahanan berlapis:
 *  - honeypot + token waktu render (bot yang mengirim < 3 detik ditolak)
 *  - pembatas laju per IP (longgar — satu sekolah sering berbagi satu IP)
 *  - jalur & jawaban divalidasi ulang di server (lib/forms/validate-answers)
 *  - kuota & "satu respons per email" dijaga di transaksi yang mengunci
 *    baris event_forms, sehingga dua kiriman bersamaan tidak bisa sama-sama
 *    lolos ketika sisa kuota tinggal satu
 *  - berkas disimpan di folder privat, jenisnya dideteksi dari isi berkas
 */

export type KirimFormulirResult =
  | {
      ok: true;
      message: string;
      /** Tautan ubah jawaban (relatif), bila diizinkan. Hanya ditampilkan sekali. */
      editPath: string | null;
      emailQueued: boolean;
    }
  | {
      ok: false;
      message: string;
      errors?: Record<string, string>;
      /** Definisi berubah sejak halaman dibuka → klien perlu memuat ulang. */
      reload?: boolean;
    };

type Konteks = {
  event: EventRow;
  form: EventFormRow;
  definition: FormDefinition;
};

async function muatKonteks(eventId: string): Promise<Konteks | null> {
  const event = await queryOne<EventRow>("SELECT * FROM events WHERE id = ? AND status = 'published'", [eventId]);
  if (!event || event.registration_mode !== "internal") return null;
  const form = await queryOne<EventFormRow>("SELECT * FROM event_forms WHERE event_id = ?", [eventId]);
  if (!form) return null;
  const definition = readDefinition(form.definition);
  if (!definition) return null;
  return { event, form, definition };
}

function pesanStatus(event: EventRow, form: EventFormRow): string | null {
  const state = getRegistrationState({ ...event, form: summaryFromRow(form) });
  switch (state) {
    case "daftar_terbuka":
      return null;
    case "kuota_penuh":
      return "Maaf, kuota peserta sudah penuh.";
    case "segera_dibuka":
      return "Pendaftaran belum dibuka.";
    default:
      return "Pendaftaran untuk kegiatan ini sudah ditutup.";
  }
}

type BerkasMasuk = { questionId: string; name: string; bytes: Uint8Array; mime: string };

/**
 * Membaca & memeriksa berkas dari FormData ("file:<questionId>").
 * Mengembalikan galat per pertanyaan bila jenis/ukuran tidak sesuai.
 */
async function bacaBerkas(
  formData: FormData,
  definition: FormDefinition,
): Promise<{ files: BerkasMasuk[]; counts: Record<string, number>; errors: Record<string, string> }> {
  const files: BerkasMasuk[] = [];
  const counts: Record<string, number> = {};
  const errors: Record<string, string> = {};
  let total = 0;

  const pertanyaanBerkas = allQuestions(definition).filter((q): q is FileUploadQuestion => q.kind === "file_upload");
  for (const q of pertanyaanBerkas) {
    const entri = formData.getAll(`file:${q.id}`).filter((v): v is File => typeof v !== "string" && v.size > 0);
    counts[q.id] = entri.length;
    if (entri.length > q.maxFiles) {
      errors[q.id] = `Maksimal ${q.maxFiles} berkas.`;
      continue;
    }
    for (const file of entri) {
      if (file.size > q.maxSizeMb * 1024 * 1024) {
        errors[q.id] = `Ukuran setiap berkas maksimal ${q.maxSizeMb} MB.`;
        break;
      }
      total += file.size;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const jenis = detectFileType(bytes, file.name);
      if (!jenis || !q.accept.includes(jenis.kind)) {
        errors[q.id] = "Jenis berkas tidak diizinkan untuk pertanyaan ini.";
        break;
      }
      files.push({ questionId: q.id, name: sanitizeOriginalName(file.name), bytes, mime: jenis.mime });
    }
  }
  if (total > FORM_LIMITS.submissionFilesMaxBytes) {
    const id = pertanyaanBerkas.find((q) => (counts[q.id] ?? 0) > 0)?.id ?? "_form";
    errors[id] = `Total ukuran berkas maksimal ${FORM_LIMITS.submissionFilesMaxBytes / (1024 * 1024)} MB per kiriman.`;
  }
  return { files, counts, errors };
}

function parseJawaban(formData: FormData): unknown {
  const raw = formData.get("answers");
  if (typeof raw !== "string" || raw.length > 512 * 1024) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Menjadwalkan email konfirmasi setelah respons terkirim (best effort). */
function jadwalkanEmail(opts: {
  responseId: string;
  formId: string;
  ip: string;
  to: string;
  emailNorm: string;
  event: EventRow;
  form: EventFormRow;
  definition: FormDefinition;
  answers: StoredAnswers;
  files: Map<string, { id: string; name: string }>;
  editPath: string | null;
  edited: boolean;
}) {
  after(async () => {
    let terkirim = false;
    try {
      if ((await countEmailsTo(opts.emailNorm)) < EMAIL_PER_ADDRESS_PER_DAY) {
        const settings = await getSiteSettings();
        const isi = buildConfirmationEmail({
          siteName: settings.site_name ?? "Rohkris SMK Plus Pelita Nusantara",
          eventTitle: opts.event.title,
          definition: opts.definition,
          answers: opts.answers,
          files: opts.files,
          editUrl: opts.editPath ? `${getSiteUrl()}${opts.editPath}` : null,
          confirmationMessage: opts.form.confirmation_message,
          edited: opts.edited,
        });
        terkirim = await sendEmail({ to: opts.to, ...isi, replyTo: settings.contact_email ?? null });
        await recordRateEvent(opts.formId, "email", opts.ip, opts.emailNorm);
      }
    } catch (error) {
      console.error("Email konfirmasi gagal:", (error as Error).message);
    }
    try {
      await execute(
        "UPDATE form_responses SET email_status = ?, email_sent_at = ? WHERE id = ?",
        [terkirim ? "sent" : "failed", terkirim ? nowDb() : null, opts.responseId],
      );
    } catch (error) {
      console.error("Gagal mencatat status email:", (error as Error).message);
    }
  });
}

/**
 * Saat kiriman membuat kuota penuh, halaman publik ber-ISR (detail kegiatan,
 * daftar, jadwal, beranda) perlu menampilkan "Kuota Penuh".
 *
 * Dijalankan di after(): revalidatePath yang dipanggil langsung di Server
 * Action ikut menyegarkan halaman yang SEDANG dibuka peserta, sehingga peserta
 * yang baru berhasil mendaftar justru melihat "Kuota Penuh" alih-alih layar
 * terima kasih. Halaman /daftar & panel admin sudah dinamis, jadi tidak perlu
 * direvalidasi.
 */
function revalidateBilaPenuh(event: EventRow) {
  after(() => {
    revalidatePath(`/kegiatan/${event.slug}`);
    revalidatePath("/kegiatan");
    revalidatePath("/jadwal");
    revalidatePath("/", "page");
  });
}

export async function kirimFormulir(eventId: string, formData: FormData): Promise<KirimFormulirResult> {
  // Honeypot: kolom tersembunyi yang hanya diisi bot.
  if (String(formData.get("website") ?? "") !== "") {
    return { ok: false, message: "Kiriman ditolak." };
  }

  const ctx = await muatKonteks(eventId);
  if (!ctx) return { ok: false, message: "Formulir tidak ditemukan." };
  const { event, form, definition } = ctx;

  const secret = getAdminSecretKey();
  if (!secret) {
    console.error("ADMIN_SECRET_KEY belum diisi — formulir internal tidak bisa menerima kiriman.");
    return { ok: false, message: "Formulir sedang tidak dapat menerima kiriman. Hubungi pengurus." };
  }
  const token = verifyFormToken(deriveFormSecret(secret), String(formData.get("token") ?? ""), form.id, Date.now());
  if (!token.ok) {
    if (token.reason === "too_fast") return { ok: false, message: "Kiriman terlalu cepat. Tunggu sebentar lalu coba lagi." };
    return { ok: false, reload: true, message: "Sesi formulir kedaluwarsa. Muat ulang halaman lalu kirim kembali." };
  }
  if (token.version !== form.version) {
    return { ok: false, reload: true, message: "Formulir baru saja diperbarui panitia. Muat ulang halaman lalu periksa jawaban Anda." };
  }

  const ip = await getFormClientIp();
  if (await isRateLimited(form.id, "submit", ip)) {
    return { ok: false, message: "Terlalu banyak kiriman dari jaringan ini. Coba lagi beberapa menit lagi." };
  }

  const tertutup = pesanStatus(event, form);
  if (tertutup) return { ok: false, message: tertutup };

  // Email responden & persetujuan (pengaturan formulir, bukan pertanyaan).
  const errors: Record<string, string> = {};
  let email: string | null = null;
  if (form.collect_email) {
    const raw = String(formData.get("email") ?? "").trim();
    if (!raw) errors._email = "Alamat email wajib diisi.";
    else if (!isValidEmail(raw)) errors._email = "Masukkan alamat email yang valid.";
    else email = raw;
  }
  if (form.consent_text && formData.get("consent") !== "on") {
    errors._consent = "Centang persetujuan untuk melanjutkan.";
  }

  const berkas = await bacaBerkas(formData, definition);
  Object.assign(errors, berkas.errors);

  const hasil = validateSubmission(definition, parseJawaban(formData), berkas.counts);
  if (!hasil.ok) Object.assign(errors, hasil.errors);
  if (Object.keys(errors).length > 0 || !hasil.ok) {
    return { ok: false, message: "Periksa kembali isian yang ditandai.", errors };
  }

  // Hanya berkas untuk pertanyaan di jalur yang disimpan.
  const dipakai = new Set(hasil.fileQuestionIds);
  const berkasDisimpan = berkas.files.filter((f) => dipakai.has(f.questionId));

  const responseId = newId();
  const answers: StoredAnswers = { ...hasil.answers };
  const fileRows = berkasDisimpan.map((f) => ({ ...f, id: newId() }));
  for (const f of fileRows) {
    const list = (answers[f.questionId] as string[] | undefined) ?? [];
    answers[f.questionId] = [...list, f.id];
  }

  // Tulis berkas lebih dulu (di luar transaksi); dihapus lagi bila transaksi gagal.
  const kunci = fileRows.map((f) => storageKey(form.id, responseId, f.id));
  try {
    for (const [i, f] of fileRows.entries()) await simpanBerkasFormulir(kunci[i]!, f.bytes);
  } catch (error) {
    console.error("Gagal menyimpan berkas formulir:", (error as Error).message);
    await hapusBerkasFormulir(kunci);
    return { ok: false, message: "Berkas gagal disimpan. Coba lagi beberapa saat lagi." };
  }

  const editToken = form.allow_edit ? newEditToken() : null;
  const emailNorm = email ? normalizeEmail(email) : null;
  const kirimEmail = Boolean(form.send_confirmation && email && isEmailConfigured());

  let hasilTx: { ok: true; penuh: boolean } | { ok: false; message: string; errors?: Record<string, string> };
  try {
    hasilTx = await transaction(async (tx) => {
      const [kunciForm] = await tx.query<EventFormRow>("SELECT * FROM event_forms WHERE id = ? FOR UPDATE", [form.id]);
      if (!kunciForm) return { ok: false, message: "Formulir tidak ditemukan." } as const;
      if (kunciForm.version !== form.version) {
        return { ok: false, message: "Formulir baru saja diperbarui panitia. Muat ulang halaman." } as const;
      }
      const ditutup = pesanStatus(event, kunciForm);
      if (ditutup) return { ok: false, message: ditutup } as const;

      if (kunciForm.limit_one_per_email && emailNorm) {
        const ada = await tx.query<{ id: string }>(
          "SELECT id FROM form_responses WHERE form_id = ? AND email_norm = ? LIMIT 1 FOR UPDATE",
          [form.id, emailNorm],
        );
        if (ada.length > 0) {
          return {
            ok: false,
            message: "Email ini sudah mengirim jawaban untuk formulir ini.",
            errors: { _email: "Email ini sudah terdaftar." },
          } as const;
        }
      }

      await tx.execute(
        `INSERT INTO form_responses
           (id, form_id, form_version, respondent_email, email_norm, dedupe_key, answers, edit_token_hash,
            email_status, ip, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          responseId, form.id, kunciForm.version, email, emailNorm,
          kunciForm.limit_one_per_email ? emailNorm : null,
          JSON.stringify(answers), editToken ? hashEditToken(editToken) : null,
          kirimEmail ? "pending" : "none", ip, await getUserAgent(),
        ],
      );
      for (const [i, f] of fileRows.entries()) {
        await tx.execute(
          `INSERT INTO form_response_files (id, response_id, question_id, storage_key, original_name, mime, size_bytes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [f.id, responseId, f.questionId, kunci[i], f.name, f.mime, f.bytes.byteLength],
        );
      }
      await tx.execute("UPDATE event_forms SET response_count = response_count + 1 WHERE id = ?", [form.id]);

      const penuh = kunciForm.quota !== null && kunciForm.response_count + 1 >= kunciForm.quota;
      return { ok: true, penuh } as const;
    });
  } catch (error) {
    await hapusBerkasFormulir(kunci);
    const e = error as { code?: string; message?: string };
    if (e.code === "ER_DUP_ENTRY") {
      return { ok: false, message: "Email ini sudah mengirim jawaban untuk formulir ini.", errors: { _email: "Email ini sudah terdaftar." } };
    }
    console.error("Gagal menyimpan respons formulir:", e.code ?? "", e.message ?? "");
    return { ok: false, message: "Jawaban gagal disimpan. Coba lagi beberapa saat lagi." };
  }

  if (!hasilTx.ok) {
    await hapusBerkasFormulir(kunci);
    return { ok: false, message: hasilTx.message, errors: hasilTx.errors };
  }

  await recordRateEvent(form.id, "submit", ip).catch(() => undefined);
  if (hasilTx.penuh) revalidateBilaPenuh(event);

  const editPath = editToken ? `/kegiatan/${event.slug}/daftar/ubah/${editToken}` : null;
  if (kirimEmail && email && emailNorm) {
    jadwalkanEmail({
      responseId, formId: form.id, ip, to: email, emailNorm, event, form, definition, answers,
      files: new Map(fileRows.map((f) => [f.id, { id: f.id, name: f.name }])),
      editPath, edited: false,
    });
  }

  return {
    ok: true,
    message: form.confirmation_message || "Jawaban Anda sudah kami terima. Terima kasih!",
    editPath,
    emailQueued: kirimEmail,
  };
}

// ---------------------------------------------------------------------------
// Ubah jawaban lewat tautan rahasia
// ---------------------------------------------------------------------------

export async function ubahJawaban(token: string, formData: FormData): Promise<KirimFormulirResult> {
  if (String(formData.get("website") ?? "") !== "") return { ok: false, message: "Kiriman ditolak." };

  const ditemukan = await cariResponsDariToken(token);
  if (!ditemukan) return { ok: false, message: "Tautan ubah jawaban tidak valid atau responsnya sudah dihapus." };
  const { response } = ditemukan;

  const form = await queryOne<EventFormRow>("SELECT * FROM event_forms WHERE id = ?", [response.form_id]);
  const event = form
    ? await queryOne<EventRow>("SELECT * FROM events WHERE id = ? AND status = 'published'", [form.event_id])
    : null;
  const definition = form ? readDefinition(form.definition) : null;
  if (!form || !event || !definition || !form.allow_edit) {
    return { ok: false, message: "Jawaban untuk formulir ini tidak dapat diubah." };
  }
  if (!canEditResponse({ ...event, form: summaryFromRow(form) })) {
    return { ok: false, message: "Masa pendaftaran sudah berakhir; jawaban tidak dapat diubah lagi." };
  }

  const secret = getAdminSecretKey();
  const cek = secret
    ? verifyFormToken(deriveFormSecret(secret), String(formData.get("token") ?? ""), form.id, Date.now())
    : ({ ok: false, reason: "invalid" } as const);
  if (!cek.ok && cek.reason !== "too_fast") {
    return { ok: false, reload: true, message: "Sesi formulir kedaluwarsa. Muat ulang halaman lalu kirim kembali." };
  }
  if (cek.ok && cek.version !== form.version) {
    return { ok: false, reload: true, message: "Formulir baru saja diperbarui panitia. Muat ulang halaman." };
  }

  const ip = await getFormClientIp();
  if (await isRateLimited(form.id, "edit", ip)) {
    return { ok: false, message: "Terlalu banyak perubahan dari jaringan ini. Coba lagi beberapa menit lagi." };
  }

  const errors: Record<string, string> = {};
  if (form.consent_text && formData.get("consent") !== "on") errors._consent = "Centang persetujuan untuk melanjutkan.";

  // Berkas lama yang dipertahankan: "keep:<questionId>" berisi id berkas.
  const lama = new Map(ditemukan.files.map((f) => [f.id, f]));
  const dipertahankan = new Map<string, string[]>();
  for (const q of allQuestions(definition)) {
    if (q.kind !== "file_upload") continue;
    const ids = formData
      .getAll(`keep:${q.id}`)
      .filter((v): v is string => typeof v === "string" && lama.get(v)?.question_id === q.id);
    dipertahankan.set(q.id, [...new Set(ids)]);
  }

  const berkas = await bacaBerkas(formData, definition);
  Object.assign(errors, berkas.errors);
  const counts: Record<string, number> = {};
  for (const q of allQuestions(definition)) {
    if (q.kind === "file_upload") counts[q.id] = (berkas.counts[q.id] ?? 0) + (dipertahankan.get(q.id)?.length ?? 0);
  }

  const hasil = validateSubmission(definition, parseJawaban(formData), counts);
  if (!hasil.ok) Object.assign(errors, hasil.errors);
  if (Object.keys(errors).length > 0 || !hasil.ok) {
    return { ok: false, message: "Periksa kembali isian yang ditandai.", errors };
  }

  const dipakai = new Set(hasil.fileQuestionIds);
  const answers: StoredAnswers = { ...hasil.answers };
  const tetap = new Set<string>();
  for (const [qid, ids] of dipertahankan) {
    if (!dipakai.has(qid) || ids.length === 0) continue;
    answers[qid] = [...ids];
    ids.forEach((id) => tetap.add(id));
  }
  const baru = berkas.files.filter((f) => dipakai.has(f.questionId)).map((f) => ({ ...f, id: newId() }));
  for (const f of baru) answers[f.questionId] = [...((answers[f.questionId] as string[] | undefined) ?? []), f.id];

  const kunciBaru = baru.map((f) => storageKey(form.id, response.id, f.id));
  try {
    for (const [i, f] of baru.entries()) await simpanBerkasFormulir(kunciBaru[i]!, f.bytes);
  } catch (error) {
    console.error("Gagal menyimpan berkas formulir:", (error as Error).message);
    await hapusBerkasFormulir(kunciBaru);
    return { ok: false, message: "Berkas gagal disimpan. Coba lagi beberapa saat lagi." };
  }

  const dibuang = ditemukan.files.filter((f) => !tetap.has(f.id));
  const kirimEmail = Boolean(form.send_confirmation && response.respondent_email && isEmailConfigured());

  try {
    await transaction(async (tx) => {
      const [kunci] = await tx.query<{ id: string }>("SELECT id FROM form_responses WHERE id = ? FOR UPDATE", [response.id]);
      if (!kunci) throw new Error("RESPONS_HILANG");
      await tx.execute(
        `UPDATE form_responses SET answers = ?, form_version = ?, edited_at = ?, edit_count = edit_count + 1,
            email_status = ? WHERE id = ?`,
        [JSON.stringify(answers), form.version, nowDb(), kirimEmail ? "pending" : response.email_status, response.id],
      );
      if (dibuang.length > 0) {
        await tx.execute(
          `DELETE FROM form_response_files WHERE response_id = ? AND id IN (${dibuang.map(() => "?").join(", ")})`,
          [response.id, ...dibuang.map((f) => f.id)],
        );
      }
      for (const [i, f] of baru.entries()) {
        await tx.execute(
          `INSERT INTO form_response_files (id, response_id, question_id, storage_key, original_name, mime, size_bytes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [f.id, response.id, f.questionId, kunciBaru[i], f.name, f.mime, f.bytes.byteLength],
        );
      }
    });
  } catch (error) {
    await hapusBerkasFormulir(kunciBaru);
    if ((error as Error).message === "RESPONS_HILANG") {
      return { ok: false, message: "Respons ini sudah dihapus panitia." };
    }
    console.error("Gagal mengubah respons formulir:", (error as Error).message);
    return { ok: false, message: "Perubahan gagal disimpan. Coba lagi beberapa saat lagi." };
  }

  await hapusBerkasFormulir(dibuang.map((f) => f.storage_key));
  await recordRateEvent(form.id, "edit", ip).catch(() => undefined);

  if (kirimEmail && response.respondent_email && response.email_norm) {
    const namaBerkas = new Map<string, { id: string; name: string }>();
    for (const f of ditemukan.files) if (tetap.has(f.id)) namaBerkas.set(f.id, { id: f.id, name: f.original_name });
    for (const f of baru) namaBerkas.set(f.id, { id: f.id, name: f.name });
    jadwalkanEmail({
      responseId: response.id, formId: form.id, ip, to: response.respondent_email, emailNorm: response.email_norm,
      event, form, definition, answers, files: namaBerkas,
      editPath: `/kegiatan/${event.slug}/daftar/ubah/${token}`, edited: true,
    });
  }

  return {
    ok: true,
    message: "Perubahan jawaban Anda sudah disimpan.",
    editPath: `/kegiatan/${event.slug}/daftar/ubah/${token}`,
    emailQueued: kirimEmail,
  };
}
