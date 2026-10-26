"use client";

import { useId } from "react";

import { IconChevronDown, IconChevronUp, IconClose, IconCopy, IconPlus, IconTrash } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";
import { QUESTION_KIND_LABEL } from "@/lib/forms/display";
import { FILE_KIND_LABEL } from "@/lib/forms/files";
import { newFormId } from "@/lib/forms/ids";
import {
  FILE_KINDS,
  type FormItem,
  type FormOption,
  type FormSection,
  type FormTarget,
  type GridLine,
  type Question,
  type QuestionKind,
  type ShortTextValidation,
} from "@/lib/forms/types";

/**
 * Kartu editor satu item builder (pertanyaan atau blok teks).
 * Semua perubahan dikirim utuh lewat `onChange(item)`; reducer yang menyimpan.
 */

export const kelasInputBuilder =
  "block w-full min-h-11 rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-md text-navy-950 " +
  "placeholder:text-navy-400 transition-[border-color,box-shadow] duration-150 ease-out hover:border-navy-300 " +
  "focus:border-navy-950 focus:outline-none focus:ring-4 focus:ring-gold-200 disabled:bg-navy-50 disabled:text-navy-500";

export const kelasTombolIkon =
  "pressable grid size-10 shrink-0 place-items-center rounded-full text-navy-600 hover:bg-navy-100 hover:text-navy-950 disabled:cursor-not-allowed disabled:opacity-40";

const URUTAN_TIPE: QuestionKind[] = [
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
];

