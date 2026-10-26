import type { QuestionSummary } from "@/lib/forms/summary";
import { QUESTION_KIND_LABEL } from "@/lib/forms/display";

/**
 * Tab "Ringkasan" respons — setara ringkasan Google Form.
 *
 * Grafik batang horizontal dibuat dengan CSS (satu warna netral), selalu
 * disertai angka & persentase sebagai teks sehingga terbaca tanpa melihat
 * panjang batang (aksesibel untuk pembaca layar & buta warna).
 */
export function RingkasanRespons({ summaries, total }: { summaries: QuestionSummary[]; total: number }) {
  if (summaries.length === 0) {
    return <p className="text-sm text-navy-600">Formulir ini belum berisi pertanyaan.</p>;
  }
  return (
    <div className="space-y-5">
      {summaries.map((s) => (
        <section key={s.question.id} className="rounded-card border border-navy-200/80 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-md font-semibold text-navy-950 [overflow-wrap:anywhere]">{s.question.title}</h2>
            <p className="text-xs text-navy-500">
              {QUESTION_KIND_LABEL[s.question.kind]} · {s.answered} dari {total} menjawab
            </p>
          </div>
          <div className="mt-4">
            <IsiRingkasan s={s} />
          </div>
        </section>
      ))}
    </div>
  );
}

function persen(n: number, dari: number) {
  return dari > 0 ? Math.round((n / dari) * 100) : 0;
}

function Batang({ label, count, dari }: { label: string; count: number; dari: number }) {
  const p = persen(count, dari);
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_5.5rem]">
      <span className="truncate text-sm text-navy-800" title={label}>
        {label}
      </span>
      <span className="order-3 col-span-2 h-2.5 overflow-hidden rounded-full bg-navy-100 sm:order-none sm:col-span-1" aria-hidden="true">
        <span className="block h-full rounded-full bg-navy-800" style={{ width: `${p}%` }} />
      </span>
      <span className="text-right text-sm tabular-nums text-navy-950">
        {count} <span className="text-navy-500">({p}%)</span>
      </span>
    </li>
  );
}

function IsiRingkasan({ s }: { s: QuestionSummary }) {
  if (s.answered === 0) return <p className="text-sm text-navy-500">Belum ada jawaban.</p>;

  switch (s.kind) {
    case "choice":
    case "scale": {
      // Kotak centang: persentase terhadap jumlah responden (total bisa > 100%), seperti Google Form.
      return (
        <div className="space-y-3">
          {s.kind === "scale" && s.mean !== null ? (
            <p className="text-sm text-navy-600">
              Rata-rata <strong className="tabular-nums text-navy-950">{s.mean.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</strong>
            </p>
          ) : null}
          <ul className="space-y-2.5">
            {s.counts.map((c) => (
              <Batang key={c.id} label={c.label} count={c.count} dari={s.answered} />
            ))}
          </ul>
          {s.kind === "choice" && s.other.length > 0 ? (
            <details className="rounded-2xl bg-navy-50 px-4 py-3 text-sm">
              <summary className="cursor-pointer font-medium text-navy-800">Isian “Lainnya” ({s.other.length})</summary>
              <ul className="mt-2 space-y-1 text-navy-700">
                {s.other.map((t, i) => (
                  <li key={i} className="[overflow-wrap:anywhere]">
                    {t}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      );
    }

    case "grid":
      return (
        <div className="overflow-x-auto rounded-2xl border border-navy-200/80">
          <table className="w-full min-w-max text-sm">
            <caption className="sr-only">Jumlah jawaban per baris dan kolom</caption>
            <thead className="bg-navy-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium text-navy-600">
                  Baris
                </th>
                {s.columns.map((c) => (
                  <th key={c.id} scope="col" className="px-3 py-2 text-center font-medium text-navy-800">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r) => (
                <tr key={r.id} className="border-t border-navy-100">
                  <th scope="row" className="px-3 py-2 text-left font-medium text-navy-950">
                    {r.label}
                  </th>
                  {r.counts.map((n, i) => (
                    <td key={i} className="px-3 py-2 text-center tabular-nums text-navy-800">
                      {n}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "file":
      return (
        <p className="text-sm text-navy-700">
          {s.files} berkas diunggah oleh {s.answered} responden. Unduh berkas lewat tab “Per respons”.
        </p>
      );

    case "text":
      return (
        <div>
          <ul className="max-h-80 divide-y divide-navy-100 overflow-y-auto rounded-2xl bg-navy-50 px-4">
            {s.latest.map((t, i) => (
              <li key={i} className="whitespace-pre-line py-2.5 text-sm text-navy-800 [overflow-wrap:anywhere]">
                {t}
              </li>
            ))}
          </ul>
          {s.answered > s.latest.length ? (
            <p className="mt-2 text-xs text-navy-500">
              Menampilkan {s.latest.length} jawaban terbaru. Unduh CSV untuk melihat semuanya.
            </p>
          ) : null}
        </div>
      );
  }
}
