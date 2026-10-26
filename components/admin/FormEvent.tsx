"use client";

import { useActionState, useState } from "react";

import { BilahAksiForm, SubmitButton } from "@/components/admin/Feedback";
import {
  CheckboxField,
  FieldGroup,
  SelectField,
  TextArea,
  TextField,
} from "@/components/admin/Fields";
import { UnggahGambar } from "@/components/admin/UnggahGambar";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconArrowUpRight,
  IconCalendar,
  IconCheck,
  IconEye,
  IconFile,
  IconImage,
  IconInfo,
  IconUsers,
} from "@/components/ui/Icons";
import type { ActionResult } from "@/lib/actions/helpers";
import { toDatetimeLocalValue } from "@/lib/format/date";
import { EVENT_CATEGORIES, type EventRow } from "@/lib/db/types";
import { slugify } from "@/lib/validation/schemas";

const KATEGORI_OPTIONS = EVENT_CATEGORIES.map((k) => ({ value: k, label: k }));

const MODE_OPTIONS = [
  { value: "tbd", label: "Belum ditentukan" },
  { value: "offline", label: "Tatap muka" },
  { value: "online", label: "Daring" },
  { value: "hybrid", label: "Hibrida" },
];

const STATUS_PENDAFTARAN_OPTIONS = [
  { value: "not_open", label: "Belum dibuka" },
  { value: "open", label: "Dibuka" },
  { value: "closed", label: "Ditutup" },
  { value: "external_only", label: "Tanpa pendaftaran / langsung hadir" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (belum tampil publik)" },
  { value: "published", label: "Terbit" },
  { value: "archived", label: "Arsip" },
  { value: "cancelled", label: "Dibatalkan" },
];

export function FormEvent({
  event,
  action,
}: {
  event?: EventRow;
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);
  const [judul, setJudul] = useState(event?.title ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [slugDisentuh, setSlugDisentuh] = useState(Boolean(event?.slug));
  const [coverUrl, setCoverUrl] = useState(event?.cover_image_url ?? "");
  const [modePendaftaran, setModePendaftaran] = useState<"external" | "internal">(
    event?.registration_mode ?? "external",
  );

  const err = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-6">

      <FieldGroup
        judul="Informasi Utama"
        deskripsi="Judul, alamat halaman, dan cerita lengkap kegiatan."
        ikon={<IconFile />}
      >
        <TextField
          id="title"
          name="title"
          label="Judul kegiatan"
          wajib
          value={judul}
          onChange={(e) => {
            const nilai = e.target.value;
            setJudul(nilai);
            // Slug otomatis mengikuti judul sampai admin mengubahnya sendiri.
            if (!slugDisentuh) setSlug(slugify(nilai));
          }}
          error={err?.title}
        />

        <TextField
          id="slug"
          name="slug"
          label="Slug URL"
          wajib
          value={slug}
          onChange={(e) => {
            setSlugDisentuh(true);
            setSlug(e.target.value);
          }}
          bantuan="Alamat halaman publik, contoh: ibadah-natal-2026. Hanya huruf kecil, angka, dan tanda hubung."
          error={err?.slug}
        />

        <SelectField
          id="category"
          name="category"
          label="Kategori"
          defaultValue={event?.category ?? "Lainnya"}
          options={KATEGORI_OPTIONS}
          wajib
          error={err?.category}
        />

        <TextArea
          id="summary"
          name="summary"
          label="Ringkasan singkat"
          rows={2}
          defaultValue={event?.summary}
          bantuan="Satu sampai dua kalimat yang tampil di kartu kegiatan. Maksimal 300 karakter."
          error={err?.summary}
        />

        <TextArea
          id="description"
          name="description"
          label="Deskripsi lengkap"
          rows={10}
          defaultValue={event?.description}
          bantuan="Mendukung Markdown: **tebal**, *miring*, - daftar, ## subjudul, dan [tautan](https://...)."
          error={err?.description}
        />
      </FieldGroup>

      <FieldGroup judul="Poster / Gambar Sampul" ikon={<IconImage />}>
        <UnggahGambar
          id="cover_image_url"
          name="cover_image_url"
          label="Poster kegiatan"
          value={coverUrl}
          onChange={setCoverUrl}
          error={err?.cover_image_url}
        />
      </FieldGroup>

      <FieldGroup
        judul="Waktu dan Tempat"
        deskripsi="Semua waktu memakai zona WIB (Asia/Jakarta)."
        ikon={<IconCalendar />}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="start_at"
            name="start_at"
            label="Mulai"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(event?.start_at)}
            error={err?.start_at}
          />
          <TextField
            id="end_at"
            name="end_at"
            label="Selesai"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(event?.end_at)}
            error={err?.end_at}
          />
        </div>

        <SelectField
          id="event_mode"
          name="event_mode"
          label="Format kegiatan"
          defaultValue={event?.event_mode ?? "tbd"}
          options={MODE_OPTIONS}
          error={err?.event_mode}
        />

        <TextField
          id="location"
          name="location"
          label="Lokasi"
          defaultValue={event?.location}
          bantuan="Contoh: Aula sekolah, atau tautan ruang daring."
          error={err?.location}
        />
      </FieldGroup>

      <FieldGroup
        judul="Pendaftaran"
        deskripsi="Tombol “Daftar Sekarang” hanya muncul bila status Dibuka dan formulirnya siap: tautan https:// untuk formulir luar, atau formulir internal yang sudah berisi pertanyaan."
        ikon={<IconUsers />}
      >
        <fieldset>
          <legend className="text-sm font-semibold text-navy-950">Jenis formulir pendaftaran</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {(
              [
                {
                  value: "external",
                  judul: "Formulir luar",
                  keterangan: "Tautan Google Form atau layanan lain. Data tersimpan di layanan tersebut.",
                },
                {
                  value: "internal",
                  judul: "Formulir internal",
                  keterangan: event
                    ? "Dibuat di tab Formulir. Respons tersimpan di server dan bisa dilihat di tab Respons."
                    : "Simpan kegiatan dulu, lalu buat pertanyaannya di tab Formulir.",
                },
              ] as const
            ).map((opsi) => (
              <label
                key={opsi.value}
                className="relative flex cursor-pointer gap-3 rounded-2xl border border-navy-200 bg-white p-4 transition-[border-color,background-color] duration-150 ease-out hover:border-navy-300 has-checked:border-navy-950 has-checked:bg-gold-50 has-focus-visible:ring-4 has-focus-visible:ring-gold-200"
              >
                <input
                  type="radio"
                  name="registration_mode"
                  value={opsi.value}
                  checked={modePendaftaran === opsi.value}
                  onChange={() => setModePendaftaran(opsi.value)}
                  className="mt-1 size-4 shrink-0 accent-navy-950"
                />
                <span>
                  <span className="block text-md font-semibold text-navy-950">{opsi.judul}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-navy-600">{opsi.keterangan}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <SelectField
          id="registration_status"
          name="registration_status"
          label="Status pendaftaran"
          defaultValue={event?.registration_status ?? "not_open"}
          options={STATUS_PENDAFTARAN_OPTIONS}
          error={err?.registration_status}
        />

        {/* Tetap dirender (disembunyikan) pada mode internal agar tautan lama tidak hilang saat beralih. */}
        <div hidden={modePendaftaran === "internal"}>
          <TextField
            id="registration_url"
            name="registration_url"
            label="Tautan PENDAFTARAN (Google Forms)"
            type="url"
            defaultValue={event?.registration_url}
            bantuan="Tautan tujuan tombol Daftar. Wajib diawali https://. Jangan diisi tautan poster."
            error={err?.registration_url}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="registration_open_at"
            name="registration_open_at"
            label="Pendaftaran dibuka"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(event?.registration_open_at)}
            error={err?.registration_open_at}
          />
          <TextField
            id="registration_close_at"
            name="registration_close_at"
            label="Pendaftaran ditutup"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(event?.registration_close_at)}
            error={err?.registration_close_at}
          />
        </div>

        <TextField
          id="resource_url"
          name="resource_url"
          label="Tautan DOKUMEN PENDUKUNG"
          type="url"
          defaultValue={event?.resource_url}
          bantuan="Berbeda dari tautan pendaftaran. Untuk rundown, booklet, atau surat izin."
          error={err?.resource_url}
        />
      </FieldGroup>

      <FieldGroup
        judul="Informasi Tambahan"
        deskripsi="Semua bersifat opsional."
        ikon={<IconInfo />}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="cost_info"
            name="cost_info"
            label="Biaya"
            defaultValue={event?.cost_info}
            error={err?.cost_info}
          />
          <TextField
            id="dress_code"
            name="dress_code"
            label="Dress code"
            defaultValue={event?.dress_code}
            error={err?.dress_code}
          />
        </div>
        <TextArea
          id="participant_rules"
          name="participant_rules"
          label="Ketentuan peserta"
          rows={3}
          defaultValue={event?.participant_rules}
          error={err?.participant_rules}
        />
        <TextField
          id="contact_info"
          name="contact_info"
          label="Kontak panitia"
          defaultValue={event?.contact_info}
          error={err?.contact_info}
        />
      </FieldGroup>

      <FieldGroup
        judul="Publikasi"
        deskripsi="Atur kapan kegiatan ini terlihat oleh pengunjung."
        ikon={<IconEye />}
      >
        <SelectField
          id="status"
          name="status"
          label="Status publikasi"
          defaultValue={event?.status ?? "draft"}
          options={STATUS_OPTIONS}
          wajib
          error={err?.status}
        />

        <CheckboxField
          id="is_featured"
          name="is_featured"
          label="Tandai sebagai kegiatan unggulan"
          defaultChecked={event?.is_featured ?? false}
          bantuan="Kegiatan unggulan tampil di bagian khusus pada beranda."
        />
      </FieldGroup>

      <BilahAksiForm hasil={state} catatan="Kolom bertanda * wajib diisi.">
        {event?.status === "published" ? (
          <ButtonLink
            href={`/kegiatan/${event.slug}`}
            variant="ghost"
            target="_blank"
            rel="noopener noreferrer"
          >
            Lihat halaman publik
            <IconArrowUpRight className="size-4" />
            <span className="sr-only">(tab baru)</span>
          </ButtonLink>
        ) : null}
        <ButtonLink href="/admin/kegiatan" variant="secondary">
          Batal
        </ButtonLink>
        <SubmitButton>
          <IconCheck className="size-4" />
          {event ? "Simpan Perubahan" : "Simpan Kegiatan"}
        </SubmitButton>
      </BilahAksiForm>
    </form>
  );
}
