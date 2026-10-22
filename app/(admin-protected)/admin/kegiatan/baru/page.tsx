import { FormEvent } from "@/components/admin/FormEvent";
import { KepalaHalamanAdmin, RemahRoti } from "@/components/admin/Fields";
import { buatEvent } from "@/lib/actions/events";
import { requireAdmin } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function BuatKegiatanPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <RemahRoti
        induk={{ href: "/admin/kegiatan", label: "Kelola Kegiatan" }}
        sekarang="Buat Kegiatan"
      />

      <KepalaHalamanAdmin
        eyebrow="Kegiatan baru"
        judul="Buat Kegiatan Baru"
        deskripsi="Simpan sebagai draft bila belum siap diumumkan. Kegiatan draft tidak terlihat oleh pengunjung."
      />

      <FormEvent action={buatEvent} />
    </div>
  );
}
