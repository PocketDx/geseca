"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { solicitarRecuperacionPassword } from "@/lib/api";
import { ClayButton, ClayCard, ClayField, ClayInput, clayBtnClass } from "../components/ui/clay";

export default function RecuperarPasswordPage() {
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const identificador = String(form.get("identificador") ?? "");

    const response = await solicitarRecuperacionPassword(identificador).catch(() => null);
    setPending(false);

    if (response?.ok) {
      setEnviado(true);
    } else if (response?.status === 429) {
      setError("Demasiadas solicitudes. Espera un momento antes de intentarlo de nuevo.");
    } else {
      setError("No se pudo enviar la solicitud. Intenta de nuevo.");
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-md flex-col justify-center px-4 py-8 sm:px-8">
      <ClayCard>
        <h1 className="font-sans text-3xl font-black tracking-[-0.04em] text-(--sw-ink)">
          Recuperar contrasena
        </h1>
        <p className="mt-1 text-sm text-(--sw-ink-soft)">
          Ingresa tu usuario o correo y te enviaremos las instrucciones.
        </p>

        {enviado ? (
          <p className="mt-6 text-sm text-(--sw-ink)">
            Si la cuenta existe, recibiras un correo con los pasos a seguir.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <ClayField label="Usuario o correo">
              <ClayInput name="identificador" autoComplete="username" required />
            </ClayField>

            <div className="mt-1 flex gap-3">
              <Link href="/login" className={clayBtnClass("secundario") + " flex-1"}>
                Cancelar
              </Link>
              <ClayButton type="submit" disabled={pending} className="flex-1">
                {pending ? "Enviando..." : "Enviar instrucciones"}
              </ClayButton>
            </div>
          </form>
        )}

        {error && (
          <p role="alert" className="mt-5 text-sm font-medium text-(--sw-danger)">
            {error}
          </p>
        )}

        <Link
          href="/login"
          className="mt-3 flex min-h-11 items-center justify-center text-xs font-bold text-(--sw-ink-soft) hover:text-(--sw-ink) hover:underline"
        >
          Volver a iniciar sesion
        </Link>
      </ClayCard>
    </main>
  );
}
