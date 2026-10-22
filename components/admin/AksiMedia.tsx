"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { kelasTombolBulat, TombolAksi, TombolKonfirmasi } from "@/components/admin/Feedback";
import { IconCheck, IconEdit, IconEye, IconTrash } from "@/components/ui/Icons";
import { hapusMedia, ubahStatusMedia } from "@/lib/actions/media";

export function AksiMedia({
  id,
  status,
  judul,
}: {
  id: string;
  status: "draft" | "published" | "archived";
  judul: string;
}) {
  const router = useRouter();

  async function jalankan<T>(aksi: Promise<T>): Promise<T> {
    const hasil = await aksi;
    router.refresh();
    return hasil;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/admin/galeri/${id}`}
        className={kelasTombolBulat("secondary")}
        title="Edit"
      >
        <IconEdit />
        <span className="sr-only">Edit</span>
      </Link>

      {status !== "published" ? (
        <TombolAksi
          label="Terbitkan"
          variant="primary"
          ikon={<IconCheck />}
          onAksi={() => jalankan(ubahStatusMedia(id, "published"))}
        />
      ) : (
        <TombolAksi
          label="Sembunyikan"
          ikon={<IconEye />}
          onAksi={() => jalankan(ubahStatusMedia(id, "draft"))}
        />
      )}

      <TombolKonfirmasi
        label="Hapus"
        ikonSaja
        ikon={<IconTrash />}
        pesanKonfirmasi={`Hapus dokumentasi “${judul}”? Tindakan ini tidak dapat dibatalkan.`}
        onKonfirmasi={() => jalankan(hapusMedia(id))}
        labelLoading="Menghapus…"
      />
    </div>
  );
}