export function EditorItem({
  item,
  nomor,
  sections,
  sectionIndex,
  typeLocked,
  issues,
  onChange,
  onChangeKind,
  onMove,
  onDuplicate,
  onRemove,
  canMoveUp,
  canMoveDown,
}: {
  item: FormItem;
  nomor: number;
  sections: FormSection[];
  sectionIndex: number;
  typeLocked: boolean;
  issues: string[];
  onChange: (item: FormItem) => void;
  onChangeKind: (kind: QuestionKind) => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const uid = useId();
  const label = item.kind === "text" ? "Judul & deskripsi" : `Pertanyaan ${nomor}`;

  return (
    <div
      className={cn(
        "rounded-card border bg-white p-4 sm:p-5",
        issues.length > 0 ? "border-danger-500/60" : "border-navy-200/80",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-navy-500">{label}</p>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => onMove(-1)} disabled={!canMoveUp} className={kelasTombolIkon}>
            <IconChevronUp className="size-4" />
            <span className="sr-only">Pindah ke atas</span>
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={!canMoveDown} className={kelasTombolIkon}>
            <IconChevronDown className="size-4" />
            <span className="sr-only">Pindah ke bawah</span>
          </button>
          <button type="button" onClick={onDuplicate} className={kelasTombolIkon}>
            <IconCopy className="size-4" />
            <span className="sr-only">Duplikat</span>
          </button>
          <button type="button" onClick={onRemove} className={cn(kelasTombolIkon, "hover:bg-danger-50 hover:text-danger-700")}>
            <IconTrash className="size-4" />
            <span className="sr-only">Hapus</span>
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_14rem]">
        <div>
          <label htmlFor={`${uid}-judul`} className="sr-only">
            {item.kind === "text" ? "Judul" : "Teks pertanyaan"}
          </label>
          <input
            id={`${uid}-judul`}
            value={item.title}
            maxLength={500}
            placeholder={item.kind === "text" ? "Judul" : "Tulis pertanyaan"}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
            className={cn(kelasInputBuilder, "font-medium")}
          />
        </div>
        {item.kind !== "text" ? (
          <div>
            <label htmlFor={`${uid}-tipe`} className="sr-only">
              Jenis pertanyaan
            </label>
            <div className="relative">
              <select
                id={`${uid}-tipe`}
                value={item.kind}
                disabled={typeLocked}
                title={typeLocked ? "Jenis tidak bisa diubah karena sudah ada respons." : undefined}
                onChange={(e) => onChangeKind(e.target.value as QuestionKind)}
                className={cn(kelasInputBuilder, "cursor-pointer appearance-none pr-10")}
              >
                {URUTAN_TIPE.map((k) => (
                  <option key={k} value={k}>
                    {QUESTION_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
              <IconChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-500" />
            </div>
          </div>
        ) : null}
      </div>

      <label htmlFor={`${uid}-desk`} className="sr-only">
        Deskripsi
      </label>
      <textarea
        id={`${uid}-desk`}
        value={item.description ?? ""}
        maxLength={2000}
        rows={item.description ? 2 : 1}
        placeholder="Deskripsi (opsional)"
        onChange={(e) => onChange({ ...item, description: e.target.value || undefined })}
        className={cn(kelasInputBuilder, "mt-3 min-h-11 resize-y text-sm")}
      />

      {item.kind !== "text" ? (
        <div className="mt-4">
          <KonfigurasiPertanyaan q={item} sections={sections} sectionIndex={sectionIndex} onChange={onChange} />
        </div>
      ) : null}

      {issues.length > 0 ? (
        <ul role="alert" className="mt-3 space-y-1 text-sm font-medium text-danger-700">
          {issues.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      ) : null}

      {item.kind !== "text" ? (
        <div className="mt-4 flex items-center justify-end border-t border-navy-100 pt-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-navy-800">
            Wajib diisi
            <input
              type="checkbox"
              checked={item.required}
              onChange={(e) => onChange({ ...item, required: e.target.checked })}
              className="size-5 cursor-pointer accent-navy-950"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

/** Pilihan tujuan lompat: hanya bagian SESUDAH bagian ini, atau kirim. */
function PilihTujuan({
  value,
  sections,
  sectionIndex,
  onChange,
  label,
}: {
  value: FormTarget | undefined;
  sections: FormSection[];
  sectionIndex: number;
  onChange: (t: FormTarget | undefined) => void;
  label: string;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
        className={cn(kelasInputBuilder, "min-h-10 cursor-pointer appearance-none py-2 pr-9 text-sm")}
      >
        <option value="">Lanjut ke bagian berikutnya</option>
        {sections.map((s, i) =>
          i > sectionIndex ? (
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
  );
}

function KonfigurasiPertanyaan({
  q,
  sections,
  sectionIndex,
  onChange,
}: {
  q: Question;
  sections: FormSection[];
  sectionIndex: number;
  onChange: (q: Question) => void;
}) {
  const uid = useId();
  const adaBagianLain = sections.length > 1;

  switch (q.kind) {
    case "short_text": {
      const v = q.validation;
      const ubahValidasi = (validation: ShortTextValidation | undefined) => onChange({ ...q, validation });
      return (
        <div className="grid gap-3 sm:grid-cols-[14rem_1fr]">
          <div className="relative">
            <label htmlFor={`${uid}-val`} className="mb-1 block text-xs font-medium text-navy-600">
              Validasi
            </label>
            <select
              id={`${uid}-val`}
              value={v?.type ?? ""}
              onChange={(e) => {
                const t = e.target.value;
                ubahValidasi(
                  t === "" ? undefined : t === "email" ? { type: "email" } : t === "phone" ? { type: "phone" } : t === "number" ? { type: "number" } : { type: "length" },
                );
              }}
              className={cn(kelasInputBuilder, "cursor-pointer appearance-none pr-10 text-sm")}
            >
              <option value="">Tanpa validasi</option>
              <option value="email">Alamat email</option>
              <option value="phone">Nomor telepon</option>
              <option value="number">Angka</option>
              <option value="length">Panjang teks</option>
            </select>
          </div>
          {v?.type === "number" || v?.type === "length" ? (
            <div className="grid grid-cols-2 gap-3">
              <AngkaOpsional label="Minimal" value={v.min} onChange={(min) => ubahValidasi({ ...v, min })} />
              <AngkaOpsional label="Maksimal" value={v.max} onChange={(max) => ubahValidasi({ ...v, max })} />
              {v.type === "number" ? (
                <label className="col-span-2 flex items-center gap-2 text-sm text-navy-800">
                  <input
                    type="checkbox"
                    checked={Boolean(v.integer)}
                    onChange={(e) => ubahValidasi({ ...v, integer: e.target.checked || undefined })}
                    className="size-4 accent-navy-950"
                  />
                  Hanya bilangan bulat
                </label>
              ) : null}
            </div>
          ) : null}
        </div>
      );
    }

    case "paragraph":
      return (
        <div className="grid max-w-md grid-cols-2 gap-3">
          <AngkaOpsional label="Panjang minimal" value={q.minLength} onChange={(minLength) => onChange({ ...q, minLength })} />
          <AngkaOpsional label="Panjang maksimal" value={q.maxLength} onChange={(maxLength) => onChange({ ...q, maxLength })} />
        </div>
      );

    case "multiple_choice":
    case "dropdown":
    case "checkboxes": {
      const bisaCabang = q.kind !== "checkboxes" && adaBagianLain;
      const cabang = q.kind !== "checkboxes" && q.branching;
      return (
        <div className="space-y-3">
          <EditorOpsi
            options={q.options}
            onChange={(options) => onChange({ ...q, options } as Question)}
            simbol={q.kind === "checkboxes" ? "kotak" : q.kind === "dropdown" ? "angka" : "bulat"}
            renderTujuan={
              cabang
                ? (o, set) => (
                    <PilihTujuan
                      label={`Tujuan bila memilih ${o.label}`}
                      value={o.goTo}
                      sections={sections}
                      sectionIndex={sectionIndex}
                      onChange={(goTo) => set({ ...o, goTo })}
                    />
                  )
                : undefined
            }
          />
          {q.kind !== "dropdown" ? (
            q.other ? (
              <div className="flex flex-wrap items-center gap-2 pl-8">
                <span className="text-sm text-navy-600">Lainnya: (isian bebas)</span>
                {cabang && q.kind === "multiple_choice" ? (
                  <div className="min-w-56">
                    <PilihTujuan
                      label="Tujuan bila memilih Lainnya"
                      value={q.otherGoTo}
                      sections={sections}
                      sectionIndex={sectionIndex}
                      onChange={(otherGoTo) => onChange({ ...q, otherGoTo })}
                    />
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => onChange({ ...q, other: false, ...(q.kind === "multiple_choice" ? { otherGoTo: undefined } : {}) } as Question)}
                  className={kelasTombolIkon}
                >
                  <IconClose className="size-4" />
                  <span className="sr-only">Hapus opsi Lainnya</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onChange({ ...q, other: true } as Question)}
                className="pressable ml-8 rounded-full px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-navy-50 hover:text-navy-950"
              >
                + Tambah “Lainnya”
              </button>
            )
          ) : null}

          {q.kind === "checkboxes" ? (
            <div className="grid max-w-md grid-cols-2 gap-3 pt-1">
              <AngkaOpsional label="Pilih minimal" value={q.minSelected} onChange={(minSelected) => onChange({ ...q, minSelected })} />
              <AngkaOpsional label="Pilih maksimal" value={q.maxSelected} onChange={(maxSelected) => onChange({ ...q, maxSelected })} />
            </div>
          ) : null}

          {bisaCabang ? (
            <label className="flex items-start gap-2.5 rounded-xl bg-navy-50 px-3.5 py-3 text-sm text-navy-800">
              <input
                type="checkbox"
                checked={cabang}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? ({ ...q, branching: true } as Question)
                      : ({
                          ...q,
                          branching: false,
                          options: q.options.map(({ id, label }) => ({ id, label })),
                          ...(q.kind === "multiple_choice" ? { otherGoTo: undefined } : {}),
                        } as Question),
                  )
                }
                className="mt-0.5 size-4 accent-navy-950"
              />
              <span>
                <span className="font-medium text-navy-950">Lompat ke bagian berdasarkan jawaban</span>
                <span className="block text-xs text-navy-600">
                  Hanya bisa melompat ke bagian sesudahnya atau langsung kirim. Satu pertanyaan per bagian.
                </span>
              </span>
            </label>
          ) : null}
        </div>
      );
    }

    case "linear_scale":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-end gap-2">
            <PilihAngka label="Dari" value={q.min} pilihan={[0, 1]} onChange={(n) => onChange({ ...q, min: n as 0 | 1 })} />
            <span className="pb-3 text-sm text-navy-500">sampai</span>
            <PilihAngka label="Sampai" value={q.max} pilihan={[2, 3, 4, 5, 6, 7, 8, 9, 10]} onChange={(n) => onChange({ ...q, max: n })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TeksKecil label={`Label ${q.min}`} value={q.minLabel} onChange={(minLabel) => onChange({ ...q, minLabel })} />
            <TeksKecil label={`Label ${q.max}`} value={q.maxLabel} onChange={(maxLabel) => onChange({ ...q, maxLabel })} />
          </div>
        </div>
      );

    case "mc_grid":
    case "checkbox_grid":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-navy-600">Baris</p>
            <EditorGaris items={q.rows} label="Baris" onChange={(rows) => onChange({ ...q, rows })} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-navy-600">Kolom</p>
            <EditorGaris items={q.columns} label="Kolom" onChange={(columns) => onChange({ ...q, columns })} />
          </div>
        </div>
      );

    case "date":
      return (
        <div className="grid max-w-md grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${uid}-min`} className="mb-1 block text-xs font-medium text-navy-600">
              Paling awal
            </label>
            <input id={`${uid}-min`} type="date" value={q.min ?? ""} onChange={(e) => onChange({ ...q, min: e.target.value || undefined })} className={cn(kelasInputBuilder, "text-sm")} />
          </div>
          <div>
            <label htmlFor={`${uid}-max`} className="mb-1 block text-xs font-medium text-navy-600">
              Paling akhir
            </label>
            <input id={`${uid}-max`} type="date" value={q.max ?? ""} onChange={(e) => onChange({ ...q, max: e.target.value || undefined })} className={cn(kelasInputBuilder, "text-sm")} />
          </div>
        </div>
      );

    case "time":
      return null;

    case "file_upload":
      return (
        <div className="space-y-3">
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-navy-600">Jenis berkas yang diizinkan</legend>
            <div className="flex flex-wrap gap-2">
              {FILE_KINDS.map((k) => {
                const aktif = q.accept.includes(k);
                return (
                  <label
                    key={k}
                    className="flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-navy-200 bg-white px-3.5 text-sm text-navy-800 has-checked:border-navy-950 has-checked:bg-gold-50"
                  >
                    <input
                      type="checkbox"
                      checked={aktif}
                      onChange={(e) =>
                        onChange({ ...q, accept: e.target.checked ? [...q.accept, k] : q.accept.filter((x) => x !== k) })
                      }
                      className="size-4 accent-navy-950"
                    />
                    {FILE_KIND_LABEL[k]}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-3">
            <PilihAngka label="Maks. berkas" value={q.maxFiles} pilihan={[1, 2, 3]} onChange={(maxFiles) => onChange({ ...q, maxFiles })} />
            <PilihAngka label="Maks. MB per berkas" value={q.maxSizeMb} pilihan={[1, 2, 3, 4, 5]} onChange={(maxSizeMb) => onChange({ ...q, maxSizeMb })} />
          </div>
          <p className="text-xs leading-relaxed text-navy-500">
            Total semua berkas dalam satu kiriman dibatasi 5 MB. Berkas tersimpan privat dan hanya bisa diunduh admin.
          </p>
        </div>
      );
  }
}

function EditorOpsi({
  options,
  onChange,
  simbol,
  renderTujuan,
}: {
  options: FormOption[];
  onChange: (options: FormOption[]) => void;
  simbol: "bulat" | "kotak" | "angka";
  renderTujuan?: (o: FormOption, set: (o: FormOption) => void) => React.ReactNode;
}) {
  const ubah = (i: number, o: FormOption) => onChange(options.map((x, k) => (k === i ? o : x)));
  return (
    <div className="space-y-2">
      {options.map((o, i) => (
        <div key={o.id} className="flex flex-wrap items-center gap-2">
          <span aria-hidden="true" className="grid w-6 shrink-0 place-items-center text-navy-400">
            {simbol === "angka" ? (
              <span className="text-sm tabular-nums">{i + 1}.</span>
            ) : (
              <span className={cn("size-4 border-2 border-navy-300", simbol === "bulat" ? "rounded-full" : "rounded")} />
            )}
          </span>
          <input
            value={o.label}
            maxLength={300}
            aria-label={`Opsi ${i + 1}`}
            onChange={(e) => ubah(i, { ...o, label: e.target.value })}
            className={cn(kelasInputBuilder, "min-h-10 min-w-0 flex-1 py-2 text-sm")}
          />
          {renderTujuan ? <div className="w-full pl-8 sm:w-60 sm:pl-0">{renderTujuan(o, (x) => ubah(i, x))}</div> : null}
          <button
            type="button"
            disabled={options.length <= 1}
            onClick={() => onChange(options.filter((_, k) => k !== i))}
            className={kelasTombolIkon}
          >
            <IconClose className="size-4" />
            <span className="sr-only">Hapus opsi {i + 1}</span>
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={options.length >= 50}
        onClick={() => onChange([...options, { id: newFormId(), label: `Opsi ${options.length + 1}` }])}
        className="pressable ml-8 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-navy-50 hover:text-navy-950"
      >
        <IconPlus className="size-4" />
        Tambah opsi
      </button>
    </div>
  );
}

function EditorGaris({ items, label, onChange }: { items: GridLine[]; label: string; onChange: (items: GridLine[]) => void }) {
  return (
    <div className="space-y-2">
      {items.map((g, i) => (
        <div key={g.id} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-right text-sm tabular-nums text-navy-400">{i + 1}.</span>
          <input
            value={g.label}
            maxLength={300}
            aria-label={`${label} ${i + 1}`}
            onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))}
            className={cn(kelasInputBuilder, "min-h-10 min-w-0 flex-1 py-2 text-sm")}
          />
          <button type="button" disabled={items.length <= 1} onClick={() => onChange(items.filter((_, k) => k !== i))} className={kelasTombolIkon}>
            <IconClose className="size-4" />
            <span className="sr-only">
              Hapus {label.toLowerCase()} {i + 1}
            </span>
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={items.length >= 20}
        onClick={() => onChange([...items, { id: newFormId(), label: `${label} ${items.length + 1}` }])}
        className="pressable ml-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-navy-50 hover:text-navy-950"
      >
        <IconPlus className="size-4" />
        Tambah {label.toLowerCase()}
      </button>
    </div>
  );
}

function AngkaOpsional({ label, value, onChange }: { label: string; value: number | undefined; onChange: (n: number | undefined) => void }) {
  const uid = useId();
  return (
    <div>
      <label htmlFor={uid} className="mb-1 block text-xs font-medium text-navy-600">
        {label}
      </label>
      <input
        id={uid}
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => {
          const n = e.target.value === "" ? undefined : Number(e.target.value);
          onChange(n === undefined || Number.isFinite(n) ? n : undefined);
        }}
        className={cn(kelasInputBuilder, "text-sm")}
      />
    </div>
  );
}

function PilihAngka({ label, value, pilihan, onChange }: { label: string; value: number; pilihan: number[]; onChange: (n: number) => void }) {
  const uid = useId();
  return (
    <div>
      <label htmlFor={uid} className="mb-1 block text-xs font-medium text-navy-600">
        {label}
      </label>
      <div className="relative">
        <select id={uid} value={value} onChange={(e) => onChange(Number(e.target.value))} className={cn(kelasInputBuilder, "w-24 cursor-pointer appearance-none pr-8 text-sm")}>
          {pilihan.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <IconChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-navy-500" />
      </div>
    </div>
  );
}

function TeksKecil({ label, value, onChange }: { label: string; value: string | undefined; onChange: (v: string | undefined) => void }) {
  const uid = useId();
  return (
    <div>
      <label htmlFor={uid} className="mb-1 block text-xs font-medium text-navy-600">
        {label}
      </label>
      <input id={uid} value={value ?? ""} maxLength={100} onChange={(e) => onChange(e.target.value || undefined)} className={cn(kelasInputBuilder, "text-sm")} placeholder="Opsional" />
    </div>
  );
}
