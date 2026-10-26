"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";

import { BlokTeks, InputPertanyaan, type BerkasLama } from "@/components/formulir/InputPertanyaan";
import { Button, ButtonLink } from "@/components/ui/Button";
import { IconAlert, IconArrowLeft, IconArrowRight, IconCheck, IconCopy } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import { nextSectionIndex } from "@/lib/forms/branching";
import { FORM_LIMITS, type Answers, type AnswerValue, type FormDefinition, allQuestions } from "@/lib/forms/types";
import { isValidEmail, validateSection } from "@/lib/forms/validate-answers";

/**
 * Formulir internal multi-bagian (pengisian publik, ubah jawaban, pratinjau).
 *
 * - "Berikutnya" memvalidasi bagian aktif lalu menghitung bagian tujuan
 *   dengan fungsi yang SAMA dengan server (lib/forms/branching).
 * - "Kembali" memakai tumpukan riwayat, sehingga lompatan cabang tetap benar.
 * - Semua bagian tetap ter-mount (yang tidak aktif disembunyikan) agar isian
 *   tidak hilang ketika berpindah bagian.
 */

export type KirimFn = (formData: FormData) => Promise<
  | { ok: true; message: string; editPath: string | null; emailQueued: boolean }
  | { ok: false; message: string; errors?: Record<string, string>; reload?: boolean }
>;

