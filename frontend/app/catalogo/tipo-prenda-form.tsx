"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { crearTipoPrenda } from "@/lib/api";
import { cx } from "@/lib/cx";
import { ClayButton, ClayField, ClayInput } from "../components/ui/clay";
import { AlertaErrores, mensajesDeError } from "./errores";

const ETIQUETAS = { nombre: "Nombre", material: "Material" };

export default function TipoPrendaForm({ className }: { className?: string }) {
  const router = useRouter();
  const [errores, setErrores] = useState<string[]>([]);
  const [creado, setCreado] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // currentTarget queda en null despues del await.
    const formulario = event.currentTarget;
    setPending(true);
    setErrores([]);
    setCreado(false);

    const form = new FormData(formulario);
    const response = await crearTipoPrenda({
      nombre: String(form.get("nombre") ?? "").trim(),
      material: String(form.get("material") ?? "").trim(),
    }).catch(() => null);
    setPending(false);

    if (response?.ok) {
      formulario.reset();
      setCreado(true);
      router.refresh();
      return;
    }
    setErrores(await mensajesDeError(response, ETIQUETAS, "No se pudo crear el tipo de prenda"));
  }

  return (
    <form onSubmit={onSubmit} className={cx("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      <ClayField label="Nombre del tipo de prenda">
        <ClayInput name="nombre" placeholder="Camisa, pantalon, cobija..." maxLength={80} required />
      </ClayField>
      <ClayField label="Material">
        <ClayInput name="material" placeholder="Algodon, lana..." maxLength={80} />
      </ClayField>

      <div className="flex items-center gap-3 sm:col-span-2">
        <ClayButton type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Agregar tipo de prenda"}
        </ClayButton>
        {creado && (
          <p role="status" className="text-sm text-(--sw-ink-soft)">
            Tipo de prenda creado.
          </p>
        )}
      </div>

      {errores.length > 0 && (
        <div className="sm:col-span-2">
          <AlertaErrores titulo="No se pudo crear el tipo de prenda" errores={errores} />
        </div>
      )}
    </form>
  );
}
