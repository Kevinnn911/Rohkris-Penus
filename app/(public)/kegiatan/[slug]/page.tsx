import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { EventCard } from "@/components/site/EventCard";
import { KATEGORI_INFO } from "@/components/site/Kategori";
import { PageHeader, SectionHeading } from "@/components/site/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/Button";
import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUpRight,
  IconCalendar,
  IconChat,
  IconClock,
  IconFile,
  IconGlobe,
  IconInfo,
  IconMapPin,
  IconShirt,
  IconStar,
  IconUsers,
  IconWallet,
} from "@/components/ui/Icons";
import {
  getEventBySlug,
  getMediaForEvent,
  getPublishedEventSlugs,
  getRelatedEvents,
} from "@/lib/data/public";
import { lampirkanFormulirSatu } from "@/lib/data/forms";
import {
  getRegistrationCta,
  getRegistrationLabel,
  getRegistrationState,
} from "@/lib/events/status";
import { formatRentangKegiatan, formatTanggal, toDateTimeAttr } from "@/lib/format/date";
import { markdownToPlainText, renderMarkdown } from "@/lib/markdown";
import { perluTanpaOptimasi } from "@/lib/images";

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getPublishedEventSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return { title: "Kegiatan tidak ditemukan", robots: { index: false, follow: false } };
  }

  const description =
    event.summary ?? markdownToPlainText(event.description) ?? `Kegiatan ${event.title}`;

  return {
    title: event.title,
    description,
    alternates: { canonical: `/kegiatan/${event.slug}` },
    openGraph: {
      title: event.title,
      description,
      type: "article",
      images: event.cover_image_url ? [{ url: event.cover_image_url }] : undefined,
    },
  };
}

/**
 * Baris informasi yang hanya tampil bila datanya ada — label tebal dan
 * nilai abu dengan ikon kecil (seperti bar pencarian referensi).
 */
function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null;
  icon: ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="border-t border-navy-100 py-4 first:border-t-0 first:pt-0 last:pb-0">
      <dt className="text-md font-semibold text-navy-950">{label}</dt>
      <dd className="mt-1.5 flex items-start gap-2 text-sm leading-relaxed text-navy-600">
        <span aria-hidden="true" className="mt-0.5 shrink-0 text-navy-500">
          {icon}
        </span>
        <span className="min-w-0 whitespace-pre-line break-words">{value}</span>
      </dd>
    </div>
  );
}

