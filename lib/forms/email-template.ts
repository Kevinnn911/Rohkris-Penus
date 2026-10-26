/**
 * Isi email konfirmasi (salinan jawaban) — teks polos + HTML yang di-escape.
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

export type ConfirmationEmailInput = {
  siteName: string;
  eventTitle: string;
  definition: FormDefinition;
  answers: StoredAnswers;
  files?: ReadonlyMap<string, FileInfo>;
  /** URL absolut tautan ubah jawaban, bila diizinkan. */
  editUrl?: string | null;
  confirmationMessage?: string | null;
  edited?: boolean;
};

export function buildConfirmationEmail(input: ConfirmationEmailInput): { subject: string; text: string; html: string } {
  const judul = input.edited ? "Jawaban Anda telah diperbarui" : "Pendaftaran Anda telah diterima";
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
  if (input.confirmationMessage) teks.push("", input.confirmationMessage);
  teks.push("", "Salinan jawaban Anda:", "");
  for (const b of butir) teks.push(`${b.title}`, `  ${b.value.replace(/\n/g, "\n  ")}`, "");
  if (input.editUrl) teks.push("Ubah jawaban:", input.editUrl, "", "Simpan tautan ini secara pribadi — siapa pun yang memilikinya dapat mengubah jawaban Anda.");
  teks.push("", `— ${input.siteName}`);

  const baris = butir
    .map(
      (b) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #ececee;vertical-align:top">` +
        `<div style="font-size:13px;color:#55555d">${escapeHtml(b.title)}</div>` +
        `<div style="font-size:15px;color:#18181b;white-space:pre-wrap">${escapeHtml(b.value)}</div></td></tr>`,
    )
    .join("");

  const html =
    `<!doctype html><html lang="id"><body style="margin:0;background:#f3f3f1;font-family:Arial,Helvetica,sans-serif">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:28px">` +
    `<tr><td><h1 style="margin:0 0 6px;font-size:20px;color:#0d0d0f">${escapeHtml(judul)}</h1>` +
    `<p style="margin:0 0 18px;font-size:15px;color:#55555d">${escapeHtml(input.eventTitle)}</p>` +
    (input.confirmationMessage
      ? `<p style="margin:0 0 18px;font-size:15px;color:#27272c;white-space:pre-wrap">${escapeHtml(input.confirmationMessage)}</p>`
      : "") +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${baris}</table>` +
    (input.editUrl
      ? `<p style="margin:22px 0 6px"><a href="${escapeHtml(input.editUrl)}" style="display:inline-block;background:#0d0d0f;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:14px">Ubah jawaban</a></p>` +
        `<p style="margin:0;font-size:12px;color:#6f6f78">Simpan tautan ini secara pribadi — siapa pun yang memilikinya dapat mengubah jawaban Anda.</p>`
      : "") +
    `<p style="margin:24px 0 0;font-size:12px;color:#6f6f78">${escapeHtml(input.siteName)}</p>` +
    `</td></tr></table></td></tr></table></body></html>`;

  return { subject, text: teks.join("\n"), html };
}
