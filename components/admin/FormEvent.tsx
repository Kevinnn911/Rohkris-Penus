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
        deskripsi="Tombol “Daftar Sekarang” hanya muncul bila status Dibuka DAN tautan pendaftaran terisi dengan https://"
        ikon={<IconUsers />}
      >
        <SelectField
          id="registration_status"
          name="registration_status"
          label="Status pendaftaran"
          defaultValue={event?.registration_status ?? "not_open"}
          options={STATUS_PENDAFTARAN_OPTIONS}
          error={err?.registration_status}
        />

        <TextField
          id="registration_url"
          name="registration_url"
          label="Tautan PENDAFTARAN (Google Forms)"
          type="url"
          defaultValue={event?.registration_url}
          bantuan="Tautan tujuan tombol Daftar. Wajib diawali https://. Jangan diisi tautan poster."
          error={err?.registration_url}
        />

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
