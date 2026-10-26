// File: components/admin/FormLogin.tsx

"use client";

import { useActionState } from "react";

import { PesanAksi, SubmitButton } from "@/components/admin/Feedback";
import { TextField } from "@/components/admin/Fields";
import { IconInfo } from "@/components/ui/Icons";
import { masuk } from "@/lib/actions/auth";
import type { ActionResult } from "@/lib/actions/helpers";

export function FormLogin({ secretKey }: { secretKey?: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(masuk, null);

  return (
    <form action={formAction} className="space-y-5">
      {state && !state.ok ? <PesanAksi result={state} /> : null}

      {secretKey ? <input type="hidden" name="secret_key" value={secretKey} /> : null}

      <TextField
        id="email"
        name="email"
        label="Email"
        type="email"
        wajib
        autoComplete="email"
      />

      <TextField
        id="password"
        name="password"
        label="Kata sandi"
        type="password"
        wajib
        autoComplete="current-password"
      />

      <div className="pt-1 [&>button]:min-h-12 [&>button]:w-full [&>button]:text-md">
        <SubmitButton labelLoading="Memproses…">Masuk</SubmitButton>
      </div>

      <p className="flex items-start gap-2.5 rounded-2xl bg-ivory-100 px-4 py-3 text-xs leading-relaxed text-navy-600">
        <IconInfo className="mt-px size-4 shrink-0 text-navy-500" />
        <span>
          Akun admin dibuat oleh super admin melalui menu Kelola Admin. Hubungi pembina bila Anda
          belum memiliki akses.
        </span>
      </p>
    </form>
  );
}
