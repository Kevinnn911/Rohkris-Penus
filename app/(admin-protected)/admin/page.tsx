import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";

import { Tag, type TagTone } from "@/components/site/Kategori";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconArrowRight,
  IconCalendar,
  IconClock,
  IconEdit,
  IconImage,
  IconMegaphone,
  IconNewspaper,
  IconPlus,
  IconSettings,
} from "@/components/ui/Icons";
import { requireAdmin } from "@/lib/auth/guard";
import { cn } from "@/lib/cn";
import { getRingkasanDashboard, getSemuaBerita, getSemuaEvent } from "@/lib/data/admin";
import { formatTanggalSingkat } from "@/lib/format/date";

export const dynamic = "force-dynamic";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

function KartuStatistik({
  label,
  nilai,
  keterangan,
  Icon,
  tag,
  aksen = false,
}: {
  label: string;
  nilai: number;
  keterangan?: string;
  Icon: IconComponent;
  tag: { label: string; tone: TagTone };
  aksen?: boolean;
}) {
  return (
    <div className="flex h-full flex-col rounded-card border border-navy-200/80 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full text-navy-950",
            aksen ? "bg-gold-300" : "bg-navy-100",
          )}
        >
          <Icon className="size-5" />
        </span>
        <Tag tone={tag.tone}>{tag.label}</Tag>
      </div>
      <p className="mt-5 text-4xl font-bold leading-none tracking-[-0.04em] text-navy-950 tabular-nums">
        {nilai}
      </p>
      <p className="mt-2 text-sm font-semibold text-navy-950">{label}</p>
      {keterangan ? <p className="mt-0.5 text-xs text-navy-500">{keterangan}</p> : null}
    </div>
  );
}

const PINTASAN = [
  { href: "/admin/kegiatan", label: "Kelola Kegiatan", Icon: IconCalendar },
  { href: "/admin/galeri", label: "Tambah Dokumentasi", Icon: IconImage },
  { href: "/admin/berita", label: "Tulis Berita", Icon: IconEdit },
  { href: "/admin/pengumuman", label: "Buat Pengumuman", Icon: IconMegaphone },
  { href: "/admin/pengaturan", label: "Pengaturan Situs", Icon: IconSettings },
] as const;

const STATUS_TONE = {
  published: "success",
  draft: "warning",
  archived: "neutral",
  cancelled: "danger",
} as const;

const STATUS_LABEL = {
  published: "Terbit",
  draft: "Draft",
  archived: "Arsip",
  cancelled: "Dibatalkan",
} as const;

