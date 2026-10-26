"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useState, useTransition } from "react";

import { EditorItem, kelasInputBuilder, kelasTombolIkon } from "@/components/admin/formulir/EditorPertanyaan";
import { FormulirPublik } from "@/components/formulir/FormulirPublik";
import { Button } from "@/components/ui/Button";
import {
  IconAlert,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconEdit,
  IconExternal,
  IconList,
  IconPlus,
  IconSettings,
  IconTrash,
} from "@/components/ui/Icons";
import { simpanFormulir } from "@/lib/actions/formulir-admin";
import { cn } from "@/lib/cn";
import {
  builderReducer,
  initialBuilderState,
  type BuilderAction,
  type BuilderState,
} from "@/lib/forms/builder-reducer";
import { parseDefinition, unreachableSections } from "@/lib/forms/definition-schema";
import { QUESTION_KIND_LABEL } from "@/lib/forms/display";
import type { FormDefinition, FormSettings, QuestionKind } from "@/lib/forms/types";

type Tab = "pertanyaan" | "pengaturan" | "pratinjau";

/**
 * Builder formulir internal (admin) — mirip Google Form: bagian, pertanyaan,
 * opsi, lompat bagian, pengaturan, dan pratinjau memakai renderer publik.
 * State dikelola reducer murni (lib/forms/builder-reducer, diuji unit) lalu
 * disimpan utuh lewat Server Action simpanFormulir.
 */
