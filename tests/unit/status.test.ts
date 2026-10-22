import { describe, expect, it } from "vitest";

import {
  canShowRegistrationCta,
  getRegistrationState,
  isPastEvent,
  isValidRegistrationUrl,
  type EventRegistrationInput,
} from "@/lib/events/status";

const NOW = new Date("2026-06-15T10:00:00.000Z");

function makeEvent(overrides: Partial<EventRegistrationInput> = {}): EventRegistrationInput {
  return {
    status: "published",
    registration_status: "open",
    registration_url: "https://forms.gle/contoh",
    registration_open_at: null,
    registration_close_at: null,
    start_at: "2026-07-01T03:00:00.000Z",
    end_at: "2026-07-01T07:00:00.000Z",
    ...overrides,
  };
}

describe("isValidRegistrationUrl", () => {
  it("menerima URL https", () => {
    expect(isValidRegistrationUrl("https://forms.gle/abc")).toBe(true);
  });

  it("menolak http, kosong, null, dan string sembarang", () => {
    expect(isValidRegistrationUrl("http://forms.gle/abc")).toBe(false);
    expect(isValidRegistrationUrl("")).toBe(false);
    expect(isValidRegistrationUrl("   ")).toBe(false);
    expect(isValidRegistrationUrl(null)).toBe(false);
    expect(isValidRegistrationUrl(undefined)).toBe(false);
    expect(isValidRegistrationUrl("bukan-url")).toBe(false);
  });

  it("menolak skema berbahaya", () => {
    expect(isValidRegistrationUrl("javascript:alert(1)")).toBe(false);
    expect(isValidRegistrationUrl("data:text/html,<script>")).toBe(false);
  });
});

describe("isPastEvent", () => {
  it("benar bila sudah lewat", () => {
    expect(
      isPastEvent({ start_at: "2026-01-01T00:00:00Z", end_at: "2026-01-01T03:00:00Z" }, NOW),
    ).toBe(true);
  });

  it("salah bila akan datang", () => {
    expect(
      isPastEvent({ start_at: "2026-12-01T00:00:00Z", end_at: null }, NOW),
    ).toBe(false);
  });

  it("salah bila tanggal belum ditentukan", () => {
    expect(isPastEvent({ start_at: null, end_at: null }, NOW)).toBe(false);
  });
});

describe("getRegistrationState", () => {
  it("terbuka bila status open dan URL valid", () => {
    expect(getRegistrationState(makeEvent(), NOW)).toBe("daftar_terbuka");
  });

  it("status kegiatan dibatalkan mengalahkan status pendaftaran", () => {
    expect(
      getRegistrationState(makeEvent({ status: "cancelled" }), NOW),
    ).toBe("dibatalkan");
  });

  it("kegiatan yang sudah lewat tidak pernah terbuka", () => {
    expect(
      getRegistrationState(
        makeEvent({ start_at: "2026-01-01T00:00:00Z", end_at: "2026-01-01T02:00:00Z" }),
        NOW,
      ),
    ).toBe("selesai");
  });

  it("open tanpa URL valid jatuh ke tanpa_pendaftaran, bukan daftar_terbuka", () => {
    expect(getRegistrationState(makeEvent({ registration_url: null }), NOW)).toBe(
      "tanpa_pendaftaran",
    );
    expect(
      getRegistrationState(makeEvent({ registration_url: "http://forms.gle/x" }), NOW),
    ).toBe("tanpa_pendaftaran");
  });

  it("menghormati jadwal buka/tutup pendaftaran", () => {
    expect(
      getRegistrationState(
        makeEvent({ registration_open_at: "2026-06-20T00:00:00Z" }),
        NOW,
      ),
    ).toBe("segera_dibuka");

    expect(
      getRegistrationState(
        makeEvent({ registration_close_at: "2026-06-10T00:00:00Z" }),
        NOW,
      ),
    ).toBe("pendaftaran_ditutup");
  });

  it("not_open dengan jadwal mendatang menjadi segera_dibuka", () => {
    expect(
      getRegistrationState(
        makeEvent({
          registration_status: "not_open",
          registration_open_at: "2026-06-20T00:00:00Z",
        }),
        NOW,
      ),
    ).toBe("segera_dibuka");
  });

  it("not_open tanpa jadwal menjadi tanpa_pendaftaran", () => {
    expect(
      getRegistrationState(makeEvent({ registration_status: "not_open" }), NOW),
    ).toBe("tanpa_pendaftaran");
  });

  it("closed selalu pendaftaran_ditutup", () => {
    expect(
      getRegistrationState(makeEvent({ registration_status: "closed" }), NOW),
    ).toBe("pendaftaran_ditutup");
  });
});

describe("canShowRegistrationCta — aturan paling kritis", () => {
  it("menampilkan CTA hanya saat benar-benar terbuka dengan URL https", () => {
    expect(canShowRegistrationCta(makeEvent(), NOW)).toBe(true);
  });

  it.each([
    ["URL kosong", makeEvent({ registration_url: null })],
    ["URL http", makeEvent({ registration_url: "http://x.id" })],
    ["URL javascript:", makeEvent({ registration_url: "javascript:alert(1)" })],
    ["pendaftaran ditutup", makeEvent({ registration_status: "closed" })],
    ["belum dibuka", makeEvent({ registration_status: "not_open" })],
    ["kegiatan dibatalkan", makeEvent({ status: "cancelled" })],
    [
      "kegiatan sudah lewat",
      makeEvent({ start_at: "2026-01-01T00:00:00Z", end_at: "2026-01-01T01:00:00Z" }),
    ],
    [
      "sudah lewat masa tutup",
      makeEvent({ registration_close_at: "2026-06-01T00:00:00Z" }),
    ],
  ])("tidak menampilkan CTA ketika %s", (_label, event) => {
    expect(canShowRegistrationCta(event, NOW)).toBe(false);
  });
});
