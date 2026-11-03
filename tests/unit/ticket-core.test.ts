// File: tests/unit/ticket-core.test.ts

import { describe, expect, it } from "vitest";

import { DEFAULT_FORM_SETTINGS, formSettingsSchema } from "@/lib/forms/definition-schema";
import type { FormDefinition } from "@/lib/forms/types";
import { buildQrPayload, generateQrDataUrl, generateQrSvg } from "@/lib/tickets/qr";
import {
  MAX_ATTENDEE_NAME_LENGTH,
  MAX_BENEFIT_KEY_LENGTH,
  MAX_BENEFIT_NAME_LENGTH,
  generateTicketCode,
  parseBenefitsConfig,
  parseScannedTicketCode,
  resolveAttendeeName,
  resolveAttendeeOrg,
  resolveAttendeePhone,
  signTicketCode,
  verifyScannedQrSignature,
} from "@/lib/tickets/ticket-code";

describe("Ticket Code & Security", () => {
  it("menghasilkan kode tiket dengan format ROH-<SLUG>-<6_CHARS>", () => {
    const code = generateTicketCode("ibadah-natal");
    expect(code).toMatch(/^ROH-IBADA-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);

    const fallbackCode = generateTicketCode("!@#$%");
    expect(fallbackCode).toMatch(/^ROH-EVT-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
  });

  it("menghasilkan HMAC signature 16 karakter yang deterministik", () => {
    const code = "ROH-NATAL-7X9B2C";
    const sig1 = signTicketCode(code);
    const sig2 = signTicketCode(code);
    expect(sig1).toHaveLength(16);
    expect(sig1).toBe(sig2);

    const sigOther = signTicketCode("ROH-NATAL-999999");
    expect(sigOther).not.toBe(sig1);
  });

  it("memverifikasi HMAC signature pada payload QR dan menolak payload palsu", () => {
    const code = "ROH-NATAL-7X9B2C";
    const validPayload = buildQrPayload(code);
    expect(verifyScannedQrSignature(validPayload)).toBe(true);

    // Signature dipalsukan
    expect(verifyScannedQrSignature(`ROHKRIS:TICKET:${code}:0000000000000000`)).toBe(false);

    // Kode tiket diubah tetapi memakai signature tiket lain
    const validSig = signTicketCode(code);
    expect(verifyScannedQrSignature(`ROHKRIS:TICKET:ROH-NATAL-HACKED:${validSig}`)).toBe(false);

    // Format QR tidak lengkap (tanpa signature)
    expect(verifyScannedQrSignature(`ROHKRIS:TICKET:${code}`)).toBe(false);
    expect(verifyScannedQrSignature(`ROHKRIS:TICKET:${code}:`)).toBe(false);

    // Kode manual atau URL tetap diizinkan untuk diverifikasi di database
    expect(verifyScannedQrSignature(code)).toBe(true);
    expect(verifyScannedQrSignature(`https://rohkris.sch.id/tiket/${code}`)).toBe(true);
    expect(verifyScannedQrSignature("")).toBe(false);
  });

  it("mengurai kode dari berbagai format scanner", () => {
    // Format 1: Format standar QR payload
    const payload = "ROHKRIS:TICKET:ROH-NATAL-7X9B2C:a1b2c3d4e5f67890";
    expect(parseScannedTicketCode(payload)).toBe("ROH-NATAL-7X9B2C");

    // Format 2: URL dengan query param code
    const urlWithCode = "https://rohkris.sch.id/admin/kegiatan/123/scan?code=ROH-NATAL-7X9B2C";
    expect(parseScannedTicketCode(urlWithCode)).toBe("ROH-NATAL-7X9B2C");

    // Format 2b: URL dengan path
    const urlWithPath = "https://rohkris.sch.id/tiket/ROH-NATAL-7X9B2C";
    expect(parseScannedTicketCode(urlWithPath)).toBe("ROH-NATAL-7X9B2C");

    // Format 3: Raw code dari barcode gun scanner
    const raw = "ROH-NATAL-7X9B2C";
    expect(parseScannedTicketCode(raw)).toBe("ROH-NATAL-7X9B2C");

    // Format lowercase
    expect(parseScannedTicketCode("roh-natal-7x9b2c")).toBe("ROH-NATAL-7X9B2C");

    // Invalid string
    expect(parseScannedTicketCode("")).toBeNull();
    expect(parseScannedTicketCode("halo-dunia-bukan-tiket")).toBeNull();
  });
});

describe("Benefits Configuration & Attendee Name Resolution", () => {
  it("mengurai konfigurasi kupon dari JSON, menghapus duplikat, dan membatasi panjang", () => {
    const customJson = JSON.stringify([
      { key: "konsumsi", name: "Kupon Konsumsi" },
      { key: "KONSUMSI", name: "Duplikat Konsumsi" },
      { key: "souvenir", name: "Souvenir Kaos" },
      { key: "k".repeat(100), name: "n".repeat(150) },
    ]);
    const parsed = parseBenefitsConfig(customJson);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]?.name).toBe("Kupon Konsumsi");
    expect(parsed[1]?.name).toBe("Souvenir Kaos");
    expect(parsed[2]?.key).toHaveLength(MAX_BENEFIT_KEY_LENGTH);
    expect(parsed[2]?.name).toHaveLength(MAX_BENEFIT_NAME_LENGTH);

    // Fallback default jika null / invalid / item kosong
    expect(parseBenefitsConfig(null)).toEqual([{ key: "konsumsi", name: "Kupon Konsumsi" }]);
    expect(parseBenefitsConfig("invalid-json")).toEqual([{ key: "konsumsi", name: "Kupon Konsumsi" }]);
    expect(parseBenefitsConfig("[]")).toEqual([{ key: "konsumsi", name: "Kupon Konsumsi" }]);
    expect(parseBenefitsConfig(JSON.stringify([{ key: " ", name: " " }]))).toEqual([
      { key: "konsumsi", name: "Kupon Konsumsi" },
    ]);
  });

  it("memvalidasi duplikasi dan batas panjang kunci kupon di formSettingsSchema", () => {
    const dupResult = formSettingsSchema.safeParse({
      ...DEFAULT_FORM_SETTINGS,
      ticketBenefitsConfig: [
        { key: "konsumsi", name: "Kupon Konsumsi" },
        { key: "Konsumsi", name: "Kupon Makan Siang" },
      ],
    });
    expect(dupResult.success).toBe(false);

    const tooLongKeyResult = formSettingsSchema.safeParse({
      ...DEFAULT_FORM_SETTINGS,
      ticketBenefitsConfig: [{ key: "x".repeat(65), name: "Kupon" }],
    });
    expect(tooLongKeyResult.success).toBe(false);
  });

  it("mendeteksi nama peserta dari jawaban formulir dan memotong nama > 120 karakter", () => {
    const def: FormDefinition = {
      schemaVersion: 1,
      sections: [
        {
          id: "sec1",
          title: "Bagian 1",
          items: [
            { kind: "short_text", id: "q_email", title: "Email", required: true },
            { kind: "short_text", id: "q_nama_lengkap", title: "Nama Lengkap Peserta", required: true },
            { kind: "short_text", id: "q_kelas", title: "Kelas", required: true },
          ],
        },
      ],
    };

    const answers = {
      q_email: "budi@example.com",
      q_nama_lengkap: "Budi Santoso",
      q_kelas: "XII RPL 1",
    };

    // Deteksi otomatis menemukan field bernama "Nama Lengkap Peserta"
    expect(resolveAttendeeName(answers, def)).toBe("Budi Santoso");

    // Menggunakan custom question id
    expect(resolveAttendeeName(answers, def, "q_kelas")).toBe("XII RPL 1");

    // Memotong nama yang melebihi 120 karakter (batas VARCHAR(120) di database)
    const namaPanjang = "A".repeat(250);
    const resolvedPanjang = resolveAttendeeName({ q_nama_lengkap: namaPanjang }, def);
    expect(resolvedPanjang).toHaveLength(MAX_ATTENDEE_NAME_LENGTH);

    // Fallback jika tidak ada pertanyaan bernama nama
    const defTanpaNama: FormDefinition = {
      schemaVersion: 1,
      sections: [
        {
          id: "sec1",
          title: "Bagian 1",
          items: [{ kind: "short_text", id: "q_id", title: "NIS", required: true }],
        },
      ],
    };
    expect(resolveAttendeeName({ q_id: "12345" }, defTanpaNama)).toBe("12345");
  });

  it("mendeteksi nomor telepon/WhatsApp dan asal instansi/sekolah", () => {
    const def: FormDefinition = {
      schemaVersion: 1,
      sections: [
        {
          id: "sec1",
          title: "Data Diri",
          items: [
            { kind: "short_text", id: "q_wa", title: "Nomor WhatsApp", required: true },
            { kind: "short_text", id: "q_asal", title: "Asal Sekolah", required: true },
          ],
        },
      ],
    };

    const answers = {
      q_wa: "081234567890",
      q_asal: "SMK Plus Pelita Nusantara",
    };

    expect(resolveAttendeePhone(answers, def)).toBe("081234567890");
    expect(resolveAttendeeOrg(answers, def)).toBe("SMK Plus Pelita Nusantara");

    // Fallback jika tidak ada pertanyaan telepon/asal
    const defKosong: FormDefinition = { schemaVersion: 1, sections: [] };
    expect(resolveAttendeePhone({}, defKosong)).toBeNull();
    expect(resolveAttendeeOrg({}, defKosong)).toBe("SMK PLUS PELITA NUSANTARA");
  });
});

describe("QR Code Generation", () => {
  it("menghasilkan Data URL gambar QR code valid", async () => {
    const dataUrl = await generateQrDataUrl("ROH-NATAL-7X9B2C");
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("menghasilkan SVG QR code valid", async () => {
    const svg = await generateQrSvg("ROH-NATAL-7X9B2C");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });
});
