import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { FormulirPublik } from "@/components/formulir/FormulirPublik";
import { PageHeader } from "@/components/site/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { IconArrowLeft } from "@/components/ui/Icons";
import { kirimFormulir } from "@/lib/actions/formulir-publik";
import { buatTokenFormulir, getFormByEventId, readDefinition, summaryFromRow } from "@/lib/data/forms";
import { getEventBySlug } from "@/lib/data/public";
import { getRegistrationLabel, getRegistrationState } from "@/lib/events/status";
import { formatTanggal } from "@/lib/format/date";

// Selalu dinamis: status kuota/jadwal & token anti-spam harus segar.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return {
    title: event ? `Daftar: ${event.title}` : "Formulir pendaftaran",
    robots: { index: false, follow: false },
  };
}

export default async function DaftarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  if (event.registration_mode !== "internal") redirect(`/kegiatan/${event.slug}`);

  const form = await getFormByEventId(event.id);
  const definition = form ? readDefinition(form.definition) : null;
  const state = getRegistrationState({ ...event, form: form ? summaryFromRow(form) : null });
  const kembali = `/kegiatan/${event.slug}`;

  const header = (
    <PageHeader
      eyebrow="Formulir pendaftaran"
      title={event.title}
      description={definition?.intro ? <span className="whitespace-pre-line">{definition.intro}</span> : undefined}
      breadcrumb={[
        { href: "/", label: "Beranda" },
        { href: "/kegiatan", label: "Kegiatan" },
        { href: kembali, label: event.title },
        { label: "Daftar" },
      ]}
    />
  );

  const token = form ? buatTokenFormulir(form) : null;
  if (state !== "daftar_terbuka" || !form || !definition || !token) {
    const label = getRegistrationLabel(state);
    return (
      <>
        {header}
        <div className="mx-auto max-w-2xl px-4 pb-8 pt-12 sm:px-6">
          <div className="rounded-panel border border-navy-200/80 bg-white px-6 py-10 text-center">
            <h2 className="text-xl font-semibold tracking-heading text-navy-950">{label.text}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-navy-600">
              {state === "segera_dibuka" && event.registration_open_at
                ? `Pendaftaran dibuka ${formatTanggal(event.registration_open_at)}.`
                : (label.hint ?? "Formulir pendaftaran belum tersedia.")}
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

  async function kirim(formData: FormData) {
    "use server";
    return kirimFormulir(event!.id, formData);
  }

  return (
    <>
      {header}
      <div className="mx-auto max-w-2xl px-4 pb-8 pt-10 sm:px-6 sm:pt-12">
        {event.registration_close_at ? (
          <p className="mb-6 text-sm text-navy-600">
            Pendaftaran ditutup <span className="font-medium text-navy-950">{formatTanggal(event.registration_close_at)}</span>.
          </p>
        ) : null}
        <FormulirPublik
          definition={definition}
          token={token}
          collectEmail={form.collect_email}
          consentText={form.consent_text}
          onSubmit={kirim}
          backHref={kembali}
        />
      </div>
    </>
  );
}
