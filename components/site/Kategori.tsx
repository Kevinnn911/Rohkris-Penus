import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

import {
  IconChurch,
  IconCompass,
  IconHandHeart,
  IconHeart,
  IconMountain,
  IconSunrise,
  IconTree,
  IconUsers,
} from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import type { EventCategory } from "@/lib/db/types";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

/** Tampilan tiap kategori kegiatan: ikon garis, deskripsi singkat, dan tag pastel. */
export const KATEGORI_INFO: Record<
  EventCategory,
  { Icon: IconType; deskripsi: string; tag?: { label: string; tone: TagTone } }
> = {
  "Ibadah Rutin": {
    Icon: IconChurch,
    deskripsi: "Ibadah mingguan bersama",
    tag: { label: "Rutin", tone: "kuning" },
  },
  Natal: { Icon: IconTree, deskripsi: "Perayaan kelahiran Kristus", tag: { label: "Tahunan", tone: "merah" } },
  Paskah: { Icon: IconSunrise, deskripsi: "Perayaan kebangkitan", tag: { label: "Tahunan", tone: "merah" } },
  Persekutuan: { Icon: IconUsers, deskripsi: "Doa & sharing kelompok", tag: { label: "Favorit", tone: "hijau" } },
  Retreat: { Icon: IconMountain, deskripsi: "Menyepi & bertumbuh", tag: { label: "Populer", tone: "kuning" } },
  Pelayanan: { Icon: IconHandHeart, deskripsi: "Melayani di sekolah", tag: { label: "Terbuka", tone: "hijau" } },
  "Aksi Sosial": { Icon: IconHeart, deskripsi: "Berbagi kasih ke sesama", tag: { label: "Peduli", tone: "merah" } },
  Lainnya: { Icon: IconCompass, deskripsi: "Kegiatan lainnya" },
};

export type TagTone = "kuning" | "merah" | "hijau" | "biru";

const TAG_TONE: Record<TagTone, string> = {
  kuning: "bg-gold-100 text-gold-700",
  merah: "bg-[#fde4e4] text-[#9b2c2c]",
  hijau: "bg-sage-100 text-sage-700",
  biru: "bg-info-50 text-info-700",
};

/** Tag pill pastel kecil di pojok kartu (mis. "Populer"). */
export function Tag({ tone, children, className }: { tone: TagTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-medium", TAG_TONE[tone], className)}>
      {children}
    </span>
  );
}

/** Kartu kategori — ikon garis besar, nama, dan keterangan; menaut ke filter kegiatan. */
export function KategoriCard({
  kategori,
  jumlah,
  aktif = false,
}: {
  kategori: EventCategory;
  /** Jumlah kegiatan pada kategori ini; null bila data belum tersedia. */
  jumlah?: number | null;
  aktif?: boolean;
}) {
  const { Icon, deskripsi, tag } = KATEGORI_INFO[kategori];

  return (
    <Link
      href={`/kegiatan?kategori=${encodeURIComponent(kategori)}`}
      aria-current={aktif ? "true" : undefined}
      className={cn(
        "group relative flex h-full min-h-[10.5rem] flex-col justify-between rounded-card border bg-white p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-lift",
        aktif ? "border-navy-950 shadow-soft" : "border-navy-200/80",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Icon className="size-11 text-navy-950 transition-transform duration-300 group-hover:-rotate-6" strokeWidth={1.4} />
        {tag ? <Tag tone={tag.tone}>{tag.label}</Tag> : null}
      </div>
      <div className="mt-6">
        <p className="text-lg font-medium leading-tight text-navy-950">{kategori}</p>
        <p className="mt-1 text-[0.8rem] text-navy-500">
          {typeof jumlah === "number" ? `${jumlah} kegiatan` : deskripsi}
        </p>
      </div>
    </Link>
  );
}
