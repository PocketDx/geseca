"use client";

import { useState, type FormEvent } from "react";

import { crearCliente, type ClienteFormulario } from "@/lib/api";
import { cx } from "@/lib/cx";
import { AvisoPendiente, ClayButton, ClayField, ClayInput } from "../components/ui/clay";

export default function ClienteForm({ className }: { className?: string }) {
  const [pendiente, setPendiente] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setPendiente(false);

    const form = new FormData(event.currentTarget);
    const datos: ClienteFormulario = {
      nombre_completo: String(form.get("nombre_completo") ?? ""),
      documento: String(form.get("documento") ?? ""),
      telefono: String(form.get("telefono") ?? ""),
      correo: String(form.get("correo") ?? ""),
    };

    const response = await crearCliente(datos).catch(() => null);
    setPending(false);

    if (response?.ok) {
      event.currentTarget.reset();
    } else {
      setPendiente(true);
    }
  }

  return (
    <form onSubmit={onSubmit} className={cx("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      <ClayField label="Nombre completo">
        <ClayInput name="nombre_completo" required />
      </ClayField>
      <ClayField label="Documento">
        <ClayInput name="documento" required />
      </ClayField>
      <ClayField label="Telefono">
        <ClayInput name="telefono" required />
      </ClayField>
      <ClayField label="Correo">
        <ClayInput name="correo" type="email" />
      </ClayField>

      <div className="sm:col-span-2">
        <ClayButton type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar cliente"}
        </ClayButton>
      </div>

      {pendiente && (
        <div className="sm:col-span-2">
          <AvisoPendiente>
            POST /api/clientes todavia no existe. El formulario queda listo
            para conectarse cuando se implemente el endpoint de HU05.
          </AvisoPendiente>
        </div>
      )}
    </form>
  );
}
