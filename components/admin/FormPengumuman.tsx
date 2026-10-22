"use client";

import { useActionState } from "react";

import { BilahAksiForm, SubmitButton } from "@/components/admin/Feedback";
import { FieldGroup, SelectField, TextArea, TextField } from "@/components/admin/Fields";
import { ButtonLink } from "@/components/ui/Button";
import { IconCheck, IconClock, IconMegaphone } from "@/components/ui/Icons";
import type { ActionResult } from "@/lib/actions/helpers";
import { toDatetimeLocalValue } from "@/lib/format/date";
import type { AnnouncementRow } from "@/lib/db/types";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (belum tampil publik)" },
  { value: "published", label: "Terbit" },
  { value: "archived", label: "Arsip" },
];

export function FormPengumuman({
  pengumuman,
  action,
}: {
  pengumuman?: AnnouncementRow;
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);
  const err = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-6">

      <FieldGroup
        judul="Isi Pengumuman"
        deskripsi="Pesan singkat yang tampil di beranda."
        ikon={<IconMegaphone />}
      >
        <TextField
          id="title"
          name="title"
          label="Judul"
          wajib
          defaultValue={pengumuman?.title}
          error={err?.title}
        />

        <TextArea
          id="body"
          name="body"
          label="Isi singkat"
          rows={4}
          defaultValue={pengumuman?.body}
          bantuan="Tampil di beranda. Gunakan kalimat ringkas."
          error={err?.body}
        />
      </FieldGroup>

      <FieldGroup
        judul="Masa Tayang"
        deskripsi="Kosongkan bila ingin tampil terus. Pengumuman kedaluwarsa otomatis berhenti tampil."
        ikon={<IconClock />}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="starts_at"
            name="starts_at"
            label="Mulai tayang"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(pengumuman?.starts_at)}
            error={err?.starts_at}
          />
          <TextField
            id="ends_at"
            name="ends_at"
            label="Berhenti tayang"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(pengumuman?.ends_at)}
            error={err?.ends_at}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="priority"
            name="priority"
            label="Prioritas"
            type="number"
            min={0}
            max={100}
            defaultValue={String(pengumuman?.priority ?? 0)}
            bantuan="Angka lebih besar tampil lebih dulu. Rentang 0–100."
            error={err?.priority}
          />

          <SelectField
            id="status"
            name="status"
            label="Status publikasi"
            defaultValue={pengumuman?.status ?? "draft"}
            options={STATUS_OPTIONS}
            wajib
            error={err?.status}
          />
        </div>
      </FieldGroup>

      <BilahAksiForm hasil={state} catatan="Kolom bertanda * wajib diisi.">
        <ButtonLink href="/admin/pengumuman" variant="secondary">
          Batal
        </ButtonLink>
        <SubmitButton>
          <IconCheck className="size-4" />
          {pengumuman ? "Simpan Perubahan" : "Simpan Pengumuman"}
        </SubmitButton>
      </BilahAksiForm>
    </form>
  );
}
