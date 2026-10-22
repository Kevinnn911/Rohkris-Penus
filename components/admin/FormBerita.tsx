"use client";

import { useActionState, useState } from "react";

import { BilahAksiForm, SubmitButton } from "@/components/admin/Feedback";
import { FieldGroup, SelectField, TextArea, TextField } from "@/components/admin/Fields";
import { UnggahGambar } from "@/components/admin/UnggahGambar";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconArrowUpRight,
  IconCheck,
  IconEye,
  IconImage,
  IconNewspaper,
} from "@/components/ui/Icons";
import type { ActionResult } from "@/lib/actions/helpers";
import type { NewsPostRow } from "@/lib/db/types";
import { slugify } from "@/lib/validation/schemas";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (belum tampil publik)" },
  { value: "published", label: "Terbit" },
  { value: "archived", label: "Arsip" },
];

export function FormBerita({
  post,
  pilihanEvent,
  action,
}: {
  post?: NewsPostRow;
  pilihanEvent: Array<{ id: string; title: string }>;
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);
  const [judul, setJudul] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugDisentuh, setSlugDisentuh] = useState(Boolean(post?.slug));
  const [coverUrl, setCoverUrl] = useState(post?.cover_image_url ?? "");

  const err = state && !state.ok ? state.fieldErrors : undefined;

  const opsiEvent = [
    { value: "", label: "— Tidak terkait kegiatan —" },
    ...pilihanEvent.map((e) => ({ value: e.id, label: e.title })),
  ];

  return (
    <form action={formAction} className="space-y-6">

      <FieldGroup
        judul="Isi Berita"
        deskripsi="Judul, ringkasan, dan isi lengkap berita."
        ikon={<IconNewspaper />}
      >
        <TextField
          id="title"
          name="title"
          label="Judul berita"
          wajib
          value={judul}
          onChange={(e) => {
            setJudul(e.target.value);
            if (!slugDisentuh) setSlug(slugify(e.target.value));
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
          bantuan="Alamat halaman publik, contoh: recap-natal-2026."
          error={err?.slug}
        />

        <TextArea
          id="excerpt"
          name="excerpt"
          label="Ringkasan"
          rows={2}
          defaultValue={post?.excerpt}
          bantuan="Tampil di daftar berita. Maksimal 300 karakter."
          error={err?.excerpt}
        />

        <TextArea
          id="body"
          name="body"
          label="Isi berita"
          rows={14}
          defaultValue={post?.body}
          bantuan="Mendukung Markdown: **tebal**, *miring*, ## subjudul, - daftar, [tautan](https://...)."
          error={err?.body}
        />
      </FieldGroup>

      <FieldGroup judul="Gambar Sampul" ikon={<IconImage />}>
        <UnggahGambar
          id="cover_image_url"
          name="cover_image_url"
          label="Sampul berita"
          value={coverUrl}
          onChange={setCoverUrl}
          error={err?.cover_image_url}
        />
      </FieldGroup>

      <FieldGroup
        judul="Publikasi"
        deskripsi="Tautkan ke kegiatan dan atur status tayang."
        ikon={<IconEye />}
      >
        <SelectField
          id="event_id"
          name="event_id"
          label="Kegiatan terkait"
          defaultValue={post?.event_id ?? ""}
          options={opsiEvent}
          bantuan="Opsional. Menautkan berita ini ke halaman detail kegiatan."
          error={err?.event_id}
        />

        <SelectField
          id="status"
          name="status"
          label="Status publikasi"
          defaultValue={post?.status ?? "draft"}
          options={STATUS_OPTIONS}
          wajib
          error={err?.status}
        />
      </FieldGroup>

      <BilahAksiForm hasil={state} catatan="Kolom bertanda * wajib diisi.">
        {post?.status === "published" ? (
          <ButtonLink
            href={`/berita/${post.slug}`}
            variant="ghost"
            target="_blank"
            rel="noopener noreferrer"
          >
            Lihat halaman publik
            <IconArrowUpRight className="size-4" />
            <span className="sr-only">(tab baru)</span>
          </ButtonLink>
        ) : null}
        <ButtonLink href="/admin/berita" variant="secondary">
          Batal
        </ButtonLink>
        <SubmitButton>
          <IconCheck className="size-4" />
          {post ? "Simpan Perubahan" : "Simpan Berita"}
        </SubmitButton>
      </BilahAksiForm>
    </form>
  );
}
