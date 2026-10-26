import { describe, expect, it } from "vitest";

import {
  builderReducer,
  cloneItem,
  convertQuestion,
  initialBuilderState,
  sanitizeTargets,
  type BuilderAction,
  type BuilderState,
} from "@/lib/forms/builder-reducer";
import { parseDefinition } from "@/lib/forms/definition-schema";
import type { FormDefinition, Question } from "@/lib/forms/types";

function idUrut() {
  let n = 0;
  return () => `id${String((n += 1)).padStart(8, "0")}`;
}

function jalankan(actions: BuilderAction[]) {
  const id = idUrut();
  let state: BuilderState = initialBuilderState(null, null, id);
  for (const a of actions) state = builderReducer(state, a, id);
  return state;
}

describe("builder formulir", () => {
  it("formulir baru memakai templat awal yang valid & ditandai belum disimpan", () => {
    const s = jalankan([]);
    expect(s.dirty).toBe(true);
    expect(s.definition.sections[0]?.items.map((i) => i.kind !== "text" && i.title)).toEqual([
      "Nama lengkap",
      "Kelas",
      "Nomor WhatsApp",
    ]);
    expect(parseDefinition(s.definition).ok).toBe(true);
  });

  it("menambah, memindah, menduplikasi, dan menghapus pertanyaan", () => {
    const s = jalankan([
      { type: "addItem", section: 0, kind: "multiple_choice" },
      { type: "moveItem", at: { section: 0, item: 3 }, dir: -1 },
      { type: "duplicateItem", at: { section: 0, item: 2 } },
      { type: "removeItem", at: { section: 0, item: 0 } },
    ]);
    const items = s.definition.sections[0]!.items;
    expect(items.map((i) => i.kind)).toEqual(["short_text", "multiple_choice", "multiple_choice", "short_text"]);
    // Duplikat mendapat id baru, termasuk id opsinya.
    const [a, b] = [items[1] as Extract<Question, { kind: "multiple_choice" }>, items[2] as Extract<Question, { kind: "multiple_choice" }>];
    expect(a.id).not.toBe(b.id);
    expect(a.options[0]!.id).not.toBe(b.options[0]!.id);
  });

  it("memindah pertanyaan melewati batas bagian", () => {
    const s = jalankan([
      { type: "addSection", after: 0 },
      { type: "moveItem", at: { section: 0, item: 2 }, dir: 1 },
    ]);
    expect(s.definition.sections[0]!.items).toHaveLength(2);
    expect(s.definition.sections[1]!.items).toHaveLength(1);
  });

  it("menghapus bagian menggabungkan isinya ke bagian sebelumnya & membersihkan target lompat", () => {
    let s = jalankan([{ type: "addSection", after: 0 }, { type: "addItem", section: 1, kind: "date" }]);
    const tanggal = s.definition.sections[1]!.items[0]!;
    s = builderReducer(s, { type: "updateItem", at: { section: 1, item: 0 }, item: { ...tanggal, title: "Tanggal lahir" } });
    const idBagian2 = s.definition.sections[1]!.id;
    s = builderReducer(s, { type: "updateSection", section: 0, patch: { next: idBagian2 } });
    s = builderReducer(s, { type: "removeSection", section: 1 });
    expect(s.definition.sections).toHaveLength(1);
    expect(s.definition.sections[0]!.items.map((i) => i.kind)).toContain("date");
    expect(s.definition.sections[0]!.next).toBeUndefined();
    expect(parseDefinition(s.definition).ok).toBe(true);
  });

  it("memindah bagian membuang lompatan yang menjadi mundur", () => {
    const def: FormDefinition = {
      schemaVersion: 1,
      sections: [
        { id: "seca000001", title: "A", next: "secb000001", items: [] },
        { id: "secb000001", title: "B", items: [] },
      ],
    };
    const s = builderReducer({ definition: def, settings: initialBuilderState(def, null).settings, dirty: false }, {
      type: "moveSection",
      section: 1,
      dir: -1,
    });
    expect(s.definition.sections.map((x) => x.id)).toEqual(["secb000001", "seca000001"]);
    expect(s.definition.sections[1]!.next).toBeUndefined();
    expect(sanitizeTargets(def)).toEqual(def);
  });

  it("mengubah tipe mempertahankan judul & opsi bila relevan", () => {
    const id = idUrut();
    const q: Question = {
      kind: "multiple_choice",
      id: "qasal00001",
      title: "Asal",
      required: true,
      other: true,
      branching: true,
      options: [{ id: "opa0000001", label: "A", goTo: "submit" }],
    };
    const kotak = convertQuestion(q, "checkboxes", id);
    expect(kotak).toMatchObject({ kind: "checkboxes", id: "qasal00001", title: "Asal", required: true });
    if (kotak.kind === "checkboxes") expect(kotak.options).toEqual([{ id: "opa0000001", label: "A" }]);
    const teks = convertQuestion(q, "paragraph", id);
    expect(teks).toMatchObject({ kind: "paragraph", title: "Asal" });
  });

  it("menyalin kisi mengganti id baris & kolom", () => {
    const id = idUrut();
    const kisi: Question = {
      kind: "mc_grid",
      id: "qkisi00001",
      title: "K",
      required: false,
      rows: [{ id: "baris00001", label: "R" }],
      columns: [{ id: "kolom00001", label: "C" }],
    };
    const salin = cloneItem(kisi, id) as typeof kisi;
    expect(salin.rows[0]!.id).not.toBe("baris00001");
    expect(salin.columns[0]!.label).toBe("C");
  });

  it("load & saved mengatur penanda perubahan", () => {
    let s = jalankan([{ type: "setIntro", intro: "Halo" }]);
    expect(s.dirty).toBe(true);
    s = builderReducer(s, { type: "saved" });
    expect(s.dirty).toBe(false);
    s = builderReducer(s, { type: "setSettings", patch: { quota: 10 } });
    expect(s.settings.quota).toBe(10);
    expect(s.dirty).toBe(true);
  });
});
