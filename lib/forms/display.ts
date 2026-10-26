/**
 * Mengubah jawaban tersimpan menjadi teks yang terbaca manusia — dipakai
 * tampilan respons admin, CSV, dan email konfirmasi.
 *
 * Opsi/baris/kolom yang sudah dihapus admin dicari di definisi versi lama
 * (bila diberikan) agar respons lama tetap terbaca.
 */

import type {
  AnswerValue,
  FormDefinition,
  FormOption,
  GridLine,
  Question,
} from "@/lib/forms/types";
import { allQuestions } from "@/lib/forms/types";

export type FileInfo = { id: string; name: string };

/** Baca nilai sebagai objek polos (jawaban tersimpan berasal dari JSON tak tepercaya). */
function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function cariLabel(list: ReadonlyArray<FormOption | GridLine>, id: string, cadangan?: ReadonlyArray<FormOption | GridLine>) {
  const hit = list.find((o) => o.id === id) ?? cadangan?.find((o) => o.id === id);
  return hit ? hit.label : "(opsi dihapus)";
}

/** Pertanyaan yang sama (id sama) di definisi lain, bila ada & bertipe sama. */
export function findQuestion(def: FormDefinition | null | undefined, id: string, kind?: Question["kind"]) {
  if (!def) return undefined;
  const q = allQuestions(def).find((x) => x.id === id);
  return q && (!kind || q.kind === kind) ? q : undefined;
}

/**
 * Teks satu jawaban. Untuk kisi, mengembalikan satu baris per baris kisi
 * ("Baris: Kolom"). `files` memetakan id berkas → nama asli.
 */
export function answerToText(
  q: Question,
  value: AnswerValue | undefined,
  opts: { previous?: FormDefinition | null; files?: ReadonlyMap<string, FileInfo> } = {},
): string {
  if (value === undefined || value === null || value === "") return "";
  const lama = findQuestion(opts.previous, q.id, q.kind);

  switch (q.kind) {
    case "short_text":
    case "paragraph":
    case "date":
    case "time":
      return typeof value === "string" ? value : "";

    case "linear_scale":
      return typeof value === "number" ? String(value) : "";

    case "multiple_choice":
    case "dropdown": {
      const v = asRecord(value);
      if (!v) return "";
      if (typeof v.c === "string") {
        const cadangan = lama && "options" in lama ? lama.options : undefined;
        return cariLabel(q.options, v.c, cadangan);
      }
      return typeof v.other === "string" ? `Lainnya: ${v.other}` : "";
    }

    case "checkboxes": {
      const v = asRecord(value);
      if (!v) return "";
      const cadangan = lama && "options" in lama ? lama.options : undefined;
      const ids = Array.isArray(v.c) ? v.c.filter((x): x is string => typeof x === "string") : [];
      const bagian = ids.map((id) => cariLabel(q.options, id, cadangan));
      if (typeof v.other === "string") bagian.push(`Lainnya: ${v.other}`);
      return bagian.join(", ");
    }

    case "mc_grid":
    case "checkbox_grid": {
      const v = asRecord(value);
      if (!v) return "";
      const lamaRows = lama && "rows" in lama ? lama.rows : undefined;
      const lamaCols = lama && "columns" in lama ? lama.columns : undefined;
      return gridRows(q, v, lamaRows, lamaCols)
        .map(([row, cols]) => `${row}: ${cols}`)
        .join("\n");
    }

    case "file_upload": {
      const ids = Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
      return ids.map((id) => opts.files?.get(id)?.name ?? "(berkas)").join(", ");
    }
  }
}

/** Pasangan [label baris, teks kolom] untuk kisi, mengikuti urutan baris. */
export function gridRows(
  q: Extract<Question, { kind: "mc_grid" | "checkbox_grid" }>,
  value: Record<string, unknown>,
  lamaRows?: ReadonlyArray<GridLine>,
  lamaCols?: ReadonlyArray<GridLine>,
): Array<[string, string]> {
  const urutan = [...q.rows.map((r) => r.id), ...Object.keys(value).filter((id) => !q.rows.some((r) => r.id === id))];
  const hasil: Array<[string, string]> = [];
  for (const rowId of urutan) {
    const v = value[rowId];
    if (v === undefined) continue;
    const label = cariLabel(q.rows, rowId, lamaRows);
    const cols = (Array.isArray(v) ? v : [v]).filter((x): x is string => typeof x === "string");
    if (cols.length === 0) continue;
    hasil.push([label, cols.map((c) => cariLabel(q.columns, c, lamaCols)).join(", ")]);
  }
  return hasil;
}

/** Label jenis pertanyaan untuk UI admin. */
export const QUESTION_KIND_LABEL: Record<Question["kind"], string> = {
  short_text: "Jawaban singkat",
  paragraph: "Paragraf",
  multiple_choice: "Pilihan ganda",
  checkboxes: "Kotak centang",
  dropdown: "Dropdown",
  linear_scale: "Skala linear",
  mc_grid: "Kisi pilihan ganda",
  checkbox_grid: "Kisi kotak centang",
  date: "Tanggal",
  time: "Waktu",
  file_upload: "Unggah berkas",
};
