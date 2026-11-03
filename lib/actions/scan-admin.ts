// File: lib/actions/scan-admin.ts

"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guard";
import { readDefinition } from "@/lib/data/forms";
import { getSiteSettings } from "@/lib/data/public";
import { query, queryOne } from "@/lib/db";
import type {
  EventFormRow,
  EventRow,
  FormResponseFileRow,
  FormResponseRow,
} from "@/lib/db/types";
import { isEmailConfigured, sendEmail } from "@/lib/email/mailer";
import { getSiteUrl } from "@/lib/env";
import { formatRentangKegiatan, formatTanggal } from "@/lib/format/date";
import { buildConfirmationEmail } from "@/lib/forms/email-template";
import type { FormDefinition, StoredAnswers } from "@/lib/forms/types";
import {
  claimAll,
  claimBenefit,
  claimCheckin,
  getTicketByCode,
  getTicketById,
} from "@/lib/tickets/data";
import { generateQrDataUrl } from "@/lib/tickets/qr";
import {
  parseScannedTicketCode,
  verifyScannedQrSignature,
} from "@/lib/tickets/ticket-code";

export type TicketScanResult =
  | {
      ok: true;
      status: "valid" | "already_checked_in";
      redemptionMode: "flexible" | "all_in_one";
      autoConfirmed?: boolean;
      ticket: {
        id: string;
        ticketCode: string;
        attendeeName: string;
        attendeeEmail: string | null;
        checkinStatus: "unattended" | "attended";
        checkinAt: string | null;
        checkedInByName: string | null;
        eventId: string;
        eventTitle: string;
        eventDate: string | null;
        eventLocation: string | null;
        benefits: Array<{
          id: string;
          key: string;
          name: string;
          status: "unclaimed" | "claimed";
          claimedAt: string | null;
        }>;
      };
    }
  | {
      ok: false;
      message: string;
    };

/**
 * Menghasilkan data URL QR code untuk tiket cadangan (dipanggil dari modal admin).
 */
export async function dapatkanDataUrlQr(ticketCode: string): Promise<string> {
  await requireAdmin();
  return generateQrDataUrl(ticketCode);
}

/**
 * Memeriksa kode tiket yang dipindai kamera atau dimasukkan panitia.
 */
export async function periksaKodeTiket(
  scannedText: string,
  expectedEventId?: string,
): Promise<TicketScanResult> {
  const auth = await requireAdmin();

  if (!verifyScannedQrSignature(scannedText)) {
    return {
      ok: false,
      message:
        "Tanda tangan keamanan Kode QR tidak valid (indikasi tiket palsu atau rusak).",
    };
  }

  const code = parseScannedTicketCode(scannedText);
  if (!code) {
    return { ok: false, message: "Kode QR tidak dikenali sebagai format tiket Rohkris." };
  }

  let ticket = await getTicketByCode(code);
  if (!ticket) {
    return { ok: false, message: `Tiket dengan kode "${code}" tidak ditemukan di database.` };
  }

  const event = await queryOne<EventRow>("SELECT * FROM events WHERE id = ?", [ticket.event_id]);

  if (expectedEventId && ticket.event_id !== expectedEventId) {
    return {
      ok: false,
      message: `Tiket "${ticket.ticket_code}" terdaftar untuk kegiatan lain ("${event?.title ?? "Kegiatan Lain"}"), bukan kegiatan ini.`,
    };
  }

  const formRow = await queryOne<Pick<EventFormRow, "ticket_redemption_mode">>(
    "SELECT ticket_redemption_mode FROM event_forms WHERE event_id = ?",
    [ticket.event_id],
  );
  const redemptionMode = formRow?.ticket_redemption_mode ?? "flexible";

  let status: "valid" | "already_checked_in" =
    ticket.checkin_status === "attended" ? "already_checked_in" : "valid";
  let autoConfirmed = false;

  if (redemptionMode === "all_in_one") {
    const allBenefitsClaimed = ticket.benefits.every((b) => b.status === "claimed");
    const alreadyFullyUsed = ticket.checkin_status === "attended" && allBenefitsClaimed;

    if (alreadyFullyUsed) {
      status = "already_checked_in";
    } else {
      await claimAll(ticket.id, auth.admin.id);
      const refreshed = await getTicketById(ticket.id);
      if (refreshed) {
        ticket = refreshed;
      }
      status = "valid";
      autoConfirmed = true;
      revalidatePath(`/admin/kegiatan/${ticket.event_id}/tiket`, "page");
      revalidatePath(`/admin/kegiatan/${ticket.event_id}/scan`, "page");
    }
  }

  const eventDate = event
    ? formatRentangKegiatan(event.start_at, event.end_at) ?? formatTanggal(event.start_at)
    : null;

  return {
    ok: true,
    status,
    redemptionMode,
    autoConfirmed,
    ticket: {
      id: ticket.id,
      ticketCode: ticket.ticket_code,
      attendeeName: ticket.attendee_name,
      attendeeEmail: ticket.attendee_email,
      checkinStatus: ticket.checkin_status,
      checkinAt: ticket.checkin_at,
      checkedInByName: ticket.checked_in_by_name ?? null,
      eventId: ticket.event_id,
      eventTitle: event?.title ?? "Kegiatan Rohkris",
      eventDate,
      eventLocation: event?.location ?? null,
      benefits: ticket.benefits.map((b) => ({
        id: b.id,
        key: b.benefit_key,
        name: b.benefit_name,
        status: b.status,
        claimedAt: b.claimed_at,
      })),
    },
  };
}

