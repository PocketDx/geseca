"use client";

import { useState, type FormEvent } from "react";

import { crearServicio } from "@/lib/api";
import { cx } from "@/lib/cx";
import { AvisoPendiente, ClayButton, ClayField, ClayInput } from "../components/ui/clay";

export default function ServicioForm({ className }: { className?: string }) {
  const [pendiente, setPendiente] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setPendiente(false);

    const form = new FormData(event.currentTarget);
    const response = await crearServicio({
      nombre: String(form.get("nombre") ?? ""),
      descripcion: String(form.get("descripcion") ?? ""),
    }).catch(() => null);
    setPending(false);

    if (response?.ok) {
      event.currentTarget.reset();
    } else {
      setPendiente(true);
    }
  }

  return (
    <form onSubmit={onSubmit} className={cx("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      <ClayField label="Nombre del servicio">
        <ClayInput name="nombre" placeholder="Lavado, planchado, lavado en seco..." required />
      </ClayField>
      <ClayField label="Descripcion">
        <ClayInput name="descripcion" />
      </ClayField>

      <div className="sm:col-span-2">
        <ClayButton type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Agregar servicio"}
        </ClayButton>
      </div>

      {pendiente && (
        <div className="sm:col-span-2">
          <AvisoPendiente>
            POST /api/catalogo/servicios todavia no existe: catalogo solo
            tiene los modelos Servicio, TipoPrenda y Tarifa. El formulario
            queda listo para HU07.
          </AvisoPendiente>
        </div>
      )}
    </form>
  );
}
