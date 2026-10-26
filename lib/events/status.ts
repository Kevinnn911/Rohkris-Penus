import type { EventRow } from "@/lib/db/types";

/**
 * Satu sumber kebenaran untuk status pendaftaran sebuah kegiatan.
 *
 * Fungsi di file ini sengaja MURNI (tanpa I/O, waktu disuntikkan lewat
 * parameter `now`) supaya bisa diuji menyeluruh — lihat tests/unit/status.test.ts.
 *
 * Aturan dari prompt §7 dan PRD §FR-03:
 *  - CTA "Daftar Sekarang" HANYA muncul bila pendaftaran benar-benar terbuka
 *    DAN (mode eksternal: registration_url ada & valid HTTPS;
 *         mode internal: formulir berisi pertanyaan & kuota belum penuh).
 *  - Pendaftaran tutup  → tampilkan label, bukan tombol rusak.
 *  - Link kosong        → jangan tampilkan tombol yang mengarah ke mana-mana.
 */

export type RegistrationState =
  | "daftar_terbuka"
  | "segera_dibuka"
  | "pendaftaran_ditutup"
  | "selesai"
  | "dibatalkan"
  | "kuota_penuh"
  | "tanpa_pendaftaran";

/** Ringkasan formulir internal yang dibutuhkan untuk menentukan status. */
export type InternalFormSummary = {
  questionCount: number;
  quota: number | null;
  responseCount: number;
};

/** Field yang relevan saja — memudahkan pengujian tanpa objek event penuh. */
export type EventRegistrationInput = Pick<
  EventRow,
  | "status"
  | "registration_status"
  | "registration_url"
  | "registration_open_at"
  | "registration_close_at"
  | "start_at"
  | "end_at"
> & {
  /** Hilang = "external" (data lama / pemanggil yang belum tahu mode internal). */
  registration_mode?: EventRow["registration_mode"];
  /** Formulir internal (null/hilang bila belum dibuat). Hanya dipakai pada mode internal. */
  form?: InternalFormSummary | null;
};

/**
 * URL pendaftaran dianggap valid hanya bila HTTPS.
 * HTTP ditolak agar data yang diisi siswa tidak terkirim tanpa enkripsi.
 */
export function isValidRegistrationUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed === "") return false;

  try {
    return new URL(trimmed).protocol === "https:";
  } catch {
    return false;
  }
}

