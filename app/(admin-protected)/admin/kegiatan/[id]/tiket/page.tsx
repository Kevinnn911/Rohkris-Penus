// File: app/(admin-protected)/admin/kegiatan/[id]/tiket/page.tsx

import { notFound } from "next/navigation";

import { KepalaHalamanAdmin, KosongAdmin } from "@/components/admin/Fields";
import { ManajemenTiket } from "@/components/admin/tiket/ManajemenTiket";
import { IconUsers } from "@/components/ui/Icons";
import { requireAdmin } from "@/lib/auth/guard";
import { getEventById } from "@/lib/data/admin";
import { getFormByEventId } from "@/lib/data/forms";
import { formatRentangKegiatan, formatTanggal } from "@/lib/format/date";
import { getEventTickets } from "@/lib/tickets/data";

export const dynamic = "force-dynamic";

export default async function TiketKegiatanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [event, form] = await Promise.all([getEventById(id), getFormByEventId(id)]);
  if (!event) notFound();

  if (!form) {
    return (
      <div className="space-y-8">
        <KepalaHalamanAdmin eyebrow="E-Tiket & Presensi" judul="Tiket Peserta" />
        <KosongAdmin
          ikon={<IconUsers />}
          judul="Formulir belum dibuat"
          deskripsi="Buat dan aktifkan formulir pendaftaran internal terlebih dahulu agar sistem tiket dan QR dapat diterbitkan."
        />
      </div>
    );
  }

  const tickets = await getEventTickets(id);
  const eventDate = formatRentangKegiatan(event.start_at, event.end_at) ?? formatTanggal(event.start_at);

  return (
    <div className="space-y-8">
      <KepalaHalamanAdmin
        eyebrow="E-Tiket & Presensi"
        judul="Daftar Tiket & Server Backup"
        deskripsi={`Kelola presensi peserta, penukaran kupon, dan tiket cadangan untuk kegiatan “${event.title}”.`}
      />

      <ManajemenTiket
        eventId={id}
        eventTitle={event.title}
        eventDate={eventDate}
        eventLocation={event.location}
        tickets={tickets}
      />
    </div>
  );
}
