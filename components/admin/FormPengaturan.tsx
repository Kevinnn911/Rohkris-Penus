"use client";

import { useActionState } from "react";

import { BilahAksiForm, SubmitButton } from "@/components/admin/Feedback";
import { FieldGroup, TextArea, TextField } from "@/components/admin/Fields";
import {
  IconBook,
  IconCheck,
  IconFile,
  IconGlobe,
  IconHome,
  IconMail,
} from "@/components/ui/Icons";
import { simpanPengaturan } from "@/lib/actions/settings";
import type { ActionResult } from "@/lib/actions/helpers";
import type { SiteSettings } from "@/lib/db/types";

export function FormPengaturan({ settings }: { settings: SiteSettings }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    simpanPengaturan,
    null,
  );
  const err = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-6">

      <FieldGroup
        judul="Identitas Situs"
        deskripsi="Kalimat pembuka dan keterangan yang mewakili Rohkris."
        ikon={<IconHome />}
      >
        <TextField
          id="site_tagline"
          name="site_tagline"
          label="Tagline"
          defaultValue={settings.site_tagline}
          bantuan="Kalimat singkat di bawah judul beranda."
          error={err?.site_tagline}
        />
        <TextArea
          id="site_description"
          name="site_description"
          label="Deskripsi singkat"
          rows={3}
          defaultValue={settings.site_description}
          bantuan="Dipakai pada beranda, footer, dan metadata pencarian."
          error={err?.site_description}
        />
        <TextField
          id="school_info"
          name="school_info"
          label="Keterangan sekolah"
          defaultValue={settings.school_info}
          error={err?.school_info}
        />
      </FieldGroup>

      <FieldGroup
        judul="Kontak"
        deskripsi="Alamat yang dapat dihubungi pengunjung."
        ikon={<IconMail />}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="contact_email"
            name="contact_email"
            label="Email kontak"
            type="email"
            defaultValue={settings.contact_email}
            error={err?.contact_email}
          />
          <TextField
            id="contact_phone"
            name="contact_phone"
            label="Telepon / WhatsApp"
            defaultValue={settings.contact_phone}
            error={err?.contact_phone}
          />
        </div>
      </FieldGroup>

      <FieldGroup
        judul="Media Sosial"
        deskripsi="Kosongkan bila belum ada. Wajib diawali https://"
        ikon={<IconGlobe />}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="instagram_url"
            name="instagram_url"
            label="Instagram"
            type="url"
            defaultValue={settings.instagram_url}
            error={err?.instagram_url}
          />
          <TextField
            id="youtube_url"
            name="youtube_url"
            label="YouTube"
            type="url"
            defaultValue={settings.youtube_url}
            error={err?.youtube_url}
          />
          <TextField
            id="tiktok_url"
            name="tiktok_url"
            label="TikTok"
            type="url"
            defaultValue={settings.tiktok_url}
            error={err?.tiktok_url}
          />
          <TextField
            id="whatsapp_url"
            name="whatsapp_url"
            label="Tautan WhatsApp"
            type="url"
            defaultValue={settings.whatsapp_url}
            error={err?.whatsapp_url}
          />
        </div>
      </FieldGroup>

      <FieldGroup
        judul="Halaman Tentang"
        deskripsi="Profil, visi, misi, dan nilai Rohkris."
        ikon={<IconBook />}
      >
        <TextArea
          id="about_body"
          name="about_body"
          label="Profil Rohkris"
          rows={8}
          defaultValue={settings.about_body}
          bantuan="Mendukung Markdown."
          error={err?.about_body}
        />
        <TextArea
          id="about_vision"
          name="about_vision"
          label="Visi"
          rows={3}
          defaultValue={settings.about_vision}
          error={err?.about_vision}
        />
        <TextArea
          id="about_mission"
          name="about_mission"
          label="Misi"
          rows={3}
          defaultValue={settings.about_mission}
          error={err?.about_mission}
        />
        <TextArea
          id="about_values"
          name="about_values"
          label="Nilai"
          rows={3}
          defaultValue={settings.about_values}
          error={err?.about_values}
        />
      </FieldGroup>

      <FieldGroup judul="Footer" ikon={<IconFile />}>
        <TextField
          id="footer_note"
          name="footer_note"
          label="Catatan footer"
          defaultValue={settings.footer_note}
          error={err?.footer_note}
        />
      </FieldGroup>

      <BilahAksiForm hasil={state} catatan="Perubahan tampil di website publik setelah disimpan.">
        <SubmitButton>
          <IconCheck className="size-4" />
          Simpan Pengaturan
        </SubmitButton>
      </BilahAksiForm>
    </form>
  );
}
