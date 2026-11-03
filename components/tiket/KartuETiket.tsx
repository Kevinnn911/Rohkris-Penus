// File: components/tiket/KartuETiket.tsx

import type { ReactNode } from "react";

import { IconCalendar, IconCheck, IconMapPin, IconTicket } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

export type KartuETiketProps = {
  ticketCode: string;
  attendeeName: string;
  attendeeEmail?: string | null;
  eventTitle: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  qrDataUrl: string;
  benefits?: Array<{ key: string; name: string; status?: "unclaimed" | "claimed" }>;
  checkinStatus?: "unattended" | "attended";
  aksiTambahan?: ReactNode;
  id?: string;
};

export function KartuETiket({
  ticketCode,
  attendeeName,
  attendeeEmail,
  eventTitle,
  eventDate,
  eventLocation,
  qrDataUrl,
  benefits = [],
  checkinStatus,
  aksiTambahan,
  id = "e-tiket-card",
}: KartuETiketProps) {
  return (
    <div
      id={id}
      className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] border border-navy-200/90 bg-white shadow-float transition-all"
    >
      {/* Header Tiket: Navy Gelap dengan Aksen Emas */}
      <div className="relative bg-navy-950 px-6 py-6 text-white sm:px-8 sm:py-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-gold-300 ring-1 ring-white/20">
              <IconTicket className="size-5" />
            </span>
            <div>
              <p className="text-[0.7rem] font-bold tracking-widest text-gold-300 uppercase">
                E-TIKET RESMI
              </p>
              <p className="text-xs text-white/70">SMK Plus Pelita Nusantara</p>
            </div>
          </div>
          {checkinStatus === "attended" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
              <IconCheck className="size-3.5" />
              Sudah Hadir
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/15">
              Tiket Sah
            </span>
          )}
        </div>

        <h2 className="mt-4 text-xl font-bold leading-snug tracking-heading text-white sm:text-2xl [overflow-wrap:anywhere]">
          {eventTitle}
        </h2>

        {(eventDate || eventLocation) && (
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-white/75 sm:text-sm">
            {eventDate ? (
              <span className="inline-flex items-center gap-1.5">
                <IconCalendar className="size-4 shrink-0 text-gold-300" />
                {eventDate}
              </span>
            ) : null}
            {eventLocation ? (
              <span className="inline-flex items-center gap-1.5">
                <IconMapPin className="size-4 shrink-0 text-gold-300" />
                {eventLocation}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Garis Potong / Perforasi Tiket */}
      <div className="relative flex items-center bg-white px-2 py-1">
        <div className="absolute -left-3 size-6 rounded-full bg-ivory-100 ring-1 ring-inset ring-navy-200/80" />
        <div className="w-full border-b-2 border-dashed border-navy-200" />
        <div className="absolute -right-3 size-6 rounded-full bg-ivory-100 ring-1 ring-inset ring-navy-200/80" />
      </div>

      {/* Badan Tiket: Data Peserta & Kode QR */}
      <div className="px-6 pb-6 pt-3 sm:px-8 sm:pb-8">
        <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
          {/* Kolom Informasi Peserta */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-navy-400 uppercase">
                Nama Peserta
              </p>
              <h3 className="mt-0.5 text-xl font-bold text-navy-950 sm:text-2xl [overflow-wrap:anywhere]">
                {attendeeName}
              </h3>
              {attendeeEmail ? (
                <p className="text-xs text-navy-500 mt-0.5">{attendeeEmail}</p>
              ) : null}
            </div>

            <div>
              <p className="text-xs font-semibold tracking-wider text-navy-400 uppercase">
                Nomor Tiket
              </p>
              <p className="mt-1 inline-block rounded-xl bg-navy-50 px-3 py-1 font-mono text-base font-bold tracking-wider text-navy-950 ring-1 ring-inset ring-navy-200/80">
                {ticketCode}
              </p>
            </div>

            {benefits.length > 0 ? (
              <div>
                <p className="text-xs font-semibold tracking-wider text-navy-400 uppercase">
                  Fasilitas &amp; Kupon Acara
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-sage-700 ring-1 ring-inset ring-sage-300">
                    <IconCheck className="size-3" />
                    Presensi Hadir
                  </span>
                  {benefits.map((b) => (
                    <span
                      key={b.key}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                        b.status === "claimed"
                          ? "bg-sage-50 text-sage-700 ring-sage-200"
                          : "bg-gold-50 text-gold-700 ring-gold-200",
                      )}
                    >
                      • {b.name} {b.status === "claimed" ? "(Ditukar)" : ""}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Kolom Kode QR */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-navy-100 bg-navy-50/70 p-3 sm:p-4">
            <div className="relative size-40 overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-navy-200/80 sm:size-44">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`QR Code Tiket ${ticketCode}`}
                className="size-full object-contain"
              />
            </div>
            <p className="mt-2 text-center text-[0.7rem] font-medium text-navy-500">
              Pindai saat tiba di lokasi
            </p>
          </div>
        </div>

        {/* Petunjuk Tiket */}
        <div className="mt-6 border-t border-navy-100 pt-4">
          <p className="text-xs leading-relaxed text-navy-500">
            <strong>Catatan Penting:</strong> Simpan atau unduh tiket ini di ponsel Anda. Tunjukkan QR Code ini kepada panitia saat kedatangan untuk verifikasi kehadiran dan penukaran kupon.
          </p>
        </div>

        {aksiTambahan ? <div className="mt-6">{aksiTambahan}</div> : null}
      </div>
    </div>
  );
}
