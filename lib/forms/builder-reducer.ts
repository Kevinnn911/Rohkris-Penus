/**
 * State builder formulir admin (useReducer). Murni & diuji unit.
 *
 * Semua perubahan menghasilkan objek baru (immutable). Id baru dibuat lewat
 * `newFormId` yang disuntikkan, sehingga test bisa memakai id deterministik.
 */

import { DEFAULT_FORM_SETTINGS } from "@/lib/forms/definition-schema";
import { newFormId } from "@/lib/forms/ids";
import type {
  FormDefinition,
  FormItem,
  FormOption,
  FormSection,
  FormSettings,
  GridLine,
  Question,
  QuestionKind,
} from "@/lib/forms/types";

export type BuilderState = {
  definition: FormDefinition;
  settings: FormSettings;
  dirty: boolean;
};

export type ItemPath = { section: number; item: number };

export type BuilderAction =
  | { type: "load"; definition: FormDefinition; settings: FormSettings }
  | { type: "saved" }
  | { type: "setIntro"; intro: string }
  | { type: "setSettings"; patch: Partial<FormSettings> }
  | { type: "addSection"; after: number }
  | { type: "updateSection"; section: number; patch: Partial<Pick<FormSection, "title" | "description" | "next">> }
  | { type: "removeSection"; section: number }
  | { type: "moveSection"; section: number; dir: -1 | 1 }
  | { type: "addItem"; section: number; after?: number; kind: QuestionKind | "text" }
  | { type: "updateItem"; at: ItemPath; item: FormItem }
  | { type: "changeKind"; at: ItemPath; kind: QuestionKind }
  | { type: "removeItem"; at: ItemPath }
  | { type: "duplicateItem"; at: ItemPath }
  | { type: "moveItem"; at: ItemPath; dir: -1 | 1 };

type IdFn = () => string;

const opsi = (id: IdFn, label: string): FormOption => ({ id: id(), label });
const garis = (id: IdFn, label: string): GridLine => ({ id: id(), label });

/** Pertanyaan baru dengan konfigurasi bawaan yang masuk akal. */
export function blankItem(kind: QuestionKind | "text", id: IdFn = newFormId): FormItem {
  const dasar = { id: id(), title: "", required: false };
  switch (kind) {
    case "text":
      return { kind: "text", id: dasar.id, title: "Judul" };
    case "short_text":
      return { ...dasar, kind };
    case "paragraph":
      return { ...dasar, kind };
    case "multiple_choice":
      return { ...dasar, kind, options: [opsi(id, "Opsi 1")], other: false, branching: false };
    case "dropdown":
      return { ...dasar, kind, options: [opsi(id, "Opsi 1")], branching: false };
    case "checkboxes":
      return { ...dasar, kind, options: [opsi(id, "Opsi 1")], other: false };
    case "linear_scale":
      return { ...dasar, kind, min: 1, max: 5 };
    case "mc_grid":
    case "checkbox_grid":
      return { ...dasar, kind, rows: [garis(id, "Baris 1")], columns: [garis(id, "Kolom 1"), garis(id, "Kolom 2")] };
    case "date":
      return { ...dasar, kind };
    case "time":
      return { ...dasar, kind };
    case "file_upload":
      return { ...dasar, kind, accept: ["image", "pdf"], maxFiles: 1, maxSizeMb: 5 };
  }
}

/**
 * Ganti tipe pertanyaan sambil mempertahankan yang masih relevan (judul,
 * deskripsi, wajib, dan opsi bila sama-sama bertipe pilihan).
 */
export function convertQuestion(q: Question, kind: QuestionKind, id: IdFn = newFormId): Question {
  const baru = blankItem(kind, id) as Question;
  const umum = { id: q.id, title: q.title, description: q.description, required: q.required };
  const opsiLama = "options" in q ? q.options.map(({ id: oid, label }) => ({ id: oid, label })) : null;
  if (opsiLama && (baru.kind === "multiple_choice" || baru.kind === "dropdown" || baru.kind === "checkboxes")) {
    return { ...baru, ...umum, options: opsiLama } as Question;
  }
  if (
    (q.kind === "mc_grid" || q.kind === "checkbox_grid") &&
    (baru.kind === "mc_grid" || baru.kind === "checkbox_grid")
  ) {
    return { ...baru, ...umum, rows: q.rows, columns: q.columns };
  }
  return { ...baru, ...umum } as Question;
}

/** Salinan item dengan seluruh id (termasuk opsi/baris/kolom) diganti baru. */
export function cloneItem(item: FormItem, id: IdFn = newFormId): FormItem {
  const salin = structuredClone(item);
  salin.id = id();
  if ("options" in salin) salin.options = salin.options.map((o) => ({ ...o, id: id() }));
  if ("rows" in salin) {
    salin.rows = salin.rows.map((r) => ({ ...r, id: id() }));
    salin.columns = salin.columns.map((c) => ({ ...c, id: id() }));
  }
  return salin;
}

export function starterDefinition(id: IdFn = newFormId): FormDefinition {
  return {
    schemaVersion: 1,
    sections: [
      {
        id: id(),
        title: "",
        items: [
          { kind: "short_text", id: id(), title: "Nama lengkap", required: true },
          { kind: "short_text", id: id(), title: "Kelas", required: true },
          {
            kind: "short_text",
            id: id(),
            title: "Nomor WhatsApp",
            required: true,
            validation: { type: "phone" },
          },
        ],
      },
    ],
  };
}

export function initialBuilderState(
  definition: FormDefinition | null,
  settings: FormSettings | null,
  id: IdFn = newFormId,
): BuilderState {
  return {
    definition: definition ?? starterDefinition(id),
    settings: settings ?? DEFAULT_FORM_SETTINGS,
    dirty: definition === null,
  };
}

