import type { Metadata } from "next";

import { PageHeader, SectionHeading } from "@/components/site/PageHeader";
import {
  IconArrowUpRight,
  IconChat,
  IconInstagram,
  IconMail,
  IconMapPin,
  IconMusic,
  IconPhone,
  IconYoutube,
} from "@/components/ui/Icons";
import { EmptyState } from "@/components/ui/States";
import { getSiteSettings } from "@/lib/data/public";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Hubungi pengurus Rohani Kristen SMK PLUS PELITA NUSANTARA melalui email, telepon, atau media sosial.",
};

const SOSIAL = [
  { key: "instagram_url", label: "Instagram", Icon: IconInstagram },
  { key: "youtube_url", label: "YouTube", Icon: IconYoutube },
  { key: "tiktok_url", label: "TikTok", Icon: IconMusic },
  { key: "whatsapp_url", label: "WhatsApp", Icon: IconChat },
] as const;

/** Ikon dalam lingkaran netral — dekoratif. */
const LINGKARAN =
  "grid size-11 shrink-0 place-items-center rounded-full bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-200/80";

export default async function KontakPage() {
  const settings = await getSiteSettings();
  const sosialAktif = SOSIAL.filter((item) => settings[item.key]);
  const adaKontak = Boolean(settings.contact_email || settings.contact_phone);

  return (
    <>
      <PageHeader
        eyebrow="Hubungi Kami"
        title="Kontak"
        description="Punya pertanyaan tentang kegiatan Rohkris? Hubungi pengurus melalui kanal berikut."
        breadcrumb={[{ href: "/", label: "Beranda" }, { label: "Kontak" }]}
      />

      <div className="mx-auto max-w-6xl space-y-20 px-4 pb-8 pt-16 sm:px-8 sm:pt-20">
        {adaKontak ? (
          <section aria-labelledby="judul-kontak">
            <SectionHeading
              id="judul-kontak"
              title="Kontak Langsung"
              description="Pengurus siap menjawab pertanyaan Anda."
            />
            {/* <div> di dalam <dl> hanya boleh berisi <dt>/<dd>, jadi ikon diletakkan di dalam <dt>. */}
            <dl className="mt-9 grid gap-5 sm:grid-cols-2">
              {settings.contact_email ? (
                <div className="flex min-w-0 flex-col rounded-card border border-navy-200/80 bg-white p-6 sm:p-7">
                  <dt>
                    <span aria-hidden="true" className={LINGKARAN}>
                      <IconMail className="size-5" />
                    </span>
                    <span className="mt-6 block text-lg font-semibold text-navy-950">
                      Email
                    </span>
                  </dt>
                  <dd className="mt-1.5">
                    <a
                      href={`mailto:${settings.contact_email}`}
                      className="inline-flex min-h-11 items-center break-all text-navy-600 underline decoration-navy-300 underline-offset-4 transition-colors hover:text-navy-950 hover:decoration-navy-950"
                    >
                      {settings.contact_email}
                    </a>
                  </dd>
                </div>
              ) : null}

              {settings.contact_phone ? (
                <div className="flex min-w-0 flex-col rounded-card border border-navy-200/80 bg-white p-6 sm:p-7">
                  <dt>
                    <span aria-hidden="true" className={LINGKARAN}>
                      <IconPhone className="size-5" />
                    </span>
                    <span className="mt-6 block text-lg font-semibold text-navy-950">
                      Telepon / WhatsApp
                    </span>
                  </dt>
                  <dd className="mt-1.5 flex min-h-11 items-center break-words text-navy-600">
                    {settings.contact_phone}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        {sosialAktif.length > 0 ? (
          <section aria-labelledby="judul-sosial">
            <SectionHeading
              id="judul-sosial"
              title="Media Sosial"
              description="Ikuti kabar dan dokumentasi kegiatan Rohkris."
            />
            <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {sosialAktif.map(({ key, label, Icon }) => (
                <li key={key}>
                  <a
                    href={settings[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-interactive group flex h-full min-h-[9.5rem] flex-col justify-between rounded-card border border-navy-200/80 bg-white p-5"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <Icon className="size-10 text-navy-950" strokeWidth={1.4} />
                      <span
                        aria-hidden="true"
                        className="grid size-9 place-items-center rounded-full bg-white text-navy-950 ring-1 ring-inset ring-navy-200 transition-colors duration-200 group-hover:bg-navy-100"
                      >
                        <IconArrowUpRight className="size-4" />
                      </span>
                    </span>
                    <span className="mt-6 block">
                      <span className="block text-lg font-medium leading-tight text-navy-950">
                        {label}
                      </span>
                      <span aria-hidden="true" className="mt-1 block text-[0.8rem] text-navy-500">
                        Buka di tab baru
                      </span>
                    </span>
                    <span className="sr-only"> (membuka tab baru)</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!adaKontak && sosialAktif.length === 0 ? (
          <section aria-labelledby="judul-kontak-kosong">
            <h2 id="judul-kontak-kosong" className="sr-only">
              Kanal kontak
            </h2>
            <EmptyState
              icon={<IconMail className="size-7" />}
              title="Informasi kontak belum tersedia"
              description="Pengurus dapat menambahkan email, nomor telepon, dan tautan media sosial melalui panel admin pada menu Pengaturan."
            />
          </section>
        ) : null}

        {settings.school_info ? (
          <section
            aria-labelledby="judul-sekolah"
            className="flex flex-col gap-5 rounded-bar border border-navy-200/80 bg-white p-6 sm:flex-row sm:items-start sm:p-8"
          >
            <span aria-hidden="true" className={LINGKARAN}>
              <IconMapPin className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 id="judul-sekolah" className="text-lg font-semibold text-navy-950">
                Sekolah
              </h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-navy-600">
                {settings.school_info}
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