/**
 * Konfirmasi kehadiran peserta (Check-in).
 */
export async function konfirmasiKehadiran(ticketId: string): Promise<{ ok: boolean; message: string }> {
  const auth = await requireAdmin();
  const res = await claimCheckin(ticketId, auth.admin.id);
  if (res.ok) {
    revalidatePath(`/admin/kegiatan/[id]/tiket`, "page");
    revalidatePath(`/admin/kegiatan/[id]/scan`, "page");
  }
  return res;
}

/**
 * Konfirmasi penukaran kupon tertentu (misal Konsumsi / Photobooth).
 */
export async function konfirmasiKupon(
  ticketId: string,
  benefitKey: string,
): Promise<{ ok: boolean; message: string }> {
  const auth = await requireAdmin();
  const res = await claimBenefit(ticketId, benefitKey, auth.admin.id);
  if (res.ok) {
    revalidatePath(`/admin/kegiatan/[id]/tiket`, "page");
    revalidatePath(`/admin/kegiatan/[id]/scan`, "page");
  }
  return res;
}

/**
 * Konfirmasi sekaligus: Kehadiran dan semua kupon.
 */
export async function konfirmasiSemua(ticketId: string): Promise<{ ok: boolean; message: string }> {
  const auth = await requireAdmin();
  const res = await claimAll(ticketId, auth.admin.id);
  if (res.ok) {
    revalidatePath(`/admin/kegiatan/[id]/tiket`, "page");
    revalidatePath(`/admin/kegiatan/[id]/scan`, "page");
  }
  return res;
}

/**
 * Mengirim ulang email tiket ke email pendaftar dari panel admin.
 */
export async function kirimUlangEmailTiket(ticketId: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();

  if (!isEmailConfigured()) {
    return { ok: false, message: "Pengiriman email belum dikonfigurasi pada server (cek .env.local)." };
  }

  const ticket = await getTicketById(ticketId);
  if (!ticket || !ticket.attendee_email) {
    return { ok: false, message: "Tiket tidak memiliki alamat email yang tersimpan." };
  }

  const [event, formRow, respRow, fileRows] = await Promise.all([
    queryOne<EventRow>("SELECT * FROM events WHERE id = ?", [ticket.event_id]),
    queryOne<EventFormRow>("SELECT * FROM event_forms WHERE event_id = ?", [ticket.event_id]),
    queryOne<FormResponseRow>("SELECT * FROM form_responses WHERE id = ?", [ticket.response_id]),
    query<FormResponseFileRow>("SELECT * FROM form_response_files WHERE response_id = ?", [ticket.response_id]),
  ]);
  if (!event) return { ok: false, message: "Data kegiatan tidak ditemukan." };

  const definition: FormDefinition =
    (formRow ? readDefinition(formRow.definition) : null) ?? { schemaVersion: 1, sections: [] };
  let answers: StoredAnswers = {};
  if (respRow?.answers) {
    try {
      answers = JSON.parse(respRow.answers) as StoredAnswers;
    } catch {
      answers = {};
    }
  }
  const filesMap = new Map(fileRows.map((f) => [f.id, { id: f.id, name: f.original_name }]));

  try {
    const qrDataUrl = await generateQrDataUrl(ticket.ticket_code);
    const base64Data = qrDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const qrBuffer = Buffer.from(base64Data, "base64");
    const qrCid = "ticket-qr-code";

    const settings = await getSiteSettings();
    const isi = buildConfirmationEmail({
      siteName: settings.site_name ?? "Rohkris SMK Plus Pelita Nusantara",
      eventTitle: event.title,
      eventDate: formatRentangKegiatan(event.start_at, event.end_at) ?? formatTanggal(event.start_at),
      eventLocation: event.location,
      definition,
      answers,
      files: filesMap,
      editUrl: `${getSiteUrl()}/kegiatan/${event.slug}`,
      confirmationMessage: formRow?.confirmation_message ?? null,
      ticket: {
        ticketCode: ticket.ticket_code,
        attendeeName: ticket.attendee_name,
        benefits: ticket.benefits.map((b) => ({ key: b.benefit_key, name: b.benefit_name })),
        qrCid,
      },
    });

    const sent = await sendEmail({
      to: ticket.attendee_email,
      ...isi,
      replyTo: settings.contact_email ?? null,
      attachments: [
        {
          filename: `tiket-${ticket.ticket_code}.png`,
          content: qrBuffer,
          cid: qrCid,
          contentType: "image/png",
        },
      ],
    });

    if (sent) {
      return { ok: true, message: `E-Tiket berhasil dikirim ulang ke ${ticket.attendee_email}.` };
    }
    return { ok: false, message: "Gagal mengirim email tiket. Coba lagi beberapa saat lagi." };
  } catch (err) {
    console.error("Gagal mengirim ulang tiket email:", err);
    return { ok: false, message: (err as Error).message || "Gagal memproses pengiriman email tiket." };
  }
}
