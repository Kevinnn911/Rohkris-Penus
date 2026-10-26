"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  IkonArsip,
  kelasTombolBulat,
  TombolAksi,
  TombolKonfirmasi,
} from "@/components/admin/Feedback";
import {
  IconCheck,
  IconClose,
  IconEdit,
  IconEye,
  IconStar,
  IconTrash,
} from "@/components/ui/Icons";
import { hapusEvent, ubahStatusEvent, ubahUnggulanEvent } from "@/lib/actions/events";

/** Tombol aksi per baris pada tabel kegiatan. */
export function AksiEvent({
  id,
  status,
  unggulan,
  judul,
}: {
  id: string;
  status: "draft" | "published" | "archived" | "cancelled";
  unggulan: boolean;
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
        href={`/admin/kegiatan/${id}`}
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
          onAksi={() => jalankan(ubahStatusEvent(id, "published"))}
        />
      ) : (
        <TombolAksi
          label="Tarik publikasi"
          ikon={<IconEye />}
          onAksi={() => jalankan(ubahStatusEvent(id, "draft"))}
        />
      )}

      {status !== "archived" ? (
        <TombolAksi
          label="Arsipkan"
          ikonSaja
          ikon={<IkonArsip />}
          onAksi={() => jalankan(ubahStatusEvent(id, "archived"))}
        />
      ) : null}

      {status !== "cancelled" ? (
        <TombolAksi
          label="Batalkan"
          ikonSaja
          ikon={<IconClose />}
          onAksi={() => jalankan(ubahStatusEvent(id, "cancelled"))}
        />
      ) : null}

      <TombolAksi
        label={unggulan ? "Lepas unggulan" : "Jadikan unggulan"}
        ikonSaja
        ikon={<IconStar />}
        onAksi={() => jalankan(ubahUnggulanEvent(id, !unggulan))}
      />

      <TombolKonfirmasi
        label="Hapus"
        ikonSaja
        ikon={<IconTrash />}
        pesanKonfirmasi={`Hapus kegiatan “${judul}” secara permanen? Tindakan ini tidak dapat dibatalkan. Pertimbangkan memakai Arsipkan bila hanya ingin menyembunyikannya.`}
        onKonfirmasi={() => jalankan(hapusEvent(id))}
        labelLoading="Menghapus…"
      />
    </div>
  );
}
