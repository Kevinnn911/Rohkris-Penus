// File: lib/tickets/data.ts

import { readDefinition } from "@/lib/data/forms";
import { newId, nowDb, query, queryOne } from "@/lib/db";
import type {
  EventTicketRow,
  TicketBenefitConfig,
  TicketBenefitRow,
  TicketWithBenefits,
} from "@/lib/db/types";
import type { StoredAnswers } from "@/lib/forms/types";
import {
  DEFAULT_TICKET_BENEFITS,
  MAX_ATTENDEE_NAME_LENGTH,
  MAX_BENEFIT_KEY_LENGTH,
  MAX_BENEFIT_NAME_LENGTH,
  generateTicketCode,
  parseBenefitsConfig,
  resolveAttendeeName,
  resolveAttendeeOrg,
  resolveAttendeePhone,
} from "@/lib/tickets/ticket-code";

export {
  DEFAULT_TICKET_BENEFITS,
  parseBenefitsConfig,
  resolveAttendeeName,
  resolveAttendeeOrg,
  resolveAttendeePhone,
};

/**
 * Menerbitkan data tiket & baris benefit di dalam transaksi MySQL pendaftaran.
 */
export async function issueTicketInTx(
  tx: {
    execute: (sql: string, params?: unknown[]) => Promise<unknown>;
    query: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
  },
  params: {
    responseId: string;
    eventId: string;
    eventSlug: string;
    attendeeName: string;
    attendeeEmail: string | null;
    benefits: TicketBenefitConfig[];
  },
): Promise<{ ticketId: string; ticketCode: string }> {
  const ticketId = newId();
  let ticketCode = generateTicketCode(params.eventSlug);

  // Pastikan kode tiket unik
  for (let i = 0; i < 5; i++) {
    const existing = await tx.query<{ id: string }>(
      "SELECT id FROM event_tickets WHERE ticket_code = ? LIMIT 1",
      [ticketCode],
    );
    if (existing.length === 0) break;
    ticketCode = generateTicketCode(params.eventSlug);
  }

  const safeName = (params.attendeeName.trim() || "Peserta Rohkris").slice(
    0,
    MAX_ATTENDEE_NAME_LENGTH,
  );

  await tx.execute(
    `INSERT INTO event_tickets
       (id, response_id, event_id, ticket_code, attendee_name, attendee_email, checkin_status)
     VALUES (?, ?, ?, ?, ?, ?, 'unattended')`,
    [
      ticketId,
      params.responseId,
      params.eventId,
      ticketCode,
      safeName,
      params.attendeeEmail,
    ],
  );

  const seenKeys = new Set<string>();
  for (const benefit of params.benefits) {
    const cleanKey = benefit.key.trim().toLowerCase().slice(0, MAX_BENEFIT_KEY_LENGTH);
    const cleanName = benefit.name.trim().slice(0, MAX_BENEFIT_NAME_LENGTH);
    if (!cleanKey || !cleanName || seenKeys.has(cleanKey)) continue;
    seenKeys.add(cleanKey);

    const benefitId = newId();
    await tx.execute(
      `INSERT INTO ticket_benefits
         (id, ticket_id, benefit_key, benefit_name, status)
       VALUES (?, ?, ?, ?, 'unclaimed')`,
      [benefitId, ticketId, cleanKey, cleanName],
    );
  }

  return { ticketId, ticketCode };
}

/**
 * Mengambil tiket lengkap beserta daftar kuponnya berdasarkan kode tiket.
 */
export async function getTicketByCode(ticketCode: string): Promise<TicketWithBenefits | null> {
  const cleanCode = ticketCode.trim().toUpperCase();
  const ticket = await queryOne<EventTicketRow & { checked_in_by_name?: string | null }>(
    `SELECT t.*, u.display_name AS checked_in_by_name
     FROM event_tickets t
     LEFT JOIN admin_users u ON t.checked_in_by = u.id
     WHERE t.ticket_code = ?`,
    [cleanCode],
  );
  if (!ticket) return null;

  const benefits = await query<TicketBenefitRow>(
    "SELECT * FROM ticket_benefits WHERE ticket_id = ? ORDER BY created_at ASC",
    [ticket.id],
  );

  return { ...ticket, benefits };
}

