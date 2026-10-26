"use client";

import { useId } from "react";

import { IconAlert, IconChevronDown, IconClose, IconFile } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import { FILE_KIND_LABEL, acceptAttribute, formatUkuran } from "@/lib/forms/files";
import type {
  AnswerValue,
  CheckboxesAnswer,
  ChoiceAnswer,
  FormItem,
  Question,
} from "@/lib/forms/types";

/**
 * Satu pertanyaan formulir internal — dipakai halaman publik dan pratinjau
 * builder admin. Komponen terkontrol: nilai & berkas dipegang induknya.
 *
 * Aksesibilitas: setiap grup pilihan memakai <fieldset>/<legend>; galat
 * dihubungkan lewat aria-describedby dan diumumkan (role="alert").
 */

export type BerkasLama = { id: string; name: string; size: number };

const kontrol =
  "block w-full min-h-12 rounded-2xl border bg-white px-4 py-3 text-md text-navy-950 placeholder:text-navy-400 " +
  "transition-[border-color,box-shadow] duration-150 ease-out focus:outline-none focus:ring-4 " +
  "focus:border-navy-950 focus:ring-gold-200 disabled:cursor-not-allowed disabled:bg-navy-50";

function kelasKontrol(error?: string) {
  return cn(kontrol, error ? "border-danger-500 bg-danger-50" : "border-navy-200 hover:border-navy-300");
}

