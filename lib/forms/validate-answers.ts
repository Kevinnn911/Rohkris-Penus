/**
 * Validasi & normalisasi jawaban formulir.
 *
 * Server memanggil `validateSubmission` dengan jawaban mentah dari klien:
 *  1. jalur bagian dihitung ULANG dari jawaban (klien tidak dipercaya),
 *  2. hanya pertanyaan di jalur yang divalidasi & disimpan,
 *  3. jawaban di luar jalur / untuk id tak dikenal dibuang.
 *
 * Formulir publik memakai `validateSection` untuk umpan balik per bagian
 * sebelum tombol "Berikutnya". Unggahan berkas divalidasi terpisah
 * (lib/forms/files.ts); di sini hanya jumlah berkas yang diperiksa lewat
 * `fileCounts`.
 */

import { computePath, questionIdsOnPath } from "@/lib/forms/branching";
import {
  FORM_LIMITS,
  type AnswerValue,
  type Answers,
  type CheckboxesAnswer,
  type ChoiceAnswer,
  type FormDefinition,
  type FormSection,
  type Question,
  type StoredAnswers,
  isQuestion,
} from "@/lib/forms/types";

export type AnswerErrors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Nomor telepon/WhatsApp Indonesia atau internasional yang wajar. */
const TELEPON = /^\+?[0-9][0-9\s-]{6,18}[0-9]$/;
const TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const JAM = /^([01]\d|2[0-3]):[0-5]\d$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function tanggalValid(value: string): boolean {
  if (!TANGGAL.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return value.length <= FORM_LIMITS.emailMax && EMAIL.test(value);
}

type Hasil = { value?: AnswerValue; error?: string };

/** Teks: trim; string kosong = tidak dijawab. */
function teks(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const v = raw.replace(/\r\n/g, "\n").trim();
  return v === "" ? undefined : v;
}

/**
 * Memeriksa satu jawaban. `fileCount` dipakai untuk pertanyaan unggah berkas
 * (jumlah berkas yang benar-benar diterima server).
 */
export function validateAnswer(q: Question, raw: unknown, fileCount = 0): Hasil {
  const wajib = (kosong: boolean): Hasil | null =>
    kosong ? (q.required ? { error: "Pertanyaan ini wajib diisi." } : {}) : null;

  switch (q.kind) {
    case "short_text": {
      const v = teks(raw);
      const k = wajib(v === undefined);
      if (k) return k;
      const s = v!;
      if (s.length > FORM_LIMITS.shortTextMax) return { error: `Maksimal ${FORM_LIMITS.shortTextMax} karakter.` };
      const val = q.validation;
      if (val?.type === "email" && !isValidEmail(s)) return { error: "Masukkan alamat email yang valid." };
      if (val?.type === "phone" && !TELEPON.test(s)) return { error: "Masukkan nomor telepon yang valid." };
      if (val?.type === "number") {
        const n = Number(s.replace(",", "."));
        if (!Number.isFinite(n)) return { error: "Masukkan angka." };
        if (val.integer && !Number.isInteger(n)) return { error: "Masukkan bilangan bulat." };
        if (val.min !== undefined && n < val.min) return { error: `Minimal ${val.min}.` };
        if (val.max !== undefined && n > val.max) return { error: `Maksimal ${val.max}.` };
      }
      if (val?.type === "length") {
        if (val.min !== undefined && s.length < val.min) return { error: `Minimal ${val.min} karakter.` };
        if (val.max !== undefined && s.length > val.max) return { error: `Maksimal ${val.max} karakter.` };
      }
      return { value: s };
    }

    case "paragraph": {
      const v = teks(raw);
      const k = wajib(v === undefined);
      if (k) return k;
      const maks = q.maxLength ?? FORM_LIMITS.paragraphDefaultMax;
      if (v!.length > maks) return { error: `Maksimal ${maks} karakter.` };
      if (q.minLength !== undefined && v!.length < q.minLength) return { error: `Minimal ${q.minLength} karakter.` };
      return { value: v! };
    }

    case "multiple_choice":
    case "dropdown": {
      if (!isRecord(raw)) return wajib(true)!;
      if (typeof raw.c === "string") {
        if (!q.options.some((o) => o.id === raw.c)) return { error: "Pilihan tidak valid." };
        return { value: { c: raw.c } satisfies ChoiceAnswer };
      }
      if (q.kind === "multiple_choice" && q.other && "other" in raw) {
        const o = teks(raw.other);
        if (o === undefined) return { error: "Isi kolom “Lainnya”." };
        if (o.length > FORM_LIMITS.otherMax) return { error: `Maksimal ${FORM_LIMITS.otherMax} karakter.` };
        return { value: { other: o } satisfies ChoiceAnswer };
      }
      return wajib(true)!;
    }

    case "checkboxes": {
      const pilihan = isRecord(raw) && Array.isArray(raw.c) ? raw.c.filter((x): x is string => typeof x === "string") : [];
      const unik = [...new Set(pilihan)];
      if (unik.some((id) => !q.options.some((o) => o.id === id))) return { error: "Pilihan tidak valid." };
      const lain = q.other && isRecord(raw) ? teks(raw.other) : undefined;
      if (lain !== undefined && lain.length > FORM_LIMITS.otherMax) {
        return { error: `Maksimal ${FORM_LIMITS.otherMax} karakter.` };
      }
      const jumlah = unik.length + (lain !== undefined ? 1 : 0);
      const k = wajib(jumlah === 0);
      if (k) return k;
      if (q.minSelected !== undefined && jumlah < q.minSelected) return { error: `Pilih minimal ${q.minSelected}.` };
      if (q.maxSelected !== undefined && jumlah > q.maxSelected) return { error: `Pilih maksimal ${q.maxSelected}.` };
      // Urutkan sesuai urutan opsi agar tampilan & CSV konsisten.
      const urut = q.options.filter((o) => unik.includes(o.id)).map((o) => o.id);
      const value: CheckboxesAnswer = lain !== undefined ? { c: urut, other: lain } : { c: urut };
      return { value };
    }

    case "linear_scale": {
      if (raw === undefined || raw === null || raw === "") return wajib(true)!;
      const n = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isInteger(n) || n < q.min || n > q.max) return { error: "Pilihan tidak valid." };
      return { value: n };
    }

    case "mc_grid": {
      const v = isRecord(raw) ? raw : {};
      const hasil: Record<string, string> = {};
      for (const row of q.rows) {
        const col = v[row.id];
        if (typeof col !== "string") continue;
        if (!q.columns.some((c) => c.id === col)) return { error: "Pilihan tidak valid." };
        hasil[row.id] = col;
      }
      const terisi = Object.keys(hasil).length;
      if (terisi === 0) return wajib(true)!;
      if (q.required && terisi < q.rows.length) return { error: "Jawab setiap baris." };
      return { value: hasil };
    }

    case "checkbox_grid": {
      const v = isRecord(raw) ? raw : {};
      const hasil: Record<string, string[]> = {};
      for (const row of q.rows) {
        const cols = v[row.id];
        if (!Array.isArray(cols)) continue;
        const unik = [...new Set(cols.filter((x): x is string => typeof x === "string"))];
        if (unik.some((id) => !q.columns.some((c) => c.id === id))) return { error: "Pilihan tidak valid." };
        const urut = q.columns.filter((c) => unik.includes(c.id)).map((c) => c.id);
        if (urut.length > 0) hasil[row.id] = urut;
      }
      const terisi = Object.keys(hasil).length;
      if (terisi === 0) return wajib(true)!;
      if (q.required && terisi < q.rows.length) return { error: "Pilih minimal satu di setiap baris." };
      return { value: hasil };
    }

    case "date": {
      const v = teks(raw);
      const k = wajib(v === undefined);
      if (k) return k;
      if (!tanggalValid(v!)) return { error: "Tanggal tidak valid." };
      if (q.min && v! < q.min) return { error: "Tanggal terlalu awal." };
      if (q.max && v! > q.max) return { error: "Tanggal terlalu akhir." };
      return { value: v! };
    }

    case "time": {
      const v = teks(raw);
      const k = wajib(v === undefined);
      if (k) return k;
      if (!JAM.test(v!)) return { error: "Waktu tidak valid." };
      return { value: v! };
    }

    case "file_upload": {
      const k = wajib(fileCount === 0);
      if (k) return k;
      if (fileCount > q.maxFiles) return { error: `Maksimal ${q.maxFiles} berkas.` };
      // Nilai (id berkas) ditetapkan server setelah berkas disimpan.
      return {};
    }
  }
}

