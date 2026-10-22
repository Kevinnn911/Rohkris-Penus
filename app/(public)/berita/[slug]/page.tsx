import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/site/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCross,
  IconInfo,
} from "@/components/ui/Icons";
import { getNewsBySlug, getPublishedEventById, getPublishedNewsSlugs } from "@/lib/data/public";
import { formatTanggal, toDateTimeAttr } from "@/lib/format/date";
import { markdownToPlainText, renderMarkdown } from "@/lib/markdown";

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getPublishedNewsSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsBySlug(slug);

  if (!post) {
    return { title: "Berita tidak ditemukan", robots: { index: false, follow: false } };
  }

  const description = post.excerpt ?? markdownToPlainText(post.body);

  return {
    title: post.title,
    description,
    alternates: { canonical: `/berita/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
    },
  };
}

export default async function DetailBeritaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getNewsBySlug(slug);

  if (!post) notFound();

  const [isiHtml, eventTerkait] = await Promise.all([
    renderMarkdown(post.body),
    post.event_id ? getPublishedEventById(post.event_id) : Promise.resolve(null),
  ]);

  return (
    <article>
      <PageHeader
        eyebrow="Berita & Recap"
        title={post.title}
        description={post.excerpt ?? undefined}
        breadcrumb={[
          { href: "/", label: "Beranda" },
          { href: "/berita", label: "Berita" },
          { label: post.title },
        ]}
      >
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-sm">
          {post.published_at ? (
            <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white px-4 font-medium text-navy-950 shadow-soft">
              <IconCalendar className="size-4 text-navy-500" />
              <span className="sr-only">Diterbitkan </span>
              <time dateTime={toDateTimeAttr(post.published_at)}>{formatTanggal(post.published_at)}</time>
            </span>
          ) : null}
          <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white/70 px-4 text-navy-700 ring-1 ring-inset ring-navy-200/80 backdrop-blur">
            <IconCross className="size-4" />
            Rohkris Pelita Nusantara
          </span>
        </div>
      </PageHeader>

      {post.cover_image_url ? (
        <div className="relative z-10 mx-auto -mt-8 max-w-6xl px-4 sm:-mt-12 sm:px-8">
          <div className="overflow-hidden rounded-panel bg-white p-2.5 shadow-float">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover_image_url}
              alt={`Sampul berita ${post.title}`}
              className="aspect-[16/9] w-full rounded-[1.5rem] object-cover"
            />
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-4xl px-4 pb-8 pt-12 sm:px-8 sm:pt-16">
        {isiHtml ? (
          <div className="rounded-panel border border-navy-200/80 bg-white px-5 py-9 sm:px-12 sm:py-14">
            <div
              className="prose-rohkris mx-auto max-w-3xl text-navy-800 [&>:first-child]:mt-0"
              // Aman: sudah disanitasi di server.
              dangerouslySetInnerHTML={{ __html: isiHtml }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-card border border-navy-200/80 bg-white p-5 sm:p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-100 text-navy-950">
              <IconInfo className="size-5" />
            </span>
            <p className="text-navy-600">Isi berita belum tersedia.</p>
          </div>
        )}

        {eventTerkait ? (
          <aside
            aria-labelledby="judul-kegiatan-terkait"
            className="mt-8 rounded-[1.75rem] bg-white p-5 shadow-float sm:p-7"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold-300 text-navy-950">
                  <IconCalendar className="size-5" />
                </span>
                <div>
                  <h2 id="judul-kegiatan-terkait" className="text-sm font-semibold text-navy-950">
                    <span className="label-dot">Kegiatan terkait</span>
                  </h2>
                  <p className="mt-1 text-xl font-bold leading-snug tracking-[-0.02em] text-navy-950 text-balance">
                    {eventTerkait.title}
                  </p>
                </div>
              </div>
              <ButtonLink
                href={`/kegiatan/${eventTerkait.slug}`}
                variant="primary"
                className="shrink-0 self-start sm:self-center"
              >
                Lihat detail kegiatan
                <IconArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </aside>
        ) : null}

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-navy-200/80 pt-8">
          <Link
            href="/berita"
            className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-white pl-1.5 pr-5 text-sm font-medium text-navy-950 ring-1 ring-inset ring-navy-200 transition-colors hover:bg-navy-50 hover:ring-navy-300"
          >
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-full bg-navy-100 transition-colors group-hover:bg-gold-300"
            >
              <IconArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            </span>
            Kembali ke daftar berita
          </Link>
          <Link
            href="/dokumentasi"
            className="group inline-flex min-h-11 items-center gap-2 px-1 text-sm font-medium text-navy-950 underline decoration-navy-300 underline-offset-[6px] transition-colors hover:decoration-navy-950"
          >
            Lihat dokumentasi kegiatan
            <IconArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
