// File: components/tiket/KartuETiket.tsx

import type { ReactNode } from "react";

import { IconMapPin, IconTicket } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

export type KartuETiketProps = {
  ticketCode: string;
  attendeeName: string;
  attendeeEmail?: string | null;
  attendeePhone?: string | null;
  attendeeOrg?: string | null;
  eventTitle: string;
  eventSummary?: string | null;
  eventDate?: string | null;
  eventLocation?: string | null;
  bannerUrl?: string | null;
  price?: string | null;
  orderId?: string | null;
  qrDataUrl: string;
  benefits?: Array<{ key: string; name: string; status?: "unclaimed" | "claimed" }>;
  checkinStatus?: "unattended" | "attended";
  whatsappGroupUrl?: string | null;
  aksiTambahan?: ReactNode;
  id?: string;
};

export function KartuETiket({
  ticketCode,
  attendeeName,
  attendeeEmail,
  attendeePhone,
  attendeeOrg,
  eventTitle,
  eventSummary,
  eventDate,
  eventLocation,
  bannerUrl,
  price,
  orderId,
  qrDataUrl,
  benefits = [],
  checkinStatus,
  whatsappGroupUrl,
  aksiTambahan,
  id = "e-tiket-card",
}: KartuETiketProps) {
  return (
    <div
      id={id}
      className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-[#18181b] text-white shadow-2xl transition-all"
    >
      {/* 1. Banner Atas (Header Poster) */}
      <div className="relative aspect-[21/9] w-full overflow-hidden bg-zinc-900 sm:aspect-[16/6]">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt={eventTitle}
            className="size-full object-cover"
          />
        ) : (
          <div className="relative flex size-full items-center justify-between overflow-hidden bg-gradient-to-r from-navy-950 via-zinc-900 to-navy-900 px-6 py-4">
            <div className="relative z-10">
              <span className="inline-block text-[10px] font-bold tracking-widest text-gold-300 uppercase">
                SMK PLUS PELITA NUSANTARA
              </span>
              <p className="mt-0.5 text-sm font-bold tracking-heading text-white sm:text-base">
                ROHANI KRISTEN (ROHKRIS)
              </p>
            </div>
            <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold-300 ring-1 ring-white/15">
              <IconTicket className="size-6" />
            </div>
          </div>
        )}
      </div>

      {/* 2. Judul Acara, Subjudul, Tanggal & Kode QR Terpusat */}
      <div className="px-5 pt-5 pb-2 text-center sm:px-6">
        <h2 className="text-base font-bold leading-snug tracking-heading text-white sm:text-lg [overflow-wrap:anywhere]">
          {eventTitle}
        </h2>
        {eventSummary ? (
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
            {eventSummary}
          </p>
        ) : null}
        {eventDate ? (
          <p className="mt-1 text-xs text-zinc-400">
            {eventDate}
          </p>
        ) : null}

        {/* Kotak Kode QR Putih Bersih di Tengah */}
        <div className="my-5 flex justify-center">
          <div className="rounded-xl bg-white p-3 shadow-md sm:p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`QR Code Tiket ${ticketCode}`}
              className="size-48 object-contain sm:size-52"
            />
          </div>
        </div>
      </div>

      {/* 3. Detail Peserta */}
      <div className="border-t border-zinc-800/80 px-5 py-4 sm:px-6">
        <h3 className="text-xs font-bold tracking-wider text-zinc-300 uppercase">
          DETAIL PESERTA
        </h3>
        <div className="mt-2.5 space-y-1.5 text-xs">
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[130px_1fr]">
            <span className="text-zinc-400">Nama:</span>
            <span className="font-semibold text-white [overflow-wrap:anywhere]">{attendeeName}</span>
          </div>
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[130px_1fr]">
            <span className="text-zinc-400">Email:</span>
            <span className="text-zinc-200 [overflow-wrap:anywhere]">{attendeeEmail || "-"}</span>
          </div>
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[130px_1fr]">
            <span className="text-zinc-400">No. WhatsApp:</span>
            <span className="text-zinc-200">{attendeePhone || "-"}</span>
          </div>
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[130px_1fr]">
            <span className="text-zinc-400">Asal:</span>
            <span className="text-zinc-200">{attendeeOrg || "SMK PLUS PELITA NUSANTARA"}</span>
          </div>
        </div>
      </div>

      {/* 4. Detail Tiket */}
      <div className="border-t border-zinc-800/80 px-5 py-4 sm:px-6">
        <h3 className="text-xs font-bold tracking-wider text-zinc-300 uppercase">
          DETAIL TIKET
        </h3>
        <div className="mt-2.5 space-y-1.5 text-xs">
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[130px_1fr]">
            <span className="text-zinc-400">Tiket ID:</span>
            <span className="font-mono font-bold text-white">{ticketCode}</span>
          </div>
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[130px_1fr]">
            <span className="text-zinc-400">Harga:</span>
            <span className="text-zinc-200">{price || "Gratis"}</span>
          </div>
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[130px_1fr]">
            <span className="text-zinc-400">Order ID:</span>
            <span className="font-mono text-zinc-300">{orderId || ticketCode}</span>
          </div>
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[130px_1fr] items-center">
            <span className="text-zinc-400">Status:</span>
            <div>
              {checkinStatus === "attended" ? (
                <span className="inline-block rounded bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  Sudah Hadir
                </span>
              ) : (
                <span className="inline-block rounded bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  Sudah Dibayar
                </span>
              )}
            </div>
          </div>
          {benefits.length > 0 ? (
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[130px_1fr] pt-1">
              <span className="text-zinc-400">Fasilitas / Kupon:</span>
              <div className="flex flex-wrap gap-1.5">
                {benefits.map((b) => (
                  <span
                    key={b.key}
                    className={cn(
                      "inline-block rounded px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                      b.status === "claimed"
                        ? "bg-zinc-800 text-zinc-400 ring-zinc-700 line-through"
                        : "bg-emerald-950/70 text-emerald-300 ring-emerald-700/60",
                    )}
                  >
                    {b.name} {b.status === "claimed" ? "(Ditukar)" : ""}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* 5. Lokasi Event */}
      <div className="border-t border-zinc-800/80 px-5 py-4 sm:px-6">
        <h3 className="text-xs font-bold tracking-wider text-zinc-300 uppercase">
          LOKASI EVENT
        </h3>
        <div className="mt-2.5 flex items-start gap-2 text-xs text-zinc-200">
          <IconMapPin className="mt-0.5 size-4 shrink-0 text-zinc-400" />
          <span className="leading-relaxed">
            {eventLocation || "SMK Plus Pelita Nusantara, Cibinong, Bogor"}
          </span>
        </div>
      </div>

      {/* 6. Kotak Catatan (Amber / Cokelat) */}
      <div className="px-5 py-2 sm:px-6">
        <div className="rounded-lg border border-amber-600/80 bg-[#3a1d06]/75 p-3 text-xs leading-relaxed text-amber-200">
          <p>
            <strong className="font-semibold text-amber-100">Catatan:</strong> Peserta wajib menunjukkan e-tiket saat registrasi ulang. Simpan e-tiket dengan cara mengunduh atau melakukan tangkapan layar, dan pastikan QR code terlihat jelas serta dapat dipindai.
          </p>
        </div>
      </div>

      {/* 7. Syarat dan Ketentuan Daftar */}
      <div className="border-t border-zinc-800/80 px-5 py-4 sm:px-6">
        <h3 className="text-xs font-bold tracking-wider text-zinc-300 uppercase">
          SYARAT DAN KETENTUAN DAFTAR
        </h3>
        <ol className="mt-2.5 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-zinc-300">
          <li>
            Acara ini terbuka untuk seluruh peserta terdaftar kegiatan Rohkris SMK Plus Pelita Nusantara.
          </li>
          <li>
            Peserta wajib mendaftar melalui situs resmi Rohkris Pelita Nusantara.
          </li>
          <li>
            Setelah mendaftar, peserta diwajibkan bergabung ke grup komunikasi / WhatsApp panitia untuk mendapatkan informasi lebih lanjut.
          </li>
          <li>
            <span>Link Grup: </span>
            {whatsappGroupUrl ? (
              <a
                href={whatsappGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-400 underline hover:text-emerald-300"
              >
                Join Grup WhatsApp
              </a>
            ) : (
              <span className="font-medium text-emerald-400">
                Informasi koordinasi dibagikan via grup Rohkris
              </span>
            )}
          </li>
          <li>
            Peserta diwajibkan mengikuti akun-akun media sosial resmi Rohkris untuk pembaruan informasi: @rohkrissmkpenus.
          </li>
          <li>
            Peserta diwajibkan mematuhi seluruh arahan dan tata tertib panitia penyelenggara.
          </li>
        </ol>
      </div>

      {/* 8. Peraturan Kegiatan (Do's & Don'ts) */}
      <div className="border-t border-zinc-800/80 px-5 py-4 sm:px-6">
        <h3 className="text-xs font-bold tracking-wider text-zinc-300 uppercase">
          PERATURAN KEGIATAN
        </h3>
        <div className="mt-2.5 space-y-3 text-xs leading-relaxed text-zinc-300">
          <div>
            <p className="font-semibold text-zinc-200">• Do&apos;s (Hal yang dilakukan)</p>
            <ol className="mt-1 list-decimal space-y-1 pl-4 text-zinc-400">
              <li>Menggunakan pakaian rapi dan sopan yang ditentukan oleh panitia.</li>
              <li>Membuang sampah pada tempat yang telah disediakan.</li>
              <li>Membawa bukti pendaftaran e-tiket dan kartu identitas / kartu pelajar yang valid.</li>
              <li>Hadir di lokasi tepat waktu sesuai jadwal acara.</li>
              <li>Menjaga ketertiban, keamanan, dan kenyamanan seluruh peserta.</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-zinc-200">• Don&apos;ts (Hal yang dihindari)</p>
            <ol className="mt-1 list-decimal space-y-1 pl-4 text-zinc-400">
              <li>Dilarang membawa hewan peliharaan.</li>
              <li>Dilarang membawa senjata tajam atau benda-benda berbahaya lainnya.</li>
              <li>Dilarang membawa dan mengonsumsi minuman keras atau obat-obatan terlarang.</li>
              <li>Dilarang merokok atau menggunakan vape di area acara.</li>
              <li>Dilarang membuang sampah sembarangan.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* 9. Tombol Aksi Tambahan (Unduh / Cetak) */}
      {aksiTambahan ? (
        <div className="border-t border-zinc-800/80 bg-zinc-900/60 p-5 sm:p-6">
          {aksiTambahan}
        </div>
      ) : null}
    </div>
  );
}
