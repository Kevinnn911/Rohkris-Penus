import { describe, expect, it } from "vitest";

import { DUMMY_HASH, hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  UPLOAD_PATH_PATTERN,
  detectImageType,
  eventFormSchema,
  mediaFormSchema,
} from "@/lib/validation/schemas";

describe("hash kata sandi", () => {
  it("memverifikasi kata sandi yang benar dan menolak yang salah", async () => {
    const hash = await hashPassword("kata-sandi-rahasia");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("kata-sandi-rahasia", hash)).toBe(true);
    expect(await verifyPassword("kata-sandi-salah", hash)).toBe(false);
  });

  it("menghasilkan salt berbeda untuk kata sandi yang sama", async () => {
    const [a, b] = await Promise.all([hashPassword("sama-persis-123"), hashPassword("sama-persis-123")]);
    expect(a).not.toBe(b);
  });

  it("menolak hash rusak dan hash palsu tanpa melempar error", async () => {
    expect(await verifyPassword("apa saja", "bukan-hash")).toBe(false);
    expect(await verifyPassword("apa saja", "scrypt$0$8$1$AA==$AA==")).toBe(false);
    expect(await verifyPassword("apa saja", DUMMY_HASH)).toBe(false);
  });
});

describe("deteksi jenis gambar dari isi berkas", () => {
  const bytes = (...values: number[]) => new Uint8Array(values);
  const ascii = (text: string) => Array.from(text, (c) => c.charCodeAt(0));

  it("mengenali JPG, PNG, WebP, dan AVIF", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))?.ext).toBe("jpg");
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.ext).toBe("png");
    expect(detectImageType(bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")))?.ext).toBe("webp");
    expect(detectImageType(bytes(0, 0, 0, 0x1c, ...ascii("ftypavif")))?.ext).toBe("avif");
  });

  it("menolak berkas yang bukan gambar meski diberi nama .jpg", () => {
    expect(detectImageType(bytes(...ascii("<svg onload=alert(1)>")))).toBeNull();
    expect(detectImageType(bytes(...ascii("<?php echo 1; ?>")))).toBeNull();
    expect(detectImageType(bytes())).toBeNull();
  });
});

describe("path unggahan lokal", () => {
  it("menerima path unggahan yang valid", () => {
    expect(UPLOAD_PATH_PATTERN.test("/uploads/2026/10/poster-natal-abc123.jpg")).toBe(true);
  });

  it("menolak path traversal, query string, dan ekstensi lain", () => {
    for (const path of [
      "/uploads/../.env.local",
      "/uploads/a.jpg?x=1",
      "/uploads/gambar.svg",
      "/uploads/a b.png",
      "/etc/passwd",
    ]) {
      expect(UPLOAD_PATH_PATTERN.test(path)).toBe(false);
    }
  });

  it("form media & kegiatan menerima unggahan lokal maupun https, menolak http", () => {
    const media = {
      title: "",
      caption: "",
      alt_text: "Foto ibadah bersama",
      media_type: "image",
      event_id: "",
      taken_at: "",
      sort_order: "0",
      status: "draft",
    };
    expect(mediaFormSchema.safeParse({ ...media, media_url: "/uploads/2026/10/foto.webp" }).success).toBe(true);
    expect(mediaFormSchema.safeParse({ ...media, media_url: "https://contoh.id/foto.jpg" }).success).toBe(true);
    expect(mediaFormSchema.safeParse({ ...media, media_url: "http://contoh.id/foto.jpg" }).success).toBe(false);

    const kegiatan = {
      title: "Ibadah Natal 2026",
      slug: "ibadah-natal-2026",
      category: "Natal",
      summary: "",
      description: "",
      start_at: "2026-12-20T18:00",
      end_at: "2026-12-20T21:00",
      location: "Aula",
      event_mode: "offline",
      registration_url: "",
      registration_open_at: "",
      registration_close_at: "",
      registration_status: "not_open",
      cost_info: "",
      dress_code: "",
      participant_rules: "",
      contact_info: "",
      resource_url: "",
      is_featured: false,
      status: "draft",
    };
    expect(eventFormSchema.safeParse({ ...kegiatan, cover_image_url: "/uploads/2026/10/poster.png" }).success).toBe(true);
    expect(eventFormSchema.safeParse({ ...kegiatan, cover_image_url: "/uploads/../rahasia.png" }).success).toBe(false);
  });
});
