import { notFound } from "next/navigation";

import { KepalaHalamanAdmin } from "@/components/admin/Fields";
import { PembangunFormulir } from "@/components/admin/formulir/PembangunFormulir";
import { requireAdmin } from "@/lib/auth/guard";
import { getEventById } from "@/lib/data/admin";
import { getFormByEventId, readDefinition, settingsFromRow } from "@/lib/data/forms";
import { isEmailConfigured } from "@/lib/email/mailer";
import { allQuestions } from "@/lib/forms/types";

export const dynamic = "force-dynamic";

export default async function FormulirKegiatanPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [event, form] = await Promise.all([getEventById(id), getFormByEventId(id)]);
  if (!event) notFound();

  const definition = form ? readDefinition(form.definition) : null;
  // Setelah ada respons, tipe pertanyaan yang sudah ada dikunci (lihat simpanFormulir).
  const lockedIds = form && form.response_count > 0 && definition ? allQuestions(definition).map((q) => q.id) : [];

  return (
    <div className="space-y-8">
      <KepalaHalamanAdmin
        eyebrow="Formulir internal"
        judul="Formulir Pendaftaran"
        deskripsi={
          event.registration_mode === "internal"
            ? "Susun pertanyaan seperti di Google Form. Respons tersimpan di server dan bisa dilihat di tab Respons."
            : "Kegiatan ini masih memakai formulir luar. Anda tetap bisa menyusun formulir di sini, lalu pilih “Formulir internal” di tab Detail untuk mengaktifkannya."
        }
      />
      <PembangunFormulir
        eventId={id}
        eventSlug={event.slug}
        initialDefinition={definition}
        initialSettings={form ? settingsFromRow(form) : null}
        revision={form?.revision ?? 0}
        responseCount={form?.response_count ?? 0}
        lockedIds={lockedIds}
        emailConfigured={isEmailConfigured()}
        modeInternal={event.registration_mode === "internal"}
      />
    </div>
  );
}
