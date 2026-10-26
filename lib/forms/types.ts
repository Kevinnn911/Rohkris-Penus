/**
 * Tipe formulir internal (pengganti Google Form).
 *
 * Modul ini murni (tanpa "server-only") agar dipakai bersama oleh builder
 * admin, formulir publik, aksi server, dan unit test.
 *
 * Definisi formulir disimpan sebagai satu dokumen JSON di
 * event_forms.definition. Semua id stabil (lihat lib/forms/ids.ts) sehingga
 * jawaban tetap terhubung walau judul pertanyaan/opsi diubah.
 */

/** Versi format dokumen definisi — naikkan bila bentuknya berubah tidak kompatibel. */
export const FORM_SCHEMA_VERSION = 1 as const;

/**
 * Tujuan setelah sebuah bagian selesai:
 *  - "next"   → bagian berikutnya sesuai urutan
 *  - "submit" → langsung ke halaman kirim
 *  - id bagian → lompat ke bagian itu (HANYA ke bagian sesudahnya; lompat
 *    mundur ditolak validasi agar tidak pernah terjadi siklus)
 */
export type FormTarget = "next" | "submit" | (string & {});

export type FormOption = {
  id: string;
  label: string;
  /** Lompat bagian saat opsi ini dipilih (hanya berlaku bila pertanyaan `branching`). */
  goTo?: FormTarget;
};

export type GridLine = { id: string; label: string };

type QuestionBase = {
  id: string;
  title: string;
  description?: string;
  required: boolean;
};

export type ShortTextValidation =
  | { type: "email" }
  | { type: "phone" }
  | { type: "number"; min?: number; max?: number; integer?: boolean }
  | { type: "length"; min?: number; max?: number };

export type ShortTextQuestion = QuestionBase & {
  kind: "short_text";
  validation?: ShortTextValidation;
};

export type ParagraphQuestion = QuestionBase & {
  kind: "paragraph";
  minLength?: number;
  /** Maks 10000; bawaan 5000. */
  maxLength?: number;
};

export type MultipleChoiceQuestion = QuestionBase & {
  kind: "multiple_choice";
  options: FormOption[];
  /** Tampilkan opsi "Lainnya" dengan isian bebas. */
  other: boolean;
  /** Tujuan lompat bila "Lainnya" dipilih. */
  otherGoTo?: FormTarget;
  /** Aktifkan "lompat ke bagian berdasarkan jawaban". */
  branching: boolean;
};

export type DropdownQuestion = QuestionBase & {
  kind: "dropdown";
  options: FormOption[];
  branching: boolean;
};

export type CheckboxesQuestion = QuestionBase & {
  kind: "checkboxes";
  options: FormOption[];
  other: boolean;
  minSelected?: number;
  maxSelected?: number;
};

export type LinearScaleQuestion = QuestionBase & {
  kind: "linear_scale";
  min: 0 | 1;
  /** 2 sampai 10. */
  max: number;
  minLabel?: string;
  maxLabel?: string;
};

/** Kisi pilihan ganda: tiap baris satu kolom. Wajib ⇒ semua baris dijawab. */
export type McGridQuestion = QuestionBase & {
  kind: "mc_grid";
  rows: GridLine[];
  columns: GridLine[];
};

/** Kisi kotak centang: tiap baris boleh banyak kolom. Wajib ⇒ tiap baris ≥ 1. */
export type CheckboxGridQuestion = QuestionBase & {
  kind: "checkbox_grid";
  rows: GridLine[];
  columns: GridLine[];
};

export type DateQuestion = QuestionBase & {
  kind: "date";
  /** "YYYY-MM-DD" */
  min?: string;
  max?: string;
};

export type TimeQuestion = QuestionBase & { kind: "time" };

export const FILE_KINDS = ["image", "pdf", "document", "spreadsheet", "presentation"] as const;
export type FileKind = (typeof FILE_KINDS)[number];

export type FileUploadQuestion = QuestionBase & {
  kind: "file_upload";
  accept: FileKind[];
  /** 1 sampai 3. */
  maxFiles: number;
  /** 1 sampai 5 (MB per berkas). */
  maxSizeMb: number;
};

