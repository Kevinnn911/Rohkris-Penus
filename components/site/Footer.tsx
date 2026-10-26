import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

import { Brand } from "@/components/site/Navbar";
import {
  IconArrowUpRight,
  IconChat,
  IconInstagram,
  IconMail,
  IconMusic,
  IconPhone,
  IconYoutube,
} from "@/components/ui/Icons";
import type { SiteSettings } from "@/lib/db/types";

const SOCIAL_LINKS: ReadonlyArray<{
  key: "instagram_url" | "youtube_url" | "tiktok_url" | "whatsapp_url";
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { key: "instagram_url", label: "Instagram", Icon: IconInstagram },
  { key: "youtube_url", label: "YouTube", Icon: IconYoutube },
  { key: "tiktok_url", label: "TikTok", Icon: IconMusic },
  { key: "whatsapp_url", label: "WhatsApp", Icon: IconChat },
];

const JELAJAHI = [
  { href: "/kegiatan", label: "Kegiatan" },
  { href: "/jadwal", label: "Jadwal" },
  { href: "/dokumentasi", label: "Dokumentasi" },
  { href: "/berita", label: "Berita" },
  { href: "/tentang", label: "Tentang Rohkris" },
];

// Jarak tepi seragam untuk seluruh isi footer. Kartu footer bersudut sangat
// membulat (rounded-hero), jadi isinya perlu menjauh dari tepi agar tidak mepet.
// Bawah ikut safe-area agar teks hak cipta tidak tertutup indikator beranda iPhone.
const TEPI = "px-7 sm:px-10 lg:px-14";

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = 2026; // Tahun statis agar output build deterministik.
  const socials = SOCIAL_LINKS.filter((item) => settings[item.key]);

  return (
    <footer className="mt-24 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-5">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-hero bg-navy-950 text-white/80">
        {/* Ayat penutup — elemen rohani yang proporsional (PRD §9). */}
        <div className={`mx-auto max-w-6xl pt-14 sm:pt-16 ${TEPI}`}>
          <figure className="max-w-2xl border-l-2 border-gold-300 pl-5 sm:pl-7">
            <blockquote className="text-2xl font-semibold leading-[1.35] tracking-heading text-white text-pretty sm:text-[2rem] sm:leading-[1.3]">
              “Kamu adalah terang dunia. Kota yang terletak di atas gunung tidak mungkin tersembunyi.”
            </blockquote>
            <figcaption className="mt-5 text-sm font-medium text-gold-300">Matius 5:14</figcaption>
          </figure>
        </div>

        <div
          className={`mx-auto mt-14 grid max-w-6xl gap-12 border-t border-white/10 py-12 sm:py-14 md:grid-cols-12 ${TEPI}`}
        >
          <div className="md:col-span-5">
            <Brand inverted />
            <p className="mt-2 text-xs text-white/50">Rohani Kristen SMK PLUS Pelita Nusantara</p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">
              {settings.site_description ??
                "Pusat informasi kegiatan Rohani Kristen SMK PLUS PELITA NUSANTARA."}
            </p>
            {settings.school_info ? (
              <p className="mt-3 max-w-sm text-sm text-white/55">{settings.school_info}</p>
            ) : null}

            {socials.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Media sosial">
                {socials.map(({ key, label, Icon }) => (
                  <li key={key}>
                    <a
                      href={settings[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pressable grid size-11 place-items-center rounded-full bg-white/5 text-white ring-1 ring-inset ring-white/15 hover:bg-white/10 hover:text-gold-300"
                    >
                      <Icon className="size-5" />
                      <span className="sr-only">{label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav aria-label="Tautan halaman" className="md:col-span-3">
            <h2 className="text-sm font-semibold text-white">Jelajahi</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {JELAJAHI.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-white/70 transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <h2 className="text-sm font-semibold text-white">Kontak</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {settings.contact_email ? (
                <li>
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="inline-flex items-center gap-2.5 text-white/70 transition-colors hover:text-white"
                  >
                    <IconMail className="size-4 text-white/50" />
                    {settings.contact_email}
                  </a>
                </li>
              ) : null}
              {settings.contact_phone ? (
                <li className="inline-flex items-center gap-2.5 text-white/70">
                  <IconPhone className="size-4 text-white/50" />
                  {settings.contact_phone}
                </li>
              ) : null}
              <li>
                <Link
                  href="/kontak"
                  className="group inline-flex items-center gap-1.5 font-semibold text-white transition-colors hover:text-gold-300"
                >
                  Halaman kontak
                  <IconArrowUpRight className="size-4 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div
            className={`mx-auto flex max-w-6xl flex-col gap-2 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between ${TEPI}`}
          >
            <p>© {year} Rohani Kristen SMK PLUS PELITA NUSANTARA.</p>
            <div className="flex items-center gap-4">
              {settings.footer_note ? <span>{settings.footer_note}</span> : null}
              <Link href="/privasi" className="transition-colors hover:text-white">
                Kebijakan Privasi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
