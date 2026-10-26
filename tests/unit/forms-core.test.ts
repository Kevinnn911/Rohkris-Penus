import { describe, expect, it } from "vitest";

import { computePath } from "@/lib/forms/branching";
import { buildCsv, csvCell, formatWaktuCsv } from "@/lib/forms/csv";
import {
  DEFAULT_FORM_SETTINGS,
  countQuestions,
  formSettingsSchema,
  parseDefinition,
  unreachableSections,
} from "@/lib/forms/definition-schema";
import { answerToText } from "@/lib/forms/display";
import { buildConfirmationEmail, escapeHtml } from "@/lib/forms/email-template";
import { detectFileType, sanitizeOriginalName } from "@/lib/forms/files";
import { FORM_ID_PATTERN, newFormId } from "@/lib/forms/ids";
import { summarize } from "@/lib/forms/summary";
import {
  EDIT_TOKEN_PATTERN,
  hashEditToken,
  newEditToken,
  signFormToken,
  verifyFormToken,
} from "@/lib/forms/token";
import type { FormDefinition, Question } from "@/lib/forms/types";
import { validateSection, validateSubmission } from "@/lib/forms/validate-answers";

/** Formulir uji: bagian 1 bercabang → bagian 2 (siswa) atau bagian 3 (guru), lalu kirim. */
function contoh(): FormDefinition {
  return {
    schemaVersion: 1,
    sections: [
      {
        id: "sec0000001",
        title: "Data diri",
        items: [
          { kind: "short_text", id: "qnama00001", title: "Nama lengkap", required: true },
          {
            kind: "multiple_choice",
            id: "qperan0001",
            title: "Anda siapa?",
            required: true,
            other: false,
            branching: true,
            options: [
              { id: "opsiswa001", label: "Siswa", goTo: "sec0000002" },
              { id: "opguru0001", label: "Guru", goTo: "sec0000003" },
            ],
          },
        ],
      },
      {
        id: "sec0000002",
        title: "Khusus siswa",
        next: "submit",
        items: [
          {
            kind: "dropdown",
            id: "qkelas0001",
            title: "Kelas",
            required: true,
            branching: false,
            options: [
              { id: "opx0000001", label: "X" },
              { id: "opxi000001", label: "XI" },
            ],
          },
        ],
      },
      {
        id: "sec0000003",
        title: "Khusus guru",
        items: [{ kind: "paragraph", id: "qmapel0001", title: "Mata pelajaran", required: true }],
      },
    ],
  };
}

describe("id formulir", () => {
  it("menghasilkan id yang cocok dengan pola dan diawali huruf", () => {
    for (let i = 0; i < 200; i += 1) {
      const id = newFormId();
      expect(id).toMatch(FORM_ID_PATTERN);
      expect(id).toMatch(/^[a-z]/);
    }
  });
});

describe("parseDefinition", () => {
  it("menerima definisi yang valid", () => {
    const r = parseDefinition(contoh());
    expect(r.ok).toBe(true);
    if (r.ok) expect(countQuestions(r.definition)).toBe(4);
  });

  it("menolak id ganda", () => {
    const def = contoh();
    def.sections[1]!.id = "sec0000001";
    const r = parseDefinition(def);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.message.includes("Id ganda"))).toBe(true);
  });

  it("menolak lompat mundur dan target yang tidak ada", () => {
    const def = contoh();
    def.sections[2]!.next = "sec0000001";
    const q = def.sections[0]!.items[1] as Extract<Question, { kind: "multiple_choice" }>;
    q.options[0]!.goTo = "tidakada01";
    const r = parseDefinition(def);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const pesan = r.issues.map((i) => i.message);
      expect(pesan).toContain("Lompat hanya boleh ke bagian sesudahnya.");
      expect(pesan).toContain("Tujuan lompat menunjuk bagian yang tidak ada.");
    }
  });

  it("menolak dua pertanyaan bercabang dalam satu bagian", () => {
    const def = contoh();
    def.sections[0]!.items.push({
      kind: "dropdown",
      id: "qlagi00001",
      title: "Lagi",
      required: false,
      branching: true,
      options: [{ id: "oplagi0001", label: "A" }],
    });
    const r = parseDefinition(def);
    expect(r.ok).toBe(false);
  });

  it("menolak label opsi kembar dan definisi tanpa bagian", () => {
    const def = contoh();
    const q = def.sections[1]!.items[0] as Extract<Question, { kind: "dropdown" }>;
    q.options[1]!.label = " x ";
    expect(parseDefinition(def).ok).toBe(false);
    expect(parseDefinition({ schemaVersion: 1, sections: [] }).ok).toBe(false);
  });

  it("melaporkan bagian yang tidak terjangkau", () => {
    const def = contoh();
    def.sections[0]!.next = "submit";
    const q = def.sections[0]!.items[1] as Extract<Question, { kind: "multiple_choice" }>;
    q.options = [{ id: "opsiswa001", label: "Siswa", goTo: "submit" }];
    expect(unreachableSections(def)).toEqual(["sec0000002", "sec0000003"]);
    expect(unreachableSections(contoh())).toEqual([]);
  });
});

