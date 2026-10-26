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
  const { Icon, deskripsi } = KATEGORI_INFO[kategori];

  return (
    <Link
      href={`/kegiatan?kategori=${encodeURIComponent(kategori)}`}
      aria-current={aktif ? "true" : undefined}
      className={cn(
        "card-interactive relative flex h-full min-h-[10.5rem] flex-col justify-between rounded-card border bg-white p-5",
        // Kartu aktif mempertahankan tepi gelapnya saat hover (card-interactive memudarkannya).
        aktif ? "border-navy-950 shadow-soft hover:border-navy-950!" : "border-navy-200/80",
      )}
    >
      <Icon className="size-11 shrink-0 text-navy-950" strokeWidth={1.4} />
      <div className="mt-6">
        <p className="text-lg font-medium leading-tight tracking-heading text-navy-950">{kategori}</p>
        <p className="mt-1 text-[0.8rem] text-navy-500 line-clamp-2">
          {typeof jumlah === "number" ? `${jumlah} kegiatan` : deskripsi}
        </p>
      </div>
    </Link>
  );
}
