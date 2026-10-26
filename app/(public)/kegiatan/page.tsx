import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { EventCard } from "@/components/site/EventCard";
import { KATEGORI_INFO } from "@/components/site/Kategori";
import { PageHeader } from "@/components/site/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { IconClose, IconFilter, IconGrid } from "@/components/ui/Icons";
import { EmptyState, ErrorState, SetupNotice } from "@/components/ui/States";
import { getAllPublishedEvents } from "@/lib/data/public";
import { isDatabaseConfigured } from "@/lib/env";
import { getRegistrationState, isPastEvent } from "@/lib/events/status";
import { EVENT_CATEGORIES } from "@/lib/db/types";
import { cn } from "@/lib/cn";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Kegiatan",
  description:
    "Daftar seluruh kegiatan Rohani Kristen SMK PLUS PELITA NUSANTARA: Natal, Paskah, ibadah rutin, persekutuan, retreat, pelayanan, dan aksi sosial.",
};

const STATUS_FILTERS = [
  { value: "semua", label: "Semua" },
  { value: "mendatang", label: "Mendatang" },
  { value: "pendaftaran", label: "Pendaftaran Dibuka" },
  { value: "arsip", label: "Arsip" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

/** Pill filter — aktif kuning sorotan, non-aktif putih bergaris (gaya referensi). */
function FilterChip({
  href,
  active,
  className,
  children,
}: {
  href: string;
  active: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "pressable inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm",
        active
          ? "bg-gold-300 font-medium text-navy-950"
          : "bg-white text-navy-700 ring-1 ring-inset ring-navy-200 hover:bg-navy-50 hover:text-navy-950",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export default async function KegiatanPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; status?: string }>;
}) {
  // Next.js 16: searchParams adalah Promise dan wajib di-await.
  const params = await searchParams;
  const kategoriAktif = params.kategori ?? "semua";
  const statusAktif = (params.status ?? "semua") as StatusFilter;

  const { data: semuaEvent, failed } = await getAllPublishedEvents();
  const now = new Date();

  const hasil = semuaEvent.filter((event) => {
    if (kategoriAktif !== "semua" && event.category !== kategoriAktif) return false;

    switch (statusAktif) {
      case "mendatang":
        return !isPastEvent(event, now) && event.status !== "cancelled";
      case "pendaftaran":
        return getRegistrationState(event, now) === "daftar_terbuka";
      case "arsip":
        return isPastEvent(event, now);
      default:
        return true;
    }
  });

  function hrefDengan(patch: { kategori?: string; status?: string }) {
    const next = new URLSearchParams();
    const kategori = patch.kategori ?? kategoriAktif;
    const status = patch.status ?? statusAktif;
    if (kategori !== "semua") next.set("kategori", kategori);
    if (status !== "semua") next.set("status", status);
    const query = next.toString();
    return query ? `/kegiatan?${query}` : "/kegiatan";
  }

  const adaFilter = kategoriAktif !== "semua" || statusAktif !== "semua";

  return (
    <>
      <PageHeader
        eyebrow="Kegiatan"
        title="Kegiatan Rohkris"
        description="Telusuri kegiatan yang akan datang maupun yang sudah terlaksana. Klik kartu untuk membaca detail dan cara mendaftar."
      />

      {/* Toolbar filter melayang di tepi bawah header */}
      <div className="relative z-10 mx-auto -mt-8 max-w-6xl px-4 sm:-mt-10 sm:px-8">
        <div className="rounded-bar bg-white p-4 shadow-float sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-4">
            <p className="inline-flex items-center gap-3 text-sm font-medium text-navy-950">
              <span className="grid size-11 place-items-center rounded-full bg-navy-100">
                <IconFilter className="size-[1.1rem]" />
              </span>
              Saring kegiatan
            </p>
            {adaFilter ? (
              <Link
                href="/kegiatan"
                className="pressable inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-navy-700 hover:bg-navy-50 hover:text-navy-950"
              >
                <IconClose className="size-4" />
                Atur ulang
              </Link>
            ) : null}
          </div>

          <div className="space-y-5 border-t border-navy-100 pt-5">
            {/* Filter kategori */}
            <section
              aria-labelledby="filter-kategori"
              className="grid gap-3 md:grid-cols-[7.5rem_1fr] md:items-start"
            >
              <h2 id="filter-kategori" className="px-1 pt-2.5 text-base font-semibold text-navy-950">
                Kategori
              </h2>
              <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                {["semua", ...EVENT_CATEGORIES].map((kategori) => {
                  const Icon =
                    kategori === "semua"
                      ? IconGrid
                      : KATEGORI_INFO[kategori as keyof typeof KATEGORI_INFO].Icon;
                  return (
                    <li key={kategori} className="shrink-0">
                      <FilterChip
                        href={hrefDengan({ kategori })}
                        active={kategori === kategoriAktif}
                        className="capitalize"
                      >
                        <Icon className="size-4" strokeWidth={1.6} />
                        {kategori === "semua" ? "Semua Kategori" : kategori}
                      </FilterChip>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Filter status */}
            <section
              aria-labelledby="filter-status"
              className="grid gap-3 md:grid-cols-[7.5rem_1fr] md:items-start"
            >
              <h2 id="filter-status" className="px-1 pt-2.5 text-base font-semibold text-navy-950">
                Status
              </h2>
              <ul className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((item) => (
                  <li key={item.value} className="shrink-0">
                    <FilterChip href={hrefDengan({ status: item.value })} active={item.value === statusAktif}>
                      {item.label}
                    </FilterChip>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-8 pt-14 sm:px-8 sm:pt-16">
        {!isDatabaseConfigured() ? <SetupNotice /> : null}

        <div>
          {failed ? (
            <ErrorState />
          ) : hasil.length === 0 ? (
            <EmptyState
              title="Tidak ada kegiatan yang cocok"
              description={
                semuaEvent.length === 0
                  ? "Belum ada kegiatan yang diterbitkan. Silakan kembali lagi nanti."
                  : "Coba ubah filter kategori atau status untuk melihat kegiatan lainnya."
              }
              action={
                semuaEvent.length > 0 ? (
                  <ButtonLink href="/kegiatan" variant="secondary">
                    Hapus filter
                  </ButtonLink>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-2xl font-bold tracking-heading text-navy-950 sm:text-3xl">
                  Daftar Kegiatan
                </h2>
                <p className="text-sm text-navy-600" role="status">
                  Menampilkan{" "}
                  <span className="font-semibold text-navy-950">{hasil.length}</span> kegiatan
                  {kategoriAktif !== "semua" ? ` kategori ${kategoriAktif}` : ""}.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {hasil.map((event) => (
                  <div key={event.id} className="relative">
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
