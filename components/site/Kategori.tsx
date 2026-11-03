// File: components/site/Kategori.tsx

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

/** Tampilan tiap kategori kegiatan: ikon garis dan deskripsi singkat. */
export const KATEGORI_INFO: Record<EventCategory, { Icon: IconType; deskripsi: string }> = {
  "Ibadah Rutin": { Icon: IconChurch, deskripsi: "Ibadah mingguan bersama" },
  Natal: { Icon: IconTree, deskripsi: "Perayaan kelahiran Kristus" },
  Paskah: { Icon: IconSunrise, deskripsi: "Perayaan kebangkitan" },
  Persekutuan: { Icon: IconUsers, deskripsi: "Doa & sharing kelompok" },
  Retreat: { Icon: IconMountain, deskripsi: "Menyepi & bertumbuh" },
  Pelayanan: { Icon: IconHandHeart, deskripsi: "Melayani di sekolah" },
  "Aksi Sosial": { Icon: IconHeart, deskripsi: "Berbagi kasih ke sesama" },
  Lainnya: { Icon: IconCompass, deskripsi: "Kegiatan lainnya" },
};

export type TagTone = "kuning" | "merah" | "hijau" | "biru";

const TAG_TONE: Record<TagTone, string> = {
  kuning: "bg-gold-100 text-gold-700",
  merah: "bg-danger-50 text-danger-700",
  hijau: "bg-sage-100 text-sage-700",
  biru: "bg-info-50 text-info-700",
};

/** Tag pill pastel kecil di pojok kartu (mis. "Terbaru"). */
export function Tag({ tone, children, className }: { tone: TagTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-medium", TAG_TONE[tone], className)}>
      {children}
    </span>
  );
}