describe("pengaturan formulir", () => {
  it("bawaan valid; satu-per-email butuh kumpulkan email", () => {
    expect(formSettingsSchema.safeParse(DEFAULT_FORM_SETTINGS).success).toBe(true);
    const r = formSettingsSchema.safeParse({ ...DEFAULT_FORM_SETTINGS, collectEmail: false, limitOnePerEmail: true });
    expect(r.success).toBe(false);
  });
});

describe("computePath", () => {
  it("mengikuti cabang pilihan", () => {
    const def = contoh();
    expect(computePath(def, { qperan0001: { c: "opsiswa001" } })).toEqual(["sec0000001", "sec0000002"]);
    expect(computePath(def, { qperan0001: { c: "opguru0001" } })).toEqual(["sec0000001", "sec0000003"]);
  });

  it("tanpa jawaban cabang memakai urutan bawaan; id tak dikenal diabaikan", () => {
    const def = contoh();
    expect(computePath(def, {})).toEqual(["sec0000001", "sec0000002"]);
    expect(computePath(def, { qperan0001: { c: "palsu00001" } })).toEqual(["sec0000001", "sec0000002"]);
  });

  it("tidak pernah berulang walau definisi rusak (target mundur)", () => {
    const def = contoh();
    def.sections[2]!.next = "sec0000001";
    const path = computePath(def, { qperan0001: { c: "opguru0001" } });
    expect(path.length).toBeLessThanOrEqual(def.sections.length);
  });
});

