import { notFound } from "next/navigation";

import { FormMedia } from "@/components/admin/FormMedia";
import { KepalaHalamanAdmin, RemahRoti } from "@/components/admin/Fields";
import { perbaruiMedia } from "@/lib/actions/media";
import type { ActionResult } from "@/lib/actions/helpers";
import { requireAdmin } from "@/lib/auth/guard";
import { getMediaById, getPilihanEvent } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function EditDokumentasiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [media, pilihanEvent] = await Promise.all([getMediaById(id), getPilihanEvent()]);

  if (!media) notFound();

  async function simpan(prev: ActionResult | null, formData: FormData) {
    "use server";
    return perbaruiMedia(id, prev, formData);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <RemahRoti
        induk={{ href: "/admin/galeri", label: "Kelola Dokumentasi" }}
        sekarang={media.title ?? media.alt_text}
      />

      <KepalaHalamanAdmin
        eyebrow="Dokumentasi"
        judul="Edit Dokumentasi"
      />

      <FormMedia media={media} pilihanEvent={pilihanEvent} action={simpan} />
    </div>
  );
}