/**
 * Mengambil tiket berdasarkan ID tiket.
 */
export async function getTicketById(ticketId: string): Promise<TicketWithBenefits | null> {
  const ticket = await queryOne<EventTicketRow & { checked_in_by_name?: string | null }>(
    `SELECT t.*, u.display_name AS checked_in_by_name
     FROM event_tickets t
     LEFT JOIN admin_users u ON t.checked_in_by = u.id
     WHERE t.id = ?`,
    [ticketId],
  );
  if (!ticket) return null;

  const benefits = await query<TicketBenefitRow>(
    "SELECT * FROM ticket_benefits WHERE ticket_id = ? ORDER BY created_at ASC",
    [ticket.id],
  );

  return { ...ticket, benefits };
}

/**
 * Mengambil tiket berdasarkan responseId pendaftar.
 */
export async function getTicketByResponseId(
  responseId: string,
): Promise<TicketWithBenefits | null> {
  const ticket = await queryOne<EventTicketRow & { checked_in_by_name?: string | null }>(
    `SELECT t.*, u.display_name AS checked_in_by_name
     FROM event_tickets t
     LEFT JOIN admin_users u ON t.checked_in_by = u.id
     WHERE t.response_id = ?`,
    [responseId],
  );
  if (!ticket) return null;

  const benefits = await query<TicketBenefitRow>(
    "SELECT * FROM ticket_benefits WHERE ticket_id = ? ORDER BY created_at ASC",
    [ticket.id],
  );

  return { ...ticket, benefits };
}

/**
 * Mengambil seluruh tiket untuk satu kegiatan (halaman manajemen tiket admin).
 */
export async function getEventTickets(
  eventId: string,
  options?: {
    search?: string;
    checkinStatus?: "all" | "unattended" | "attended";
  },
): Promise<TicketWithBenefits[]> {
  const params: unknown[] = [eventId];
  let where = "t.event_id = ?";

  if (options?.checkinStatus && options.checkinStatus !== "all") {
    where += " AND t.checkin_status = ?";
    params.push(options.checkinStatus);
  }

  if (options?.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    where += " AND (t.ticket_code LIKE ? OR t.attendee_name LIKE ? OR t.attendee_email LIKE ?)";
    params.push(term, term, term);
  }

  const [tickets, formRow] = await Promise.all([
    query<
      EventTicketRow & {
        checked_in_by_name?: string | null;
        response_answers?: string | null;
      }
    >(
      `SELECT t.*, u.display_name AS checked_in_by_name, r.answers AS response_answers
       FROM event_tickets t
       LEFT JOIN admin_users u ON t.checked_in_by = u.id
       LEFT JOIN form_responses r ON t.response_id = r.id
       WHERE ${where}
       ORDER BY t.created_at DESC`,
      params,
    ),
    queryOne<{ definition: string }>(
      "SELECT definition FROM event_forms WHERE event_id = ?",
      [eventId],
    ),
  ]);

  if (tickets.length === 0) return [];

  const definition = formRow ? readDefinition(formRow.definition) : null;

  // Ambil semua benefits untuk event ini
  const ticketIds = tickets.map((t) => t.id);
  const placeholders = ticketIds.map(() => "?").join(",");
  const allBenefits = await query<TicketBenefitRow>(
    `SELECT * FROM ticket_benefits WHERE ticket_id IN (${placeholders}) ORDER BY created_at ASC`,
    ticketIds,
  );

  const benefitMap = new Map<string, TicketBenefitRow[]>();
  for (const b of allBenefits) {
    const list = benefitMap.get(b.ticket_id) ?? [];
    list.push(b);
    benefitMap.set(b.ticket_id, list);
  }

  return tickets.map((t) => {
    let attendeePhone: string | null = null;
    let attendeeOrg: string | null = null;
    if (definition && t.response_answers) {
      try {
        const parsedAnswers = JSON.parse(t.response_answers) as StoredAnswers;
        attendeePhone = resolveAttendeePhone(parsedAnswers, definition);
        attendeeOrg = resolveAttendeeOrg(parsedAnswers, definition);
      } catch {
        // abaikan jika JSON tidak valid
      }
    }
    const { response_answers: _ignored, ...rest } = t;
    void _ignored;
    return {
      ...rest,
      attendee_phone: attendeePhone,
      attendee_org: attendeeOrg,
      benefits: benefitMap.get(t.id) ?? [],
    };
  });
}

