// File: app/(public)/page.tsx

import Image from "next/image";
import Link from "next/link";

import { EventCard } from "@/components/site/EventCard";
import { HeroBackdrop } from "@/components/site/HeroBackdrop";
import { KategoriFleksibel } from "@/components/site/KategoriFleksibel";
import { ArrowLink, SectionHeading } from "@/components/site/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconArrowRight,
  IconCalendar,
  IconChevronRight,
  IconFilter,
  IconMegaphone,
  IconSearch,
  IconTag,
} from "@/components/ui/Icons";
import { EmptyState, ErrorState, SetupNotice } from "@/components/ui/States";
import {
  getActiveAnnouncements,
  getFeaturedEvents,
  getPublishedMedia,
  getPublishedNews,
  getSiteSettings,
  getUpcomingEvents,
} from "@/lib/data/public";
import { isDatabaseConfigured } from "@/lib/env";
import { formatTanggalSingkat } from "@/lib/format/date";
import { EVENT_CATEGORIES, type EventRow } from "@/lib/db/types";
import { perluTanpaOptimasi } from "@/lib/images";

export const revalidate = 300;

const STATUS_PILIHAN = [
  { value: "semua", label: "Semua status" },
  { value: "mendatang", label: "Mendatang" },
  { value: "pendaftaran", label: "Pendaftaran dibuka" },
  { value: "arsip", label: "Arsip" },
] as const;

/** Kontrol pilihan yang tenang: tanpa garis bawah, panah kecil dari <PencarianField>. */
const SELECT_KELAS =
  "min-h-11 w-full min-w-0 cursor-pointer appearance-none truncate bg-transparent pr-6 text-md text-navy-700 transition-colors duration-150 hover:text-navy-950";