export default async function DetailKegiatanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ditemukan = await getEventBySlug(slug);

  if (!ditemukan) notFound();
  const event = await lampirkanFormulirSatu(ditemukan);

  const [related, media, deskripsiHtml] = await Promise.all([
    getRelatedEvents(event),
    getMediaForEvent(event.id),
    renderMarkdown(event.description),
  ]);

  const state = getRegistrationState(event);
  const label = getRegistrationLabel(state);
  const cta = getRegistrationCta(event);
  const waktu = formatRentangKegiatan(event.start_at, event.end_at);

  const modeLabel: Record<string, string> = {
    offline: "Tatap muka",
    online: "Daring",
    hybrid: "Hibrida (tatap muka & daring)",
    tbd: "Akan diumumkan",
  };

  const KategoriIcon =
    KATEGORI_INFO[event.category as keyof typeof KATEGORI_INFO]?.Icon ?? KATEGORI_INFO.Lainnya.Icon;

  return (
    <article>
      <PageHeader
        eyebrow={event.category}
        title={event.title}
        description={event.summary ?? undefined}
        breadcrumb={[
          { href: "/", label: "Beranda" },
          { href: "/kegiatan", label: "Kegiatan" },
          { label: event.title },
        ]}
        className="[&_section>div]:pb-24 sm:[&_section>div]:pb-32"
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge tone={label.tone}>
            {label.text}
          </Badge>
          {event.is_featured ? (
            <Badge tone="gold">
              <IconStar className="size-3.5" />
              Unggulan
            </Badge>
          ) : null}
        </div>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        {/* Poster lebar — bingkai putih melayang di tepi bawah header */}
        <div className="relative z-10 -mt-16 rounded-panel bg-white p-2.5 shadow-float sm:-mt-24">
          <div className="relative aspect-[16/9] overflow-hidden rounded-panel-inner bg-navy-100">
            {event.cover_image_url ? (
              <Image
                src={event.cover_image_url}
                unoptimized={perluTanpaOptimasi(event.cover_image_url)}
                alt={`Poster kegiatan ${event.title}`}
                fill
                priority
                sizes="(max-width: 1152px) 100vw, 1152px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 bg-mist text-navy-950">
                <KategoriIcon aria-hidden="true" className="size-16 sm:size-20" strokeWidth={1.2} />
                <p className="text-sm text-navy-600">Poster kegiatan belum tersedia</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 grid gap-10 sm:mt-16 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-14">
          {/* Kolom utama */}
          <div className="min-w-0 space-y-14">
            <section aria-labelledby="judul-deskripsi">
              <h2
                id="judul-deskripsi"
                className="text-2xl font-bold tracking-heading text-navy-950 sm:text-3xl"
              >
                Tentang Kegiatan
              </h2>
              {deskripsiHtml ? (
                <div
                  className="prose-rohkris mt-5 text-navy-800"
                  // Aman: HTML sudah disanitasi di server (lihat lib/markdown.ts).
                  dangerouslySetInnerHTML={{ __html: deskripsiHtml }}
                />
              ) : (
                <p className="mt-5 text-navy-600">Deskripsi lengkap kegiatan ini belum tersedia.</p>
              )}
            </section>

            {/* Ketentuan peserta */}
            {event.participant_rules ? (
              <section
                aria-labelledby="judul-ketentuan"
                className="flex gap-4 rounded-card border border-navy-200/80 bg-white p-5 sm:p-6"
              >
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-200/80"
                >
                  <IconUsers className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 id="judul-ketentuan" className="text-lg font-semibold text-navy-950">
                    Ketentuan peserta
                  </h2>
                  <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed text-navy-600">
                    {event.participant_rules}
                  </p>
                </div>
              </section>
            ) : null}

            {/* Dokumentasi terkait */}
            {media.length > 0 ? (
              <section aria-labelledby="judul-dokumentasi">
                <h2
                  id="judul-dokumentasi"
                  className="text-2xl font-bold tracking-heading text-navy-950 sm:text-3xl"
                >
                  Dokumentasi Kegiatan
                </h2>
                <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {media.map((item) => (
                    <li
                      key={item.id}
                      className="overflow-hidden rounded-card border border-navy-200/80 bg-white p-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.media_url}
                        alt={item.alt_text}
                        loading="lazy"
                        className="aspect-square w-full rounded-inner bg-navy-100 object-cover"
                      />
                      {item.caption ? (
                        <p className="px-2 pb-1 pt-2.5 text-xs leading-relaxed text-navy-600 [overflow-wrap:anywhere]">
                          {item.caption}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {/* Sidebar informasi + CTA */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-bar bg-white p-6 shadow-float sm:p-7">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-100 text-navy-950"
                >
                  <IconInfo className="size-5" />
                </span>
                <h2 className="text-lg font-bold tracking-heading text-navy-950">
                  Informasi Kegiatan
                </h2>
              </div>

              <dl className="mt-6">
                <InfoRow
                  label="Waktu"
                  value={waktu ?? "Tanggal akan diumumkan"}
                  icon={<IconCalendar className="size-4" />}
                />
                <InfoRow
                  label="Format"
                  value={modeLabel[event.event_mode] ?? null}
                  icon={<IconGlobe className="size-4" />}
                />
                <InfoRow label="Tempat" value={event.location} icon={<IconMapPin className="size-4" />} />
                <InfoRow label="Biaya" value={event.cost_info} icon={<IconWallet className="size-4" />} />
                <InfoRow
                  label="Dress code"
                  value={event.dress_code}
                  icon={<IconShirt className="size-4" />}
                />
                <InfoRow
                  label="Kontak panitia"
                  value={event.contact_info}
                  icon={<IconChat className="size-4" />}
                />
                {event.registration_close_at ? (
                  <InfoRow
                    label="Pendaftaran ditutup"
                    value={formatTanggal(event.registration_close_at)}
                    icon={<IconClock className="size-4" />}
                  />
                ) : null}
              </dl>

              {event.start_at ? (
                <time dateTime={toDateTimeAttr(event.start_at)} className="sr-only">
                  {formatTanggal(event.start_at)}
                </time>
              ) : null}

              {/* CTA pendaftaran — hanya bila benar-benar terbuka dan URL valid */}
              <div className="mt-7">
                {cta && !cta.external ? (
                  <>
                    <ButtonLink href={cta.href} size="lg" className="w-full min-h-14! text-base!">
                      Daftar Sekarang
                      <IconArrowRight className="size-4" />
                    </ButtonLink>
                    <p className="mt-2.5 text-center text-xs leading-relaxed text-navy-500">
                      Formulir pendaftaran diisi langsung di situs ini.
                    </p>
                  </>
                ) : cta ? (
                  <>
                    <ExternalButtonLink href={cta.href} size="lg" className="w-full min-h-14! text-base!">
                      Daftar Sekarang
                      <IconArrowUpRight className="size-4" />
                    </ExternalButtonLink>
                    <p className="mt-2.5 text-center text-xs leading-relaxed text-navy-500">
                      Tautan akan terbuka di tab baru menuju formulir pendaftaran.
                    </p>
                  </>
                ) : (
                  <div className="rounded-2xl bg-navy-50 px-4 py-4 text-center ring-1 ring-inset ring-navy-100">
                    <p className="text-sm font-semibold text-navy-950">{label.text}</p>
                    {label.hint ? (
                      <p className="mt-1 text-xs leading-relaxed text-navy-600">{label.hint}</p>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Dokumen pendukung */}
              {event.resource_url ? (
                <div className="mt-3">
                  <ExternalButtonLink href={event.resource_url} variant="secondary" className="w-full">
                    <IconFile className="size-4" />
                    Lihat Dokumen Pendukung
                  </ExternalButtonLink>
                </div>
              ) : null}

              <div className="mt-6 border-t border-navy-100 pt-4">
                <Link
                  href="/kegiatan"
                  className="pressable group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-navy-700 hover:text-navy-950"
                >
                  <IconArrowLeft className="size-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
                  Kembali ke daftar kegiatan
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Kegiatan terkait */}
      {related.length > 0 ? (
        <section
          aria-labelledby="judul-terkait"
          className="mx-auto max-w-6xl px-4 pb-8 pt-20 sm:px-8 sm:pt-24"
        >
          <SectionHeading
            id="judul-terkait"
            title={`Kegiatan Lain Kategori ${event.category}`}
            description="Agenda serupa yang mungkin kamu minati"
          />
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <div key={item.id} className="relative">
                <EventCard event={item} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
