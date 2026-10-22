/**
 * Format tanggal/waktu dalam Bahasa Indonesia dengan zona Asia/Jakarta.
 *
 * Database menyimpan timestamp dalam UTC; seluruh tampilan dikonversi ke WIB
 * (PRD §10 dan §16). Semua fungsi menerima string ISO dan tahan terhadap nilai
 * null/invalid agar halaman tidak pernah crash karena data belum lengkap.
 */

export const TIMEZONE = "Asia/Jakarta";
const LOCALE = "id-ID";

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Contoh: "Sabtu, 20 Desember 2025" */
export function formatTanggal(value: string | null | undefined): string | null {
  const date = toDate(value);
  if (!date) return null;
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIMEZONE,
  }).format(date);
}

/** Contoh: "20 Des 2025" — untuk kartu dan daftar ringkas. */
export function formatTanggalSingkat(value: string | null | undefined): string | null {
  const date = toDate(value);
  if (!date) return null;
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIMEZONE,
  }).format(date);
}

/** Contoh: "19.30 WIB" */
export function formatJam(value: string | null | undefined): string | null {
  const date = toDate(value);
  if (!date) return null;
  const jam = new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  }).format(date);
  return `${jam} WIB`;
}

/**
 * Rentang waktu kegiatan yang mudah dipindai.
 * Mengembalikan null bila tanggal mulai belum ditentukan, sehingga pemanggil
 * dapat menampilkan label "Tanggal segera diumumkan" (PRD §FR-04).
 */
export function formatRentangKegiatan(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
): string | null {
  const start = toDate(startAt);
  if (!start) return null;

  const end = toDate(endAt);
  const tanggalMulai = formatTanggal(startAt);
  const jamMulai = formatJam(startAt);

  if (!end) return `${tanggalMulai} • ${jamMulai}`;

  const sameDay =
    new Intl.DateTimeFormat(LOCALE, { dateStyle: "short", timeZone: TIMEZONE }).format(start) ===
    new Intl.DateTimeFormat(LOCALE, { dateStyle: "short", timeZone: TIMEZONE }).format(end);

  if (sameDay) {
    const jamSelesai = new Intl.DateTimeFormat(LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: TIMEZONE,
    }).format(end);
    return `${tanggalMulai} • ${jamMulai?.replace(" WIB", "")}–${jamSelesai} WIB`;
  }

  return `${formatTanggalSingkat(startAt)} – ${formatTanggalSingkat(endAt)}`;
}

/** Nilai untuk atribut dateTime pada elemen <time>. */
export function toDateTimeAttr(value: string | null | undefined): string | undefined {
  const date = toDate(value);
  return date ? date.toISOString() : undefined;
}

/** Mengubah timestamp UTC menjadi nilai untuk <input type="datetime-local"> dalam WIB. */
export function toDatetimeLocalValue(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIMEZONE,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/**
 * Kebalikan dari toDatetimeLocalValue: menafsirkan input admin sebagai WIB
 * lalu mengubahnya ke ISO UTC untuk disimpan.
 */
export function fromDatetimeLocalValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  // WIB = UTC+7, tanpa daylight saving.
  const utcMs = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour) - 7,
    Number(minute),
  );
  const date = new Date(utcMs);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
