import { getAdminContext } from "@/lib/auth/guard";
import { getEventById } from "@/lib/data/admin";
import {
  getFormByEventId,
  getFormVersions,
  getResponseFiles,
  getResponses,
  readAnswers,
  readDefinition,
} from "@/lib/data/forms";
import { buildCsv, csvFileName, type CsvResponse } from "@/lib/forms/csv";

/**
 * Unduh respons formulir sebagai CSV.
 * Route Handler TIDAK melewati layout admin, jadi sesi diperiksa di sini;
 * tanpa sesi admin hasilnya 404 (panel tetap tersembunyi).
 * IP & user agent sengaja tidak ikut diekspor.
 */
export const dynamic = "force-dynamic";

const tidakDitemukan = () => new Response("Tidak ditemukan", { status: 404 });

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAdminContext();
  if (!ctx) return tidakDitemukan();

  const { id } = await params;
  const [event, form] = await Promise.all([getEventById(id), getFormByEventId(id)]);
  const definition = form ? readDefinition(form.definition) : null;
  if (!event || !form || !definition) return tidakDitemukan();

  const [rows, files, versions] = await Promise.all([
    getResponses(form.id),
    getResponseFiles(form.id),
    getFormVersions(form.id),
  ]);
  const namaBerkas = new Map(files.map((f) => [f.id, { id: f.id, name: f.original_name }]));

  // CSV diurutkan dari yang paling awal, seperti spreadsheet Google Form.
  const data: CsvResponse[] = [...rows].reverse().map((r) => ({
    submittedAt: r.submitted_at,
    editedAt: r.edited_at,
    email: r.respondent_email,
    answers: readAnswers(r.answers),
    versionDefinition: versions.get(r.form_version) ?? null,
    files: namaBerkas,
  }));

  const pemisah = new URL(request.url).searchParams.get("pemisah") === "titikkoma" ? ";" : ",";
  const csv = buildCsv(definition, data, { delimiter: pemisah, includeEmail: form.collect_email });
  const nama = csvFileName(event.slug, new Date());

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nama}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
