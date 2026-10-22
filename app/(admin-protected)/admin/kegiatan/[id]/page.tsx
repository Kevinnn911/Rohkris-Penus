import { notFound } from "next/navigation";

import { FormEvent } from "@/components/admin/FormEvent";
import { KepalaHalamanAdmin, RemahRoti } from "@/components/admin/Fields";
import { perbaruiEvent } from "@/lib/actions/events";
import type { ActionResult } from "@/lib/actions/helpers";
import { requireAdmin } from "@/lib/auth/guard";
import { getEventById } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function EditKegiatanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) notFound();

  // Mengikat id ke Server Action agar form tetap menerima (prev, formData).
  async function simpan(prev: ActionResult | null, formData: FormData) {
    "use server";
    return perbaruiEvent(id, prev, formData);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <RemahRoti
        induk={{ href: "/admin/kegiatan", label: "Kelola Kegiatan" }}
        sekarang={event.title}
      />

      <KepalaHalamanAdmin
        eyebrow="Kegiatan"
        judul="Edit Kegiatan"
        deskripsi="Perubahan langsung tampil di website publik setelah disimpan."
      />

      <FormEvent event={event} action={simpan} />
    </div>
  );
}