export type Question =
  | ShortTextQuestion
  | ParagraphQuestion
  | MultipleChoiceQuestion
  | DropdownQuestion
  | CheckboxesQuestion
  | LinearScaleQuestion
  | McGridQuestion
  | CheckboxGridQuestion
  | DateQuestion
  | TimeQuestion
  | FileUploadQuestion;

export type QuestionKind = Question["kind"];

/** Blok judul/deskripsi tanpa jawaban. */
export type TextBlock = {
  kind: "text";
  id: string;
  title: string;
  description?: string;
};

export type FormItem = TextBlock | Question;

export type FormSection = {
  id: string;
  title: string;
  description?: string;
  /** Tujuan setelah bagian ini (bawaan "next"). Bisa ditimpa oleh opsi bercabang. */
  next?: FormTarget;
  items: FormItem[];
};

export type FormDefinition = {
  schemaVersion: typeof FORM_SCHEMA_VERSION;
  /** Teks pembuka di atas formulir. */
  intro?: string;
  sections: FormSection[];
};

/** Pengaturan formulir (kolom event_forms, bukan bagian dari definisi). */
export type FormSettings = {
  quota: number | null;
  collectEmail: boolean;
  limitOnePerEmail: boolean;
  allowEdit: boolean;
  sendConfirmation: boolean;
  confirmationMessage: string | null;
  consentText: string | null;
};

// ---------------------------------------------------------------------------
// Jawaban
// ---------------------------------------------------------------------------

/** Pilihan tunggal: id opsi, atau isian "Lainnya". */
export type ChoiceAnswer = { c: string } | { other: string };
export type CheckboxesAnswer = { c: string[]; other?: string };
/** Kisi pilihan ganda: id baris → id kolom. */
export type McGridAnswer = Record<string, string>;
/** Kisi kotak centang: id baris → id kolom[]. */
export type CheckboxGridAnswer = Record<string, string[]>;

/**
 * Nilai jawaban per tipe:
 *  short_text, paragraph, date ("YYYY-MM-DD"), time ("HH:MM") → string
 *  multiple_choice, dropdown → ChoiceAnswer (dropdown tanpa "Lainnya")
 *  checkboxes → CheckboxesAnswer
 *  linear_scale → number
 *  mc_grid → McGridAnswer; checkbox_grid → CheckboxGridAnswer
 *  file_upload → string[] (id berkas yang ditetapkan server)
 */
export type AnswerValue =
  | string
  | number
  | string[]
  | ChoiceAnswer
  | CheckboxesAnswer
  | McGridAnswer
  | CheckboxGridAnswer;

/** Jawaban berkunci id pertanyaan. */
export type Answers = Record<string, AnswerValue>;

/** Jawaban yang disimpan: hanya pertanyaan di jalur + urutan bagian yang dilalui. */
export type StoredAnswers = Answers & { _path?: string[] };

// ---------------------------------------------------------------------------
// Batas global
// ---------------------------------------------------------------------------

export const FORM_LIMITS = {
  maxSections: 30,
  maxItems: 100,
  maxOptions: 50,
  maxGridLines: 20,
  titleMax: 500,
  descriptionMax: 2000,
  optionLabelMax: 300,
  shortTextMax: 500,
  paragraphDefaultMax: 5000,
  paragraphMax: 10000,
  otherMax: 500,
  definitionMaxBytes: 256 * 1024,
  fileMaxBytes: 5 * 1024 * 1024,
  /** Total semua berkas dalam satu kiriman (bodySizeLimit server action = 6 MB). */
  submissionFilesMaxBytes: 5 * 1024 * 1024,
  maxFilesPerQuestion: 3,
  emailMax: 254,
  confirmationMessageMax: 2000,
  consentTextMax: 1000,
  quotaMax: 100000,
} as const;

/** Pertanyaan = item selain blok teks. */
export function isQuestion(item: FormItem): item is Question {
  return item.kind !== "text";
}

/** Semua pertanyaan dalam urutan tampil. */
export function allQuestions(def: FormDefinition): Question[] {
  return def.sections.flatMap((section) => section.items.filter(isQuestion));
}
