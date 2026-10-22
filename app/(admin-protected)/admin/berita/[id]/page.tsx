import { notFound } from "next/navigation";

import { FormBerita } from "@/components/admin/FormBerita";
import { KepalaHalamanAdmin, RemahRoti } from "@/components/admin/Fields";
import { perbaruiBerita } from "@/lib/actions/news";
import type { ActionResult } from "@/lib/actions/helpers";
import { requireAdmin } from "@/lib/auth/guard";
import { getBeritaById, getPilihanEvent } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function EditBeritaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [post, pilihanEvent] = await Promise.all([getBeritaById(id), getPilihanEvent()]);

  if (!post) notFound();

  async function simpan(prev: ActionResult | null, formData: FormData) {
    "use server";
    return perbaruiBerita(id, prev, formData);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <RemahRoti
        induk={{ href: "/admin/berita", label: "Kelola Berita" }}
        sekarang={post.title}
      />

      <KepalaHalamanAdmin
        eyebrow="Berita"
        judul="Edit Berita"
      />

      <FormBerita post={post} pilihanEvent={pilihanEvent} action={simpan} />
    </div>
  );
}
