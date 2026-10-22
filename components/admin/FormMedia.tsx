"use client";

import { useActionState, useState } from "react";

import { BilahAksiForm, SubmitButton } from "@/components/admin/Feedback";
import { FieldGroup, SelectField, TextArea, TextField } from "@/components/admin/Fields";
import { UnggahGambar } from "@/components/admin/UnggahGambar";
import { ButtonLink } from "@/components/ui/Button";
import { IconCheck, IconEye, IconImage, IconInfo } from "@/components/ui/Icons";
import type { ActionResult } from "@/lib/actions/helpers";
import { toDatetimeLocalValue } from "@/lib/format/date";
import type { MediaItemRow } from "@/lib/db/types";

const TIPE_OPTIONS = [
  { value: "image", label: "Gambar" },
  { value: "video", label: "Video" },
  { value: "document", label: "Dokumen" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (belum tampil publik)" },
  { value: "published", label: "Terbit" },
  { value: "archived", label: "Arsip" },
];

export function FormMedia({
  media,
  pilihanEvent,
  action,
}: {
  media?: MediaItemRow;
  pilihanEvent: Array<{ id: string; title: string }>;
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);
  const [mediaUrl, setMediaUrl] = useState(media?.media_url ?? "");

  const err = state && !state.ok ? state.fieldErrors : undefined;

  const opsiEvent = [
    { value: "", label: "— Tidak terkait kegiatan —" },
    ...pilihanEvent.map((e) => ({ value: e.id, label: e.title })),
  ];

  return (
    <form action={formAction} className="space-y-6">

      <FieldGroup judul="Berkas Media" ikon={<IconImage />}>
        <UnggahGambar
          id="media_url"
          name="media_url"
          label="Gambar dokumentasi"
          value={mediaUrl}
          onChange={setMediaUrl}
          error={err?.media_url}
        />

        <SelectField
          id="media_type"
          name="media_type"
          label="Jenis media"
          defaultValue={media?.media_type ?? "image"}
          options={TIPE_OPTIONS}
          error={err?.media_type}
        />
      </FieldGroup>

      <FieldGroup
        judul="Keterangan"
        deskripsi="Teks alternatif wajib diisi agar dokumentasi dapat diakses pengguna pembaca layar."
        ikon={<IconInfo />}
      >
        <TextField
          id="alt_text"
          name="alt_text"
          label="Teks alternatif (alt text)"
          wajib
          defaultValue={media?.alt_text}
          bantuan="Jelaskan isi gambar secara singkat, contoh: “Siswa menyanyikan pujian saat ibadah Natal”."
          error={err?.alt_text}
        />

        <TextField
          id="title"
          name="title"
          label="Judul"
          defaultValue={media?.title}
          error={err?.title}
        />

        <TextArea
          id="caption"
          name="caption"
          label="Keterangan"
          rows={2}
          defaultValue={media?.caption}
          error={err?.caption}
        />
      </FieldGroup>

      <FieldGroup
        judul="Pengelompokan dan Publikasi"
        deskripsi="Kaitkan dengan kegiatan, atur urutan, dan status tayang."
        ikon={<IconEye />}
      >
        <SelectField
          id="event_id"
          name="event_id"
          label="Kegiatan terkait"
          defaultValue={media?.event_id ?? ""}
          options={opsiEvent}
          bantuan="Bila diisi, dokumentasi ini juga tampil di halaman detail kegiatan."
          error={err?.event_id}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="taken_at"
            name="taken_at"
            label="Tanggal pengambilan"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(media?.taken_at)}
            error={err?.taken_at}
          />

          <TextField
            id="sort_order"
            name="sort_order"
            label="Urutan tampil"
            type="number"
            min={0}
            max={9999}
            defaultValue={String(media?.sort_order ?? 0)}
            bantuan="Angka lebih kecil tampil lebih dulu."
            error={err?.sort_order}
          />
        </div>

        <SelectField
          id="status"
          name="status"
          label="Status publikasi"
          defaultValue={media?.status ?? "draft"}
          options={STATUS_OPTIONS}
          wajib
          error={err?.status}
        />
      </FieldGroup>

      <BilahAksiForm hasil={state} catatan="Kolom bertanda * wajib diisi.">
        <ButtonLink href="/admin/galeri" variant="secondary">
          Batal
        </ButtonLink>
        <SubmitButton>
          <IconCheck className="size-4" />
          {media ? "Simpan Perubahan" : "Tambah Dokumentasi"}
        </SubmitButton>
      </BilahAksiForm>
    </form>
  );
}
