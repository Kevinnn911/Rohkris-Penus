import { describe, expect, it } from "vitest";

import {
  formatJam,
  formatTanggal,
  formatTanggalSingkat,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/format/date";

describe("format tanggal Indonesia (WIB)", () => {
  // 2026-12-20T13:00Z = 20 Des 2026 pukul 20.00 WIB
  const iso = "2026-12-20T13:00:00.000Z";

  it("menampilkan tanggal lengkap dalam Bahasa Indonesia", () => {
    const hasil = formatTanggal(iso);
    expect(hasil).toContain("Desember");
    expect(hasil).toContain("2026");
    expect(hasil).toContain("20");
  });

  it("menampilkan tanggal singkat", () => {
    expect(formatTanggalSingkat(iso)).toContain("2026");
  });

  it("mengonversi jam ke WIB", () => {
    expect(formatJam(iso)).toBe("20.00 WIB");
  });

  it("mengembalikan null untuk nilai kosong atau tidak valid", () => {
    expect(formatTanggal(null)).toBeNull();
    expect(formatTanggal("bukan-tanggal")).toBeNull();
    expect(formatJam(undefined)).toBeNull();
  });
});

describe("konversi datetime-local (WIB) ↔ ISO UTC", () => {
  it("menampilkan timestamp UTC sebagai waktu WIB untuk input form", () => {
    expect(toDatetimeLocalValue("2026-12-20T13:00:00.000Z")).toBe("2026-12-20T20:00");
  });

  it("menafsirkan input form sebagai WIB lalu menyimpannya sebagai UTC", () => {
    expect(fromDatetimeLocalValue("2026-12-20T20:00")).toBe("2026-12-20T13:00:00.000Z");
  });

  it("bolak-balik tanpa kehilangan nilai", () => {
    const asal = "2026-07-01T03:30:00.000Z";
    expect(fromDatetimeLocalValue(toDatetimeLocalValue(asal))).toBe(asal);
  });

  it("menangani pergantian hari saat konversi zona waktu", () => {
    // 20.00 WIB tanggal 1 = 13.00 UTC tanggal 1
    expect(fromDatetimeLocalValue("2026-07-01T01:00")).toBe("2026-06-30T18:00:00.000Z");
  });

  it("aman untuk nilai kosong", () => {
    expect(toDatetimeLocalValue(null)).toBe("");
    expect(fromDatetimeLocalValue("")).toBeNull();
    expect(fromDatetimeLocalValue("sembarang")).toBeNull();
  });
});
