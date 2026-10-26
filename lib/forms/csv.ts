/**
 * Ekspor respons ke CSV yang bisa dibuka di Google Sheets maupun Excel.
 *
 *  - UTF-8 dengan BOM agar Excel membaca huruf non-ASCII dengan benar.
 *  - Pemisah koma (bawaan, cocok untuk Google Sheets) atau titik koma
 *    (Excel dengan pengaturan wilayah Indonesia memakai ";" sebagai pemisah
 *    daftar). Sengaja TIDAK memakai baris "sep=" karena membuat Excel
 *    mengabaikan BOM.
 *  - Pengaman formula injection: sel yang diawali = + - @ tab atau CR diberi
 *    awalan apostrof agar tidak dieksekusi sebagai rumus.
 *  - Waktu ditampilkan dalam WIB.
 */

import { answerToText, type FileInfo } from "@/lib/forms/display";
import { type FormDefinition, type Question, type StoredAnswers, allQuestions } from "@/lib/forms/types";

export type CsvDelimiter = "," | ";";

export type CsvResponse = {
  submittedAt: string;
  editedAt: string | null;
  email: string | null;
  answers: StoredAnswers;
  /** Definisi versi saat respons dikirim (untuk label opsi yang sudah dihapus). */
  versionDefinition?: FormDefinition | null;
  files?: ReadonlyMap<string, FileInfo>;
};

export const CSV_BOM = "﻿";

/** Mengamankan & mengutip satu sel. */
export function csvCell(value: string, delimiter: CsvDelimiter = ","): string {
  let v = value.replace(/\r\n?/g, "\n");
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  const perluKutip = v.includes(delimiter) || v.includes('"') || v.includes("\n") || /^\s|\s$/.test(v);
  return perluKutip ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Waktu ISO → "DD/MM/YYYY HH.mm.ss" WIB (format yang dikenali spreadsheet berlokal Indonesia). */
export function formatWaktuCsv(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const bagian = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const ambil = (t: string) => bagian.find((p) => p.type === t)?.value ?? "";
  return `${ambil("day")}/${ambil("month")}/${ambil("year")} ${ambil("hour")}.${ambil("minute")}.${ambil("second")}`;
}

export type CsvColumn = { id: string; title: string; question?: Question };

/**
 * Kolom = pertanyaan definisi terbaru, ditambah kolom "(dihapus)" untuk
 * pertanyaan yang hanya ada di versi lama tetapi punya jawaban.
 */
export function csvColumns(def: FormDefinition, responses: CsvResponse[]): CsvColumn[] {
  const kolom: CsvColumn[] = allQuestions(def).map((q) => ({ id: q.id, title: q.title, question: q }));
  const dikenal = new Set(kolom.map((k) => k.id));
  for (const r of responses) {
    const lama = r.versionDefinition ? allQuestions(r.versionDefinition) : [];
    for (const id of Object.keys(r.answers)) {
      if (id === "_path" || dikenal.has(id)) continue;
      const q = lama.find((x) => x.id === id);
      kolom.push({ id, title: `${q?.title ?? id} (dihapus)`, question: q });
      dikenal.add(id);
    }
  }
  return kolom;
}

export function buildCsv(
  def: FormDefinition,
  responses: CsvResponse[],
  opts: { delimiter?: CsvDelimiter; includeEmail?: boolean } = {},
): string {
  const delimiter = opts.delimiter ?? ",";
  const kolom = csvColumns(def, responses);
  const baris: string[][] = [];

  const kepala = ["Waktu kirim (WIB)"];
  if (opts.includeEmail) kepala.push("Email");
  kepala.push(...kolom.map((k) => k.title), "Diubah (WIB)");
  baris.push(kepala);

  for (const r of responses) {
    const sel = [formatWaktuCsv(r.submittedAt)];
    if (opts.includeEmail) sel.push(r.email ?? "");
    for (const k of kolom) {
      const v = r.answers[k.id];
      sel.push(k.question ? answerToText(k.question, v, { previous: r.versionDefinition, files: r.files }) : "");
    }
    sel.push(formatWaktuCsv(r.editedAt));
    baris.push(sel);
  }

  return CSV_BOM + baris.map((b) => b.map((c) => csvCell(c, delimiter)).join(delimiter)).join("\r\n") + "\r\n";
}

/** Nama berkas unduhan yang aman: "respons-<slug>-<YYYYMMDD>.csv". */
export function csvFileName(slug: string, now: Date): string {
  const tgl = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now).replace(/-/g, "");
  const aman = slug.replace(/[^a-z0-9-]/g, "").slice(0, 80) || "formulir";
  return `respons-${aman}-${tgl}.csv`;
}
