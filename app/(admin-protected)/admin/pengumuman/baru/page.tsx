import { FormPengumuman } from "@/components/admin/FormPengumuman";
import { KepalaHalamanAdmin, RemahRoti } from "@/components/admin/Fields";
import { buatPengumuman } from "@/lib/actions/announcements";
import { requireAdmin } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function BuatPengumumanPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <RemahRoti
        induk={{ href: "/admin/pengumuman", label: "Kelola Pengumuman" }}
        sekarang="Buat"
      />

      <KepalaHalamanAdmin
        eyebrow="Pengumuman baru"
        judul="Buat Pengumuman"
      />

      <FormPengumuman action={buatPengumuman} />
    </div>
  );
}
