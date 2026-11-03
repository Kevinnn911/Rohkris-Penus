// File: components/admin/tiket/ManajemenTiket.tsx

"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { AksiUnduhTiket } from "@/components/tiket/AksiUnduhTiket";
import { KartuETiket } from "@/components/tiket/KartuETiket";
import { Button } from "@/components/ui/Button";
import {
  IconAlert,
  IconCheck,
  IconCopy,
  IconEye,
  IconFilter,
  IconMail,
  IconSearch,
  IconUsers,
} from "@/components/ui/Icons";
import {
  dapatkanDataUrlQr,
  kirimUlangEmailTiket,
  konfirmasiKehadiran,
  konfirmasiKupon,
} from "@/lib/actions/scan-admin";
import { cn } from "@/lib/cn";
import type { TicketWithBenefits } from "@/lib/db/types";

export function ManajemenTiket({
  eventId,
  eventTitle,
  eventDate,
  eventLocation,
  tickets: initialTickets,
}: {
  eventId: string;
  eventTitle: string;
  eventDate: string | null;
  eventLocation: string | null;
  tickets: TicketWithBenefits[];
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "unattended" | "attended">("all");
  const [selectedTicket, setSelectedTicket] = useState<TicketWithBenefits | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [pending, startTransition] = useTransition();
  const [notif, setNotif] = useState<{ ok: boolean; message: string } | null>(null);

  // Filter daftar tiket
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (filterStatus === "unattended" && t.checkin_status !== "unattended") return false;
      if (filterStatus === "attended" && t.checkin_status !== "attended") return false;

      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        t.ticket_code.toLowerCase().includes(term) ||
        t.attendee_name.toLowerCase().includes(term) ||
        (t.attendee_email && t.attendee_email.toLowerCase().includes(term))
      );
    });
  }, [tickets, search, filterStatus]);

  // Statistik ringkas
  const stats = useMemo(() => {
    const total = tickets.length;
    const attended = tickets.filter((t) => t.checkin_status === "attended").length;
    const unattended = total - attended;
    let totalBenefits = 0;
    let claimedBenefits = 0;
    for (const t of tickets) {
      for (const b of t.benefits) {
        totalBenefits += 1;
        if (b.status === "claimed") claimedBenefits += 1;
      }
    }
    return { total, attended, unattended, totalBenefits, claimedBenefits };
  }, [tickets]);

  async function bukaModalTiket(ticket: TicketWithBenefits) {
    setSelectedTicket(ticket);
    setLoadingQr(true);
    setQrDataUrl(null);
    try {
      const url = await dapatkanDataUrlQr(ticket.ticket_code);
      setQrDataUrl(url);
    } catch {
      setNotif({ ok: false, message: "Gagal memuat kode QR tiket." });
    } finally {
      setLoadingQr(false);
    }
  }

  function salinKode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  }

  function handleCheckin(ticketId: string) {
    startTransition(async () => {
      const res = await konfirmasiKehadiran(ticketId);
      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  checkin_status: "attended",
                  checkin_at: new Date().toISOString(),
                }
              : t,
          ),
        );
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket((prev) =>
            prev ? { ...prev, checkin_status: "attended", checkin_at: new Date().toISOString() } : null,
          );
        }
        setNotif({ ok: true, message: "Kehadiran peserta berhasil dikonfirmasi." });
      } else {
        setNotif({ ok: false, message: res.message });
      }
    });
  }

  function handleClaimBenefit(ticketId: string, benefitKey: string) {
    startTransition(async () => {
      const res = await konfirmasiKupon(ticketId, benefitKey);
      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) => {
            if (t.id !== ticketId) return t;
            return {
              ...t,
              benefits: t.benefits.map((b) =>
                b.benefit_key === benefitKey
                  ? { ...b, status: "claimed", claimed_at: new Date().toISOString() }
                  : b,
              ),
            };
          }),
        );
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              benefits: prev.benefits.map((b) =>
                b.benefit_key === benefitKey
                  ? { ...b, status: "claimed", claimed_at: new Date().toISOString() }
                  : b,
              ),
            };
          });
        }
        setNotif({ ok: true, message: `Kupon "${benefitKey}" berhasil ditukarkan.` });
      } else {
        setNotif({ ok: false, message: res.message });
      }
    });
  }

  function handleKirimUlangEmail(ticketId: string) {
    startTransition(async () => {
      setNotif(null);
      const res = await kirimUlangEmailTiket(ticketId);
      setNotif(res);
    });
  }

  return (
    <div className="space-y-6">
      {/* Notifikasi feedback */}
      {notif ? (
        <div
          role={notif.ok ? "status" : "alert"}
          className={cn(
            "flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium",
            notif.ok ? "border-sage-300 bg-sage-100 text-sage-800" : "border-danger-600/20 bg-danger-50 text-danger-700",
          )}
        >
          <div className="flex items-center gap-2">
            {notif.ok ? <IconCheck className="size-4 shrink-0 text-sage-700" /> : <IconAlert className="size-4 shrink-0" />}
            <span>{notif.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotif(null)}
            className="text-xs font-semibold underline underline-offset-4"
          >
            Tutup
          </button>
        </div>
      ) : null}

      {/* Kartu Ringkasan Statistik */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-navy-200/80 bg-white p-4">
          <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">Total Tiket</p>
          <p className="mt-1 text-2xl font-bold text-navy-950">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-navy-200/80 bg-white p-4">
          <p className="text-xs font-medium text-sage-700 uppercase tracking-wider">Hadir (Check-in)</p>
          <p className="mt-1 text-2xl font-bold text-sage-700">{stats.attended}</p>
        </div>
        <div className="rounded-2xl border border-navy-200/80 bg-white p-4">
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Belum Hadir</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{stats.unattended}</p>
        </div>
        <div className="rounded-2xl border border-navy-200/80 bg-white p-4">
          <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">Kupon Ditukar</p>
          <p className="mt-1 text-2xl font-bold text-navy-950">
            {stats.claimedBenefits}
            <span className="text-xs font-normal text-navy-400"> / {stats.totalBenefits}</span>
          </p>
        </div>
      </div>

      {/* Bilah Pencarian & Filter */}
      <div className="flex flex-col gap-3 rounded-2xl border border-navy-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            placeholder="Cari kode tiket, nama peserta, atau email..."
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-11 rounded-full border border-navy-200 bg-navy-50/50 pl-10 pr-4 text-sm text-navy-950 placeholder:text-navy-400 focus:border-navy-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-200"
          />
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-400" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-navy-100/70 p-1">
            {(
              [
                { id: "all", label: "Semua" },
                { id: "unattended", label: "Belum Hadir" },
                { id: "attended", label: "Hadir" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStatus(f.id)}
                className={cn(
                  "pressable rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  filterStatus === f.id
                    ? "bg-navy-950 text-white shadow-sm"
                    : "text-navy-700 hover:bg-navy-200/60 hover:text-navy-950",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Link
            href={`/admin/kegiatan/${eventId}/scan`}
            className="pressable inline-flex min-h-10 items-center gap-2 rounded-full bg-navy-950 px-4 text-sm font-medium text-white shadow-sm hover:bg-navy-900"
          >
            <IconFilter className="size-4" />
            Buka Pemindai QR
          </Link>
        </div>
      </div>

      {/* Tabel Tiket */}
      {filteredTickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy-300 bg-white p-12 text-center">
          <IconUsers className="mx-auto size-10 text-navy-300" />
          <h3 className="mt-3 text-base font-semibold text-navy-950">Tidak ada tiket yang cocok</h3>
          <p className="mt-1 text-sm text-navy-600">
            {search.trim() ? "Coba ubah kata kunci pencarian Anda." : "Belum ada tiket yang diterbitkan untuk kegiatan ini."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-navy-900">
              <thead className="border-b border-navy-200 bg-navy-50/75 text-xs font-semibold uppercase tracking-wider text-navy-600">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Kode Tiket</th>
                  <th scope="col" className="px-5 py-3.5">Peserta</th>
                  <th scope="col" className="px-5 py-3.5">Presensi</th>
                  <th scope="col" className="px-5 py-3.5">Status Kupon</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {filteredTickets.map((t) => {
                  const isAttended = t.checkin_status === "attended";
                  return (
                    <tr key={t.id} className="transition-colors hover:bg-navy-50/50">
                      <td className="whitespace-nowrap px-5 py-4 font-mono font-medium text-navy-950">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-navy-100 px-2 py-1 text-xs">{t.ticket_code}</span>
                          <button
                            type="button"
                            onClick={() => salinKode(t.ticket_code)}
                            title="Salin kode tiket"
                            className="text-navy-400 hover:text-navy-700"
                          >
                            <IconCopy className="size-3.5" />
                          </button>
                          {copiedCode === t.ticket_code ? (
                            <span className="text-[10px] text-sage-700">Tersalin</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-navy-950">{t.attendee_name}</p>
                        <p className="text-xs text-navy-500">{t.attendee_email ?? "Tanpa email"}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {isAttended ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-2.5 py-1 text-xs font-semibold text-sage-800">
                            <IconCheck className="size-3" />
                            Hadir
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            Belum Hadir
                          </span>
                        )}
                        {t.checkin_at ? (
                          <p className="mt-0.5 text-[11px] text-navy-400">
                            {new Date(t.checkin_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            {t.checked_in_by_name ? ` oleh ${t.checked_in_by_name}` : ""}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {t.benefits.map((b) => (
                            <span
                              key={b.id}
                              className={cn(
                                "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
                                b.status === "claimed"
                                  ? "bg-sage-50 text-sage-700 ring-1 ring-inset ring-sage-300"
                                  : "bg-navy-50 text-navy-600 ring-1 ring-inset ring-navy-200",
                              )}
                            >
                              {b.benefit_name}: {b.status === "claimed" ? "Ditukar" : "Belum"}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => bukaModalTiket(t)}
                            className="pressable inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-navy-800 ring-1 ring-inset ring-navy-300 hover:bg-navy-50 hover:text-navy-950"
                          >
                            <IconEye className="size-3.5" />
                            Lihat Tiket
                          </button>

                          {t.attendee_email ? (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => handleKirimUlangEmail(t.id)}
                              title="Kirim ulang tiket ke email peserta"
                              className="pressable inline-flex size-8 items-center justify-center rounded-full text-navy-600 ring-1 ring-inset ring-navy-300 hover:bg-navy-50 hover:text-navy-950 disabled:opacity-50"
                            >
                              <IconMail className="size-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tiket Cadangan Server */}
      {selectedTicket ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-navy-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-navy-950">Tiket Cadangan Server</h3>
                <p className="text-xs text-navy-600">
                  Digunakan bila e-tiket peserta hilang atau tidak dapat dibuka di gawai peserta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-full p-2 text-navy-400 hover:bg-navy-100 hover:text-navy-950"
              >
                <span className="sr-only">Tutup modal</span>
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-6">
              {loadingQr || !qrDataUrl ? (
                <div className="flex h-64 items-center justify-center rounded-2xl bg-navy-50">
                  <p className="text-sm font-medium text-navy-600">Menghasilkan kode QR tiket...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <KartuETiket
                    ticketCode={selectedTicket.ticket_code}
                    attendeeName={selectedTicket.attendee_name}
                    attendeeEmail={selectedTicket.attendee_email}
                    eventTitle={eventTitle}
                    eventDate={eventDate}
                    eventLocation={eventLocation}
                    benefits={selectedTicket.benefits.map((b) => ({
                      key: b.benefit_key,
                      name: b.benefit_name,
                      status: b.status,
                    }))}
                    qrDataUrl={qrDataUrl}
                  />

                  <div className="mt-4 w-full">
                    <AksiUnduhTiket
                      ticketCode={selectedTicket.ticket_code}
                      attendeeName={selectedTicket.attendee_name}
                      eventTitle={eventTitle}
                      eventDate={eventDate}
                      eventLocation={eventLocation}
                      benefits={selectedTicket.benefits.map((b) => ({
                        key: b.benefit_key,
                        name: b.benefit_name,
                      }))}
                      qrDataUrl={qrDataUrl}
                    />
                  </div>
                </div>
              )}

              {/* Tombol Aksi Cepat Panitia */}
              <div className="rounded-2xl border border-navy-100 bg-navy-50/60 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-navy-600">Aksi Panitia Langsung</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTicket.checkin_status === "unattended" ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleCheckin(selectedTicket.id)}
                      disabled={pending}
                    >
                      <IconCheck className="size-4" />
                      Konfirmasi Presensi (Check-in)
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-3 py-1.5 text-xs font-semibold text-sage-800">
                      <IconCheck className="size-3.5" />
                      Sudah Check-in
                    </span>
                  )}

                  {selectedTicket.benefits.map((b) => (
                    <Button
                      key={b.id}
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={b.status === "claimed" || pending}
                      onClick={() => handleClaimBenefit(selectedTicket.id, b.benefit_key)}
                    >
                      {b.status === "claimed" ? `${b.benefit_name} (Sudah Ditukar)` : `Tukar ${b.benefit_name}`}
                    </Button>
                  ))}

                  {selectedTicket.attendee_email ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => handleKirimUlangEmail(selectedTicket.id)}
                    >
                      <IconMail className="size-4" />
                      Kirim Ulang Email
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
