import Link from "next/link";
import { notFound } from "next/navigation";

import { KepalaHalamanAdmin, KosongAdmin } from "@/components/admin/Fields";
import { AksiRespons, HapusSemuaRespons } from "@/components/admin/respons/AksiRespons";
import { RingkasanRespons } from "@/components/admin/respons/RingkasanRespons";
import { ResponsIndividu } from "@/components/admin/respons/ResponsIndividu";
import { buttonClasses } from "@/components/ui/Button";
import { IconChart, IconDownload, IconList, IconUsers } from "@/components/ui/Icons";
import { requireAdmin } from "@/lib/auth/guard";
import { cn } from "@/lib/cn";
import { getEventById } from "@/lib/data/admin";
import {
  getFormByEventId,
  getFormVersions,
  getResponseFiles,
  getResponses,
  readAnswers,
  readDefinition,
} from "@/lib/data/forms";
import { summarize } from "@/lib/forms/summary";

export const dynamic = "force-dynamic";

export default async function ResponsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; n?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { tab: tabRaw, n: nRaw } = await searchParams;
  const tab = tabRaw === "individu" ? "individu" : "ringkasan";

  const [event, form] = await Promise.all([getEventById(id), getFormByEventId(id)]);
  if (!event) notFound();

  const definition = form ? readDefinition(form.definition) : null;
  if (!form || !definition) {
    return (
      <div className="space-y-8">
        <KepalaHalamanAdmin eyebrow="Formulir internal" judul="Respons" />
        <KosongAdmin
          ikon={<IconUsers />}
          judul="Belum ada formulir"
          deskripsi="Buat formulir di tab Formulir terlebih dahulu. Respons peserta akan tampil di sini."
        />
      </div>
    );
  }

  const [rows, files, versions] = await Promise.all([
    getResponses(form.id),
    getResponseFiles(form.id),
    getFormVersions(form.id),
  ]);
  const responses = rows.map((r) => ({ row: r, answers: readAnswers(r.answers) }));
  const total = responses.length;
  const dasar = `/admin/kegiatan/${id}/respons`;

  const kuota = form.quota !== null ? ` dari kuota ${form.quota}` : "";
  const aksi =
    total > 0 ? (
      <div className="flex flex-wrap gap-2">
        <a href={`${dasar}/csv`} className={buttonClasses("secondary", "md")} download>
          <IconDownload className="size-4" />
          CSV (Google Sheets)
        </a>
        <a href={`${dasar}/csv?pemisah=titikkoma`} className={buttonClasses("secondary", "md")} download>
          <IconDownload className="size-4" />
          CSV (Excel)
        </a>
      </div>
    ) : null;

  return (
    <div className="space-y-8">
      <KepalaHalamanAdmin
        eyebrow="Formulir internal"
        judul={`${total} respons`}
        deskripsi={`${event.title}${kuota}.`}
        aksi={aksi}
      />

      {total === 0 ? (
        <KosongAdmin
          ikon={<IconUsers />}
          judul="Belum ada respons"
          deskripsi="Respons akan tampil di sini segera setelah peserta mengirim formulir."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="Tampilan respons" className="inline-flex gap-1 rounded-full bg-white p-1 ring-1 ring-inset ring-navy-200/80">
              {(
                [
                  { id: "ringkasan", label: "Ringkasan", Icon: IconChart },
                  { id: "individu", label: "Per respons", Icon: IconList },
                ] as const
              ).map((t) => (
                <Link
                  key={t.id}
                  href={t.id === "ringkasan" ? dasar : `${dasar}?tab=individu`}
                  aria-current={tab === t.id ? "page" : undefined}
                  className={cn(
                    "pressable inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm",
                    tab === t.id ? "bg-navy-950 font-medium text-white" : "text-navy-700 hover:bg-navy-50 hover:text-navy-950",
                  )}
                >
                  <t.Icon className="size-4" />
                  {t.label}
                </Link>
              ))}
            </nav>
            <HapusSemuaRespons eventId={id} total={total} />
          </div>

          {tab === "ringkasan" ? (
            <RingkasanRespons summaries={summarize(definition, responses.map((r) => r.answers))} total={total} />
          ) : (
            (() => {
              const n = Math.min(Math.max(1, Number.parseInt(nRaw ?? "1", 10) || 1), total);
              const item = responses[n - 1]!;
              const berkas = files.filter((f) => f.response_id === item.row.id);
              return (
                <ResponsIndividu
                  eventId={id}
                  nomor={n}
                  total={total}
                  hrefSebelum={n > 1 ? `${dasar}?tab=individu&n=${n - 1}` : null}
                  hrefSesudah={n < total ? `${dasar}?tab=individu&n=${n + 1}` : null}
                  definition={definition}
                  versionDefinition={versions.get(item.row.form_version) ?? null}
                  response={{
                    id: item.row.id,
                    email: item.row.respondent_email,
                    submittedAt: item.row.submitted_at,
                    editedAt: item.row.edited_at,
                    editCount: item.row.edit_count,
                    emailStatus: item.row.email_status,
                    answers: item.answers,
                  }}
                  files={berkas.map((f) => ({ id: f.id, questionId: f.question_id, name: f.original_name, size: f.size_bytes, mime: f.mime }))}
                  aksi={<AksiRespons eventId={id} responseId={item.row.id} nomor={n} total={total} />}
                />
              );
            })()
          )}
        </>
      )}
    </div>
  );
}
