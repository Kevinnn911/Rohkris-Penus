import { describe, expect, it } from "vitest";

import {
  eventFormSchema,
  safeFileName,
  slugify,
  validateUploadFile,
} from "@/lib/validation/schemas";

function validEvent() {
  return {
    title: "Ibadah Natal 2026",
    slug: "ibadah-natal-2026",
    category: "Natal" as const,
    summary: "",
    description: "",
    cover_image_url: "",
    start_at: "2026-12-20T18:00",
    end_at: "2026-12-20T21:00",
    location: "Aula Sekolah",
    event_mode: "offline" as const,
    registration_url: "https://forms.gle/contoh",
    registration_open_at: "",
    registration_close_at: "",
    registration_status: "open" as const,
    cost_info: "",
    dress_code: "",
    participant_rules: "",
    contact_info: "",
    resource_url: "",
    is_featured: false,
    status: "published" as const,
  };
}

describe("eventFormSchema", () => {
  it("menerima data yang valid", () => {
    expect(eventFormSchema.safeParse(validEvent()).success).toBe(true);
  });

  it("mengubah string kosong menjadi null", () => {
    const parsed = eventFormSchema.parse(validEvent());
    expect(parsed.summary).toBeNull();
    expect(parsed.cover_image_url).toBeNull();
  });

  it("menolak slug dengan spasi atau huruf besar", () => {
    expect(eventFormSchema.safeParse({ ...validEvent(), slug: "Slug Salah" }).success).toBe(false);
  });

  it("menolak judul terlalu pendek", () => {
    expect(eventFormSchema.safeParse({ ...validEvent(), title: "ab" }).success).toBe(false);
  });

  it("menolak tautan non-https", () => {
    const result = eventFormSchema.safeParse({
      ...validEvent(),
      registration_url: "http://forms.gle/x",
    });
    expect(result.success).toBe(false);
  });

  it("menolak waktu selesai sebelum waktu mulai", () => {
    const result = eventFormSchema.safeParse({
      ...validEvent(),
      start_at: "2026-12-20T21:00",
      end_at: "2026-12-20T18:00",
    });
    expect(result.success).toBe(false);
  });

  it("menolak status pendaftaran 'open' tanpa tautan", () => {
    const result = eventFormSchema.safeParse({
      ...validEvent(),
      registration_status: "open",
      registration_url: "",
    });
    expect(result.success).toBe(false);
  });

  it("mengizinkan tanpa tautan bila pendaftaran tidak dibuka", () => {
    const result = eventFormSchema.safeParse({
      ...validEvent(),
      registration_status: "not_open",
      registration_url: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("slugify", () => {
  it("membuat slug dari judul berbahasa Indonesia", () => {
    expect(slugify("Ibadah Natal 2026!")).toBe("ibadah-natal-2026");
  });

  it("merapikan spasi dan tanda hubung berlebih", () => {
    expect(slugify("  Retreat   Pemuda -- 2026  ")).toBe("retreat-pemuda-2026");
  });

  it("menghasilkan string kosong untuk input tanpa karakter valid", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("validateUploadFile", () => {
  it("menerima gambar yang diizinkan", () => {
    expect(validateUploadFile({ type: "image/jpeg", size: 1000 }).ok).toBe(true);
  });

  it("menolak tipe yang tidak diizinkan", () => {
    const result = validateUploadFile({ type: "application/x-msdownload", size: 1000 });
    expect(result.ok).toBe(false);
  });

  it("menolak berkas melebihi 5 MB", () => {
    const result = validateUploadFile({ type: "image/png", size: 6 * 1024 * 1024 });
    expect(result.ok).toBe(false);
  });
});

describe("safeFileName", () => {
  it("membersihkan nama berkas dan mempertahankan ekstensi", () => {
    expect(safeFileName("Poster Natal (final).PNG", "abc123")).toBe("poster-natal-final-abc123.png");
  });

  it("menetralkan upaya path traversal", () => {
    const hasil = safeFileName("../../etc/passwd.png", "x1");
    expect(hasil).not.toContain("..");
    expect(hasil).not.toContain("/");
  });
});
