// File: lib/tickets/ticket-code.ts

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { TicketBenefitConfig } from "@/lib/db/types";
import { getAdminSecretKey } from "@/lib/env";
import { allQuestions, type FormDefinition, type StoredAnswers } from "@/lib/forms/types";

export const DEFAULT_TICKET_BENEFITS: TicketBenefitConfig[] = [
  { key: "konsumsi", name: "Kupon Konsumsi" },
];

export const MAX_ATTENDEE_NAME_LENGTH = 120;
export const MAX_BENEFIT_KEY_LENGTH = 64;
export const MAX_BENEFIT_NAME_LENGTH = 100;

/**
 * Format kode tiket human-readable:
 * ROH-<EVENT_PREFIX>-<RANDOM_CHARS>
 * Contoh: ROH-NATAL-7X9B2C
 */
export function generateTicketCode(eventSlug: string): string {
  const cleanSlug = eventSlug
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 5)
    .toUpperCase();
  const prefix = cleanSlug || "EVT";
  // Karakter yang tidak ambigu (tanpa 0/O, 1/I)
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(4);
  let rand = "";
  for (let i = 0; i < 6; i++) {
    rand += chars[bytes[i % bytes.length]! % chars.length];
  }
  return `ROH-${prefix}-${rand}`;
}

/**
 * Membuat HMAC signature untuk validasi keaslian tiket.
 */
export function signTicketCode(ticketCode: string): string {
  const secret = getAdminSecretKey();
  return createHmac("sha256", secret).update(ticketCode.trim().toUpperCase()).digest("hex").slice(0, 16);
}

/**
 * Memverifikasi keaslian HMAC signature pada payload QR ("ROHKRIS:TICKET:<code>:<sig>").
 * Jika input adalah kode manual ("ROH-XXXX-YYYYYY") atau URL, mengembalikan true.
 * Jika input berformat payload QR tetapi signature hilang atau tidak cocok, mengembalikan false.
 */
export function verifyScannedQrSignature(scannedText: string): boolean {
  const trimmed = scannedText.trim();
  if (!trimmed) return false;

  if (trimmed.toUpperCase().startsWith("ROHKRIS:TICKET:")) {
    const parts = trimmed.split(":");
    if (parts.length < 4 || !parts[2]?.trim() || !parts[3]?.trim()) {
      return false;
    }
    const code = parts[2].trim().toUpperCase();
    const providedSig = parts[3].trim().toLowerCase();
    const expectedSig = signTicketCode(code).toLowerCase();

    const bufProvided = Buffer.from(providedSig, "utf8");
    const bufExpected = Buffer.from(expectedSig, "utf8");
    if (bufProvided.length !== bufExpected.length) {
      return false;
    }
    return timingSafeEqual(bufProvided, bufExpected);
  }

  return true;
}

/**
 * Memvalidasi payload QR code dan mengekstrak kode tiket.
 * Menerima:
 * - "ROHKRIS:TICKET:<code_tiket>:<signature>"
 * - URL lengkap yang memuat kode tiket
 * - Kode tiket langsung "ROH-XXXX-YYYYYY"
 */
export function parseScannedTicketCode(scannedText: string): string | null {
  const trimmed = scannedText.trim();
  if (!trimmed) return null;

  // Format 1: ROHKRIS:TICKET:<code>:<sig>
  if (trimmed.toUpperCase().startsWith("ROHKRIS:TICKET:")) {
    const parts = trimmed.split(":");
    if (parts.length >= 3 && parts[2]?.trim()) {
      return parts[2].trim().toUpperCase();
    }
  }

  // Format 2: URL containing code query param or path
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      const codeParam = url.searchParams.get("code") || url.searchParams.get("ticket");
      if (codeParam) return codeParam.trim().toUpperCase();
      const segments = url.pathname.split("/").filter(Boolean);
      const last = segments[segments.length - 1];
      if (last && /^ROH-[A-Z0-9]+-[A-Z0-9]+$/i.test(last)) {
        return last.trim().toUpperCase();
      }
    } catch {
      // bukan URL valid, abaikan
    }
  }

  // Format 3: Raw ticket code (misal dari gun scanner atau ketikan panitia)
  const match = trimmed.match(/ROH-[A-Z0-9]+-[A-Z0-9]+/i);
  if (match) {
    return match[0].toUpperCase();
  }

  return null;
}

