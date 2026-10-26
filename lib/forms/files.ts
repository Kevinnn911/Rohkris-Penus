/**
 * Deteksi & validasi berkas unggahan peserta.
 *
 * Jenis berkas ditentukan dari ISI (magic bytes), bukan dari nama atau MIME
 * yang dikirim browser — keduanya bisa dipalsukan. Dokumen Office modern
 * (docx/xlsx/pptx) adalah arsip ZIP, sehingga ekstensi ikut dicocokkan.
 */

import { detectImageType } from "@/lib/validation/schemas";
import type { FileKind } from "@/lib/forms/types";

export type DetectedFile = { kind: FileKind; mime: string; ext: string };

const OFFICE: Record<string, DetectedFile> = {
  docx: {
    kind: "document",
    ext: "docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  xlsx: {
    kind: "spreadsheet",
    ext: "xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  pptx: {
    kind: "presentation",
    ext: "pptx",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
};

function ekstensi(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name.trim());
  return m?.[1]?.toLowerCase() ?? "";
}

export function detectFileType(bytes: Uint8Array, originalName: string): DetectedFile | null {
  const gambar = detectImageType(bytes);
  if (gambar) return { kind: "image", mime: gambar.mime, ext: gambar.ext };

  // %PDF-
  if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d) {
    return { kind: "pdf", mime: "application/pdf", ext: "pdf" };
  }

  // ZIP (PK\x03\x04) + ekstensi Office yang cocok.
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return OFFICE[ekstensi(originalName)] ?? null;
  }
  return null;
}

/** Atribut `accept` untuk <input type="file"> sesuai jenis yang diizinkan. */
export function acceptAttribute(kinds: readonly FileKind[]): string {
  const peta: Record<FileKind, string[]> = {
    image: [".jpg", ".jpeg", ".png", ".webp", ".avif"],
    pdf: [".pdf"],
    document: [".docx"],
    spreadsheet: [".xlsx"],
    presentation: [".pptx"],
  };
  return kinds.flatMap((k) => peta[k]).join(",");
}

export const FILE_KIND_LABEL: Record<FileKind, string> = {
  image: "Gambar (JPG, PNG, WebP)",
  pdf: "PDF",
  document: "Dokumen Word (.docx)",
  spreadsheet: "Spreadsheet Excel (.xlsx)",
  presentation: "Presentasi PowerPoint (.pptx)",
};

/** Nama asli yang aman untuk disimpan & ditampilkan (tanpa path, karakter kendali dibuang). */
export function sanitizeOriginalName(name: string): string {
  const dasar = name.split(/[\\/]/).pop() ?? "";
  const bersih = dasar.replace(/[\u0000-\u001f\u007f"<>|*?:]/g, "").trim();
  return (bersih || "berkas").slice(0, 200);
}

/** Ukuran berkas yang terbaca: "1,2 MB". */
export function formatUkuran(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}
