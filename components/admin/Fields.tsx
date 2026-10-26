import Link from "next/link";
import type { ReactNode } from "react";

import { IconAlert, IconChevronLeft } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

/**
 * Field form admin.
 *
 * Aksesibilitas (PRD §9): setiap input punya <label> yang terhubung lewat
 * htmlFor/id — placeholder TIDAK pernah dipakai sebagai pengganti label.
 * Pesan error terhubung melalui aria-describedby dan aria-invalid.
 */

// Fokus: border tinta hitam (kontras tinggi) + cincin kuning lembut seperti referensi.
// Warna border/latar dipisah per keadaan: `cn` tidak menggabungkan kelas Tailwind yang
// bertabrakan, jadi kelas normal dan error tidak boleh muncul bersamaan.
const inputDasar =
  "block w-full min-h-12 rounded-2xl border px-4 py-3 text-md text-navy-950 " +
  "placeholder:text-navy-400 " +
  "transition-[border-color,box-shadow,background-color] duration-150 ease-out " +
  "focus:outline-none focus:ring-4 focus-visible:outline-none " +
  "disabled:cursor-not-allowed disabled:bg-navy-50 disabled:text-navy-500";

const inputNormal = "border-navy-200 bg-white hover:border-navy-300 focus:border-navy-950 focus:ring-gold-200";

const inputError =
  "border-danger-500 bg-danger-50 hover:border-danger-600 focus:border-danger-600 focus:ring-danger-500/15";

function kelasInput(adaError: boolean, ...tambahan: string[]) {
  return cn(inputDasar, adaError ? inputError : inputNormal, ...tambahan);
}

/** Label tebal dengan titik kuning kecil di depannya (detail referensi). */
function LabelField({ htmlFor, label, wajib }: { htmlFor: string; label: string; wajib?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-navy-950">
      {label}
      {wajib ? (
        <span className="ml-1 text-danger-600" aria-hidden="true">
          *
        </span>
      ) : null}
      {wajib ? <span className="sr-only"> (wajib diisi)</span> : null}
    </label>
  );
}

/** Pesan galat field — merah jelas, ikon peringatan, dan teks (bukan warna saja). */
function PesanErrorField({ id, error }: { id: string; error?: string[] }) {
  if (!error?.length) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-2 flex items-start gap-1.5 text-sm font-medium leading-snug text-danger-700"
    >
      <IconAlert className="mt-px size-4 shrink-0" />
      <span>{error.join(" ")}</span>
    </p>
  );
}

function Pembungkus({
  id,
  label,
  wajib,
  bantuan,
  error,
  children,
}: {
  id: string;
  label: string;
  wajib?: boolean;
  bantuan?: string;
  error?: string[];
  children: ReactNode;
}) {
  return (
    <div>
      <LabelField htmlFor={id} label={label} wajib={wajib} />

      {bantuan ? (
        <p id={`${id}-bantuan`} className="mt-1 text-sm leading-relaxed text-navy-500">
          {bantuan}
        </p>
      ) : null}

      <div className="relative mt-2.5">{children}</div>

      <PesanErrorField id={`${id}-error`} error={error} />
    </div>
  );
}