describe("validateSubmission", () => {
  it("menyimpan hanya jawaban di jalur dan menambahkan _path", () => {
    const r = validateSubmission(contoh(), {
      qnama00001: "  Budi  ",
      qperan0001: { c: "opsiswa001" },
      qkelas0001: { c: "opxi000001" },
      qmapel0001: "Tidak di jalur",
      qasing0001: "id tak dikenal",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.answers).toEqual({
        qnama00001: "Budi",
        qperan0001: { c: "opsiswa001" },
        qkelas0001: { c: "opxi000001" },
        _path: ["sec0000001", "sec0000002"],
      });
    }
  });

  it("melaporkan pertanyaan wajib yang kosong hanya di jalur", () => {
    const r = validateSubmission(contoh(), { qperan0001: { c: "opguru0001" } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["qmapel0001", "qnama00001"]);
  });

  it("menolak opsi palsu", () => {
    const r = validateSubmission(contoh(), {
      qnama00001: "A",
      qperan0001: { c: "opsiswa001" },
      qkelas0001: { c: "bukanopsi1" },
    });
    expect(r.ok).toBe(false);
  });
});

describe("validasi per tipe", () => {
  const satu = (q: Question): FormDefinition => ({
    schemaVersion: 1,
    sections: [{ id: "secsatu001", title: "", items: [q] }],
  });
  const cek = (q: Question, value: unknown, files: Record<string, number> = {}) =>
    validateSection(satu(q).sections[0]!, { [q.id]: value as never }, files)[q.id];

  it("jawaban singkat: email, telepon, angka, panjang", () => {
    const base = { kind: "short_text" as const, id: "qteks00001", title: "T", required: true };
    expect(cek({ ...base, validation: { type: "email" } }, "bukan-email")).toBeDefined();
    expect(cek({ ...base, validation: { type: "email" } }, "a@b.id")).toBeUndefined();
    expect(cek({ ...base, validation: { type: "phone" } }, "0812-3456-7890")).toBeUndefined();
    expect(cek({ ...base, validation: { type: "phone" } }, "halo")).toBeDefined();
    expect(cek({ ...base, validation: { type: "number", min: 1, max: 5, integer: true } }, "3")).toBeUndefined();
    expect(cek({ ...base, validation: { type: "number", min: 1, max: 5, integer: true } }, "2,5")).toBeDefined();
    expect(cek({ ...base, validation: { type: "length", max: 3 } }, "abcd")).toBeDefined();
    expect(cek(base, "   ")).toBe("Pertanyaan ini wajib diisi.");
  });

  it("kotak centang: min/maks & Lainnya", () => {
    const q: Question = {
      kind: "checkboxes",
      id: "qcentang01",
      title: "C",
      required: true,
      other: true,
      minSelected: 2,
      options: [
        { id: "opa0000001", label: "A" },
        { id: "opb0000001", label: "B" },
      ],
    };
    expect(cek(q, { c: ["opa0000001"] })).toBe("Pilih minimal 2.");
    expect(cek(q, { c: ["opa0000001"], other: "Z" })).toBeUndefined();
  });

  it("kisi wajib: setiap baris harus dijawab", () => {
    const q: Question = {
      kind: "mc_grid",
      id: "qkisi00001",
      title: "K",
      required: true,
      rows: [
        { id: "baris00001", label: "R1" },
        { id: "baris00002", label: "R2" },
      ],
      columns: [{ id: "kolom00001", label: "C1" }],
    };
    expect(cek(q, { baris00001: "kolom00001" })).toBe("Jawab setiap baris.");
    expect(cek(q, { baris00001: "kolom00001", baris00002: "kolom00001" })).toBeUndefined();
  });

  it("tanggal, waktu, skala, berkas", () => {
    const tgl: Question = { kind: "date", id: "qtgl000001", title: "D", required: true, min: "2026-01-01" };
    expect(cek(tgl, "2026-02-30")).toBe("Tanggal tidak valid.");
    expect(cek(tgl, "2025-12-31")).toBe("Tanggal terlalu awal.");
    expect(cek({ kind: "time", id: "qjam000001", title: "J", required: true }, "24:00")).toBeDefined();
    const skala: Question = { kind: "linear_scale", id: "qskala0001", title: "S", required: true, min: 1, max: 5 };
    expect(cek(skala, 6)).toBeDefined();
    expect(cek(skala, 5)).toBeUndefined();
    const berkas: Question = {
      kind: "file_upload",
      id: "qberkas001",
      title: "F",
      required: true,
      accept: ["pdf"],
      maxFiles: 1,
      maxSizeMb: 5,
    };
    expect(cek(berkas, undefined, {})).toBe("Pertanyaan ini wajib diisi.");
    expect(cek(berkas, undefined, { qberkas001: 2 })).toBe("Maksimal 1 berkas.");
    expect(cek(berkas, undefined, { qberkas001: 1 })).toBeUndefined();
  });
});

describe("tampilan & ringkasan", () => {
  it("menampilkan label opsi dari versi lama bila opsi sudah dihapus", () => {
    const def = contoh();
    const lama = contoh();
    const q = def.sections[1]!.items[0] as Extract<Question, { kind: "dropdown" }>;
    q.options = q.options.filter((o) => o.id !== "opxi000001");
    expect(answerToText(q, { c: "opxi000001" })).toBe("(opsi dihapus)");
    expect(answerToText(q, { c: "opxi000001" }, { previous: lama })).toBe("XI");
  });

  it("menghitung pilihan dan sampel teks", () => {
    const def = contoh();
    const ringkas = summarize(def, [
      { qnama00001: "B", qperan0001: { c: "opsiswa001" } },
      { qnama00001: "A", qperan0001: { c: "opsiswa001" } },
      { qnama00001: "C", qperan0001: { c: "opguru0001" } },
    ]);
    const peran = ringkas.find((r) => r.question.id === "qperan0001");
    expect(peran?.kind).toBe("choice");
    if (peran?.kind === "choice") expect(peran.counts.map((c) => c.count)).toEqual([2, 1]);
    const nama = ringkas.find((r) => r.question.id === "qnama00001");
    if (nama?.kind === "text") expect(nama.latest).toEqual(["B", "A", "C"]);
  });
});

describe("CSV", () => {
  it("menetralkan formula dan mengutip sel", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("+62812")).toBe("'+62812");
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell("a;b", ";")).toBe('"a;b"');
    expect(csvCell("baris\r\nbaru")).toBe('"baris\nbaru"');
  });

  it("memakai BOM, waktu WIB, dan kolom (dihapus) untuk pertanyaan lama", () => {
    const def = contoh();
    const csv = buildCsv(
      def,
      [
        {
          submittedAt: "2026-10-25T01:02:03.000Z",
          editedAt: null,
          email: "a@b.id",
          answers: { qnama00001: "Budi", qhilang001: "x" },
          versionDefinition: {
            schemaVersion: 1,
            sections: [{ id: "seclama001", title: "", items: [{ kind: "short_text", id: "qhilang001", title: "Asal", required: false }] }],
          },
        },
      ],
      { delimiter: ";", includeEmail: true },
    );
    expect(csv.startsWith("﻿")).toBe(true);
    const [kepala, baris] = csv.slice(1).trim().split("\r\n");
    expect(kepala).toBe("Waktu kirim (WIB);Email;Nama lengkap;Anda siapa?;Kelas;Mata pelajaran;Asal (dihapus);Diubah (WIB)");
    expect(baris).toBe("25/10/2026 08.02.03;a@b.id;Budi;;;;x;");
    expect(formatWaktuCsv(null)).toBe("");
  });
});

