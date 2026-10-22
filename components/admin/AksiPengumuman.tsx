"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { kelasTombolBulat, TombolKonfirmasi } from "@/components/admin/Feedback";
import { IconEdit, IconTrash } from "@/components/ui/Icons";
import { hapusPengumuman } from "@/lib/actions/announcements";

export function AksiPengumuman({ id, judul }: { id: string; judul: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/admin/pengumuman/${id}`}
        className={kelasTombolBulat("secondary")}
        title="Edit"
      >
        <IconEdit />
        <span className="sr-only">Edit</span>
      </Link>

      <TombolKonfirmasi
        label="Hapus"
        ikonSaja
        ikon={<IconTrash />}
        pesanKonfirmasi={`Hapus pengumuman “${judul}”? Tindakan ini tidak dapat dibatalkan.`}
        onKonfirmasi={async () => {
          const hasil = await hapusPengumuman(id);
          router.refresh();
          return hasil;
        }}
        labelLoading="Menghapus…"
      />
    </div>
  );
}