export default async function BerandaPage() {
  const configured = isDatabaseConfigured();

  const [featured, upcoming, media, news, announcements, settings] = await Promise.all([
    getFeaturedEvents(2),
    getUpcomingEvents(6),
    getPublishedMedia(6),
    getPublishedNews(3),
    getActiveAnnouncements(),
    getSiteSettings(),
  ]);

  const gagalMemuat = featured.failed || upcoming.failed;
  const terdekat: EventRow | undefined = upcoming.data[0] ?? featured.data[0];

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <div className="-mt-[5.25rem] px-3 sm:-mt-24 sm:px-5">
        <section
          aria-labelledby="judul-hero"
          className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-hero bg-mist pb-36 pt-32 sm:pb-44 sm:pt-40"
        >
          <HeroBackdrop />

          <div className="relative mx-auto max-w-4xl px-5 text-center">
            <h1
              id="judul-hero"
              className="animate-fade-up text-[3.1rem] font-bold leading-[0.98] tracking-display text-navy-950 text-balance sm:text-7xl lg:text-[6.5rem]"
            >
              Bertumbuh dalam Iman
            </h1>
            <p
              className="mx-auto mt-6 max-w-xl animate-fade-up text-lg text-navy-600 text-pretty sm:text-xl"
              style={{ animationDelay: "60ms" }}
            >
              {settings.site_tagline ?? "Bersama dalam kasih, pujian, dan pelayanan."}
            </p>

            <div
              className="mt-10 flex animate-fade-up flex-wrap justify-center gap-3"
              style={{ animationDelay: "120ms" }}
            >
              <ButtonLink href="/kegiatan" size="lg">
                Lihat kegiatan
              </ButtonLink>
              <ButtonLink href="/jadwal" variant="secondary" size="lg">
                Jadwal
              </ButtonLink>
            </div>

            {/* Satu baris tenang menuju kegiatan terdekat (bila ada) */}
            {terdekat ? (
              <p className="mt-5 flex animate-fade-up justify-center" style={{ animationDelay: "120ms" }}>
                <Link
                  href={`/kegiatan/${terdekat.slug}`}
                  className="group inline-flex min-h-11 min-w-0 max-w-full items-center gap-1.5 text-sm text-navy-600 transition-colors duration-150 hover:text-navy-950"
                >
                  <span className="shrink-0">Terdekat:</span>
                  <span className="min-w-0 truncate font-medium text-navy-950">{terdekat.title}</span>
                  <span className="shrink-0">
                    · {formatTanggalSingkat(terdekat.start_at) ?? "Segera diumumkan"}
                  </span>
                  <IconChevronRight
                    aria-hidden="true"
                    className="size-4 shrink-0 transition-[translate] duration-200 ease-out group-hover:translate-x-0.5"
                  />
                </Link>
              </p>
            ) : null}
          </div>
        </section>
      </div>

      {/* ───────────── Bar pencarian (melayang di tepi bawah hero) ───────────── */}
      <div className="relative z-10 mx-auto -mt-24 max-w-5xl px-4 sm:-mt-20 sm:px-6">
        <form
          action="/kegiatan"
          method="get"
          role="search"
          aria-label="Cari kegiatan"
          className="grid gap-1 rounded-bar bg-white p-3 shadow-float sm:p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center md:gap-0 md:rounded-panel"
        >
          <PencarianField id="cari-kategori" label="Kategori" Icon={IconTag}>
            <select id="cari-kategori" name="kategori" defaultValue="semua" className={SELECT_KELAS}>
              <option value="semua">Semua kategori</option>
              {EVENT_CATEGORIES.map((kategori) => (
                <option key={kategori} value={kategori}>
                  {kategori}
                </option>
              ))}
            </select>
          </PencarianField>

          <PencarianField id="cari-status" label="Status" Icon={IconFilter} pemisah>
            <select id="cari-status" name="status" defaultValue="semua" className={SELECT_KELAS}>
              {STATUS_PILIHAN.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </PencarianField>

          <div className="px-4 py-2.5 md:border-l md:border-navy-200 md:px-7">
            <p className="text-sm font-semibold text-navy-950">Jadwal</p>
            <Link
              href="/jadwal"
              className="group flex min-h-11 items-center gap-2 text-md text-navy-700 transition-colors duration-150 hover:text-navy-950"
            >
              <IconCalendar className="size-4 shrink-0 text-navy-500" />
              Lihat kalender
              <IconChevronRight
                aria-hidden="true"
                className="ml-auto size-4 shrink-0 text-navy-400 transition-[translate] duration-200 ease-out group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <div className="px-2 pb-2 pt-1 md:p-0 md:pl-4">
            <button
              type="submit"
              className="pressable flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-navy-950 font-medium text-white shadow-button hover:bg-navy-800 md:size-[4.5rem] md:min-h-0"
            >
              <IconSearch className="size-6" />
              <span className="md:sr-only">Cari kegiatan</span>
            </button>
          </div>
        </form>
      </div>

      <div className="mx-auto max-w-7xl space-y-24 px-4 pt-20 sm:px-8 sm:pt-24">
        {!configured ? <SetupNotice /> : null}

        {/* Pengumuman aktif — ikon netral; kuning disimpan untuk aksen seksi "Tentang" */}
        {announcements.length > 0 ? (
          <section aria-labelledby="judul-pengumuman">
            <h2 id="judul-pengumuman" className="sr-only">
              Pengumuman
            </h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {announcements.map((item) => (
                <li key={item.id} className="flex gap-4 rounded-card border border-navy-200/80 bg-white p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-200/80">
                    <IconMegaphone className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-navy-500">Pengumuman</p>
                    <h3 className="mt-0.5 font-semibold text-navy-950 [overflow-wrap:anywhere]">{item.title}</h3>
                    {item.body ? (
                      <p className="mt-1.5 text-sm leading-relaxed text-navy-600 [overflow-wrap:anywhere]">
                        {item.body}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ───────────── Pilih kategori ───────────── */}
        <KategoriFleksibel
          judulId="judul-kategori"
          heading={
            <SectionHeading
              id="judul-kategori"
              title="Pilih Kategori"
              description="Temukan kegiatan yang paling cocok untukmu"
            />
          }
        />

        {gagalMemuat ? <ErrorState /> : null}

        {/* Kegiatan unggulan */}
        {featured.data.length > 0 ? (
          <section aria-labelledby="judul-unggulan">
            <SectionHeading
              id="judul-unggulan"
              title="Kegiatan Unggulan"
              description="Yang sedang menjadi sorotan Rohkris"
            />
            <div className="mt-9 grid gap-5 sm:grid-cols-2">
              {featured.data.map((event) => (
                <div key={event.id} className="relative">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Kegiatan mendatang */}
        <section aria-labelledby="judul-mendatang">
          <SectionHeading
            id="judul-mendatang"
            title="Kegiatan Mendatang"
            description="Agenda terdekat yang bisa kamu ikuti"
            action={<ArrowLink href="/kegiatan">Lihat semua</ArrowLink>}
          />

          <div className="mt-9">
            {upcoming.data.length === 0 ? (
              <EmptyState
                title="Belum ada kegiatan terjadwal"
                description="Kegiatan Rohkris berikutnya akan tampil di sini segera setelah pengurus menambahkannya."
                action={
                  <ButtonLink href="/dokumentasi" variant="secondary">
                    Lihat dokumentasi
                  </ButtonLink>
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.data.map((event) => (
                  <div key={event.id} className="relative">
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Tentang singkat — satu-satunya aksen kuning di seksi ini.
          Berada di luar pembungkus konten agar memakai bingkai yang sama dengan
          hero & footer (px-3 sm:px-5 + max-w-7xl), sehingga lebarnya sejajar. */}
      <div className="mt-24 px-3 sm:px-5">
        <section
          aria-labelledby="judul-tentang"
          className="mx-auto max-w-7xl rounded-hero bg-navy-950 px-6 py-14 text-white sm:px-14 sm:py-16"
        >
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="text-sm font-medium text-gold-300">Tentang Kami</p>
              <h2
                id="judul-tentang"
                className="mt-4 text-3xl font-bold leading-[1.1] tracking-heading text-balance sm:text-5xl"
              >
                Satu keluarga yang bertumbuh dan melayani bersama.
              </h2>
              <p className="mt-5 max-w-2xl leading-relaxed text-white/70">
                {settings.about_body ??
                  "Rohani Kristen SMK PLUS PELITA NUSANTARA adalah wadah persekutuan siswa Kristen untuk bertumbuh dalam iman, melayani sesama, dan membangun komunitas yang hangat."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
              <ButtonLink href="/tentang" variant="gold" size="lg">
                Kenali kami
              </ButtonLink>
              <ButtonLink href="/kontak" variant="glass" size="lg">
                Hubungi pengurus
              </ButtonLink>
            </div>
          </div>
        </section>
      </div>

      {media.data.length > 0 || news.data.length > 0 ? (
      <div className="mx-auto max-w-7xl space-y-24 px-4 pb-8 pt-24 sm:px-8">
        {/* Cuplikan dokumentasi */}
        {media.data.length > 0 ? (
          <section aria-labelledby="judul-galeri">
            <SectionHeading
              id="judul-galeri"
              title="Dokumentasi Kegiatan"
              description="Momen kebersamaan yang kami syukuri"
              action={<ArrowLink href="/dokumentasi">Lihat galeri</ArrowLink>}
            />
            <ul className="mt-9 grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] sm:grid-cols-4 sm:gap-4">
              {media.data.map((item, index) => (
                <li
                  key={item.id}
                  className={
                    "relative overflow-hidden rounded-card bg-navy-100 " +
                    (index === 0 ? "col-span-2 row-span-2" : index === 3 ? "sm:col-span-2" : "")
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.media_url}
                    alt={item.alt_text}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Berita terbaru */}
        {news.data.length > 0 ? (
          <section aria-labelledby="judul-berita">
            <SectionHeading
              id="judul-berita"
              title="Berita Terbaru"
              description="Cerita dan rekap dari kegiatan Rohkris"
              action={<ArrowLink href="/berita">Semua berita</ArrowLink>}
            />
            <ul className="mt-9 grid gap-5 md:grid-cols-3">
              {news.data.map((post) => (
                <li
                  key={post.id}
                  className="card-interactive group relative flex flex-col rounded-card border border-navy-200/80 bg-white p-2.5"
                >
                  {post.cover_image_url ? (
                    <div className="relative aspect-[16/10] overflow-hidden rounded-inner bg-navy-100">
                      <Image
                        src={post.cover_image_url}
                        unoptimized={perluTanpaOptimasi(post.cover_image_url)}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
                    <p className="text-xs text-navy-500">
                      {formatTanggalSingkat(post.published_at) ?? "Tanggal belum diatur"}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold leading-snug tracking-heading text-navy-950 [overflow-wrap:anywhere]">
                      <Link href={`/berita/${post.slug}`} className="after:absolute after:inset-0">
                        {post.title}
                      </Link>
                    </h3>
                    {post.excerpt ? (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-navy-600">{post.excerpt}</p>
                    ) : null}
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-navy-950">
                      Baca selengkapnya
                      <IconArrowRight className="size-4 transition-[translate] duration-200 ease-out group-hover:translate-x-1" />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      ) : null}
    </>
  );
}

/** Satu kolom pada bar pencarian: label kecil tebal + kontrol pilihan berikon. */
function PencarianField({
  id,
  label,
  Icon,
  pemisah = false,
  children,
}: {
  id: string;
  label: string;
  Icon: typeof IconTag;
  pemisah?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={pemisah ? "px-4 py-2.5 md:border-l md:border-navy-200 md:px-7" : "px-4 py-2.5 md:px-7"}>
      <label htmlFor={id} className="block text-sm font-semibold text-navy-950">
        {label}
      </label>
      <div className="relative flex items-center gap-2 text-navy-500">
        <Icon className="size-4 shrink-0" />
        {children}
        <IconChevronRight
          aria-hidden="true"
          className="pointer-events-none absolute right-0 size-4 rotate-90 text-navy-400"
        />
      </div>
    </div>
  );
}
