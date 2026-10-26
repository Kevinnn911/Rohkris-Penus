/**
 * Validasi dokumen definisi formulir (zod v4).
 *
 * Dipakai builder admin (umpan balik langsung) dan aksi server (penentu).
 * Aturan antar-bagian diperiksa di superRefine:
 *  - semua id unik di seluruh dokumen
 *  - target lompat menunjuk bagian yang ADA dan SESUDAH bagian asal, atau "submit"
 *  - maksimal satu pertanyaan bercabang per bagian (pilihan ganda / dropdown)
 *  - label opsi unik per pertanyaan; min ≤ maks
 */

import { z } from "zod";

import { FORM_ID_PATTERN } from "@/lib/forms/ids";
import {
  FILE_KINDS,
  FORM_LIMITS,
  FORM_SCHEMA_VERSION,
  type FormDefinition,
  type FormItem,
  type FormSettings,
  type FormTarget,
  isQuestion,
} from "@/lib/forms/types";

const id = z.string().regex(FORM_ID_PATTERN, { error: "Id tidak valid." });

const judul = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} wajib diisi.` })
    .max(FORM_LIMITS.titleMax, { error: `${label} maksimal ${FORM_LIMITS.titleMax} karakter.` });

const deskripsi = z
  .string()
  .trim()
  .max(FORM_LIMITS.descriptionMax, { error: `Deskripsi maksimal ${FORM_LIMITS.descriptionMax} karakter.` })
  .optional()
  .transform((value) => (value ? value : undefined));

const target = z.string().min(1).max(16) as z.ZodType<FormTarget>;

const opsi = z.object({
  id,
  label: z
    .string()
    .trim()
    .min(1, { error: "Label opsi wajib diisi." })
    .max(FORM_LIMITS.optionLabelMax, { error: `Label opsi maksimal ${FORM_LIMITS.optionLabelMax} karakter.` }),
  goTo: target.optional(),
});

const daftarOpsi = z
  .array(opsi)
  .min(1, { error: "Tambahkan minimal satu opsi." })
  .max(FORM_LIMITS.maxOptions, { error: `Maksimal ${FORM_LIMITS.maxOptions} opsi.` });

const garisKisi = (label: string) =>
  z
    .array(
      z.object({
        id,
        label: z
          .string()
          .trim()
          .min(1, { error: `Label ${label} wajib diisi.` })
          .max(FORM_LIMITS.optionLabelMax),
      }),
    )
    .min(1, { error: `Tambahkan minimal satu ${label}.` })
    .max(FORM_LIMITS.maxGridLines, { error: `Maksimal ${FORM_LIMITS.maxGridLines} ${label}.` });

const angkaOpsional = z.number().finite().optional();
const bulatOpsional = (min: number, max: number) => z.number().int().min(min).max(max).optional();
const tanggal = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Format tanggal harus YYYY-MM-DD." })
  .optional();

const dasar = {
  id,
  title: judul("Pertanyaan"),
  description: deskripsi,
  required: z.boolean(),
};

const validasiTeksSingkat = z.discriminatedUnion("type", [
  z.object({ type: z.literal("email") }),
  z.object({ type: z.literal("phone") }),
  z.object({
    type: z.literal("number"),
    min: angkaOpsional,
    max: angkaOpsional,
    integer: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("length"),
    min: bulatOpsional(0, FORM_LIMITS.shortTextMax),
    max: bulatOpsional(1, FORM_LIMITS.shortTextMax),
  }),
]);

const pertanyaan = z.discriminatedUnion("kind", [
  z.object({ ...dasar, kind: z.literal("short_text"), validation: validasiTeksSingkat.optional() }),
  z.object({
    ...dasar,
    kind: z.literal("paragraph"),
    minLength: bulatOpsional(0, FORM_LIMITS.paragraphMax),
    maxLength: bulatOpsional(1, FORM_LIMITS.paragraphMax),
  }),
  z.object({
    ...dasar,
    kind: z.literal("multiple_choice"),
    options: daftarOpsi,
    other: z.boolean(),
    otherGoTo: target.optional(),
    branching: z.boolean(),
  }),
  z.object({ ...dasar, kind: z.literal("dropdown"), options: daftarOpsi, branching: z.boolean() }),
  z.object({
    ...dasar,
    kind: z.literal("checkboxes"),
    options: daftarOpsi,
    other: z.boolean(),
    minSelected: bulatOpsional(0, FORM_LIMITS.maxOptions + 1),
    maxSelected: bulatOpsional(1, FORM_LIMITS.maxOptions + 1),
  }),
  z.object({
    ...dasar,
    kind: z.literal("linear_scale"),
    min: z.union([z.literal(0), z.literal(1)]),
    max: z.number().int().min(2).max(10),
    minLabel: z.string().trim().max(100).optional(),
    maxLabel: z.string().trim().max(100).optional(),
  }),
  z.object({ ...dasar, kind: z.literal("mc_grid"), rows: garisKisi("baris"), columns: garisKisi("kolom") }),
  z.object({ ...dasar, kind: z.literal("checkbox_grid"), rows: garisKisi("baris"), columns: garisKisi("kolom") }),
  z.object({ ...dasar, kind: z.literal("date"), min: tanggal, max: tanggal }),
  z.object({ ...dasar, kind: z.literal("time") }),
  z.object({
    ...dasar,
    kind: z.literal("file_upload"),
    accept: z
      .array(z.enum(FILE_KINDS))
      .min(1, { error: "Pilih minimal satu jenis berkas." })
      .refine((list) => new Set(list).size === list.length, { error: "Jenis berkas ganda." }),
    maxFiles: z.number().int().min(1).max(FORM_LIMITS.maxFilesPerQuestion),
    maxSizeMb: z.number().int().min(1).max(FORM_LIMITS.fileMaxBytes / (1024 * 1024)),
  }),
]);

const blokTeks = z.object({
  kind: z.literal("text"),
  id,
  title: judul("Judul"),
  description: deskripsi,
});

const item = z.union([blokTeks, pertanyaan]);

const bagian = z.object({
  id,
  title: z.string().trim().max(FORM_LIMITS.titleMax).default(""),
  description: deskripsi,
  next: target.optional(),
  items: z.array(item),
});

/** Pesan galat yang menunjuk lokasi di dokumen (dipakai builder untuk sorotan). */
type Lokasi = Array<string | number>;

export const formDefinitionSchema = z
  .object({
    schemaVersion: z.literal(FORM_SCHEMA_VERSION),
    intro: z
      .string()
      .trim()
      .max(FORM_LIMITS.descriptionMax)
      .optional()
      .transform((value) => (value ? value : undefined)),
    sections: z
      .array(bagian)
      .min(1, { error: "Formulir minimal memiliki satu bagian." })
      .max(FORM_LIMITS.maxSections, { error: `Maksimal ${FORM_LIMITS.maxSections} bagian.` }),
  })
  .superRefine((def, ctx) => {
    const tambah = (message: string, path: Lokasi) => ctx.addIssue({ code: "custom", message, path });

    const totalItem = def.sections.reduce((n, s) => n + s.items.length, 0);
    if (totalItem > FORM_LIMITS.maxItems) {
      tambah(`Maksimal ${FORM_LIMITS.maxItems} pertanyaan/blok dalam satu formulir.`, ["sections"]);
    }

    const indeksBagian = new Map(def.sections.map((s, i) => [s.id, i]));
    const terpakai = new Set<string>();
    const cekId = (value: string, path: Lokasi) => {
      if (terpakai.has(value)) tambah("Id ganda di dalam formulir.", path);
      terpakai.add(value);
    };

    const cekTarget = (t: FormTarget | undefined, dari: number, path: Lokasi) => {
      if (t === undefined || t === "next" || t === "submit") return;
      const ke = indeksBagian.get(t);
      if (ke === undefined) tambah("Tujuan lompat menunjuk bagian yang tidak ada.", path);
      else if (ke <= dari) tambah("Lompat hanya boleh ke bagian sesudahnya.", path);
    };

    def.sections.forEach((section, si) => {
      cekId(section.id, ["sections", si, "id"]);
      cekTarget(section.next, si, ["sections", si, "next"]);

      let jumlahCabang = 0;
      section.items.forEach((it: FormItem, ii) => {
        const path: Lokasi = ["sections", si, "items", ii];
        cekId(it.id, [...path, "id"]);
        if (!isQuestion(it)) return;

        if (it.kind === "multiple_choice" || it.kind === "dropdown" || it.kind === "checkboxes") {
          const label = new Set<string>();
          it.options.forEach((o, oi) => {
            cekId(o.id, [...path, "options", oi, "id"]);
            const kunci = o.label.trim().toLowerCase();
            if (label.has(kunci)) tambah("Label opsi tidak boleh sama.", [...path, "options", oi, "label"]);
            label.add(kunci);
          });
        }

        if (it.kind === "multiple_choice" || it.kind === "dropdown") {
          if (it.branching) {
            jumlahCabang += 1;
            it.options.forEach((o, oi) => cekTarget(o.goTo, si, [...path, "options", oi, "goTo"]));
            if (it.kind === "multiple_choice") cekTarget(it.otherGoTo, si, [...path, "otherGoTo"]);
          }
        }

        if (it.kind === "checkboxes") {
          const n = it.options.length + (it.other ? 1 : 0);
          if (it.minSelected !== undefined && it.maxSelected !== undefined && it.minSelected > it.maxSelected) {
            tambah("Minimal pilihan tidak boleh melebihi maksimal.", [...path, "minSelected"]);
          }
          if (it.minSelected !== undefined && it.minSelected > n) {
            tambah("Minimal pilihan melebihi jumlah opsi.", [...path, "minSelected"]);
          }
        }

        if (it.kind === "mc_grid" || it.kind === "checkbox_grid") {
          it.rows.forEach((r, ri) => cekId(r.id, [...path, "rows", ri, "id"]));
          it.columns.forEach((c, ci) => cekId(c.id, [...path, "columns", ci, "id"]));
        }

        if (it.kind === "short_text" && it.validation) {
          const v = it.validation;
          if ((v.type === "number" || v.type === "length") && v.min !== undefined && v.max !== undefined && v.min > v.max) {
            tambah("Nilai minimal tidak boleh melebihi maksimal.", [...path, "validation"]);
          }
        }
        if (it.kind === "paragraph" && it.minLength !== undefined && it.maxLength !== undefined && it.minLength > it.maxLength) {
          tambah("Panjang minimal tidak boleh melebihi maksimal.", [...path, "minLength"]);
        }
        if (it.kind === "date" && it.min && it.max && it.min > it.max) {
          tambah("Tanggal paling awal tidak boleh sesudah tanggal paling akhir.", [...path, "min"]);
        }
        if (it.kind === "linear_scale" && it.min >= it.max) {
          tambah("Skala tidak valid.", [...path, "max"]);
        }
      });

      if (jumlahCabang > 1) {
        tambah("Hanya satu pertanyaan per bagian yang boleh menentukan lompat bagian.", ["sections", si]);
      }
    });

    const ukuran = new TextEncoder().encode(JSON.stringify(def)).length;
    if (ukuran > FORM_LIMITS.definitionMaxBytes) {
      tambah("Formulir terlalu besar. Kurangi jumlah pertanyaan atau opsi.", []);
    }
  });

/**
 * Hasil validasi definisi. Galat menyertakan path agar builder bisa menyorot
 * kartu pertanyaan yang bermasalah.
 */
export type DefinitionIssue = { message: string; path: Array<string | number> };

export function parseDefinition(
  input: unknown,
): { ok: true; definition: FormDefinition } | { ok: false; issues: DefinitionIssue[] } {
  const hasil = formDefinitionSchema.safeParse(input);
  if (hasil.success) return { ok: true, definition: hasil.data as FormDefinition };
  return {
    ok: false,
    issues: hasil.error.issues.map((issue) => ({
      message: issue.message,
      path: issue.path.map((p) => (typeof p === "symbol" ? String(p) : p)),
    })),
  };
}

/** Bagian yang tidak bisa dicapai dari bagian pertama — peringatan, bukan galat. */
export function unreachableSections(def: FormDefinition): string[] {
  const indeks = new Map(def.sections.map((s, i) => [s.id, i]));
  const tercapai = new Set<number>([0]);
  def.sections.forEach((section, i) => {
    if (!tercapai.has(i)) return;
    const tujuan = new Set<FormTarget>();
    const cabang = section.items.find(
      (it) => (it.kind === "multiple_choice" || it.kind === "dropdown") && it.branching,
    );
    const bawaan = section.next ?? "next";
    if (cabang && (cabang.kind === "multiple_choice" || cabang.kind === "dropdown")) {
      for (const o of cabang.options) tujuan.add(o.goTo ?? bawaan);
      if (cabang.kind === "multiple_choice" && cabang.other) tujuan.add(cabang.otherGoTo ?? bawaan);
      // Pertanyaan bercabang yang tidak wajib bisa dilewati → tujuan bawaan juga mungkin.
      if (!cabang.required) tujuan.add(bawaan);
    } else {
      tujuan.add(bawaan);
    }
    for (const t of tujuan) {
      if (t === "submit") continue;
      const j = t === "next" ? i + 1 : indeks.get(t);
      if (j !== undefined && j < def.sections.length) tercapai.add(j);
    }
  });
  return def.sections.filter((_, i) => !tercapai.has(i)).map((s) => s.id);
}

/** Jumlah pertanyaan (tanpa blok teks). */
export function countQuestions(def: FormDefinition): number {
  return def.sections.reduce((n, s) => n + s.items.filter(isQuestion).length, 0);
}

// ---------------------------------------------------------------------------
// Pengaturan formulir
// ---------------------------------------------------------------------------

export const formSettingsSchema = z
  .object({
    quota: z.number().int().min(1).max(FORM_LIMITS.quotaMax).nullable(),
    collectEmail: z.boolean(),
    limitOnePerEmail: z.boolean(),
    allowEdit: z.boolean(),
    sendConfirmation: z.boolean(),
    confirmationMessage: z
      .string()
      .trim()
      .max(FORM_LIMITS.confirmationMessageMax, {
        error: `Pesan konfirmasi maksimal ${FORM_LIMITS.confirmationMessageMax} karakter.`,
      })
      .nullable()
      .transform((value) => (value ? value : null)),
    consentText: z
      .string()
      .trim()
      .max(FORM_LIMITS.consentTextMax, { error: `Teks persetujuan maksimal ${FORM_LIMITS.consentTextMax} karakter.` })
      .nullable()
      .transform((value) => (value ? value : null)),
  })
  .superRefine((s, ctx) => {
    if (s.limitOnePerEmail && !s.collectEmail) {
      ctx.addIssue({
        code: "custom",
        message: "Aktifkan “Kumpulkan email” untuk membatasi satu respons per email.",
        path: ["limitOnePerEmail"],
      });
    }
    if (s.sendConfirmation && !s.collectEmail) {
      ctx.addIssue({
        code: "custom",
        message: "Aktifkan “Kumpulkan email” untuk mengirim salinan jawaban.",
        path: ["sendConfirmation"],
      });
    }
  });

export const DEFAULT_CONSENT_TEXT =
  "Saya menyetujui data yang saya isi disimpan dan digunakan oleh pengurus Rohkris hanya untuk keperluan kegiatan ini.";

export const DEFAULT_FORM_SETTINGS: FormSettings = {
  quota: null,
  collectEmail: true,
  limitOnePerEmail: false,
  allowEdit: true,
  sendConfirmation: false,
  confirmationMessage: null,
  consentText: DEFAULT_CONSENT_TEXT,
};
