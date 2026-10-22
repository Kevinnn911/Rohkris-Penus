import { KepalaHalamanAdmin } from "@/components/admin/Fields";
import { FormPengaturan } from "@/components/admin/FormPengaturan";
import { requireAdmin } from "@/lib/auth/guard";
import { getSiteSettings } from "@/lib/data/public";

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <KepalaHalamanAdmin
        eyebrow="Situs"
        judul="Pengaturan Situs"
        deskripsi="Identitas, kontak, media sosial, dan profil Rohkris. Semua dapat diubah tanpa menyentuh source code."
      />

      <FormPengaturan settings={settings} />
    </div>
  );
}
