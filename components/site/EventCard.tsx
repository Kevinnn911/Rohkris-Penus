import Image from "next/image";
import Link from "next/link";

import { KATEGORI_INFO } from "@/components/site/Kategori";
import { Badge } from "@/components/ui/Badge";
import { IconArrowRight, IconCalendar, IconMapPin } from "@/components/ui/Icons";
import {
  getRegistrationLabel,
  getRegistrationState,
} from "@/lib/events/status";
import { formatRentangKegiatan } from "@/lib/format/date";
import type { EventWithForm } from "@/lib/db/types";
import { perluTanpaOptimasi } from "@/lib/images";

/**
 * Kartu kegiatan.
 *
 * Kartu TIDAK pernah memuat tombol daftar — hanya "Lihat Detail" (PRD §FR-02).
 * Keputusan menampilkan CTA pendaftaran ada di halaman detail, memakai
 * logika tunggal di lib/events/status.ts.
 */
export function EventCard({ event }: { event: EventWithForm }) {
  const waktu = formatRentangKegiatan(event.start_at, event.end_at);
  const statusPendaftaran = getRegistrationLabel(getRegistrationState(event));
  const KategoriIcon = KATEGORI_INFO[event.category as keyof typeof KATEGORI_INFO]?.Icon ?? KATEGORI_INFO.Lainnya.Icon;

  return (
    <article className="card-interactive group flex h-full flex-col rounded-card border border-navy-200/80 bg-white p-2.5">
      <div className="relative aspect-[4/3] overflow-hidden rounded-inner bg-navy-100">
        {event.cover_image_url ? (
          <Image
            src={event.cover_image_url}
            unoptimized={perluTanpaOptimasi(event.cover_image_url)}
            alt={`Poster kegiatan ${event.title}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          // Placeholder saat poster belum diunggah — tetap rapi, bukan gambar rusak.
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-mist">
            <KategoriIcon className="size-14 text-navy-950/80" strokeWidth={1.2} />
            <span className="text-xs text-navy-600">Poster belum tersedia</span>
          </div>
        )}
        <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-navy-950 shadow-sm">
          {event.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        <h3 className="text-lg font-semibold leading-snug tracking-heading text-navy-950 [overflow-wrap:anywhere]">
          <Link href={`/kegiatan/${event.slug}`} className="after:absolute after:inset-0 after:rounded-card">
            {event.title}
          </Link>
        </h3>

        <dl className="mt-3 space-y-1.5 text-sm text-navy-500">
          <div className="flex items-start gap-2">
            <dt className="sr-only">Waktu</dt>
            <IconCalendar className="mt-0.5 size-4 shrink-0" />
            <dd>{waktu ?? "Tanggal akan diumumkan"}</dd>
          </div>
          {event.location ? (
            <div className="flex items-start gap-2">
              <dt className="sr-only">Lokasi</dt>
              <IconMapPin className="mt-0.5 size-4 shrink-0" />
              <dd>{event.location}</dd>
            </div>
          ) : null}
        </dl>

        {event.summary ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-navy-600">{event.summary}</p>
        ) : null}

        <div aria-hidden="true" className="min-h-5 flex-1" />

        <div className="flex items-center justify-between gap-3">
          <Badge tone={statusPendaftaran.tone}>
            {statusPendaftaran.text}
          </Badge>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy-100 text-navy-950 transition-colors duration-200 group-hover:bg-navy-200">
            <IconArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
            <span className="sr-only">Lihat detail</span>
          </span>
        </div>
      </div>
    </article>
  );
}

/** Versi relatif agar kartu di dalam grid bisa memakai overlay link. */
export function EventCardGrid({ events }: { events: EventWithForm[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <div key={event.id} className="relative">
          <EventCard event={event} />
        </div>
      ))}
    </div>
  );
}
