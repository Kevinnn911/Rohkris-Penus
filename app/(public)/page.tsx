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
  IconBook,
  IconCalendar,
  IconCross,
  IconHandHeart,
  IconHeart,
  IconLamp,
  IconMegaphone,
  IconMusic,
  IconSearch,
  IconSparkle,
  IconTag,
  IconUsers,
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
import { formatRentangKegiatan, formatTanggalSingkat } from "@/lib/format/date";
import { EVENT_CATEGORIES, type EventRow } from "@/lib/db/types";
import { perluTanpaOptimasi } from "@/lib/images";

export const revalidate = 300;

/** Deretan ikon bulat di bawah judul hero (pengganti deretan emoji pada referensi). */
const NILAI = [
  { Icon: IconCross, label: "Iman" },
  { Icon: IconHeart, label: "Kasih" },
  { Icon: IconBook, label: "Firman" },
  { Icon: IconUsers, label: "Persekutuan" },
  { Icon: IconMusic, label: "Pujian" },
  { Icon: IconHandHeart, label: "Pelayanan" },
] as const;

const STATUS_PILIHAN = [
  { value: "semua", label: "Semua status" },
  { value: "mendatang", label: "Mendatang" },
  { value: "pendaftaran", label: "Pendaftaran dibuka" },
  { value: "arsip", label: "Arsip" },
] as const;

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

          {/* Kartu melayang kiri — kegiatan terdekat */}
          <FloatingEventChip event={terdekat} />

          {/* Kartu melayang kanan — ayat */}
          <div className="absolute right-8 top-44 hidden w-56 animate-float rounded-[1.4rem] bg-white/75 p-2.5 shadow-float ring-1 ring-white backdrop-blur-md xl:block [animation-delay:1.5s]">
            <div className="relative overflow-hidden rounded-[1rem] bg-gradient-to-br from-[#d9e6f2] via-[#eef2f6] to-[#f8e9b8] px-4 py-5">
              <IconLamp aria-hidden="true" className="absolute right-3 top-3 size-5 text-navy-950/50" />
              <p className="text-[0.95rem] font-semibold leading-tight text-navy-950">
                Kamu adalah
                <br />
                terang dunia
              </p>
            </div>
            <p className="px-2 pb-1 pt-3 text-xs text-navy-500">
              <span className="font-medium text-navy-950">Matius 5:14</span> · Ayat tema
            </p>
          </div>

          <div className="relative mx-auto max-w-4xl px-5 text-center">
            <h1
              id="judul-hero"
              className="animate-fade-up text-[3.1rem] font-bold leading-[0.98] tracking-[-0.055em] text-navy-950 text-balance sm:text-7xl lg:text-[6.5rem]"
            >
              Bertumbuh dalam Iman
            </h1>
            <p
              className="mx-auto mt-6 max-w-xl animate-fade-up text-lg text-navy-600 sm:text-xl"
              style={{ animationDelay: "100ms" }}
            >
              {settings.site_tagline ?? "Bersama dalam kasih, pujian, dan pelayanan."}
            </p>

            <ul
              className="mt-10 flex animate-fade-up justify-center"
              style={{ animationDelay: "180ms" }}
              aria-label="Nilai-nilai Rohkris"
            >
              {NILAI.map(({ Icon, label }) => (
                <li key={label} className="-ml-2 first:ml-0">
                  <span
                    title={label}
                    className="grid size-12 place-items-center rounded-full bg-white text-navy-950 shadow-soft ring-4 ring-[#eef0f2] sm:size-[3.25rem]"
                  >
                    <Icon className="size-5" />
                    <span className="sr-only">{label}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 animate-fade-up" style={{ animationDelay: "240ms" }}>
              <Link
                href="/tentang"
                className="text-sm font-medium text-navy-950 underline decoration-navy-950 underline-offset-4 hover:decoration-2"
              >
                Terbuka untuk seluruh siswa
              </Link>
            </p>
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
          className="grid gap-1 rounded-[1.75rem] bg-white p-3 shadow-float sm:p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center md:gap-0 md:rounded-[2rem]"
        >
          <PencarianField id="cari-kategori" label="Kategori" Icon={IconTag}>
            <select
              id="cari-kategori"
              name="kategori"
              defaultValue="semua"
              className="w-full cursor-pointer appearance-none bg-transparent py-1 text-sm text-navy-600 underline decoration-navy-300 underline-offset-4 focus:outline-none"
            >
              <option value="semua">Semua kategori</option>
              {EVENT_CATEGORIES.map((kategori) => (
                <option key={kategori} value={kategori}>
                  {kategori}
                </option>
              ))}
            </select>
          </PencarianField>

          <PencarianField id="cari-status" label="Status" Icon={IconSparkle} pemisah>
            <select
              id="cari-status"
              name="status"
              defaultValue="semua"
              className="w-full cursor-pointer appearance-none bg-transparent py-1 text-sm text-navy-600 underline decoration-navy-300 underline-offset-4 focus:outline-none"
            >
              {STATUS_PILIHAN.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </PencarianField>

          <div className="px-4 py-3 md:border-l md:border-navy-200 md:px-7">
            <p className="text-lg font-semibold text-navy-950">
              <span className="label-dot">Jadwal</span>
            </p>
            <Link
              href="/jadwal"
              className="mt-1 inline-flex items-center gap-2 py-1 text-sm text-navy-600 underline decoration-navy-300 underline-offset-4 hover:text-navy-950"
            >
              <IconCalendar className="size-4" />
              Lihat kalender
            </Link>
          </div>

          <div className="px-2 pb-2 pt-1 md:p-0 md:pl-4">
            <button
              type="submit"
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-navy-950 font-medium text-white transition-colors hover:bg-navy-800 md:size-[4.5rem] md:min-h-0"
            >
              <IconSearch className="size-6" />
              <span className="md:sr-only">Cari kegiatan</span>
            </button>
          </div>
        </form>
      </div>

      <div className="mx-auto max-w-7xl space-y-24 px-4 pb-8 pt-20 sm:px-8 sm:pt-24">
        {!configured ? <SetupNotice /> : null}

        {/* Pengumuman aktif */}
        {announcements.length > 0 ? (
          <section aria-labelledby="judul-pengumuman">
            <h2 id="judul-pengumuman" className="sr-only">
              Pengumuman
            </h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {announcements.map((item) => (
                <li key={item.id} className="flex gap-4 rounded-card border border-navy-200/80 bg-white p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold-300 text-navy-950">
                    <IconMegaphone className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-navy-500">Pengumuman</p>
                    <h3 className="mt-0.5 font-semibold text-navy-950">{item.title}</h3>
                    {item.body ? <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{item.body}</p> : null}
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

        {/* Tentang singkat */}
        <section
          aria-labelledby="judul-tentang"
          className="relative isolate overflow-hidden rounded-hero bg-navy-950 px-6 py-14 text-white sm:px-14 sm:py-16"
        >
          <div aria-hidden="true" className="absolute -right-20 -top-20 -z-10 size-80 rounded-full bg-gold-300/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -right-10 top-10 -z-10 size-72 rounded-full border border-white/10" />
          <IconCross
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-12 right-6 -z-10 size-72 text-white/[0.05]"
            strokeWidth={1}
          />
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="inline-flex rounded-full bg-gold-300 px-3.5 py-1 text-sm font-medium text-navy-950">
                Tentang Kami
              </p>
              <h2
                id="judul-tentang"
                className="mt-5 text-3xl font-bold leading-[1.1] tracking-[-0.035em] text-balance sm:text-5xl"
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
                    "group relative overflow-hidden rounded-card bg-navy-100 " +
                    (index === 0 ? "col-span-2 row-span-2" : index === 3 ? "sm:col-span-2" : "")
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.media_url}
                    alt={item.alt_text}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
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
                  className="group relative flex flex-col rounded-card border border-navy-200/80 bg-white p-2.5 transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  {post.cover_image_url ? (
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[1.1rem] bg-navy-100">
                      <Image
                        src={post.cover_image_url}
                        unoptimized={perluTanpaOptimasi(post.cover_image_url)}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
                    <p className="text-xs text-navy-500">
                      {formatTanggalSingkat(post.published_at) ?? "Tanggal belum diatur"}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold leading-snug tracking-[-0.015em] text-navy-950">
                      <Link href={`/berita/${post.slug}`} className="after:absolute after:inset-0">
                        {post.title}
                      </Link>
                    </h3>
                    {post.excerpt ? (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-navy-600">{post.excerpt}</p>
                    ) : null}
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-navy-950">
                      Baca selengkapnya
                      <IconArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}

/** Satu kolom pada bar pencarian: label tebal bertitik kuning + kontrol bergaris bawah. */
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
    <div className={pemisah ? "px-4 py-3 md:border-l md:border-navy-200 md:px-7" : "px-4 py-3 md:px-7"}>
      <label htmlFor={id} className="block text-lg font-semibold text-navy-950">
        <span className="label-dot">{label}</span>
      </label>
      <div className="mt-1 flex items-center gap-2 text-navy-500">
        <Icon className="size-4 shrink-0" />
        {children}
      </div>
    </div>
  );
}

/** Kartu kecil melayang di sisi kiri hero. */
function FloatingEventChip({ event }: { event: EventRow | undefined }) {
  const href = event ? `/kegiatan/${event.slug}` : "/jadwal";
  const judul = event?.title ?? "Ibadah & persekutuan";
  const keterangan = event
    ? (formatRentangKegiatan(event.start_at, event.end_at) ?? "Tanggal akan diumumkan")
    : "Lihat jadwal terdekat";

  return (
    <Link
      href={href}
      className="group absolute left-8 top-60 hidden w-64 animate-float items-center gap-3 rounded-[1.4rem] bg-white/75 p-3 pr-4 shadow-float ring-1 ring-white backdrop-blur-md transition-colors hover:bg-white lg:flex"
    >
      <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-gold-200 via-gold-300 to-sage-300 text-navy-950">
        {event?.cover_image_url ? (
          <Image
            src={event.cover_image_url}
            unoptimized={perluTanpaOptimasi(event.cover_image_url)}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <IconCalendar className="size-5" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium text-navy-950">{judul}</span>
        <span className="block truncate text-xs text-navy-500">{keterangan}</span>
      </span>
    </Link>
  );
}
