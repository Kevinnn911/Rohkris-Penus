"use client";

import { useRouter } from "next/navigation";

import { TombolKonfirmasi } from "@/components/admin/Feedback";
import { IconTrash } from "@/components/ui/Icons";
import { hapusRespons, hapusSemuaRespons } from "@/lib/actions/formulir-admin";

/** Hapus satu respons; setelahnya pindah ke respons yang masih ada. */
export function AksiRespons({
  eventId,
  responseId,
  nomor,
  total,
}: {
  eventId: string;
  responseId: string;
  nomor: number;
  total: number;
}) {
  const router = useRouter();
  return (
    <TombolKonfirmasi
      label="Hapus respons"
      ikon={<IconTrash />}
      pesanKonfirmasi="Respons ini beserta berkas lampirannya akan dihapus permanen. Lanjutkan?"
      onKonfirmasi={async () => {
        const hasil = await hapusRespons(eventId, responseId);
        if (hasil.ok) {
          const berikut = Math.min(nomor, Math.max(1, total - 1));
          router.replace(`/admin/kegiatan/${eventId}/respons?tab=individu&n=${berikut}`);
          router.refresh();
        }
        return hasil;
      }}
    />
  );
}

export function HapusSemuaRespons({ eventId, total }: { eventId: string; total: number }) {
  const router = useRouter();
  return (
    <TombolKonfirmasi
      label="Hapus semua respons"
      ikon={<IconTrash />}
      pesanKonfirmasi={`Seluruh ${total} respons dan berkasnya akan dihapus permanen, dan kuota kembali kosong. Unduh CSV dulu bila masih dibutuhkan. Lanjutkan?`}
      onKonfirmasi={async () => {
        const hasil = await hapusSemuaRespons(eventId);
        if (hasil.ok) {
          router.replace(`/admin/kegiatan/${eventId}/respons`);
          router.refresh();
        }
        return hasil;
      }}
    />
  );
}
