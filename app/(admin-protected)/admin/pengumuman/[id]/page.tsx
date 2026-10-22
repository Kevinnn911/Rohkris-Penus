import { notFound } from "next/navigation";

import { FormPengumuman } from "@/components/admin/FormPengumuman";
import { KepalaHalamanAdmin, RemahRoti } from "@/components/admin/Fields";
import { perbaruiPengumuman } from "@/lib/actions/announcements";
import type { ActionResult } from "@/lib/actions/helpers";
import { requireAdmin } from "@/lib/auth/guard";
import { getPengumumanById } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function EditPengumumanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const pengumuman = await getPengumumanById(id);

  if (!pengumuman) notFound();

  async function simpan(prev: ActionResult | null, formData: FormData) {
    "use server";
    return perbaruiPengumuman(id, prev, formData);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <RemahRoti
        induk={{ href: "/admin/pengumuman", label: "Kelola Pengumuman" }}
        sekarang={pengumuman.title}
      />

      <KepalaHalamanAdmin
        eyebrow="Pengumuman"
        judul="Edit Pengumuman"
      />

      <FormPengumuman pengumuman={pengumuman} action={simpan} />
    </div>
  );
}