function describedBy(id: string, bantuan?: string, error?: string[]) {
  const parts: string[] = [];
  if (bantuan) parts.push(`${id}-bantuan`);
  if (error?.length) parts.push(`${id}-error`);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

export function TextField({
  id,
  label,
  name,
  defaultValue,
  type = "text",
  wajib,
  bantuan,
  error,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue"> & {
  id: string;
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  wajib?: boolean;
  bantuan?: string;
  error?: string[];
}) {
  return (
    <Pembungkus id={id} label={label} wajib={wajib} bantuan={bantuan} error={error}>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={wajib}
        aria-invalid={error?.length ? true : undefined}
        aria-describedby={describedBy(id, bantuan, error)}
        className={kelasInput(Boolean(error?.length))}
        {...rest}
      />
    </Pembungkus>
  );
}

export function TextArea({
  id,
  label,
  name,
  defaultValue,
  rows = 5,
  wajib,
  bantuan,
  error,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  wajib?: boolean;
  bantuan?: string;
  error?: string[];
}) {
  return (
    <Pembungkus id={id} label={label} wajib={wajib} bantuan={bantuan} error={error}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        required={wajib}
        aria-invalid={error?.length ? true : undefined}
        aria-describedby={describedBy(id, bantuan, error)}
        className={kelasInput(Boolean(error?.length), "resize-y leading-relaxed")}
      />
    </Pembungkus>
  );
}

export function SelectField({
  id,
  label,
  name,
  defaultValue,
  options,
  wajib,
  bantuan,
  error,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue?: string | null;
  options: ReadonlyArray<{ value: string; label: string }>;
  wajib?: boolean;
  bantuan?: string;
  error?: string[];
}) {
  return (
    <Pembungkus id={id} label={label} wajib={wajib} bantuan={bantuan} error={error}>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? options[0]?.value}
        aria-invalid={error?.length ? true : undefined}
        aria-describedby={describedBy(id, bantuan, error)}
        className={kelasInput(Boolean(error?.length), "cursor-pointer appearance-none pr-12")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* Panah dropdown kustom (dekoratif) dalam lingkaran kecil. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-navy-50 text-navy-700"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </Pembungkus>
  );
}

export function CheckboxField({
  id,
  label,
  name,
  defaultChecked,
  bantuan,
}: {
  id: string;
  label: string;
  name: string;
  defaultChecked?: boolean;
  bantuan?: string;
}) {
  return (
    <div className="relative flex items-start gap-4 rounded-2xl border border-navy-200 bg-white p-4 transition-[border-color,background-color,scale] duration-150 ease-out hover:border-navy-300 active:scale-[0.99] has-checked:border-navy-950 has-checked:bg-gold-50 has-focus-visible:ring-4 has-focus-visible:ring-gold-200 sm:p-5">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        aria-describedby={bantuan ? `${id}-bantuan` : undefined}
        className="mt-0.5 size-5 shrink-0 cursor-pointer rounded-md border-navy-300 accent-navy-950"
      />
      <div className="min-w-0">
        {/* Seluruh kartu dapat diklik: area label diperluas lewat pseudo-elemen. */}
        <label
          htmlFor={id}
          className="cursor-pointer text-md font-semibold text-navy-950 after:absolute after:inset-0 after:rounded-2xl"
        >
          {label}
        </label>
        {bantuan ? (
          <p id={`${id}-bantuan`} className="mt-1 text-sm leading-relaxed text-navy-500">
            {bantuan}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Kelompok field dengan judul — memecah form panjang jadi bagian yang jelas. */
export function FieldGroup({
  judul,
  deskripsi,
  ikon,
  children,
}: {
  judul: string;
  deskripsi?: string;
  /** Ikon dekoratif opsional di samping judul. */
  ikon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0 rounded-card border border-navy-200/80 bg-white">
      {/* float + w-full agar legend tidak menempel di garis tepi fieldset. */}
      <legend className="float-left w-full px-5 pt-6 sm:px-8 sm:pt-7">
        <span className="flex items-center gap-3.5">
          {ikon ? (
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-200/80 [&>svg]:size-5"
            >
              {ikon}
            </span>
          ) : null}
          <span className="text-xl font-bold tracking-heading text-navy-950">{judul}</span>
        </span>
      </legend>
      <div className="clear-both px-5 sm:px-8">
        {deskripsi ? (
          <p className={cn("pt-1.5 text-sm leading-relaxed text-navy-500", ikon && "sm:pl-[3.625rem]")}>
            {deskripsi}
          </p>
        ) : null}
      </div>
      <div className="mx-5 mt-5 space-y-6 border-t border-navy-100 pb-7 pt-6 sm:mx-8 sm:pb-8">
        {children}
      </div>
    </fieldset>
  );
}

/* -------------------------------------------------------------------------- */
/*  Kerangka halaman admin (dipakai halaman daftar & form konten).            */
/* -------------------------------------------------------------------------- */

/** Kepala halaman admin: label kecil bertitik, judul tebal besar, subjudul abu, dan aksi. */
export function KepalaHalamanAdmin({
  eyebrow,
  judul,
  deskripsi,
  aksi,
  children,
}: {
  eyebrow?: string;
  judul: string;
  deskripsi?: ReactNode;
  aksi?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? <p className="mb-2 text-sm font-medium text-navy-600">{eyebrow}</p> : null}
        <h1 className="text-3xl font-bold leading-[1.08] tracking-display text-balance text-navy-950 [overflow-wrap:anywhere] sm:text-[2.75rem]">
          {judul}
        </h1>
        {deskripsi ? (
          <p className="mt-3 text-base leading-relaxed text-navy-500 sm:text-lg">{deskripsi}</p>
        ) : null}
        {children}
      </div>
      {aksi ? <div className="flex shrink-0 flex-wrap items-center gap-3">{aksi}</div> : null}
    </header>
  );
}

/** Breadcrumb ringkas: pill "kembali" ke halaman daftar + posisi saat ini. */
export function RemahRoti({
  induk,
  sekarang,
}: {
  induk: { href: string; label: string };
  sekarang: string;
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2 text-sm text-navy-500">
        <li>
          <Link
            href={induk.href}
            className="pressable group inline-flex min-h-11 items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 font-medium text-navy-950 ring-1 ring-inset ring-navy-200 hover:bg-navy-50 hover:ring-navy-300"
          >
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-full bg-navy-100 transition-colors duration-200 group-hover:bg-navy-200"
            >
              <IconChevronLeft className="size-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
            </span>
            {induk.label}
          </Link>
        </li>
        <li aria-hidden="true" className="text-navy-300">
          ·
        </li>
        <li className="min-w-0">
          <span aria-current="page" className="line-clamp-1 font-medium text-navy-700">
            {sekarang}
          </span>
        </li>
      </ol>
    </nav>
  );
}

/** Keadaan kosong pada halaman daftar admin (judul memakai h2 agar hierarki tetap rapi). */
export function KosongAdmin({
  ikon,
  judul,
  deskripsi,
  aksi,
}: {
  ikon: ReactNode;
  judul: string;
  deskripsi: string;
  aksi?: ReactNode;
}) {
  return (
    <div className="rounded-panel border border-navy-200/80 bg-white px-6 py-16 text-center sm:py-20">
      <span
        aria-hidden="true"
        className="mx-auto grid size-14 place-items-center rounded-full bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-200/80 [&>svg]:size-6"
      >
        {ikon}
      </span>
      <h2 className="mt-5 text-xl font-bold tracking-heading text-navy-950 sm:text-2xl">{judul}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-navy-500 sm:text-base">
        {deskripsi}
      </p>
      {aksi ? <div className="mt-8 flex justify-center">{aksi}</div> : null}
    </div>
  );
}

/** Kartu pembungkus tabel admin — dapat digulir horizontal di layar sempit. */
export function KartuTabel({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-card border border-navy-200/80 bg-white">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/** Kelas bersama untuk tabel admin. */
export const kelasTabel = {
  tabel: "w-full text-left text-sm",
  thead: "border-b border-navy-100 text-xs font-medium text-navy-500",
  th: "px-5 py-4 font-medium whitespace-nowrap first:pl-6 last:pr-6",
  tbody: "divide-y divide-navy-100",
  tr: "align-top transition-colors duration-150 hover:bg-navy-50",
  td: "px-5 py-4 first:pl-6 last:pr-6",
  tautanJudul:
    "font-semibold text-navy-950 underline-offset-4 decoration-gold-500 decoration-[3px] [overflow-wrap:anywhere] hover:underline",
} as const;
