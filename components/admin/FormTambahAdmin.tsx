"use client";

import { useActionState } from "react";

import { PesanAksi, SubmitButton } from "@/components/admin/Feedback";
import { SelectField, TextField } from "@/components/admin/Fields";
import { tambahAdmin } from "@/lib/actions/settings";
import type { ActionResult } from "@/lib/actions/helpers";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin — kelola semua konten" },
  { value: "editor", label: "Editor — kelola konten" },
  { value: "super_admin", label: "Super Admin — termasuk kelola admin" },
];

export function FormTambahAdmin() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(tambahAdmin, null);
  const err = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form
      action={formAction}
      // Kartu putih melayang; gaya label & field (label-dot, fokus tinta) sudah dari Fields.tsx.
      className="space-y-5 rounded-[1.75rem] bg-white p-6 shadow-float sm:p-8"
    >
      <div>
        <h3 className="text-lg font-bold tracking-[-0.02em] text-navy-950">Formulir admin baru</h3>
        <p className="mt-1 text-sm text-navy-500">Semua isian bertanda * wajib diisi.</p>
      </div>

      {state ? <PesanAksi result={state} /> : null}

      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        wajib
        autoComplete="off"
        bantuan="Dipakai untuk masuk ke panel admin."
        error={err?.email}
      />

      <TextField
        id="display_name"
        name="display_name"
        label="Nama tampilan"
        wajib
        error={err?.display_name}
      />

      <TextField
        id="password"
        name="password"
        type="password"
        label="Kata sandi awal"
        wajib
        minLength={10}
        autoComplete="new-password"
        bantuan="Minimal 10 karakter. Sampaikan langsung ke admin baru; minta ia menggantinya bila fitur ganti kata sandi tersedia."
        error={err?.password}
      />

      <SelectField
        id="role"
        name="role"
        label="Peran"
        defaultValue="admin"
        options={ROLE_OPTIONS}
        error={err?.role}
      />

      <div className="flex justify-end border-t border-navy-100 pt-5 [&>button]:min-h-12 [&>button]:w-full sm:[&>button]:w-auto">
        <SubmitButton>Tambah Admin</SubmitButton>
      </div>
    </form>
  );
}
