import { FormBerita } from "@/components/admin/FormBerita";
import { KepalaHalamanAdmin, RemahRoti } from "@/components/admin/Fields";
import { buatBerita } from "@/lib/actions/news";
import { requireAdmin } from "@/lib/auth/guard";
import { getPilihanEvent } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function TulisBeritaPage() {
  await requireAdmin();
  const pilihanEvent = await getPilihanEvent();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <RemahRoti
        induk={{ href: "/admin/berita", label: "Kelola Berita" }}
        sekarang="Tulis Berita"
      />

      <KepalaHalamanAdmin
        eyebrow="Berita baru"
        judul="Tulis Berita Baru"
        deskripsi="Gunakan untuk recap kegiatan atau pengumuman panjang."
      />

      <FormBerita pilihanEvent={pilihanEvent} action={buatBerita} />
    </div>
  );
}
