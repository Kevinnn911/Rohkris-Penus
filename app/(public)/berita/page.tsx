import type { Metadata } from "next";
import Link from "next/link";

import { Tag } from "@/components/site/Kategori";
import { PageHeader, SectionHeading } from "@/components/site/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { IconArrowRight, IconCalendar, IconNewspaper } from "@/components/ui/Icons";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { getPublishedNews } from "@/lib/data/public";
import { formatTanggal, toDateTimeAttr } from "@/lib/format/date";
import type { NewsPostRow } from "@/lib/db/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Berita",
  description:
    "Berita dan recap kegiatan Rohani Kristen SMK PLUS PELITA NUSANTARA.",
};

export default async function BeritaPage() {
  const { data: berita, failed } = await getPublishedNews();
  const [utama, ...lainnya] = berita;

  return (
    <>
      <PageHeader
        eyebrow="Kabar Rohkris"
        title="Berita & Recap"
        description="Cerita dan rangkuman dari kegiatan Rohkris yang telah terlaksana."
        breadcrumb={[{ href: "/", label: "Beranda" }, { label: "Berita" }]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-8 sm:pt-20">
        {failed ? (
          <ErrorState />
        ) : !utama ? (
          <EmptyState
            title="Belum ada berita"
            description="Recap kegiatan akan dipublikasikan di sini setelah kegiatan terlaksana."
            action={
              <ButtonLink href="/kegiatan" variant="secondary">
                Lihat kegiatan
                <IconArrowRight className="size-4" />
              </ButtonLink>
            }
            icon={<IconNewspaper className="size-7" />}
          />
        ) : (
          <div className="space-y-20 sm:space-y-24">
            <section aria-labelledby="judul-berita-terbaru">
              <SectionHeading
                id="judul-berita-terbaru"
                eyebrow="Terbaru"
                title="Kabar Terkini"
                description="Recap kegiatan yang paling baru dipublikasikan."
              />
              <div className="mt-10">
                <BeritaUtama post={utama} />
              </div>
            </section>

            {lainnya.length > 0 ? (
              <section aria-labelledby="judul-berita-lainnya">
                <SectionHeading
                  id="judul-berita-lainnya"
                  eyebrow="Arsip"
                  title="Kabar Lainnya"
                  description="Jejak cerita dari kegiatan-kegiatan sebelumnya."
                />
                <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {lainnya.map((post) => (
                    <li key={post.id} className="flex">
                      <KartuBerita post={post} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

/** Tanggal terbit dalam pill abu — dipakai di semua kartu berita. */
function TanggalTerbit({ value }: { value: string | null }) {
  if (!value) return null;
  return (
    <p className="inline-flex items-center gap-2 self-start rounded-full bg-navy-100 px-3 py-1 text-xs font-medium text-navy-700">
      <IconCalendar className="size-3.5" />
      <time dateTime={toDateTimeAttr(value)}>{formatTanggal(value)}</time>
    </p>
  );
}

/** Sampul berita, atau latar kabut berikon garis bila sampul belum ada. */
function SampulBerita({ post, className }: { post: NewsPostRow; className?: string }) {
  if (post.cover_image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={post.cover_image_url}
        alt={`Sampul berita ${post.title}`}
        loading="lazy"
        className={`size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] ${className ?? ""}`}
      />
    );
  }
  return (
    <div className={`flex size-full flex-col items-center justify-center gap-3 bg-mist ${className ?? ""}`}>
      <IconNewspaper aria-hidden="true" className="size-14 text-navy-950/80" strokeWidth={1.2} />
      <span className="text-xs text-navy-600">Sampul belum tersedia</span>
    </div>
  );
}

/** Kartu berita pertama — besar dan horizontal (gambar kiri, teks kanan). */
function BeritaUtama({ post }: { post: NewsPostRow }) {
  return (
    <article className="card-interactive group relative grid gap-2 rounded-panel border border-navy-200/80 bg-white p-2.5 lg:grid-cols-12 lg:gap-4">
      <div className="relative aspect-[16/10] overflow-hidden rounded-panel-inner bg-navy-100 lg:col-span-7 lg:aspect-auto lg:min-h-[26rem]">
        <SampulBerita post={post} className="lg:absolute lg:inset-0" />
        <Tag tone="kuning" className="absolute left-4 top-4 shadow-sm">
          Terbaru
        </Tag>
      </div>

      <div className="flex flex-col px-4 pb-4 pt-4 sm:px-6 sm:pb-6 lg:col-span-5 lg:py-8 lg:pl-4 lg:pr-8">
        <TanggalTerbit value={post.published_at} />
        <h3 className="mt-5 text-3xl font-bold leading-[1.1] tracking-display text-navy-950 text-balance [overflow-wrap:anywhere] sm:text-[2.5rem]">
          <Link
            href={`/berita/${post.slug}`}
            className="after:absolute after:inset-0 after:rounded-panel"
          >
            {post.title}
          </Link>
        </h3>
        {post.excerpt ? (
          <p className="mt-4 text-base leading-relaxed text-navy-600 sm:text-lg">{post.excerpt}</p>
        ) : null}
        <div aria-hidden="true" className="min-h-8 flex-1" />
        <span className="inline-flex min-h-11 items-center gap-3 self-start rounded-full bg-navy-950 py-1.5 pl-5 pr-1.5 text-sm font-medium text-white transition-colors group-hover:bg-navy-800">
          Baca selengkapnya
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-full bg-gold-300 text-navy-950"
          >
            <IconArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </span>
        </span>
      </div>
    </article>
  );
}

/** Kartu grid untuk berita lainnya — gaya kartu kegiatan (bingkai tipis, gambar membulat). */
function KartuBerita({ post }: { post: NewsPostRow }) {
  return (
    <article className="card-interactive group relative flex w-full flex-col rounded-card border border-navy-200/80 bg-white p-2.5">
      <div className="relative aspect-[4/3] overflow-hidden rounded-inner bg-navy-100">
        <SampulBerita post={post} />
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        <TanggalTerbit value={post.published_at} />
        <h3 className="mt-3 text-lg font-semibold leading-snug tracking-heading text-navy-950 text-balance [overflow-wrap:anywhere]">
          <Link href={`/berita/${post.slug}`} className="after:absolute after:inset-0 after:rounded-card">
            {post.title}
          </Link>
        </h3>
        {post.excerpt ? (
          <p className="mt-2 text-sm leading-relaxed text-navy-600">{post.excerpt}</p>
        ) : null}
        <div aria-hidden="true" className="min-h-5 flex-1" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-navy-950">Baca selengkapnya</span>
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-navy-100 text-navy-950 transition-colors duration-200 group-hover:bg-navy-200"
          >
            <IconArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
