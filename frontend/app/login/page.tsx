"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { api } from "@/lib/api";
import { ClayButton, ClayCard, ClayField, ClayInput } from "../components/ui/clay";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    let response: Response;
    try {
      response = await api("/auth/login", {
        method: "POST",
        body: {
          username: form.get("username"),
          password: form.get("password"),
        },
      });
    } catch {
      // El backend no responde: sin esto el boton se queda en "Ingresando...".
      setError("No hay conexion con el servidor. Intentalo de nuevo.");
      setPending(false);
      return;
    }

    if (response.ok) {
      router.replace("/");
      router.refresh();
      return;
    }

    const data = (await response.json().catch(() => ({}))) as {
      detail?: string;
    };
    setError(data.detail ?? "No fue posible iniciar sesion.");
    setPending(false);
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-sm flex-col justify-center p-4 sm:p-8">
      <ClayCard>
        <h1 className="text-2xl font-extrabold tracking-tight text-(--sw-ink)">
          Smart<span className="text-[#5b8fb0]">Wash</span>
        </h1>
        <p className="mt-1 text-sm text-(--sw-ink-soft)">
          Ingresa con tu usuario y contrasena.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <ClayField label="Usuario">
            <ClayInput name="username" autoComplete="username" required />
          </ClayField>

          <ClayField label="Contrasena">
            <ClayInput
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </ClayField>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <ClayButton type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "Ingresando..." : "Iniciar sesion"}
          </ClayButton>
        </form>

        <Link
          href="/recuperar-password"
          className="mt-5 block text-center text-xs font-semibold text-(--sw-ink-soft) hover:text-(--sw-ink) hover:underline"
        >
          Olvidaste tu contrasena?
        </Link>
      </ClayCard>
    </main>
  );
}
