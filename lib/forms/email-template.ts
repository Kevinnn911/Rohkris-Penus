// File: lib/forms/email-template.ts

/**
 * Isi email konfirmasi (salinan jawaban & e-tiket) — teks polos + HTML yang di-escape.
 *
 * Seluruh isian peserta dianggap tidak tepercaya: tidak pernah disisipkan
 * sebagai HTML mentah.
 */

import { answerToText, type FileInfo } from "@/lib/forms/display";
import { type FormDefinition, type StoredAnswers, allQuestions } from "@/lib/forms/types";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type TicketEmailData = {
  ticketCode: string;
  attendeeName: string;
  benefits: Array<{ key: string; name: string }>;
  qrCid?: string;
};

export type ConfirmationEmailInput = {
  siteName: string;
  eventTitle: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  definition: FormDefinition;
  answers: StoredAnswers;
  files?: ReadonlyMap<string, FileInfo>;
  /** URL absolut tautan ubah jawaban, bila diizinkan. */
  editUrl?: string | null;
  confirmationMessage?: string | null;
  edited?: boolean;
  ticket?: TicketEmailData | null;
};

export function buildConfirmationEmail(input: ConfirmationEmailInput): { subject: string; text: string; html: string } {
  const judul = input.edited
    ? "Jawaban Anda telah diperbarui"
    : input.ticket
      ? "E-Tiket & Bukti Pendaftaran"
      : "Pendaftaran Anda telah diterima";
  const subject = `${judul}: ${input.eventTitle}`.slice(0, 200);

  const butir = allQuestions(input.definition)
    .filter((q) => input.answers[q.id] !== undefined)
    .map((q) => ({ title: q.title, value: answerToText(q, input.answers[q.id], { files: input.files }) }))
    .filter((b) => b.value !== "");

  const teks: string[] = [
    `${judul}.`,
    "",
    `Kegiatan: ${input.eventTitle}`,
  ];
  if (input.eventDate) teks.push(`Waktu: ${input.eventDate}`);
  if (input.eventLocation) teks.push(`Lokasi: ${input.eventLocation}`);

  if (input.ticket) {
    teks.push(
      "",
      "========================================",
      "             E-TIKET RESMI             ",
      "========================================",
      `Nama Peserta : ${input.ticket.attendeeName}`,
      `Kode Tiket   : ${input.ticket.ticketCode}`,
      `Kupon/Benefit: ${input.ticket.benefits.map((b) => b.name).join(", ") || "Presensi Kehadiran"}`,
      "Catatan      : Tunjukkan kode QR atau kode tiket ini kepada panitia saat registrasi di lokasi acara.",
      "========================================",
      "",
    );
  }

  if (input.confirmationMessage) teks.push("", input.confirmationMessage);
  teks.push("", "Salinan jawaban Anda:", "");
  for (const b of butir) teks.push(`${b.title}`, `  ${b.value.replace(/\n/g, "\n  ")}`, "");
  if (input.editUrl) {
    teks.push(
      "Ubah jawaban:",
      input.editUrl,
      "",
      "Simpan tautan ini secara pribadi — siapa pun yang memilikinya dapat mengubah jawaban Anda.",
    );
  }
  teks.push("", `— ${input.siteName}`);

  const baris = butir
    .map(
      (b) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #ececee;vertical-align:top">` +
        `<div style="font-size:13px;color:#55555d">${escapeHtml(b.title)}</div>` +
        `<div style="font-size:15px;color:#18181b;white-space:pre-wrap">${escapeHtml(b.value)}</div></td></tr>`,
    )
    .join("");

  const tiketHtml = input.ticket
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#18181b;border:1px solid #27272a;border-radius:16px;padding:24px;color:#ffffff">` +
      `<tr><td align="center">` +
      `<div style="font-size:11px;font-weight:bold;letter-spacing:1.5px;color:#f6f06a;text-transform:uppercase;margin-bottom:6px">E-TIKET RESMI</div>` +
      `<div style="font-size:18px;font-weight:bold;color:#ffffff;margin-bottom:4px">${escapeHtml(input.eventTitle)}</div>` +
      (input.eventDate ? `<div style="font-size:12px;color:#a1a1aa;margin-bottom:16px">${escapeHtml(input.eventDate)}</div>` : `<div style="margin-bottom:16px"></div>`) +
      (input.ticket.qrCid
        ? `<div style="background:#ffffff;border-radius:12px;padding:12px;display:inline-block;margin-bottom:16px"><img src="cid:${escapeHtml(input.ticket.qrCid)}" width="180" height="180" alt="QR Code Tiket" style="display:block;margin:0 auto" /></div>`
        : "") +
      `<table role="presentation" width="100%" cellpadding="4" cellspacing="0" style="text-align:left;font-size:12px;margin:12px 0 16px;border-top:1px solid #27272a;padding-top:12px">` +
      `<tr><td style="color:#a1a1aa;width:90px">Nama:</td><td style="color:#ffffff;font-weight:bold">${escapeHtml(input.ticket.attendeeName)}</td></tr>` +
      `<tr><td style="color:#a1a1aa">Tiket ID:</td><td style="color:#ffffff;font-family:monospace;font-weight:bold">${escapeHtml(input.ticket.ticketCode)}</td></tr>` +
      `<tr><td style="color:#a1a1aa">Status:</td><td><span style="background:#059669;color:#ffffff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold">Sudah Dibayar</span></td></tr>` +
      (input.ticket.benefits.length > 0
        ? `<tr><td style="color:#a1a1aa">Kupon:</td><td style="color:#34d399">${input.ticket.benefits.map((b) => escapeHtml(b.name)).join(" &bull; ")}</td></tr>`
        : "") +
      `</table>` +
      `<div style="background:#3a1d06;border:1px solid #b45309;border-radius:8px;padding:10px 12px;text-align:left;font-size:11px;color:#fef08a;line-height:1.4">` +
      `<strong>Catatan:</strong> Peserta wajib menunjukkan e-tiket ini saat registrasi ulang di lokasi. Simpan atau tangkap layar gambar QR code di atas.` +
      `</div>` +
      `</td></tr></table>`
    : "";

  const html =
    `<!doctype html><html lang="id"><body style="margin:0;background:#f3f3f1;font-family:Arial,Helvetica,sans-serif">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:28px">` +
    `<tr><td><h1 style="margin:0 0 6px;font-size:20px;color:#0d0d0f">${escapeHtml(judul)}</h1>` +
    `<p style="margin:0 0 14px;font-size:15px;color:#55555d">${escapeHtml(input.eventTitle)}</p>` +
    tiketHtml +
    (input.confirmationMessage
      ? `<p style="margin:0 0 18px;font-size:15px;color:#27272c;white-space:pre-wrap">${escapeHtml(input.confirmationMessage)}</p>`
      : "") +
    `<h2 style="margin:24px 0 10px;font-size:15px;font-weight:bold;color:#0d0d0f">Rincian Jawaban Formulir:</h2>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${baris}</table>` +
    (input.editUrl
      ? `<p style="margin:22px 0 6px"><a href="${escapeHtml(input.editUrl)}" style="display:inline-block;background:#0d0d0f;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:14px">Ubah jawaban</a></p>` +
        `<p style="margin:0;font-size:12px;color:#6f6f78">Simpan tautan ini secara pribadi — siapa pun yang memilikinya dapat mengubah jawaban Anda.</p>`
      : "") +
    `<p style="margin:24px 0 0;font-size:12px;color:#6f6f78">${escapeHtml(input.siteName)}</p>` +
    `</td></tr></table></td></tr></table></body></html>`;

  return { subject, text: teks.join("\n"), html };
}
