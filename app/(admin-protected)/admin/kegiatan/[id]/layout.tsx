import { notFound } from "next/navigation";

import { RemahRoti } from "@/components/admin/Fields";
import { SubNavKegiatan } from "@/components/admin/SubNavKegiatan";
import { requireAdmin } from "@/lib/auth/guard";
import { getEventById } from "@/lib/data/admin";
import { getFormByEventId } from "@/lib/data/forms";

export const dynamic = "force-dynamic";

/** Bingkai bersama halaman Detail, Formulir, dan Respons sebuah kegiatan. */
export default async function KegiatanLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  await requireAdmin();
  const { id } = await params;
  const [event, form] = await Promise.all([getEventById(id), getFormByEventId(id)]);
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <RemahRoti induk={{ href: "/admin/kegiatan", label: "Kelola Kegiatan" }} sekarang={event.title} />
        <SubNavKegiatan eventId={id} jumlahRespons={form ? form.response_count : null} />
      </div>
      {children}
    </div>
  );
}
