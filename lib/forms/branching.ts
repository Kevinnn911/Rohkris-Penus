/**
 * Menghitung jalur bagian yang dilalui responden berdasarkan jawabannya.
 *
 * Dipakai bersama oleh formulir publik (tombol "Berikutnya") dan server
 * (penentu jawaban mana yang divalidasi & disimpan). Karena validasi definisi
 * hanya mengizinkan lompat ke bagian SESUDAHNYA, jalur selalu berakhir dalam
 * paling banyak N langkah — tidak ada siklus.
 */

import type { Answers, FormDefinition, FormSection, FormTarget } from "@/lib/forms/types";

/** Pertanyaan yang menentukan lompat bagian pada sebuah bagian, bila ada. */
export function branchingQuestion(section: FormSection) {
  for (const item of section.items) {
    if ((item.kind === "multiple_choice" || item.kind === "dropdown") && item.branching) return item;
  }
  return undefined;
}

/**
 * Tujuan setelah `section` berdasarkan jawaban. Mengembalikan target mentah
 * ("next" | "submit" | id bagian).
 */
export function nextTarget(section: FormSection, answers: Answers): FormTarget {
  const bawaan = section.next ?? "next";
  const q = branchingQuestion(section);
  if (!q) return bawaan;
  const a = answers[q.id];
  if (!a || typeof a !== "object" || Array.isArray(a)) return bawaan;
  if ("c" in a && typeof a.c === "string") {
    const opsi = q.options.find((o) => o.id === a.c);
    return opsi?.goTo ?? bawaan;
  }
  if ("other" in a && q.kind === "multiple_choice") return q.otherGoTo ?? bawaan;
  return bawaan;
}

/** Indeks bagian berikutnya, atau null bila tujuan adalah "submit"/akhir formulir. */
export function nextSectionIndex(def: FormDefinition, index: number, answers: Answers): number | null {
  const section = def.sections[index];
  if (!section) return null;
  const t = nextTarget(section, answers);
  if (t === "submit") return null;
  let j = t === "next" ? index + 1 : def.sections.findIndex((s) => s.id === t);
  // Pertahanan: target tak dikenal/mundur seharusnya sudah ditolak validasi
  // definisi; bila tetap terjadi, perlakukan sebagai "bagian berikutnya".
  if (j <= index) j = index + 1;
  return j < def.sections.length ? j : null;
}

/** Urutan id bagian yang dilalui dari bagian pertama sampai kirim. */
export function computePath(def: FormDefinition, answers: Answers): string[] {
  const path: string[] = [];
  let i: number | null = 0;
  let langkah = 0;
  while (i !== null && i < def.sections.length && langkah <= def.sections.length) {
    const section = def.sections[i];
    if (!section) break;
    path.push(section.id);
    i = nextSectionIndex(def, i, answers);
    langkah += 1;
  }
  return path;
}

/** Id pertanyaan yang berada di jalur. */
export function questionIdsOnPath(def: FormDefinition, path: string[]): Set<string> {
  const dilalui = new Set(path);
  const ids = new Set<string>();
  for (const section of def.sections) {
    if (!dilalui.has(section.id)) continue;
    for (const item of section.items) if (item.kind !== "text") ids.add(item.id);
  }
  return ids;
}
