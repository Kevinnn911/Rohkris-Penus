/**
 * Agregasi respons untuk tab "Ringkasan" (seperti ringkasan Google Form).
 *
 * Murni: menerima definisi terbaru + jawaban yang sudah di-parse, tanpa I/O.
 * Opsi yang sudah dihapus tetap dihitung dengan label "(opsi dihapus)" bila
 * masih muncul di jawaban lama.
 */

import { answerToText } from "@/lib/forms/display";
import {
  type FormDefinition,
  type Question,
  type StoredAnswers,
  allQuestions,
} from "@/lib/forms/types";

export type ChoiceCount = { id: string; label: string; count: number };

export type QuestionSummary =
  | { kind: "choice"; question: Question; answered: number; counts: ChoiceCount[]; other: string[] }
  | { kind: "scale"; question: Question; answered: number; counts: ChoiceCount[]; mean: number | null }
  | {
      kind: "grid";
      question: Question;
      answered: number;
      columns: Array<{ id: string; label: string }>;
      rows: Array<{ id: string; label: string; counts: number[] }>;
    }
  | { kind: "text"; question: Question; answered: number; latest: string[] }
  | { kind: "file"; question: Question; answered: number; files: number };

/** Jumlah jawaban teks terbaru yang ditampilkan per pertanyaan. */
export const TEXT_SAMPLE = 50;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * @param responses jawaban, URUT dari yang terbaru (untuk sampel teks).
 */
export function summarize(def: FormDefinition, responses: StoredAnswers[]): QuestionSummary[] {
  return allQuestions(def).map((q) => ringkas(q, responses));
}

function ringkas(q: Question, responses: StoredAnswers[]): QuestionSummary {
  const nilai = responses.map((r) => r[q.id]).filter((v) => v !== undefined && v !== null && v !== "");
  const answered = nilai.length;

  switch (q.kind) {
    case "multiple_choice":
    case "dropdown":
    case "checkboxes": {
      const counts = new Map<string, ChoiceCount>(q.options.map((o) => [o.id, { id: o.id, label: o.label, count: 0 }]));
      const other: string[] = [];
      for (const v of nilai) {
        const rec = asRecord(v);
        if (!rec) continue;
        const ids = Array.isArray(rec.c) ? rec.c : typeof rec.c === "string" ? [rec.c] : [];
        for (const id of ids) {
          if (typeof id !== "string") continue;
          const hit = counts.get(id) ?? { id, label: "(opsi dihapus)", count: 0 };
          hit.count += 1;
          counts.set(id, hit);
        }
        if (typeof rec.other === "string") other.push(rec.other);
      }
      const daftar = [...counts.values()];
      if (other.length > 0) daftar.push({ id: "__other", label: "Lainnya", count: other.length });
      return { kind: "choice", question: q, answered, counts: daftar, other: other.slice(0, TEXT_SAMPLE) };
    }

    case "linear_scale": {
      const counts: ChoiceCount[] = [];
      for (let n = q.min; n <= q.max; n += 1) counts.push({ id: String(n), label: String(n), count: 0 });
      let total = 0;
      let jumlah = 0;
      for (const v of nilai) {
        if (typeof v !== "number") continue;
        const hit = counts.find((c) => c.id === String(v));
        if (hit) hit.count += 1;
        total += v;
        jumlah += 1;
      }
      return { kind: "scale", question: q, answered, counts, mean: jumlah ? total / jumlah : null };
    }

    case "mc_grid":
    case "checkbox_grid": {
      const kolom = q.columns.map((c) => ({ id: c.id, label: c.label }));
      const baris = q.rows.map((r) => ({ id: r.id, label: r.label, counts: kolom.map(() => 0) }));
      for (const v of nilai) {
        const rec = asRecord(v);
        if (!rec) continue;
        for (const row of baris) {
          const isi = rec[row.id];
          const ids = Array.isArray(isi) ? isi : typeof isi === "string" ? [isi] : [];
          for (const id of ids) {
            const ci = kolom.findIndex((c) => c.id === id);
            if (ci >= 0) row.counts[ci] = (row.counts[ci] ?? 0) + 1;
          }
        }
      }
      return { kind: "grid", question: q, answered, columns: kolom, rows: baris };
    }

    case "file_upload": {
      const files = nilai.reduce<number>((n, v) => n + (Array.isArray(v) ? v.length : 0), 0);
      return { kind: "file", question: q, answered, files };
    }

    default: {
      const latest = nilai
        .slice(0, TEXT_SAMPLE)
        .map((v) => answerToText(q, v))
        .filter((t) => t !== "");
      return { kind: "text", question: q, answered, latest };
    }
  }
}
