// File: app/(admin-protected)/admin/kegiatan/[id]/scan/page.tsx

import { notFound } from "next/navigation";

import { KepalaHalamanAdmin } from "@/components/admin/Fields";
import { PindaiTiket } from "@/components/admin/tiket/PindaiTiket";
import { requireAdmin } from "@/lib/auth/guard";
import { getEventById } from "@/lib/data/admin";
import { getFormByEventId } from "@/lib/data/forms";

export const dynamic = "force-dynamic";

export default async function PindaiTiketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [event, form] = await Promise.all([getEventById(id), getFormByEventId(id)]);
  if (!event) notFound();

  return (
    <div className="space-y-8">
      <KepalaHalamanAdmin
        eyebrow="Presensi & Penukaran Kupon"
        judul="Pemindai Kode QR Tiket"
        deskripsi={`Pindai kode QR e-tiket peserta untuk memverifikasi kehadiran dan penukaran kupon fisik pada kegiatan “${event.title}”.`}
      />

      <PindaiTiket
        eventId={id}
        eventTitle={event.title}
        redemptionMode={form?.ticket_redemption_mode ?? "flexible"}
      />
    </div>
  );
}