function toTime(value: string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/** Kegiatan dianggap sudah lewat bila waktu selesai (atau mulai) ada di masa lalu. */
export function isPastEvent(
  event: Pick<EventRow, "start_at" | "end_at">,
  now: Date = new Date(),
): boolean {
  const end = toTime(event.end_at) ?? toTime(event.start_at);
  if (end === null) return false;
  return end < now.getTime();
}

/** Menentukan status pendaftaran efektif pada waktu tertentu. */
export function getRegistrationState(
  event: EventRegistrationInput,
  now: Date = new Date(),
): RegistrationState {
  return hitungStatus(event, now, true);
}

/**
 * Inti penentuan status. `cekKuota` dimatikan saat memeriksa izin mengubah
 * jawaban: peserta yang sudah terdaftar tetap boleh mengubah jawabannya
 * meski kuota sudah penuh.
 */
function hitungStatus(
  event: EventRegistrationInput,
  now: Date,
  cekKuota: boolean,
): RegistrationState {
  // Status kegiatan selalu menang atas status pendaftaran.
  if (event.status === "cancelled") return "dibatalkan";

  const nowMs = now.getTime();
  const opensAt = toTime(event.registration_open_at);
  const closesAt = toTime(event.registration_close_at);

  // Kegiatan yang sudah lewat tidak pernah menampilkan CTA daftar.
  if (isPastEvent(event, now)) return "selesai";

  switch (event.registration_status) {
    case "not_open":
      // Ada jadwal buka di masa depan → "segera dibuka"; selain itu tanpa pendaftaran.
      return opensAt !== null && opensAt > nowMs
        ? "segera_dibuka"
        : "tanpa_pendaftaran";

    case "closed":
      return "pendaftaran_ditutup";

    case "open":
    case "external_only": {
      // Jadwal (bila diisi) membatasi status "open".
      if (opensAt !== null && nowMs < opensAt) return "segera_dibuka";
      if (closesAt !== null && nowMs > closesAt) return "pendaftaran_ditutup";

      // Terbuka tetapi tanpa tautan yang valid → jangan janjikan pendaftaran.
      if (event.registration_mode === "internal") {
        // Formulir belum dibuat / belum berisi pertanyaan: belum ada yang bisa diisi.
        if (!event.form || event.form.questionCount === 0) return "tanpa_pendaftaran";
        if (cekKuota && event.form.quota !== null && event.form.responseCount >= event.form.quota) {
          return "kuota_penuh";
        }
        return "daftar_terbuka";
      }

      if (!isValidRegistrationUrl(event.registration_url)) {
        return "tanpa_pendaftaran";
      }
      return "daftar_terbuka";
    }

    default:
      return "tanpa_pendaftaran";
  }
}

export type RegistrationCta = {
  href: string;
  /** true = tautan luar (buka di tab baru); false = formulir internal di situs ini. */
  external: boolean;
};

/**
 * Tujuan tombol "Daftar Sekarang", atau null bila tombol tidak layak tampil.
 * Mode internal mengarah ke /kegiatan/[slug]/daftar.
 */
export function getRegistrationCta(
  event: EventRegistrationInput & Pick<EventRow, "slug">,
  now: Date = new Date(),
): RegistrationCta | null {
  if (getRegistrationState(event, now) !== "daftar_terbuka") return null;
  if (event.registration_mode === "internal") {
    return { href: `/kegiatan/${event.slug}/daftar`, external: false };
  }
  if (!event.registration_url || !isValidRegistrationUrl(event.registration_url)) return null;
  return { href: event.registration_url.trim(), external: true };
}

/** True hanya bila tombol "Daftar Sekarang" layak ditampilkan. */
export function canShowRegistrationCta(
  event: EventRegistrationInput,
  now: Date = new Date(),
): boolean {
  if (getRegistrationState(event, now) !== "daftar_terbuka") return false;
  return event.registration_mode === "internal" || isValidRegistrationUrl(event.registration_url);
}

/**
 * Bolehkah peserta mengubah jawaban formulir internal sekarang?
 * Sama dengan "pendaftaran dibuka", tetapi kuota penuh tidak menghalangi.
 */
export function canEditResponse(event: EventRegistrationInput, now: Date = new Date()): boolean {
  return event.registration_mode === "internal" && hitungStatus(event, now, false) === "daftar_terbuka";
}

export interface RegistrationLabel {
  text: string;
  tone: "success" | "warning" | "danger" | "neutral" | "info";
  /** Keterangan tambahan untuk pembaca layar / teks pendukung. */
  hint?: string;
}

/** Label berbahasa Indonesia untuk setiap status. */
export function getRegistrationLabel(state: RegistrationState): RegistrationLabel {
  switch (state) {
    case "daftar_terbuka":
      return { text: "Pendaftaran Dibuka", tone: "success" };
    case "segera_dibuka":
      return {
        text: "Segera Dibuka",
        tone: "info",
        hint: "Pendaftaran belum dibuka. Pantau halaman ini untuk pembaruan.",
      };
    case "pendaftaran_ditutup":
      return {
        text: "Pendaftaran Ditutup",
        tone: "warning",
        hint: "Masa pendaftaran untuk kegiatan ini sudah berakhir.",
      };
    case "selesai":
      return { text: "Kegiatan Selesai", tone: "neutral" };
    case "dibatalkan":
      return {
        text: "Kegiatan Dibatalkan",
        tone: "danger",
        hint: "Kegiatan ini dibatalkan oleh panitia.",
      };
    case "kuota_penuh":
      return {
        text: "Kuota Penuh",
        tone: "warning",
        hint: "Kuota peserta untuk kegiatan ini sudah terpenuhi.",
      };
    case "tanpa_pendaftaran":
      return {
        text: "Tanpa Pendaftaran",
        tone: "neutral",
        hint: "Kegiatan ini terbuka tanpa perlu mendaftar lebih dulu.",
      };
  }
}

/** Label singkat status kegiatan untuk badge pada kartu. */
export function getEventStatusLabel(event: Pick<EventRow, "status" | "start_at" | "end_at">, now: Date = new Date()) {
  if (event.status === "cancelled") {
    return { text: "Dibatalkan", tone: "danger" as const };
  }
  if (event.status === "archived" || isPastEvent(event, now)) {
    return { text: "Selesai", tone: "neutral" as const };
  }
  return { text: "Akan Datang", tone: "info" as const };
}