export function PembangunFormulir({
  eventId,
  eventSlug,
  initialDefinition,
  initialSettings,
  revision: revisiAwal,
  responseCount,
  lockedIds,
  emailConfigured,
  modeInternal,
}: {
  eventId: string;
  eventSlug: string;
  initialDefinition: FormDefinition | null;
  initialSettings: FormSettings | null;
  revision: number;
  responseCount: number;
  lockedIds: string[];
  emailConfigured: boolean;
  modeInternal: boolean;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    (st: BuilderState, a: BuilderAction) => builderReducer(st, a),
    null,
    () =>
    initialBuilderState(initialDefinition, initialSettings),
  );
  const [revision, setRevision] = useState(revisiAwal);
  const [tab, setTab] = useState<Tab>("pertanyaan");
  const [pending, startTransition] = useTransition();
  const [hasil, setHasil] = useState<{ ok: boolean; message: string; conflict?: boolean } | null>(null);
  const [masalahServer, setMasalahServer] = useState<Array<{ message: string; path: Array<string | number> }>>([]);
  const terkunci = useMemo(() => new Set(lockedIds), [lockedIds]);

  const { definition, settings, dirty } = state;

  // Validasi langsung di klien (skema yang sama dengan server).
  const validasi = useMemo(() => parseDefinition(definition), [definition]);
  const masalah = validasi.ok ? masalahServer.filter((m) => m.path[0] === "settings") : validasi.issues;
  const tidakTerjangkau = useMemo(() => (validasi.ok ? unreachableSections(definition) : []), [validasi, definition]);

  const masalahItem = (si: number, ii: number) =>
    masalah.filter((m) => m.path[0] === "sections" && m.path[1] === si && m.path[2] === "items" && m.path[3] === ii).map((m) => m.message);
  const masalahBagian = (si: number) =>
    masalah.filter((m) => m.path[0] === "sections" && m.path[1] === si && m.path[2] !== "items").map((m) => m.message);
  const masalahUmum = masalah.filter((m) => m.path[0] !== "sections" && m.path[0] !== "settings").map((m) => m.message);

  // Peringatan saat menutup tab / memuat ulang dengan perubahan belum disimpan.
  useEffect(() => {
    if (!dirty) return;
    const tahan = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", tahan);
    return () => window.removeEventListener("beforeunload", tahan);
  }, [dirty]);

  // Navigasi di dalam aplikasi (Link) juga ditahan bila ada perubahan.
  useEffect(() => {
    if (!dirty) return;
    const klik = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest("a[href]");
      if (!a || a.getAttribute("target") === "_blank" || e.defaultPrevented) return;
      const href = a.getAttribute("href") ?? "";
      if (!href.startsWith("/") || href.startsWith("#")) return;
      if (!window.confirm("Perubahan formulir belum disimpan. Tinggalkan halaman ini?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("click", klik, true);
    return () => document.removeEventListener("click", klik, true);
  }, [dirty]);

  function simpan() {
    if (!validasi.ok) {
      setTab("pertanyaan");
      setHasil({ ok: false, message: "Periksa kembali pertanyaan yang ditandai merah." });
      return;
    }
    setHasil(null);
    startTransition(async () => {
      const r = await simpanFormulir(eventId, { definition, settings, revision });
      if (r.ok) {
        setRevision(r.revision);
        setMasalahServer([]);
        dispatch({ type: "saved" });
        setHasil({ ok: true, message: r.message });
        router.refresh();
      } else {
        setMasalahServer(r.issues ?? []);
        setHasil({ ok: false, message: r.message, conflict: r.conflict });
      }
    });
  }

  // Nomor urut pertanyaan (blok teks tidak dihitung), dihitung di luar JSX.
  const nomorPertanyaan = useMemo(() => {
    const peta = new Map<string, number>();
    let n = 0;
    for (const s of definition.sections) for (const it of s.items) if (it.kind !== "text") peta.set(it.id, (n += 1));
    return peta;
  }, [definition]);

  return (
    <div className="space-y-6">
      {!modeInternal ? (
        <div className="flex items-start gap-3 rounded-2xl border border-warning-600/20 bg-warning-50 px-4 py-3.5 text-sm text-warning-700">
          <IconAlert className="mt-px size-4 shrink-0" />
          <p>
            Formulir ini belum aktif untuk publik. Buka tab{" "}
            <Link href={`/admin/kegiatan/${eventId}`} className="font-semibold underline underline-offset-4">
              Detail
            </Link>{" "}
            lalu pilih <strong>Formulir internal</strong> pada bagian Pendaftaran.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Builder formulir" className="inline-flex gap-1 rounded-full bg-white p-1 ring-1 ring-inset ring-navy-200/80">
          {(
            [
              { id: "pertanyaan", label: "Pertanyaan", Icon: IconList },
              { id: "pengaturan", label: "Pengaturan", Icon: IconSettings },
              { id: "pratinjau", label: "Pratinjau", Icon: IconEye },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "pressable inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm",
                tab === t.id ? "bg-navy-950 font-medium text-white" : "text-navy-700 hover:bg-navy-50 hover:text-navy-950",
              )}
            >
              <t.Icon className="size-4" />
              {t.label}
            </button>
          ))}
        </div>
        {modeInternal && !dirty && revision > 0 ? (
          <a
            href={`/kegiatan/${eventSlug}/daftar`}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-navy-700 hover:bg-navy-50 hover:text-navy-950"
          >
            Buka formulir publik
            <IconExternal className="size-4" />
          </a>
        ) : null}
      </div>

      {responseCount > 0 ? (
        <p className="text-sm text-navy-600">
          Sudah ada <strong className="text-navy-950">{responseCount} respons</strong>. Jenis pertanyaan yang sudah ada
          dikunci; perubahan teks dan opsi baru tetap boleh. Respons lama tetap terbaca walau opsi dihapus.
        </p>
      ) : null}

      {tab === "pertanyaan" ? (
        <div className="space-y-6">
          <div className="rounded-card border border-navy-200/80 bg-white p-4 sm:p-5">
            <label htmlFor="intro-formulir" className="block text-sm font-semibold text-navy-950">
              Teks pembuka
            </label>
            <textarea
              id="intro-formulir"
              rows={2}
              maxLength={2000}
              value={definition.intro ?? ""}
              placeholder="Mis. ketentuan peserta, informasi biaya, atau kontak panitia (opsional)"
              onChange={(e) => dispatch({ type: "setIntro", intro: e.target.value })}
              className={cn(kelasInputBuilder, "mt-2 resize-y text-sm")}
            />
          </div>

          {masalahUmum.length > 0 ? (
            <p role="alert" className="text-sm font-medium text-danger-700">
              {masalahUmum.join(" ")}
            </p>
          ) : null}

          {definition.sections.map((section, si) => {
            const banyak = definition.sections.length > 1;
            return (
              <section key={section.id} aria-label={`Bagian ${si + 1}`} className="space-y-3">
                {banyak ? (
                  <div className="rounded-card border border-navy-950/80 bg-navy-950 p-4 text-white sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-gold-300">
                        Bagian {si + 1} dari {definition.sections.length}
                      </p>
                      <div className="flex items-center gap-0.5">
                        <button type="button" disabled={si === 0} onClick={() => dispatch({ type: "moveSection", section: si, dir: -1 })} className={cn(kelasTombolIkon, "text-white/70 hover:bg-white/10 hover:text-white")}>
                          <IconChevronUp className="size-4" />
                          <span className="sr-only">Pindah bagian ke atas</span>
                        </button>
                        <button type="button" disabled={si === definition.sections.length - 1} onClick={() => dispatch({ type: "moveSection", section: si, dir: 1 })} className={cn(kelasTombolIkon, "text-white/70 hover:bg-white/10 hover:text-white")}>
                          <IconChevronDown className="size-4" />
                          <span className="sr-only">Pindah bagian ke bawah</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (section.items.length === 0 || window.confirm("Hapus bagian ini? Pertanyaannya dipindahkan ke bagian di sebelahnya.")) {
                              dispatch({ type: "removeSection", section: si });
                            }
                          }}
                          className={cn(kelasTombolIkon, "text-white/70 hover:bg-white/10 hover:text-white")}
                        >
                          <IconTrash className="size-4" />
                          <span className="sr-only">Hapus bagian</span>
                        </button>
                      </div>
                    </div>
                    <input
                      value={section.title}
                      maxLength={500}
                      aria-label={`Judul bagian ${si + 1}`}
                      placeholder="Judul bagian (opsional)"
                      onChange={(e) => dispatch({ type: "updateSection", section: si, patch: { title: e.target.value } })}
                      className="mt-2 block w-full min-h-11 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-md font-medium text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none focus:ring-4 focus:ring-white/10"
                    />
                    <textarea
                      value={section.description ?? ""}
                      maxLength={2000}
                      rows={1}
                      aria-label={`Deskripsi bagian ${si + 1}`}
                      placeholder="Deskripsi bagian (opsional)"
                      onChange={(e) => dispatch({ type: "updateSection", section: si, patch: { description: e.target.value || undefined } })}
                      className="mt-2 block w-full min-h-11 resize-y rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none focus:ring-4 focus:ring-white/10"
                    />
                    {tidakTerjangkau.includes(section.id) ? (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-gold-200">
                        <IconAlert className="mt-px size-3.5 shrink-0" />
                        Bagian ini tidak pernah dicapai dengan aturan lompat saat ini.
                      </p>
                    ) : null}
                    {masalahBagian(si).length > 0 ? (
                      <p role="alert" className="mt-2 text-xs font-medium text-danger-50">
                        {masalahBagian(si).join(" ")}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {section.items.length === 0 ? (
                  <p className="rounded-card border border-dashed border-navy-300 bg-white px-5 py-6 text-center text-sm text-navy-500">
                    Bagian ini belum berisi pertanyaan.
                  </p>
                ) : null}

                {section.items.map((item, ii) => {
                  const pertamaGlobal = si === 0 && ii === 0;
                  const terakhirGlobal = si === definition.sections.length - 1 && ii === section.items.length - 1;
                  return (
                    <EditorItem
                      key={item.id}
                      item={item}
                      nomor={nomorPertanyaan.get(item.id) ?? 0}
                      sections={definition.sections}
                      sectionIndex={si}
                      typeLocked={terkunci.has(item.id)}
                      issues={masalahItem(si, ii)}
                      onChange={(baru) => dispatch({ type: "updateItem", at: { section: si, item: ii }, item: baru })}
                      onChangeKind={(kind) => dispatch({ type: "changeKind", at: { section: si, item: ii }, kind })}
                      onMove={(dir) => dispatch({ type: "moveItem", at: { section: si, item: ii }, dir })}
                      onDuplicate={() => dispatch({ type: "duplicateItem", at: { section: si, item: ii } })}
                      onRemove={() => dispatch({ type: "removeItem", at: { section: si, item: ii } })}
                      canMoveUp={!pertamaGlobal}
                      canMoveDown={!terakhirGlobal}
                    />
                  );
                })}

                <TambahItem onAdd={(kind) => dispatch({ type: "addItem", section: si, kind })} />

                {banyak ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-card bg-white px-4 py-3 ring-1 ring-inset ring-navy-200/80">
                    <span className="text-sm text-navy-600">Setelah bagian {si + 1}:</span>
                    <div className="relative min-w-56">
                      <select
                        aria-label={`Tujuan setelah bagian ${si + 1}`}
                        value={section.next ?? ""}
                        onChange={(e) => dispatch({ type: "updateSection", section: si, patch: { next: e.target.value || undefined } })}
                        className={cn(kelasInputBuilder, "min-h-10 cursor-pointer appearance-none py-2 pr-9 text-sm")}
                      >
                        <option value="">Lanjut ke bagian berikutnya</option>
                        {definition.sections.map((s, i) =>
                          i > si + 1 ? (
                            <option key={s.id} value={s.id}>
                              Ke bagian {i + 1}
                              {s.title ? `: ${s.title}` : ""}
                            </option>
                          ) : null,
                        )}
                        <option value="submit">Kirim formulir</option>
                      </select>
                      <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-navy-500" />
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => dispatch({ type: "addSection", after: si })}
                  disabled={definition.sections.length >= 30}
                  className="pressable inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-navy-700 hover:bg-navy-100 hover:text-navy-950"
                >
                  <IconPlus className="size-4" />
                  Tambah bagian setelah ini
                </button>
              </section>
            );
          })}
        </div>
      ) : null}

      {tab === "pengaturan" ? (
        <PanelPengaturan
          settings={settings}
          emailConfigured={emailConfigured}
          responseCount={responseCount}
          masalah={masalah.filter((m) => m.path[0] === "settings").map((m) => m.message)}
          onChange={(patch) => dispatch({ type: "setSettings", patch })}
        />
      ) : null}

      {tab === "pratinjau" ? (
        <div className="mx-auto max-w-2xl">
          <p className="mb-4 rounded-2xl bg-info-50 px-4 py-3 text-sm text-info-700 ring-1 ring-inset ring-info-600/15">
            Pratinjau: coba isi untuk memeriksa urutan bagian dan validasi. Jawaban tidak dikirim.
          </p>
          {validasi.ok ? (
            <FormulirPublik
              key={JSON.stringify(definition).length}
              definition={definition}
              token=""
              collectEmail={settings.collectEmail}
              consentText={settings.consentText}
              preview
            />
          ) : (
            <p className="text-sm font-medium text-danger-700">Perbaiki pertanyaan yang ditandai sebelum melihat pratinjau.</p>
          )}
        </div>
      ) : null}

      {/* Bilah simpan menempel di bawah layar. */}
      <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 space-y-2.5 sm:bottom-5">
        {hasil ? (
          <div
            role={hasil.ok ? "status" : "alert"}
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-[opacity,translate] duration-200 ease-out starting:-translate-y-1 starting:opacity-0",
              hasil.ok ? "border-sage-300 bg-sage-100 text-sage-700" : "border-danger-600/20 bg-danger-50 text-danger-700",
            )}
          >
            {hasil.ok ? <IconCheck className="mt-px size-4 shrink-0" /> : <IconAlert className="mt-px size-4 shrink-0" />}
            <span className="min-w-0">
              {hasil.message}
              {hasil.conflict ? (
                <button type="button" onClick={() => window.location.reload()} className="ml-2 underline underline-offset-4">
                  Muat ulang
                </button>
              ) : null}
            </span>
          </div>
        ) : null}
        <div className="flex flex-col gap-3 rounded-bar border border-navy-200/60 bg-white p-2.5 shadow-float sm:flex-row sm:items-center sm:justify-between sm:pl-6">
          <p className="hidden text-sm text-navy-500 sm:block">
            {dirty ? "Ada perubahan yang belum disimpan." : revision > 0 ? "Semua perubahan tersimpan." : "Formulir belum pernah disimpan."}
          </p>
          <Button type="button" onClick={simpan} disabled={pending || (!dirty && revision > 0)} aria-busy={pending} className="px-6">
            <IconCheck className="size-4" />
            {pending ? "Menyimpan…" : "Simpan formulir"}
          </Button>
        </div>
      </div>
    </div>
  );
}

const TIPE_TAMBAH: Array<QuestionKind | "text"> = [
  "short_text",
  "paragraph",
  "multiple_choice",
  "checkboxes",
  "dropdown",
  "linear_scale",
  "mc_grid",
  "checkbox_grid",
  "date",
  "time",
  "file_upload",
  "text",
];

function TambahItem({ onAdd }: { onAdd: (kind: QuestionKind | "text") => void }) {
  const [buka, setBuka] = useState(false);
  return (
    <div>
      <button
        type="button"
        aria-expanded={buka}
        onClick={() => setBuka((b) => !b)}
        className="pressable inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-navy-950 ring-1 ring-inset ring-navy-200 hover:bg-navy-50"
      >
        <IconPlus className="size-4" />
        Tambah pertanyaan
      </button>
      {buka ? (
        <div className="mt-2 grid gap-1.5 rounded-card border border-navy-200/80 bg-white p-2 transition-[opacity,translate] duration-150 ease-out starting:-translate-y-1 starting:opacity-0 sm:grid-cols-3">
          {TIPE_TAMBAH.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                onAdd(k);
                setBuka(false);
              }}
              className="pressable flex min-h-11 items-center gap-2 rounded-xl px-3 text-left text-sm text-navy-800 hover:bg-navy-50 hover:text-navy-950"
            >
              {k === "text" ? <IconEdit className="size-4 text-navy-500" /> : null}
              {k === "text" ? "Judul & deskripsi" : QUESTION_KIND_LABEL[k]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Saklar({
  label,
  keterangan,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  keterangan: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <label className={cn("flex items-start justify-between gap-4 py-4", disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
      <span>
        <span className="block text-md font-semibold text-navy-950">{label}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-navy-600">{keterangan}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-1 size-5 shrink-0 cursor-pointer accent-navy-950"
      />
    </label>
  );
}

function PanelPengaturan({
  settings: s,
  emailConfigured,
  responseCount,
  masalah,
  onChange,
}: {
  settings: FormSettings;
  emailConfigured: boolean;
  responseCount: number;
  masalah: string[];
  onChange: (patch: Partial<FormSettings>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="divide-y divide-navy-100 rounded-card border border-navy-200/80 bg-white px-5 sm:px-6">
        <Saklar
          label="Kumpulkan alamat email"
          keterangan="Peserta wajib mengisi email. Dibutuhkan untuk salinan jawaban & batas satu respons per email."
          checked={s.collectEmail}
          onToggle={(v) => onChange(v ? { collectEmail: true } : { collectEmail: false, limitOnePerEmail: false, sendConfirmation: false })}
        />
        <Saklar
          label="Batasi satu respons per email"
          keterangan="Mencegah pendaftaran ganda tanpa sengaja. Karena tanpa login, ini bukan verifikasi identitas."
          checked={s.limitOnePerEmail}
          disabled={!s.collectEmail}
          onToggle={(v) => onChange({ limitOnePerEmail: v })}
        />
        <Saklar
          label="Izinkan ubah jawaban setelah dikirim"
          keterangan="Peserta mendapat tautan rahasia untuk mengubah jawaban selama pendaftaran masih dibuka."
          checked={s.allowEdit}
          onToggle={(v) => onChange({ allowEdit: v })}
        />
        <Saklar
          label="Kirim salinan jawaban ke email peserta"
          keterangan={
            emailConfigured
              ? "Email konfirmasi berisi jawaban dan tautan ubah (bila diizinkan)."
              : "Belum tersedia: pengiriman email belum dikonfigurasi di server (lihat README, bagian Email)."
          }
          checked={s.sendConfirmation && emailConfigured}
          disabled={!s.collectEmail || !emailConfigured}
          onToggle={(v) => onChange({ sendConfirmation: v })}
        />
      </div>

      <div className="grid gap-5 rounded-card border border-navy-200/80 bg-white p-5 sm:p-6">
        <div>
          <label htmlFor="kuota-formulir" className="block text-md font-semibold text-navy-950">
            Kuota peserta
          </label>
          <p className="mt-0.5 text-sm text-navy-600">
            Kosongkan bila tanpa batas. Saat kuota tercapai, tombol Daftar berubah menjadi “Kuota Penuh”.
            {responseCount > 0 ? ` Saat ini ${responseCount} respons.` : ""}
          </p>
          <input
            id="kuota-formulir"
            type="number"
            inputMode="numeric"
            min={1}
            max={100000}
            value={s.quota ?? ""}
            onChange={(e) => {
              const n = e.target.value === "" ? null : Math.floor(Number(e.target.value));
              onChange({ quota: n !== null && Number.isFinite(n) && n > 0 ? n : null });
            }}
            className={cn(kelasInputBuilder, "mt-2 max-w-48")}
          />
          <p className="mt-2 text-xs text-navy-500">
            Waktu buka & tutup pendaftaran diatur di tab Detail (bagian Pendaftaran).
          </p>
        </div>

        <div>
          <label htmlFor="pesan-konfirmasi" className="block text-md font-semibold text-navy-950">
            Pesan setelah mengirim
          </label>
          <textarea
            id="pesan-konfirmasi"
            rows={3}
            maxLength={2000}
            value={s.confirmationMessage ?? ""}
            placeholder="Jawaban Anda sudah kami terima. Terima kasih!"
            onChange={(e) => onChange({ confirmationMessage: e.target.value || null })}
            className={cn(kelasInputBuilder, "mt-2 resize-y text-sm")}
          />
        </div>

        <div>
          <label htmlFor="teks-persetujuan" className="block text-md font-semibold text-navy-950">
            Persetujuan penggunaan data
          </label>
          <p className="mt-0.5 text-sm text-navy-600">
            Kotak centang wajib di akhir formulir. Disarankan tetap diisi karena peserta umumnya siswa di bawah umur.
          </p>
          <textarea
            id="teks-persetujuan"
            rows={3}
            maxLength={1000}
            value={s.consentText ?? ""}
            onChange={(e) => onChange({ consentText: e.target.value || null })}
            className={cn(kelasInputBuilder, "mt-2 resize-y text-sm")}
          />
        </div>
      </div>

      {masalah.length > 0 ? (
        <p role="alert" className="text-sm font-medium text-danger-700">
          {masalah.join(" ")}
        </p>
      ) : null}
    </div>
  );
}