/** Validasi satu bagian (umpan balik klien sebelum "Berikutnya"). */
export function validateSection(
  section: FormSection,
  answers: Answers,
  fileCounts: Record<string, number> = {},
): AnswerErrors {
  const errors: AnswerErrors = {};
  for (const item of section.items) {
    if (!isQuestion(item)) continue;
    const r = validateAnswer(item, answers[item.id], fileCounts[item.id] ?? 0);
    if (r.error) errors[item.id] = r.error;
  }
  return errors;
}

export type SubmissionResult =
  | { ok: true; answers: StoredAnswers; path: string[]; fileQuestionIds: string[] }
  | { ok: false; errors: AnswerErrors; path: string[] };

/**
 * Validasi seluruh kiriman. Jawaban yang lolos dinormalisasi; pertanyaan di
 * luar jalur dibuang. `fileQuestionIds` = pertanyaan unggah berkas di jalur
 * yang memiliki berkas (server menyimpan berkas hanya untuk id ini).
 */
export function validateSubmission(
  def: FormDefinition,
  rawAnswers: unknown,
  fileCounts: Record<string, number> = {},
): SubmissionResult {
  const answers: Answers = isRecord(rawAnswers) ? (rawAnswers as Answers) : {};
  const path = computePath(def, answers);
  const dilalui = questionIdsOnPath(def, path);

  const hasil: StoredAnswers = {};
  const errors: AnswerErrors = {};
  const fileQuestionIds: string[] = [];

  for (const section of def.sections) {
    for (const item of section.items) {
      if (!isQuestion(item) || !dilalui.has(item.id)) continue;
      const r = validateAnswer(item, answers[item.id], fileCounts[item.id] ?? 0);
      if (r.error) errors[item.id] = r.error;
      else if (r.value !== undefined) hasil[item.id] = r.value;
      if (item.kind === "file_upload" && (fileCounts[item.id] ?? 0) > 0) fileQuestionIds.push(item.id);
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors, path };
  hasil._path = path;
  return { ok: true, answers: hasil, path, fileQuestionIds };
}