/**
 * Mengurai konfigurasi kupon/benefit dari teks JSON di event_forms.
 * Menghapus kunci duplikat dan membatasi panjang sesuai skema kolom database.
 */
export function parseBenefitsConfig(raw: string | null | undefined): TicketBenefitConfig[] {
  if (!raw || !raw.trim()) return DEFAULT_TICKET_BENEFITS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const seen = new Set<string>();
      const valid: TicketBenefitConfig[] = [];
      for (const b of parsed) {
        if (
          typeof b === "object" &&
          b !== null &&
          typeof b.key === "string" &&
          typeof b.name === "string"
        ) {
          const cleanKey = b.key.trim().toLowerCase().slice(0, MAX_BENEFIT_KEY_LENGTH);
          const cleanName = b.name.trim().slice(0, MAX_BENEFIT_NAME_LENGTH);
          if (cleanKey.length > 0 && cleanName.length > 0 && !seen.has(cleanKey)) {
            seen.add(cleanKey);
            valid.push({ key: cleanKey, name: cleanName });
          }
        }
      }
      if (valid.length > 0) return valid;
    }
  } catch {
    // jika json invalid, fallback ke default
  }
  return DEFAULT_TICKET_BENEFITS;
}

/**
 * Mencari nama peserta dari isian jawaban formulir.
 * Mendahulukan `customQuestionId` bila disetel, atau deteksi otomatis
 * pertanyaan berlabel "Nama / Nama Lengkap".
 * Dibatasi maksimal 120 karakter sesuai kolom event_tickets.attendee_name.
 */
export function resolveAttendeeName(
  answers: StoredAnswers,
  definition: FormDefinition,
  customQuestionId?: string | null,
): string {
  if (customQuestionId && answers[customQuestionId]) {
    const val = answers[customQuestionId];
    if (typeof val === "string" && val.trim()) {
      return val.trim().slice(0, MAX_ATTENDEE_NAME_LENGTH);
    }
  }

  const questions = allQuestions(definition);
  // Cari pertanyaan bertipe teks yang memuat kata "nama"
  for (const q of questions) {
    if (q.kind === "short_text" && /nama/i.test(q.title)) {
      const val = answers[q.id];
      if (typeof val === "string" && val.trim()) {
        return val.trim().slice(0, MAX_ATTENDEE_NAME_LENGTH);
      }
    }
  }

  // Jika tidak ditemukan, ambil pertanyaan short_text pertama
  for (const q of questions) {
    if (q.kind === "short_text") {
      const val = answers[q.id];
      if (typeof val === "string" && val.trim()) {
        return val.trim().slice(0, MAX_ATTENDEE_NAME_LENGTH);
      }
    }
  }

  return "Peserta Rohkris";
}

/**
 * Mencari nomor telepon/WhatsApp peserta dari isian jawaban formulir.
 */
export function resolveAttendeePhone(
  answers: StoredAnswers,
  definition: FormDefinition,
): string | null {
  const questions = allQuestions(definition);
  for (const q of questions) {
    if (
      q.kind === "short_text" &&
      /(wa|whatsapp|telepon|telp|hp|handphone|ponsel)/i.test(q.title)
    ) {
      const val = answers[q.id];
      if (typeof val === "string" && val.trim()) return val.trim();
    }
  }
  return null;
}

/**
 * Mencari asal sekolah/instansi/kelas peserta dari isian jawaban formulir.
 */
export function resolveAttendeeOrg(
  answers: StoredAnswers,
  definition: FormDefinition,
): string {
  const questions = allQuestions(definition);
  for (const q of questions) {
    if (
      (q.kind === "short_text" || q.kind === "multiple_choice" || q.kind === "dropdown") &&
      /(asal|sekolah|instansi|institusi|lembaga|kelas|jurusan)/i.test(q.title)
    ) {
      const val = answers[q.id];
      if (typeof val === "string" && val.trim()) return val.trim();
    }
  }
  return "SMK PLUS PELITA NUSANTARA";
}