/**
 * Konfirmasi kehadiran tiket (presensi).
 */
export async function claimCheckin(
  ticketId: string,
  adminId: string,
): Promise<{ ok: boolean; message: string; checkinAt?: string }> {
  const ticket = await queryOne<EventTicketRow>(
    "SELECT * FROM event_tickets WHERE id = ?",
    [ticketId],
  );
  if (!ticket) return { ok: false, message: "Tiket tidak ditemukan." };

  if (ticket.checkin_status === "attended") {
    return {
      ok: false,
      message: `Tiket sudah pernah digunakan untuk check-in pada ${ticket.checkin_at ?? "-"}.`,
    };
  }

  const now = nowDb();
  await query(
    "UPDATE event_tickets SET checkin_status = 'attended', checkin_at = ?, checked_in_by = ? WHERE id = ?",
    [now, adminId, ticketId],
  );

  return { ok: true, message: "Kehadiran berhasil dikonfirmasi.", checkinAt: now };
}

/**
 * Konfirmasi penukaran kupon/benefit tertentu (misal Konsumsi / Photobooth).
 */
export async function claimBenefit(
  ticketId: string,
  benefitKey: string,
  adminId: string,
): Promise<{ ok: boolean; message: string; claimedAt?: string }> {
  const benefit = await queryOne<TicketBenefitRow>(
    "SELECT * FROM ticket_benefits WHERE ticket_id = ? AND benefit_key = ?",
    [ticketId, benefitKey.trim().toLowerCase()],
  );
  if (!benefit) return { ok: false, message: `Kupon "${benefitKey}" tidak ditemukan pada tiket ini.` };

  if (benefit.status === "claimed") {
    return {
      ok: false,
      message: `Kupon "${benefit.benefit_name}" sudah pernah ditukarkan pada ${benefit.claimed_at ?? "-"}.`,
    };
  }

  const now = nowDb();
  await query(
    "UPDATE ticket_benefits SET status = 'claimed', claimed_at = ?, claimed_by = ? WHERE id = ?",
    [now, adminId, benefit.id],
  );

  return {
    ok: true,
    message: `Kupon "${benefit.benefit_name}" berhasil ditukarkan.`,
    claimedAt: now,
  };
}

/**
 * Konfirmasi sekaligus: Kehadiran + seluruh kupon yang belum ditukar.
 */
export async function claimAll(
  ticketId: string,
  adminId: string,
): Promise<{ ok: boolean; message: string }> {
  const now = nowDb();
  await query(
    "UPDATE event_tickets SET checkin_status = 'attended', checkin_at = COALESCE(checkin_at, ?), checked_in_by = COALESCE(checked_in_by, ?) WHERE id = ?",
    [now, adminId, ticketId],
  );
  await query(
    "UPDATE ticket_benefits SET status = 'claimed', claimed_at = COALESCE(claimed_at, ?), claimed_by = COALESCE(claimed_by, ?) WHERE ticket_id = ? AND status = 'unclaimed'",
    [now, adminId, ticketId],
  );

  return { ok: true, message: "Kehadiran dan semua kupon berhasil dikonfirmasi sekaligus." };
}
