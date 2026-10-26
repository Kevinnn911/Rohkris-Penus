import type { Metadata } from "next";
import type { ComponentType, SVGProps } from "react";

import { PageHeader, SectionHeading } from "@/components/site/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconArrowRight,
  IconCompass,
  IconCross,
  IconHandHeart,
  IconMail,
  IconStar,
} from "@/components/ui/Icons";
import { EmptyState } from "@/components/ui/States";
import { getSiteSettings } from "@/lib/data/public";
import { renderMarkdown } from "@/lib/markdown";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Tentang Rohkris SMK Penus",
  description:
    "Mengenal Rohkris SMK Penus (Rohani Kristen SMK Plus Pelita Nusantara): profil, visi, misi, nilai, dan kegiatan pembinaan iman siswa.",
};

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

/** Kartu visi/misi/nilai — hanya tampil bila admin sudah mengisinya. */
function KartuNilai({
  judul,
  isi,
  Icon,
}: {
  judul: string;
  isi: string | undefined;
  Icon: IconType;
}) {
  if (!isi) return null;
  return (
    <li className="flex flex-col rounded-card border border-navy-200/80 bg-white p-6 sm:p-7">
      <Icon className="size-11 text-navy-950" strokeWidth={1.4} />
      <h3 className="mt-7 text-xl font-semibold tracking-heading text-navy-950">{judul}</h3>
      <p className="mt-2.5 whitespace-pre-line leading-relaxed text-navy-600">{isi}</p>
    </li>
  );
}

export default async function TentangPage() {
  const settings = await getSiteSettings();
  const isiHtml = await renderMarkdown(settings.about_body);

  const adaKonten = Boolean(
    settings.about_body ||
      settings.about_vision ||
      settings.about_mission ||
      settings.about_values,
  );
  const adaNilai = Boolean(
    settings.about_vision || settings.about_mission || settings.about_values,
  );

  return (
    <>
      <PageHeader
        eyebrow="Tentang Kami"
        title="Rohani Kristen SMK PLUS PELITA NUSANTARA"
        description={
          settings.site_tagline ?? "Bertumbuh bersama dalam iman, kasih, dan pelayanan."
        }
        breadcrumb={[{ href: "/", label: "Beranda" }, { label: "Tentang" }]}
      />

      <div className="mx-auto max-w-7xl space-y-20 px-4 pt-16 sm:space-y-24 sm:px-8 sm:pt-20">
        {isiHtml ? (
          <section aria-labelledby="judul-profil" className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <h2
                  id="judul-profil"
                  className="text-3xl font-bold leading-tight tracking-heading text-navy-950 text-balance sm:text-[2.125rem]"
                >
                  Profil Rohkris
                </h2>
                <p className="mt-2.5 text-lg text-navy-600">
                  Satu keluarga yang bertumbuh dan melayani bersama.
                </p>
              </div>
            </div>
            <div className="lg:col-span-8">
              <div className="rounded-panel border border-navy-200/80 bg-white px-6 py-8 sm:px-10 sm:py-10">
                <div
                  className="prose-rohkris text-navy-800"
                  dangerouslySetInnerHTML={{ __html: isiHtml }}
                />
              </div>
            </div>
          </section>
        ) : null}

        {adaNilai ? (
          <section aria-labelledby="judul-nilai">
            <SectionHeading
              id="judul-nilai"
              title="Visi, Misi, dan Nilai"
              description="Pegangan yang menuntun setiap ibadah, kegiatan, dan pelayanan Rohkris."
            />
            <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <KartuNilai
                judul="Visi"
                isi={settings.about_vision}
                Icon={IconCompass}
              />
              <KartuNilai
                judul="Misi"
                isi={settings.about_mission}
                Icon={IconHandHeart}
              />
              <KartuNilai
                judul="Nilai Kami"
                isi={settings.about_values}
                Icon={IconStar}
              />
            </ul>
          </section>
        ) : null}

        {!adaKonten ? (
          <section aria-labelledby="judul-profil-kosong">
            <h2 id="judul-profil-kosong" className="sr-only">
              Profil Rohkris
            </h2>
            <EmptyState
              icon={<IconCross className="size-7" />}
              title="Profil Rohkris belum diisi"
              description="Pengurus dapat melengkapi visi, misi, nilai, dan profil Rohkris melalui panel admin pada menu Pengaturan."
            />
          </section>
        ) : null}
      </div>

      {/* Pita ajakan memakai bingkai yang sama dengan header & footer agar lebarnya sejajar. */}
      <div className="mt-20 px-3 sm:mt-24 sm:px-5">
        <section
          aria-labelledby="judul-ajakan"
          className="mx-auto max-w-7xl rounded-hero bg-navy-950 px-6 py-14 text-white sm:px-14 sm:py-16"
        >
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-sm font-medium text-gold-300">Mari Bergabung</p>
              <h2
                id="judul-ajakan"
                className="mt-4 text-3xl font-bold leading-[1.1] tracking-heading text-balance sm:text-5xl"
              >
                Ingin ikut kegiatan Rohkris?
              </h2>
              <p className="mt-5 max-w-xl leading-relaxed text-white/70">
                Semua siswa dipersilakan bergabung dalam ibadah dan kegiatan pelayanan kami.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
              <ButtonLink href="/kegiatan" variant="gold" size="lg">
                Lihat Kegiatan
                <IconArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/kontak" variant="glass" size="lg">
                <IconMail className="size-4" />
                Hubungi Kami
              </ButtonLink>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