describe("berkas", () => {
  it("mendeteksi PDF, gambar, dan docx; menolak zip tanpa ekstensi Office", () => {
    expect(detectFileType(new TextEncoder().encode("%PDF-1.7 ..."), "x.pdf")?.kind).toBe("pdf");
    expect(detectFileType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "a.jpg")?.kind).toBe("image");
    const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0]);
    expect(detectFileType(zip, "Tugas.DOCX")?.kind).toBe("document");
    expect(detectFileType(zip, "arsip.zip")).toBeNull();
    expect(detectFileType(new TextEncoder().encode("<script>"), "a.pdf")).toBeNull();
  });

  it("membersihkan nama berkas", () => {
    expect(sanitizeOriginalName("C:\\fakepath\\..\\bukti<1>.pdf")).toBe("bukti1.pdf");
    expect(sanitizeOriginalName("")).toBe("berkas");
  });
});

describe("token", () => {
  const rahasia = "rahasia-uji";
  const t0 = 1_800_000_000_000;

  it("menerima token sah dan menolak yang terlalu cepat, kedaluwarsa, palsu, atau formulir lain", () => {
    const token = signFormToken(rahasia, "form-a", 3, t0);
    expect(verifyFormToken(rahasia, token, "form-a", t0 + 10_000)).toEqual({ ok: true, version: 3 });
    expect(verifyFormToken(rahasia, token, "form-a", t0 + 1_000)).toEqual({ ok: false, reason: "too_fast" });
    expect(verifyFormToken(rahasia, token, "form-a", t0 + 25 * 3_600_000)).toEqual({ ok: false, reason: "expired" });
    expect(verifyFormToken(rahasia, token, "form-b", t0 + 10_000)).toEqual({ ok: false, reason: "wrong_form" });
    expect(verifyFormToken("lain", token, "form-a", t0 + 10_000)).toEqual({ ok: false, reason: "invalid" });
    expect(verifyFormToken(rahasia, token.replace(".3.", ".4."), "form-a", t0 + 10_000).ok).toBe(false);
  });

  it("token ubah berbentuk tetap dan di-hash", () => {
    const token = newEditToken();
    expect(token).toMatch(EDIT_TOKEN_PATTERN);
    expect(hashEditToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("email konfirmasi", () => {
  it("meng-escape isian peserta", () => {
    expect(escapeHtml(`<b>"x"&'`)).toBe("&lt;b&gt;&quot;x&quot;&amp;&#39;");
    const { html, text, subject } = buildConfirmationEmail({
      siteName: "Rohkris",
      eventTitle: "Retreat",
      definition: contoh(),
      answers: { qnama00001: "<script>alert(1)</script>" },
      editUrl: "https://contoh.id/ubah?a=1&b=2",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a=1&amp;b=2");
    expect(text).toContain("<script>alert(1)</script>");
    expect(subject).toBe("Pendaftaran Anda telah diterima: Retreat");
  });
});