function asRecord(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export function BlokTeks({ item }: { item: Extract<FormItem, { kind: "text" }> }) {
  return (
    <div className="border-l-2 border-gold-400 pl-4">
      <h3 className="text-lg font-semibold tracking-heading text-navy-950 [overflow-wrap:anywhere]">{item.title}</h3>
      {item.description ? (
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-navy-600">{item.description}</p>
      ) : null}
    </div>
  );
}

export function InputPertanyaan({
  question: q,
  value,
  onChange,
  error,
  files = [],
  onFilesChange,
  keptFiles = [],
  onKeptFilesChange,
  disabled = false,
}: {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue | undefined) => void;
  error?: string;
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  /** Berkas tersimpan (halaman ubah jawaban) yang masih dipertahankan. */
  keptFiles?: BerkasLama[];
  onKeptFilesChange?: (files: BerkasLama[]) => void;
  disabled?: boolean;
}) {
  const uid = useId();
  const id = `q-${q.id}-${uid}`;
  const idDesk = `${id}-desk`;
  const idErr = `${id}-err`;
  const describedBy = [q.description ? idDesk : null, error ? idErr : null].filter(Boolean).join(" ") || undefined;

  const judul = (
    <>
      <span className="[overflow-wrap:anywhere]">{q.title}</span>
      {q.required ? (
        <>
          <span aria-hidden="true" className="ml-1 text-danger-600">
            *
          </span>
          <span className="sr-only"> (wajib)</span>
        </>
      ) : null}
    </>
  );
  const kelasJudul = "block text-md font-semibold leading-snug text-navy-950";
  const deskripsi = q.description ? (
    <p id={idDesk} className="mt-1 whitespace-pre-line text-sm leading-relaxed text-navy-600">
      {q.description}
    </p>
  ) : null;
  const pesan = error ? (
    <p id={idErr} role="alert" className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger-700">
      <IconAlert className="mt-px size-4 shrink-0" />
      <span>{error}</span>
    </p>
  ) : null;

  // Pertanyaan berbasis grup (radio/checkbox/kisi/skala/berkas) memakai fieldset.
  const grup = (isi: React.ReactNode, extra?: string) => (
    <fieldset aria-describedby={describedBy} className={extra}>
      <legend className={kelasJudul}>{judul}</legend>
      {deskripsi}
      <div className="mt-3">{isi}</div>
      {pesan}
    </fieldset>
  );

  switch (q.kind) {
    case "short_text": {
      const v = q.validation;
      const tipe = v?.type === "email" ? "email" : v?.type === "phone" ? "tel" : "text";
      return (
        <div>
          <label htmlFor={id} className={kelasJudul}>
            {judul}
          </label>
          {deskripsi}
          <input
            id={id}
            type={tipe}
            inputMode={v?.type === "number" ? "decimal" : v?.type === "phone" ? "tel" : undefined}
            autoComplete={v?.type === "email" ? "email" : v?.type === "phone" ? "tel" : "off"}
            maxLength={v?.type === "length" && v.max ? v.max : 500}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-required={q.required || undefined}
            disabled={disabled}
            className={cn(kelasKontrol(error), "mt-3")}
          />
          {pesan}
        </div>
      );
    }

    case "paragraph":
      return (
        <div>
          <label htmlFor={id} className={kelasJudul}>
            {judul}
          </label>
          {deskripsi}
          <textarea
            id={id}
            rows={4}
            maxLength={q.maxLength ?? 5000}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-required={q.required || undefined}
            disabled={disabled}
            className={cn(kelasKontrol(error), "mt-3 min-h-28 resize-y leading-relaxed")}
          />
          {pesan}
        </div>
      );

    case "multiple_choice": {
      const v = asRecord(value) as Partial<ChoiceAnswer> & Record<string, unknown>;
      const pilih = typeof v.c === "string" ? v.c : "other" in v ? "__other" : null;
      const nama = `${id}-opsi`;
      return grup(
        <div className="grid gap-2">
          {q.options.map((o) => (
            <PilihanBaris key={o.id} type="radio" name={nama} label={o.label} checked={pilih === o.id} disabled={disabled}
              onChange={() => onChange({ c: o.id })} />
          ))}
          {q.other ? (
            <PilihanLainnya
              type="radio"
              name={nama}
              checked={pilih === "__other"}
              text={typeof v.other === "string" ? v.other : ""}
              disabled={disabled}
              onCheck={() => onChange({ other: typeof v.other === "string" ? v.other : "" })}
              onText={(t) => onChange({ other: t })}
            />
          ) : null}
          {!q.required && pilih ? (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              disabled={disabled}
              className="pressable justify-self-start rounded-full px-3 py-1.5 text-sm text-navy-600 underline-offset-4 hover:text-navy-950 hover:underline"
            >
              Hapus pilihan
            </button>
          ) : null}
        </div>,
      );
    }

    case "checkboxes": {
      const v = asRecord(value) as Partial<CheckboxesAnswer>;
      const dipilih = new Set(Array.isArray(v.c) ? v.c : []);
      const lainAktif = typeof v.other === "string";
      const ubah = (ids: Set<string>, other: string | undefined) =>
        onChange(ids.size === 0 && other === undefined ? undefined : other !== undefined ? { c: [...ids], other } : { c: [...ids] });
      return grup(
        <div className="grid gap-2">
          {q.options.map((o) => (
            <PilihanBaris
              key={o.id}
              type="checkbox"
              label={o.label}
              checked={dipilih.has(o.id)}
              disabled={disabled}
              onChange={(cek) => {
                const s = new Set(dipilih);
                if (cek) s.add(o.id);
                else s.delete(o.id);
                ubah(s, v.other);
              }}
            />
          ))}
          {q.other ? (
            <PilihanLainnya
              type="checkbox"
              checked={lainAktif}
              text={v.other ?? ""}
              disabled={disabled}
              onCheck={(cek) => ubah(dipilih, cek ? (v.other ?? "") : undefined)}
              onText={(t) => ubah(dipilih, t)}
            />
          ) : null}
        </div>,
      );
    }

    case "dropdown": {
      const v = asRecord(value);
      return (
        <div>
          <label htmlFor={id} className={kelasJudul}>
            {judul}
          </label>
          {deskripsi}
          <div className="relative mt-3">
            <select
              id={id}
              value={typeof v.c === "string" ? v.c : ""}
              onChange={(e) => onChange(e.target.value ? { c: e.target.value } : undefined)}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              aria-required={q.required || undefined}
              disabled={disabled}
              className={cn(kelasKontrol(error), "cursor-pointer appearance-none pr-11")}
            >
              <option value="">Pilih…</option>
              {q.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy-500" />
          </div>
          {pesan}
        </div>
      );
    }

    case "linear_scale": {
      const angka: number[] = [];
      for (let n = q.min; n <= q.max; n += 1) angka.push(n);
      const nama = `${id}-skala`;
      return grup(
        <div>
          <div className="flex flex-wrap gap-2">
            {angka.map((n) => (
              <label key={n} className="relative">
                <input
                  type="radio"
                  name={nama}
                  value={n}
                  checked={value === n}
                  onChange={() => onChange(n)}
                  disabled={disabled}
                  className="peer sr-only"
                />
                <span className="pressable grid size-11 cursor-pointer place-items-center rounded-full border border-navy-200 bg-white text-sm font-medium tabular-nums text-navy-800 hover:border-navy-300 peer-checked:border-navy-950 peer-checked:bg-navy-950 peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-gold-200">
                  {n}
                </span>
              </label>
            ))}
          </div>
          {q.minLabel || q.maxLabel ? (
            <div className="mt-2 flex justify-between gap-4 text-xs text-navy-600">
              <span>
                {q.min} = {q.minLabel ?? "-"}
              </span>
              <span className="text-right">
                {q.max} = {q.maxLabel ?? "-"}
              </span>
            </div>
          ) : null}
        </div>,
      );
    }

    case "mc_grid":
    case "checkbox_grid": {
      const v = asRecord(value);
      const banyak = q.kind === "checkbox_grid";
      const setBaris = (rowId: string, isi: string | string[] | undefined) => {
        const baru: Record<string, unknown> = { ...v };
        if (isi === undefined || (Array.isArray(isi) && isi.length === 0)) delete baru[rowId];
        else baru[rowId] = isi;
        onChange(Object.keys(baru).length ? (baru as AnswerValue) : undefined);
      };
      return grup(
        <div className="overflow-x-auto rounded-2xl border border-navy-200/80">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr className="bg-navy-50">
                <th scope="col" className="sticky left-0 bg-navy-50 px-3 py-2.5 text-left font-medium text-navy-600">
                  <span className="sr-only">Baris</span>
                </th>
                {q.columns.map((c) => (
                  <th key={c.id} scope="col" className="px-3 py-2.5 text-center font-medium text-navy-800">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.rows.map((r) => {
                const isi = v[r.id];
                return (
                  <tr key={r.id} className="border-t border-navy-100">
                    <th scope="row" className="sticky left-0 bg-white px-3 py-2 text-left font-medium text-navy-950">
                      {r.label}
                    </th>
                    {q.columns.map((c) => {
                      const cek = banyak ? Array.isArray(isi) && isi.includes(c.id) : isi === c.id;
                      return (
                        <td key={c.id} className="px-3 py-1 text-center">
                          <label className="inline-grid size-11 cursor-pointer place-items-center">
                            <input
                              type={banyak ? "checkbox" : "radio"}
                              name={`${id}-${r.id}`}
                              checked={cek}
                              disabled={disabled}
                              aria-label={`${r.label}: ${c.label}`}
                              onChange={(e) => {
                                if (!banyak) return setBaris(r.id, c.id);
                                const lama = Array.isArray(isi) ? (isi as string[]) : [];
                                setBaris(r.id, e.target.checked ? [...lama, c.id] : lama.filter((x) => x !== c.id));
                              }}
                              className="size-5 cursor-pointer accent-navy-950"
                            />
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>,
      );
    }

    case "date":
    case "time":
      return (
        <div>
          <label htmlFor={id} className={kelasJudul}>
            {judul}
          </label>
          {deskripsi}
          <input
            id={id}
            type={q.kind}
            min={q.kind === "date" ? q.min : undefined}
            max={q.kind === "date" ? q.max : undefined}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-required={q.required || undefined}
            disabled={disabled}
            className={cn(kelasKontrol(error), "mt-3 sm:max-w-xs")}
          />
          {pesan}
        </div>
      );

    case "file_upload": {
      const total = files.length + keptFiles.length;
      const penuh = total >= q.maxFiles;
      return grup(
        <div className="space-y-2.5">
          {[...keptFiles.map((f) => ({ key: f.id, name: f.name, size: f.size, lama: f })), ...files.map((f, i) => ({ key: `baru-${i}`, name: f.name, size: f.size, baru: i }))].map(
            (f) => (
              <div key={f.key} className="flex items-center gap-3 rounded-2xl border border-navy-200/80 bg-white px-4 py-2.5">
                <IconFile className="size-5 shrink-0 text-navy-500" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-navy-950">{f.name}</span>
                  <span className="block text-xs text-navy-500">{formatUkuran(f.size)}</span>
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    "lama" in f && f.lama
                      ? onKeptFilesChange?.(keptFiles.filter((k) => k.id !== f.lama!.id))
                      : onFilesChange?.(files.filter((_, i) => i !== (f as { baru: number }).baru))
                  }
                  className="pressable grid size-10 shrink-0 place-items-center rounded-full text-navy-600 hover:bg-navy-50 hover:text-navy-950"
                >
                  <IconClose className="size-4" />
                  <span className="sr-only">Hapus berkas {f.name}</span>
                </button>
              </div>
            ),
          )}
          {!penuh ? (
            <label className="pressable flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-navy-300 bg-white px-4 py-3 text-sm font-medium text-navy-800 hover:border-navy-400 hover:bg-navy-50 has-focus-visible:ring-4 has-focus-visible:ring-gold-200">
              <input
                type="file"
                accept={acceptAttribute(q.accept)}
                multiple={q.maxFiles - total > 1}
                disabled={disabled}
                aria-describedby={describedBy}
                className="sr-only"
                onChange={(e) => {
                  const dipilih = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  onFilesChange?.([...files, ...dipilih].slice(0, q.maxFiles - keptFiles.length));
                }}
              />
              Pilih berkas
            </label>
          ) : null}
          <p className="text-xs leading-relaxed text-navy-500">
            {q.accept.map((k) => FILE_KIND_LABEL[k]).join(", ")} · maks. {q.maxFiles} berkas · {q.maxSizeMb} MB per berkas
          </p>
        </div>,
      );
    }
  }
}

function PilihanBaris({
  type,
  name,
  label,
  checked,
  onChange,
  disabled,
}: {
  type: "radio" | "checkbox";
  name?: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-navy-200 bg-white px-4 py-2.5 transition-[border-color,background-color] duration-150 ease-out hover:border-navy-300 has-checked:border-navy-950 has-checked:bg-gold-50 has-focus-visible:ring-4 has-focus-visible:ring-gold-200">
      <input
        type={type}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 shrink-0 cursor-pointer accent-navy-950"
      />
      <span className="text-md text-navy-950 [overflow-wrap:anywhere]">{label}</span>
    </label>
  );
}

function PilihanLainnya({
  type,
  name,
  checked,
  text,
  onCheck,
  onText,
  disabled,
}: {
  type: "radio" | "checkbox";
  name?: string;
  checked: boolean;
  text: string;
  onCheck: (checked: boolean) => void;
  onText: (text: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-navy-200 bg-white px-4 py-2 transition-[border-color,background-color] duration-150 ease-out has-checked:border-navy-950 has-checked:bg-gold-50 has-focus-visible:ring-4 has-focus-visible:ring-gold-200">
      <label className="flex shrink-0 cursor-pointer items-center gap-3">
        <input
          type={type}
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheck(e.target.checked)}
          className="size-4 shrink-0 cursor-pointer accent-navy-950"
        />
        <span className="text-md text-navy-950">Lainnya:</span>
      </label>
      <input
        type="text"
        value={text}
        maxLength={500}
        disabled={disabled}
        aria-label="Isian lainnya"
        onFocus={() => {
          if (!checked) onCheck(true);
        }}
        onChange={(e) => onText(e.target.value)}
        className="min-w-0 flex-1 border-b border-navy-200 bg-transparent py-1.5 text-md text-navy-950 focus:border-navy-950 focus:outline-none"
      />
    </div>
  );
}
