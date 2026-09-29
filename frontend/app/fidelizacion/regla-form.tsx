"use client";

import { useState, type FormEvent } from "react";

import { crearReglaDescuento, type Cliente, type ReglaDescuento } from "@/lib/api";
import { cx } from "@/lib/cx";
import { AvisoPendiente, ClayButton, ClayField, ClayInput, ClaySelect } from "../components/ui/clay";

const CLASIFICACIONES: Cliente["clasificacion"][] = ["Ocasional", "Frecuente", "VIP"];

export default function ReglaDescuentoForm({ className }: { className?: string }) {
  const [pendiente, setPendiente] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setPendiente(false);

    const form = new FormData(event.currentTarget);
    const clasificacion = String(form.get("clasificacion_cliente") ?? "");
    const datos: Omit<ReglaDescuento, "id"> = {
      nombre: String(form.get("nombre") ?? ""),
      tipo: (form.get("tipo") as ReglaDescuento["tipo"]) ?? "porcentaje",
      valor: String(form.get("valor") ?? "0"),
      clasificacion_cliente: (clasificacion || "") as ReglaDescuento["clasificacion_cliente"],
      activa: form.get("activa") === "on",
      vigente_desde: String(form.get("vigente_desde") ?? ""),
      vigente_hasta: null,
    };

    const response = await crearReglaDescuento(datos).catch(() => null);
    setPending(false);

    if (response?.ok) {
      event.currentTarget.reset();
    } else {
      setPendiente(true);
    }
  }

  return (
    <form onSubmit={onSubmit} className={cx("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      <ClayField label="Nombre de la regla">
        <ClayInput name="nombre" placeholder="Descuento clientes VIP" required />
      </ClayField>
      <ClayField label="Tipo">
        <ClaySelect name="tipo" defaultValue="porcentaje" required>
          <option value="porcentaje">Porcentaje</option>
          <option value="monto_fijo">Monto fijo</option>
        </ClaySelect>
      </ClayField>
      <ClayField label="Valor">
        <ClayInput name="valor" type="number" min="0" step="0.01" required />
      </ClayField>
      <ClayField label="Clasificacion del cliente">
        <ClaySelect name="clasificacion_cliente" defaultValue="">
          <option value="">Cualquiera</option>
          {CLASIFICACIONES.map((clasificacion) => (
            <option key={clasificacion} value={clasificacion}>
              {clasificacion}
            </option>
          ))}
        </ClaySelect>
      </ClayField>
      <ClayField label="Vigente desde">
        <ClayInput name="vigente_desde" type="date" required />
      </ClayField>
      <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-(--sw-ink-soft)">
        <input name="activa" type="checkbox" defaultChecked className="size-4" />
        Activa desde que se crea
      </label>

      <div className="sm:col-span-2">
        <ClayButton type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Crear regla"}
        </ClayButton>
      </div>

      {pendiente && (
        <div className="sm:col-span-2">
          <AvisoPendiente>
            POST /api/fidelizacion/reglas-descuento todavia no existe: la app
            fidelizacion ni siquiera esta creada (ver plot.md, EP08 pendiente).
            El formulario queda listo para HU08.
          </AvisoPendiente>
        </div>
      )}
    </form>
  );
}
