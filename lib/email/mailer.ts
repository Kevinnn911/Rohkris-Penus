import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { getMailConfig } from "@/lib/env";

/**
 * Pengirim email (konfirmasi formulir internal).
 *
 * Mendukung dua transport karena banyak hosting cPanel memblokir koneksi
 * SMTP keluar:
 *   MAIL_TRANSPORT=smtp     → akun email cPanel / layanan SMTP
 *   MAIL_TRANSPORT=sendmail → /usr/sbin/sendmail milik hosting
 * Bila konfigurasi belum lengkap, isEmailConfigured() = false dan fitur
 * "kirim salinan jawaban" dinonaktifkan di builder.
 */

let cache: { kunci: string; transporter: Transporter } | null = null;

export function isEmailConfigured(): boolean {
  return getMailConfig() !== null;
}

function transporter(): { transporter: Transporter; from: string } | null {
  const config = getMailConfig();
  if (!config) return null;
  const kunci = JSON.stringify(config);
  if (!cache || cache.kunci !== kunci) {
    const t =
      config.transport === "sendmail"
        ? nodemailer.createTransport({ sendmail: true, newline: "unix", path: config.path })
        : nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: { user: config.user, pass: config.pass },
            connectionTimeout: 15_000,
            greetingTimeout: 15_000,
            socketTimeout: 20_000,
          });
    cache = { kunci, transporter: t };
  }
  return { transporter: cache.transporter, from: config.from };
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string | null;
}): Promise<boolean> {
  const t = transporter();
  if (!t) return false;
  try {
    await t.transporter.sendMail({
      from: t.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo || undefined,
    });
    return true;
  } catch (error) {
    console.error("Gagal mengirim email:", (error as Error).message);
    return false;
  }
}
