"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import { confirmarRecuperacionPassword, leerErroresApi } from "@/lib/api";
import { ClayButton, ClayCard, ClayField, ClayInput } from "../components/ui/clay";

export default function RestablecerPasswordPage() {
  return (
    <Suspense>
      <RestablecerPasswordForm />
    </Suspense>
  );
}

function RestablecerPasswordForm() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [completado, setCompletado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmacion = String(form.get("confirmacion") ?? "");

    if (password !== confirmacion) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    setPending(true);
    const response = await confirmarRecuperacionPassword(uid, token, password).catch(() => null);
    setPending(false);

    if (response?.ok) {
      setCompletado(true);
    } else if (response) {
      const errores = await leerErroresApi(response);
      setError(
        Object.values(errores).flat().join(" ") || "No se pudo actualizar la contrasena.",
      );
    } else {
      setError("No hay conexion con el servidor. Intenta de nuevo.");
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-sm flex-col justify-center p-4 sm:p-8">
      <ClayCard>
        <h1 className="text-xl font-extrabold tracking-tight text-(--sw-ink)">
          Restablecer contrasena
        </h1>
        <p className="mt-1 text-sm text-(--sw-ink-soft)">
          Elige una contrasena nueva para tu cuenta.
        </p>

        {completado ? (
          <p className="mt-6 text-sm text-(--sw-ink)">
            Tu contrasena quedo actualizada. Ya puedes iniciar sesion con ella.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <ClayField label="Contrasena nueva">
              <ClayInput
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </ClayField>

            <ClayField label="Confirmar contrasena">
              <ClayInput
                name="confirmacion"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </ClayField>

            {error && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <div className="mt-2 flex gap-3">
              <Link href="/login" className="flex-1">
                <ClayButton type="button" variant="secundario" className="w-full">
                  Cancelar
                </ClayButton>
              </Link>
              <ClayButton type="submit" disabled={pending} className="flex-1">
                {pending ? "Guardando..." : "Guardar"}
              </ClayButton>
            </div>
          </form>
        )}

        <Link
          href="/login"
          className="mt-5 block text-center text-xs font-semibold text-(--sw-ink-soft) hover:text-(--sw-ink) hover:underline"
        >
          Volver a iniciar sesion
        </Link>
      </ClayCard>
    </main>
  );
}