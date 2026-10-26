import type { Metadata } from "next";

import { GaleriLightbox } from "@/components/site/Lightbox";
import { PageHeader, SectionHeading } from "@/components/site/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { IconArrowRight, IconImage } from "@/components/ui/Icons";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { getPublishedMedia } from "@/lib/data/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Dokumentasi",
  description:
    "Galeri dokumentasi kegiatan Rohani Kristen SMK PLUS PELITA NUSANTARA: ibadah, Natal, Paskah, retreat, dan pelayanan.",
};

export default async function DokumentasiPage() {
  const { data: media, failed } = await getPublishedMedia();

  return (
    <>
      <PageHeader
        eyebrow="Galeri"
        title="Dokumentasi Kegiatan"
        description="Kumpulan momen kegiatan Rohkris. Klik gambar untuk memperbesar."
        breadcrumb={[{ href: "/", label: "Beranda" }, { label: "Dokumentasi" }]}
      >
        {!failed && media.length > 0 ? (
          <p className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-navy-950 shadow-soft">
            <IconImage aria-hidden="true" className="size-4 text-navy-500" />
            {media.length} momen terdokumentasi
          </p>
        ) : null}
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-8 sm:pt-20">
        {failed ? (
          <ErrorState />
        ) : media.length === 0 ? (
          <EmptyState
            title="Belum ada dokumentasi"
            description="Foto kegiatan akan tampil di sini setelah pengurus mengunggahnya."
            action={
              <ButtonLink href="/kegiatan" variant="secondary">
                Lihat kegiatan
                <IconArrowRight className="size-4" />
              </ButtonLink>
            }
            icon={<IconImage className="size-7" />}
          />
        ) : (
          <section aria-labelledby="judul-galeri">
            <SectionHeading
              id="judul-galeri"
              eyebrow="Galeri"
              title="Momen Bersama"
              description="Ibadah, perayaan, retreat, dan pelayanan yang telah kita lalui."
            />
            <div className="mt-10">
              <GaleriLightbox items={media} />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
