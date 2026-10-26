import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormulirPublik } from "@/components/formulir/FormulirPublik";
import { PageHeader } from "@/components/site/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { IconArrowLeft } from "@/components/ui/Icons";
import { ubahJawaban } from "@/lib/actions/formulir-publik";
import { buatTokenFormulir, dataUntukUbah, getFormByEventId, readDefinition, summaryFromRow } from "@/lib/data/forms";
import { getEventBySlug } from "@/lib/data/public";
import { canEditResponse } from "@/lib/events/status";
import type { Answers } from "@/lib/forms/types";

export const dynamic = "force-dynamic";

// Tautan rahasia: jangan diindeks dan jangan bocorkan URL lewat header Referer.
export const metadata: Metadata = {
  title: "Ubah jawaban",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function UbahJawabanPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  const event = await getEventBySlug(slug);
  if (!event || event.registration_mode !== "internal") notFound();

  const [form, data] = await Promise.all([getFormByEventId(event.id), dataUntukUbah(token)]);
  if (!form || !data || data.formId !== form.id) notFound();
  const definition = readDefinition(form.definition);
  if (!definition) notFound();

  const kembali = `/kegiatan/${event.slug}`;
  const bolehUbah = form.allow_edit && canEditResponse({ ...event, form: summaryFromRow(form) });
  const tokenForm = buatTokenFormulir(form, 5_000);

  const header = (
    <PageHeader
      eyebrow="Ubah jawaban"
      title={event.title}
      breadcrumb={[
        { href: "/", label: "Beranda" },
        { href: kembali, label: event.title },
        { label: "Ubah jawaban" },
      ]}
    />
  );

  if (!bolehUbah || !tokenForm) {
    return (
      <>
        {header}
        <div className="mx-auto max-w-2xl px-4 pb-8 pt-12 sm:px-6">
          <div className="rounded-panel border border-navy-200/80 bg-white px-6 py-10 text-center">
            <h2 className="text-xl font-semibold tracking-heading text-navy-950">Jawaban tidak dapat diubah lagi</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-navy-600">
              Masa pendaftaran sudah berakhir atau panitia menonaktifkan perubahan jawaban. Hubungi panitia bila ada
              data yang perlu dikoreksi.
            </p>
            <div className="mt-6">
              <ButtonLink href={kembali} variant="secondary">
                <IconArrowLeft className="size-4" />
                Kembali ke halaman kegiatan
              </ButtonLink>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Berkas tersimpan dikelompokkan per pertanyaan untuk ditampilkan & dipertahankan.
  const berkas: Record<string, Array<{ id: string; name: string; size: number }>> = {};
  for (const f of data.files) (berkas[f.questionId] ??= []).push({ id: f.id, name: f.name, size: f.size });
  const { _path: _diabaikan, ...jawaban } = data.answers;
  void _diabaikan;

  async function simpan(formData: FormData) {
    "use server";
    return ubahJawaban(token, formData);
  }

  return (
    <>
      {header}
      <div className="mx-auto max-w-2xl px-4 pb-8 pt-10 sm:px-6 sm:pt-12">
        <FormulirPublik
          definition={definition}
          token={tokenForm}
          collectEmail={form.collect_email}
          consentText={form.consent_text}
          onSubmit={simpan}
          initialAnswers={jawaban as Answers}
          initialEmail={data.email ?? ""}
          emailLocked
          initialFiles={berkas}
          backHref={kembali}
          submitLabel="Simpan perubahan"
        />
      </div>
    </>
  );
}