function pindah<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const salin = [...list];
  const [x] = salin.splice(from, 1);
  salin.splice(to, 0, x as T);
  return salin;
}

/**
 * Hapus rujukan lompat ke bagian yang tidak lagi valid (dihapus, atau kini
 * berada sebelum/sama dengan bagian asal setelah dipindah) agar definisi
 * tetap lolos validasi "lompat hanya ke depan".
 */
export function sanitizeTargets(def: FormDefinition): FormDefinition {
  const indeks = new Map(def.sections.map((s, i) => [s.id, i]));
  const valid = (t: string | undefined, dari: number) =>
    t === undefined || t === "next" || t === "submit" || (indeks.get(t) ?? -1) > dari;
  return {
    ...def,
    sections: def.sections.map((s, si) => ({
      ...s,
      next: valid(s.next, si) ? s.next : undefined,
      items: s.items.map((it) => {
        if (it.kind !== "multiple_choice" && it.kind !== "dropdown") return it;
        const options = it.options.map((o) => (valid(o.goTo, si) ? o : { id: o.id, label: o.label }));
        if (it.kind === "multiple_choice") {
          return { ...it, options, otherGoTo: valid(it.otherGoTo, si) ? it.otherGoTo : undefined };
        }
        return { ...it, options };
      }),
    })),
  };
}

function ubahBagian(def: FormDefinition, si: number, fn: (s: FormSection) => FormSection): FormDefinition {
  return { ...def, sections: def.sections.map((s, i) => (i === si ? fn(s) : s)) };
}

export function builderReducer(
  state: BuilderState,
  action: BuilderAction,
  id: IdFn = newFormId,
): BuilderState {
  const ganti = (definition: FormDefinition): BuilderState => ({ ...state, definition, dirty: true });
  const def = state.definition;

  switch (action.type) {
    case "load":
      return { definition: action.definition, settings: action.settings, dirty: false };
    case "saved":
      return { ...state, dirty: false };
    case "setIntro":
      return ganti({ ...def, intro: action.intro || undefined });
    case "setSettings":
      return { ...state, settings: { ...state.settings, ...action.patch }, dirty: true };

    case "addSection": {
      const sections = [...def.sections];
      sections.splice(action.after + 1, 0, { id: id(), title: "", items: [] });
      return ganti({ ...def, sections });
    }
    case "updateSection":
      return ganti(ubahBagian(def, action.section, (s) => ({ ...s, ...action.patch })));
    case "removeSection": {
      if (def.sections.length <= 1) return state;
      // Isi bagian yang dihapus digabung ke bagian sebelumnya agar pertanyaan tidak hilang tanpa sengaja.
      const tujuan = action.section === 0 ? 1 : action.section - 1;
      const dihapus = def.sections[action.section];
      if (!dihapus) return state;
      const sections = def.sections
        .map((s, i) =>
          i === tujuan
            ? { ...s, items: action.section === 0 ? [...dihapus.items, ...s.items] : [...s.items, ...dihapus.items] }
            : s,
        )
        .filter((_, i) => i !== action.section);
      return ganti(sanitizeTargets({ ...def, sections }));
    }
    case "moveSection":
      return ganti(sanitizeTargets({ ...def, sections: pindah(def.sections, action.section, action.section + action.dir) }));

    case "addItem": {
      const item = blankItem(action.kind, id);
      return ganti(
        ubahBagian(def, action.section, (s) => {
          const items = [...s.items];
          items.splice(action.after === undefined ? items.length : action.after + 1, 0, item);
          return { ...s, items };
        }),
      );
    }
    case "updateItem":
      return ganti(
        ubahBagian(def, action.at.section, (s) => ({
          ...s,
          items: s.items.map((it, i) => (i === action.at.item ? action.item : it)),
        })),
      );
    case "changeKind":
      return ganti(
        ubahBagian(def, action.at.section, (s) => ({
          ...s,
          items: s.items.map((it, i) =>
            i === action.at.item && it.kind !== "text" ? convertQuestion(it, action.kind, id) : it,
          ),
        })),
      );
    case "removeItem":
      return ganti(
        ubahBagian(def, action.at.section, (s) => ({ ...s, items: s.items.filter((_, i) => i !== action.at.item) })),
      );
    case "duplicateItem":
      return ganti(
        ubahBagian(def, action.at.section, (s) => {
          const asli = s.items[action.at.item];
          if (!asli) return s;
          const items = [...s.items];
          items.splice(action.at.item + 1, 0, cloneItem(asli, id));
          return { ...s, items };
        }),
      );
    case "moveItem": {
      const { section: si, item: ii } = action.at;
      const bagian = def.sections[si];
      if (!bagian) return state;
      const tujuan = ii + action.dir;
      // Di batas bagian, item pindah ke bagian sebelah (seperti Google Form).
      if (tujuan < 0 || tujuan >= bagian.items.length) {
        const siBaru = si + action.dir;
        const sebelah = def.sections[siBaru];
        const item = bagian.items[ii];
        if (!sebelah || !item) return state;
        const sections = def.sections.map((s, i) => {
          if (i === si) return { ...s, items: s.items.filter((_, k) => k !== ii) };
          if (i === siBaru) return { ...s, items: action.dir < 0 ? [...s.items, item] : [item, ...s.items] };
          return s;
        });
        return ganti({ ...def, sections });
      }
      return ganti(ubahBagian(def, si, (s) => ({ ...s, items: pindah(s.items, ii, tujuan) })));
    }
  }
}
