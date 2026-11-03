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
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 24px;background:#f9f9fb;border:2px dashed #dedee2;border-radius:16px;padding:20px">` +
      `<tr><td align="center">` +
      `<div style="font-size:11px;font-weight:bold;letter-spacing:1px;color:#75680a;text-transform:uppercase;margin-bottom:4px">E-TIKET KEGIATAN</div>` +
      `<div style="font-size:18px;font-weight:bold;color:#0d0d0f;margin-bottom:6px">${escapeHtml(input.ticket.attendeeName)}</div>` +
      `<div style="font-family:monospace;font-size:16px;font-weight:bold;background:#0d0d0f;color:#f6f06a;display:inline-block;padding:6px 16px;border-radius:8px;letter-spacing:1.5px;margin-bottom:16px">${escapeHtml(input.ticket.ticketCode)}</div>` +
      (input.ticket.qrCid
        ? `<div style="margin:8px 0 14px"><img src="cid:${escapeHtml(input.ticket.qrCid)}" width="180" height="180" alt="QR Code Tiket" style="display:block;margin:0 auto;border-radius:8px;background:#ffffff;padding:8px;border:1px solid #dedee2" /></div>`
        : "") +
      `<div style="font-size:12px;color:#55555d;margin-bottom:10px">Tunjukkan QR code ini ke panitia untuk presensi dan penukaran kupon.</div>` +
      (input.ticket.benefits.length > 0
        ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #dedee2">` +
          `<div style="font-size:12px;font-weight:bold;color:#27272c;margin-bottom:6px">Kupon yang Anda dapatkan:</div>` +
          `<div style="font-size:13px;color:#05603a">${input.ticket.benefits.map((b) => `• ${escapeHtml(b.name)}`).join("&nbsp;&nbsp;")}</div>` +
          `</div>`
        : "") +
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