export function FormulirPublik({
  definition,
  token,
  collectEmail,
  consentText,
  onSubmit,
  initialAnswers = {},
  initialEmail = "",
  emailLocked = false,
  initialFiles = {},
  backHref,
  preview = false,
  submitLabel = "Kirim",
}: {
  definition: FormDefinition;
  /** Token anti-spam bertanda tangan dari server (kosong pada pratinjau). */
  token: string;
  collectEmail: boolean;
  consentText: string | null;
  onSubmit?: KirimFn;
  initialAnswers?: Answers;
  initialEmail?: string;
  /** Email tidak bisa diubah pada halaman ubah jawaban. */
  emailLocked?: boolean;
  initialFiles?: Record<string, BerkasLama[]>;
  backHref?: string;
  /** Mode pratinjau builder: tanpa kirim sungguhan. */
  preview?: boolean;
  submitLabel?: string;
}) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [kept, setKept] = useState<Record<string, BerkasLama[]>>(initialFiles);
  const [email, setEmail] = useState(initialEmail);
  const [consent, setConsent] = useState(false);
  const [riwayat, setRiwayat] = useState<number[]>([0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pesan, setPesan] = useState<{ tone: "danger" | "info"; text: string; reload?: boolean } | null>(null);
  const [selesai, setSelesai] = useState<{ message: string; editPath: string | null; emailQueued: boolean } | null>(null);
  const [pending, startTransition] = useTransition();
  const atasRef = useRef<HTMLDivElement>(null);

  const indeks = riwayat[riwayat.length - 1] ?? 0;
  const section = definition.sections[indeks];
  const tujuan = section ? nextSectionIndex(definition, indeks, answers) : null;
  const terakhir = tujuan === null;
  const banyakBagian = definition.sections.length > 1;

  const hitungBerkas = (): Record<string, number> => {
    const n: Record<string, number> = {};
    for (const q of allQuestions(definition)) {
      if (q.kind === "file_upload") n[q.id] = (files[q.id]?.length ?? 0) + (kept[q.id]?.length ?? 0);
    }
    return n;
  };

  const gulirKeAtas = () => {
    atasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    atasRef.current?.focus({ preventScroll: true });
  };

  /** Fokus ke kontrol pertama yang bermasalah agar pengguna keyboard/pembaca layar langsung tahu. */
  const fokusGalat = (ids: string[]) => {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-q="${ids[0]}"] input, [data-q="${ids[0]}"] textarea, [data-q="${ids[0]}"] select`);
      el?.focus();
    });
  };

  function cekBagian(): Record<string, string> {
    if (!section) return {};
    const e = validateSection(section, answers, hitungBerkas());
    // Email & persetujuan diperiksa di bagian pertama / terakhir.
    if (indeks === 0 && collectEmail && !emailLocked) {
      if (!email.trim()) e._email = "Alamat email wajib diisi.";
      else if (!isValidEmail(email.trim())) e._email = "Masukkan alamat email yang valid.";
    }
    if (terakhir && consentText && !consent) e._consent = "Centang persetujuan untuk melanjutkan.";
    if (terakhir) {
      const total = Object.values(files).flat().reduce((n, f) => n + f.size, 0);
      if (total > FORM_LIMITS.submissionFilesMaxBytes) {
        e._form = `Total ukuran berkas maksimal ${FORM_LIMITS.submissionFilesMaxBytes / (1024 * 1024)} MB per kiriman.`;
      }
    }
    return e;
  }

  function lanjut() {
    const e = cekBagian();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setPesan({ tone: "danger", text: "Periksa kembali isian yang ditandai." });
      fokusGalat(Object.keys(e));
      return;
    }
    setPesan(null);
    if (tujuan !== null) {
      setRiwayat((r) => [...r, tujuan]);
      gulirKeAtas();
    }
  }

  function kembali() {
    setErrors({});
    setPesan(null);
    setRiwayat((r) => (r.length > 1 ? r.slice(0, -1) : r));
    gulirKeAtas();
  }

  function kirim() {
    const e = cekBagian();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setPesan({ tone: "danger", text: e._form ?? "Periksa kembali isian yang ditandai." });
      fokusGalat(Object.keys(e));
      return;
    }
    if (preview || !onSubmit) {
      setSelesai({ message: "Ini pratinjau — jawaban tidak dikirim.", editPath: null, emailQueued: false });
      return;
    }
    const fd = new FormData();
    fd.set("token", token);
    fd.set("answers", JSON.stringify(answers));
    if (collectEmail && !emailLocked) fd.set("email", email.trim());
    if (consent) fd.set("consent", "on");
    for (const [qid, list] of Object.entries(files)) for (const f of list) fd.append(`file:${qid}`, f);
    for (const [qid, list] of Object.entries(kept)) for (const f of list) fd.append(`keep:${qid}`, f.id);

    setPesan(null);
    startTransition(async () => {
      try {
        const hasil = await onSubmit(fd);
        if (hasil.ok) {
          setSelesai({ message: hasil.message, editPath: hasil.editPath, emailQueued: hasil.emailQueued });
          gulirKeAtas();
          return;
        }
        setErrors(hasil.errors ?? {});
        setPesan({ tone: "danger", text: hasil.message, reload: hasil.reload });
        // Bawa pengguna ke bagian berisi galat pertama bila ada di bagian lain.
        const ids = Object.keys(hasil.errors ?? {});
        const bagianGalat = definition.sections.findIndex((s) => s.items.some((it) => ids.includes(it.id)));
        if (bagianGalat >= 0 && bagianGalat !== indeks) {
          const posisi = riwayat.indexOf(bagianGalat);
          if (posisi >= 0) setRiwayat(riwayat.slice(0, posisi + 1));
        }
        fokusGalat(ids);
      } catch {
        setPesan({
          tone: "danger",
          text: "Kiriman gagal. Bila Anda melampirkan berkas, pastikan totalnya tidak lebih dari 5 MB, lalu coba lagi.",
        });
      }
    });
  }

  if (selesai) return <LayarSelesai {...selesai} backHref={backHref} />;
  if (!section) return null;

  const hapusGalat = (id: string) =>
    setErrors((e) => {
      const sisa = { ...e };
      delete sisa[id];
      return sisa;
    });

  const setJawaban = (id: string, v: AnswerValue | undefined) => {
    setAnswers((a) => {
      const b = { ...a };
      if (v === undefined) delete b[id];
      else b[id] = v;
      return b;
    });
    if (errors[id]) hapusGalat(id);
  };

  return (
    <div ref={atasRef} tabIndex={-1} className="scroll-mt-28 focus:outline-none">
      {banyakBagian ? (
        <p className="mb-4 text-sm font-medium text-navy-600" aria-live="polite">
          Bagian {riwayat.length}
          {section.title ? <span className="text-navy-950"> · {section.title}</span> : null}
        </p>
      ) : null}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (terakhir) kirim();
          else lanjut();
        }}
        className="space-y-5"
      >
        {/* Honeypot: tidak terlihat & tidak bisa difokus pengguna sungguhan. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Situs web
            <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        {definition.sections.map((s, si) => (
          <div key={s.id} hidden={si !== indeks} className="space-y-5">
            {s.description && si === indeks ? (
              <p className="whitespace-pre-line rounded-card bg-white px-5 py-4 text-sm leading-relaxed text-navy-700 ring-1 ring-inset ring-navy-200/80">
                {s.description}
              </p>
            ) : null}

            {si === 0 && collectEmail ? (
              <Kartu>
                <label htmlFor="formulir-email" className="block text-md font-semibold text-navy-950">
                  Email
                  <span aria-hidden="true" className="ml-1 text-danger-600">*</span>
                  <span className="sr-only"> (wajib)</span>
                </label>
                <p id="formulir-email-desk" className="mt-1 text-sm text-navy-600">
                  {emailLocked ? "Email tidak dapat diubah." : "Salinan & tautan ubah jawaban dikirim ke alamat ini bila diaktifkan panitia."}
                </p>
                <input
                  id="formulir-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  readOnly={emailLocked}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors._email) hapusGalat("_email");
                  }}
                  aria-invalid={errors._email ? true : undefined}
                  aria-describedby={errors._email ? "formulir-email-desk formulir-email-err" : "formulir-email-desk"}
                  className={cn(
                    "mt-3 block w-full min-h-12 rounded-2xl border bg-white px-4 py-3 text-md text-navy-950 transition-[border-color,box-shadow] duration-150 ease-out focus:border-navy-950 focus:outline-none focus:ring-4 focus:ring-gold-200 read-only:bg-navy-50 read-only:text-navy-600",
                    errors._email ? "border-danger-500 bg-danger-50" : "border-navy-200 hover:border-navy-300",
                  )}
                />
                {errors._email ? (
                  <p id="formulir-email-err" role="alert" className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger-700">
                    <IconAlert className="mt-px size-4 shrink-0" />
                    {errors._email}
                  </p>
                ) : null}
              </Kartu>
            ) : null}

            {s.items.map((it) =>
              it.kind === "text" ? (
                <BlokTeks key={it.id} item={it} />
              ) : (
                <Kartu key={it.id} galat={Boolean(errors[it.id])} dataQ={it.id}>
                  <InputPertanyaan
                    question={it}
                    value={answers[it.id]}
                    onChange={(v) => setJawaban(it.id, v)}
                    error={errors[it.id]}
                    files={files[it.id] ?? []}
                    onFilesChange={(f) => {
                      setFiles((x) => ({ ...x, [it.id]: f }));
                      if (errors[it.id]) hapusGalat(it.id);
                    }}
                    keptFiles={kept[it.id] ?? []}
                    onKeptFilesChange={(f) => setKept((x) => ({ ...x, [it.id]: f }))}
                    disabled={pending}
                  />
                </Kartu>
              ),
            )}
          </div>
        ))}

        {terakhir && consentText ? (
          <Kartu galat={Boolean(errors._consent)} dataQ="_consent">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (errors._consent) hapusGalat("_consent");
                }}
                aria-invalid={errors._consent ? true : undefined}
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-navy-950"
              />
              <span className="text-sm leading-relaxed text-navy-800">{consentText}</span>
            </label>
            {errors._consent ? (
              <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger-700">
                <IconAlert className="mt-px size-4 shrink-0" />
                {errors._consent}
              </p>
            ) : null}
          </Kartu>
        ) : null}

        {pesan ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-danger-600/20 bg-danger-50 px-4 py-3.5 text-sm font-medium text-danger-700"
          >
            <IconAlert className="mt-px size-4 shrink-0" />
            <div className="min-w-0">
              <p>{pesan.text}</p>
              {pesan.reload ? (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-1 underline underline-offset-4 hover:no-underline"
                >
                  Muat ulang halaman
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          {riwayat.length > 1 ? (
            <Button type="button" variant="secondary" onClick={kembali} disabled={pending}>
              <IconArrowLeft className="size-4" />
              Kembali
            </Button>
          ) : (
            <span aria-hidden="true" />
          )}
          <Button type="submit" size="lg" disabled={pending} aria-busy={pending} className="sm:min-w-44">
            {terakhir ? (pending ? "Mengirim…" : submitLabel) : "Berikutnya"}
            {terakhir ? null : <IconArrowRight className="size-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Kartu({ children, galat = false, dataQ }: { children: React.ReactNode; galat?: boolean; dataQ?: string }) {
  return (
    <div
      data-q={dataQ}
      className={cn(
        "rounded-card border bg-white p-5 transition-[border-color] duration-150 ease-out sm:p-6",
        galat ? "border-danger-500/60" : "border-navy-200/80",
      )}
    >
      {children}
    </div>
  );
}

function LayarSelesai({
  message,
  editPath,
  emailQueued,
  backHref,
}: {
  message: string;
  editPath: string | null;
  emailQueued: boolean;
  backHref?: string;
}) {
  const [tersalin, setTersalin] = useState(false);
  const url = editPath && typeof window !== "undefined" ? `${window.location.origin}${editPath}` : editPath;

  return (
    <div role="status" className="rounded-panel border border-navy-200/80 bg-white px-6 py-10 text-center sm:px-10">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-sage-100 text-sage-700 ring-1 ring-inset ring-sage-300">
        <IconCheck className="size-6" />
      </span>
      <h2 className="mt-5 text-2xl font-bold tracking-heading text-navy-950">Terima kasih!</h2>
      <p className="mx-auto mt-2 max-w-md whitespace-pre-line leading-relaxed text-navy-600">{message}</p>
      {emailQueued ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-navy-500">Salinan jawaban sedang dikirim ke email Anda.</p>
      ) : null}

      {url ? (
        <div className="mx-auto mt-7 max-w-lg rounded-card bg-navy-50 p-4 text-left ring-1 ring-inset ring-navy-200/80">
          <p className="text-sm font-semibold text-navy-950">Tautan untuk mengubah jawaban</p>
          <p className="mt-1 text-xs leading-relaxed text-navy-600">
            Simpan tautan ini secara pribadi. Siapa pun yang memilikinya dapat mengubah jawaban Anda.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={url}
              aria-label="Tautan ubah jawaban"
              onFocus={(e) => e.currentTarget.select()}
              className="min-h-11 min-w-0 flex-1 rounded-full border border-navy-200 bg-white px-4 text-sm text-navy-800"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setTersalin(true);
                } catch {
                  setTersalin(false);
                }
              }}
            >
              <IconCopy className="size-4" />
              {tersalin ? "Tersalin" : "Salin"}
            </Button>
          </div>
        </div>
      ) : null}

      {backHref ? (
        <div className="mt-8">
          <ButtonLink href={backHref} variant="secondary">
            <IconArrowLeft className="size-4" />
            Kembali ke halaman kegiatan
          </ButtonLink>
        </div>
      ) : editPath ? null : (
        <Link href="/" className="mt-6 inline-block text-sm text-navy-600 underline underline-offset-4">
          Ke beranda
        </Link>
      )}
    </div>
  );
}
