import { FormMedia } from "@/components/admin/FormMedia";
import { KepalaHalamanAdmin, RemahRoti } from "@/components/admin/Fields";
import { buatMedia } from "@/lib/actions/media";
import { requireAdmin } from "@/lib/auth/guard";
import { getPilihanEvent } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function TambahDokumentasiPage() {
  await requireAdmin();
  const pilihanEvent = await getPilihanEvent();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <RemahRoti
        induk={{ href: "/admin/galeri", label: "Kelola Dokumentasi" }}
        sekarang="Tambah"
      />

      <KepalaHalamanAdmin
        eyebrow="Dokumentasi baru"
        judul="Tambah Dokumentasi"
        deskripsi="Pastikan penggunaan foto siswa sudah sesuai kebijakan sekolah dan persetujuan yang berlaku."
      />

      <FormMedia pilihanEvent={pilihanEvent} action={buatMedia} />
    </div>
  );
}
