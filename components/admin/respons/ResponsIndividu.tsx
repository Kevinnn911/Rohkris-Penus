import Link from "next/link";

import { kelasTombolBulat } from "@/components/admin/kelasTombol";
import { IconChevronLeft, IconChevronRight, IconDownload, IconFile } from "@/components/ui/Icons";
import { answerToText, gridRows } from "@/lib/forms/display";
import { formatUkuran } from "@/lib/forms/files";
import { formatJam, formatTanggal } from "@/lib/format/date";
import { type FormDefinition, type Question, type StoredAnswers, allQuestions } from "@/lib/forms/types";
import type { FormEmailStatus } from "@/lib/db/types";

type Berkas = { id: string; questionId: string; name: string; size: number; mime: string };

const LABEL_EMAIL: Record<FormEmailStatus, string | null> = {
  none: null,
  pending: "Salinan email sedang dikirim",
  sent: "Salinan email terkirim",
  failed: "Salinan email gagal dikirim",
};

/**
 * Tab "Per respons" — satu respons lengkap dengan navigasi sebelumnya/berikutnya.
 * Pertanyaan yang sudah dihapus dari formulir tetap ditampilkan dari snapshot
 * versi saat respons dikirim.
 */
export function ResponsIndividu({
  eventId,
  nomor,
  total,
  hrefSebelum,
  hrefSesudah,
  definition,
  versionDefinition,
  response,
  files,
  aksi,
}: {
  eventId: string;
  nomor: number;
  total: number;
  hrefSebelum: string | null;
  hrefSesudah: string | null;
  definition: FormDefinition;
  versionDefinition: FormDefinition | null;
  response: {
    id: string;
    email: string | null;
    submittedAt: string;
    editedAt: string | null;
    editCount: number;
    emailStatus: FormEmailStatus;
    answers: StoredAnswers;
  };
  files: Berkas[];
  aksi: React.ReactNode;
}) {
  const sekarang = allQuestions(definition);
  const dikenal = new Set(sekarang.map((q) => q.id));
  const lama = versionDefinition ? allQuestions(versionDefinition).filter((q) => !dikenal.has(q.id)) : [];
  const daftar: Array<{ q: Question; dihapus: boolean }> = [
    ...sekarang.map((q) => ({ q, dihapus: false })),
    ...lama.filter((q) => response.answers[q.id] !== undefined).map((q) => ({ q, dihapus: true })),
  ];
  const peta = new Map(files.map((f) => [f.id, { id: f.id, name: f.name }]));
  const statusEmail = LABEL_EMAIL[response.emailStatus];

  return (
    <article className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-navy-200/80 bg-white px-4 py-3 sm:px-5">
        <div className="flex items-center gap-1.5">
          {hrefSebelum ? (
            <Link href={hrefSebelum} className={kelasTombolBulat("secondary")}>
              <IconChevronLeft />
              <span className="sr-only">Respons sebelumnya</span>
            </Link>
          ) : (
            <span aria-hidden="true" className={`${kelasTombolBulat("secondary")} opacity-40`}>
              <IconChevronLeft />
            </span>
          )}
          <p className="px-2 text-sm tabular-nums text-navy-800">
            <span className="font-semibold text-navy-950">{nomor}</span> dari {total}
          </p>
          {hrefSesudah ? (
            <Link href={hrefSesudah} className={kelasTombolBulat("secondary")}>
              <IconChevronRight />
              <span className="sr-only">Respons berikutnya</span>
            </Link>
          ) : (
            <span aria-hidden="true" className={`${kelasTombolBulat("secondary")} opacity-40`}>
              <IconChevronRight />
            </span>
          )}
        </div>
        {aksi}
      </div>

      <div className="rounded-card border border-navy-200/80 bg-white p-5 sm:p-6">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-navy-500">Dikirim</dt>
            <dd className="font-medium text-navy-950">
              {formatTanggal(response.submittedAt)}, {formatJam(response.submittedAt)}
            </dd>
          </div>
          {response.email ? (
            <div className="min-w-0">
              <dt className="text-navy-500">Email</dt>
              <dd className="truncate font-medium text-navy-950">
                <a href={`mailto:${response.email}`} className="underline-offset-4 hover:underline">
                  {response.email}
                </a>
              </dd>
            </div>
          ) : null}
          {response.editedAt ? (
            <div>
              <dt className="text-navy-500">Terakhir diubah peserta</dt>
              <dd className="font-medium text-navy-950">
                {formatTanggal(response.editedAt)}, {formatJam(response.editedAt)} ({response.editCount}×)
              </dd>
            </div>
          ) : null}
          {statusEmail ? (
            <div>
              <dt className="text-navy-500">Email konfirmasi</dt>
              <dd className={response.emailStatus === "failed" ? "font-medium text-danger-700" : "font-medium text-navy-950"}>
                {statusEmail}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="divide-y divide-navy-100 rounded-card border border-navy-200/80 bg-white px-5 sm:px-6">
        {daftar.map(({ q, dihapus }) => {
          const v = response.answers[q.id];
          const berkas = q.kind === "file_upload" ? files.filter((f) => f.questionId === q.id) : [];
          return (
            <div key={q.id} className="py-4">
              <p className="text-sm font-medium text-navy-600 [overflow-wrap:anywhere]">
                {q.title}
                {dihapus ? <span className="ml-2 text-xs font-normal text-navy-500">(pertanyaan dihapus)</span> : null}
              </p>
              <div className="mt-1.5 text-md text-navy-950">
                {v === undefined ? (
                  <span className="text-navy-400">—</span>
                ) : q.kind === "file_upload" ? (
                  <ul className="space-y-2">
                    {berkas.map((f) => (
                      <li key={f.id} className="flex items-center gap-3 rounded-2xl bg-navy-50 px-3 py-2">
                        <IconFile className="size-5 shrink-0 text-navy-500" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{f.name}</span>
                          <span className="block text-xs text-navy-500">{formatUkuran(f.size)}</span>
                        </span>
                        <a
                          href={`/admin/kegiatan/${eventId}/respons/berkas/${f.id}`}
                          className={kelasTombolBulat("secondary")}
                        >
                          <IconDownload />
                          <span className="sr-only">Unduh {f.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (q.kind === "mc_grid" || q.kind === "checkbox_grid") && typeof v === "object" && !Array.isArray(v) ? (
                  <dl className="space-y-1 text-sm">
                    {gridRows(q, v as Record<string, unknown>).map(([baris, kolom]) => (
                      <div key={baris} className="flex gap-2">
                        <dt className="text-navy-600">{baris}:</dt>
                        <dd className="font-medium">{kolom}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="whitespace-pre-line [overflow-wrap:anywhere]">
                    {answerToText(q, v, { previous: versionDefinition, files: peta }) || <span className="text-navy-400">—</span>}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