function KartuDaftar({
  idJudul,
  judul,
  hrefSemua,
  Icon,
  children,
}: {
  idJudul: string;
  judul: string;
  hrefSemua: string;
  Icon: IconComponent;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={idJudul}
      className="overflow-hidden rounded-card border border-navy-200/80 bg-white"
    >
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-100 text-navy-950"
          >
            <Icon className="size-5" />
          </span>
          <h2 id={idJudul} className="truncate text-lg font-bold tracking-[-0.02em] text-navy-950">
            {judul}
          </h2>
        </div>
        <Link
          href={hrefSemua}
          className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-medium text-navy-950 ring-1 ring-inset ring-navy-200 transition-colors hover:bg-navy-50"
        >
          Lihat semua
          <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function DaftarKosong({ children }: { children: ReactNode }) {
  return (
    <div className="m-2.5 flex flex-col items-center rounded-[1.1rem] bg-ivory-100 px-6 py-10 text-center">
      <span
        aria-hidden="true"
        className="grid size-11 place-items-center rounded-full bg-gold-300 text-navy-950"
      >
        <IconClock className="size-5" />
      </span>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-navy-600">{children}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const { admin } = await requireAdmin();
  const [ringkasan, events, berita] = await Promise.all([
    getRingkasanDashboard(),
    getSemuaEvent(),
    getSemuaBerita(),
  ]);

  const eventTerbaru = events.slice(0, 5);
  const beritaTerbaru = berita.slice(0, 5);

  return (
    <div className="space-y-12 animate-fade-up">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="inline-flex items-center rounded-full bg-gold-300 px-3.5 py-1 text-sm font-medium text-navy-950">
            Dashboard
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-navy-950 text-balance sm:text-5xl">
            Selamat datang, {admin.display_name}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-navy-600 sm:text-lg">
            Ringkasan konten Rohkris dan pintasan aksi utama.
          </p>
        </div>
        <ButtonLink href="/admin/kegiatan/baru" size="lg">
          <IconPlus className="size-4" />
          Buat Kegiatan
        </ButtonLink>
      </header>

      <section aria-labelledby="judul-statistik">
        <h2 id="judul-statistik" className="sr-only">
          Statistik konten
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KartuStatistik
            label="Total Kegiatan"
            nilai={ringkasan.totalEvent}
            keterangan={`${ringkasan.eventPublished} terbit · ${ringkasan.eventDraft} draft`}
            Icon={IconCalendar}
            tag={{ label: "Kegiatan", tone: "kuning" }}
            aksen
          />
          <KartuStatistik
            label="Kegiatan Mendatang"
            nilai={ringkasan.eventMendatang}
            keterangan="Sudah terbit dan belum lewat"
            Icon={IconClock}
            tag={{ label: "Mendatang", tone: "hijau" }}
          />
          <KartuStatistik
            label="Berita"
            nilai={ringkasan.totalBerita}
            keterangan={`${ringkasan.beritaDraft} masih draft`}
            Icon={IconNewspaper}
            tag={{ label: "Kabar", tone: "merah" }}
          />
          <KartuStatistik
            label="Dokumentasi"
            nilai={ringkasan.totalMedia}
            keterangan={`${ringkasan.mediaDraft} masih draft`}
            Icon={IconImage}
            tag={{ label: "Galeri", tone: "biru" }}
          />
        </div>
      </section>

      {/* Pintasan */}
      <section aria-labelledby="judul-pintasan">
        <h2 id="judul-pintasan" className="text-2xl font-bold tracking-[-0.03em] text-navy-950">
          Pintasan
        </h2>
        <p className="mt-1.5 text-navy-600">Aksi yang paling sering dipakai pengurus.</p>
        <ul className="mt-5 flex flex-wrap gap-3">
          {PINTASAN.map(({ href, label, Icon }) => (
            <li key={href}>
              <ButtonLink href={href} variant="secondary">
                <Icon className="size-4" />
                {label}
              </ButtonLink>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kegiatan terbaru */}
        <KartuDaftar
          idJudul="judul-event-terbaru"
          judul="Kegiatan Terbaru"
          hrefSemua="/admin/kegiatan"
          Icon={IconCalendar}
        >
          {eventTerbaru.length === 0 ? (
            <DaftarKosong>Belum ada kegiatan. Mulai dengan membuat kegiatan baru.</DaftarKosong>
          ) : (
            <ul className="space-y-1 p-2.5 pt-1">
              {eventTerbaru.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between gap-3 rounded-[1.1rem] px-3 py-3 transition-colors hover:bg-navy-50 sm:px-4"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/kegiatan/${event.id}`}
                      className="block truncate text-sm font-semibold text-navy-950 underline-offset-4 hover:underline"
                    >
                      {event.title}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-navy-500">
                      <IconCalendar className="size-3.5" />
                      {formatTanggalSingkat(event.start_at) ?? "Tanggal belum diatur"}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[event.status]} className="shrink-0">
                    {STATUS_LABEL[event.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </KartuDaftar>

        {/* Berita terbaru */}
        <KartuDaftar
          idJudul="judul-berita-terbaru"
          judul="Berita Terbaru"
          hrefSemua="/admin/berita"
          Icon={IconNewspaper}
        >
          {beritaTerbaru.length === 0 ? (
            <DaftarKosong>Belum ada berita.</DaftarKosong>
          ) : (
            <ul className="space-y-1 p-2.5 pt-1">
              {beritaTerbaru.map((post) => (
                <li
                  key={post.id}
                  className="flex items-center justify-between gap-3 rounded-[1.1rem] px-3 py-3 transition-colors hover:bg-navy-50 sm:px-4"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/berita/${post.id}`}
                      className="block truncate text-sm font-semibold text-navy-950 underline-offset-4 hover:underline"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-navy-500">
                      <IconClock className="size-3.5" />
                      {formatTanggalSingkat(post.published_at) ?? "Belum terbit"}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[post.status]} className="shrink-0">
                    {STATUS_LABEL[post.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </KartuDaftar>
      </div>
    </div>
  );
}
