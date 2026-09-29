"use client";

import { useState, type FormEvent } from "react";

import { crearTarifa, type Servicio, type TipoPrenda } from "@/lib/api";
import { cx } from "@/lib/cx";
import { AvisoPendiente, ClayButton, ClayField, ClayInput, ClaySelect } from "../components/ui/clay";

export default function TarifaForm({
  tiposPrenda,
  servicios,
  className,
}: {
  tiposPrenda: TipoPrenda[];
  servicios: Servicio[];
  className?: string;
}) {
  const [pendiente, setPendiente] = useState(false);
  const [pending, setPending] = useState(false);
  const sinCatalogo = tiposPrenda.length === 0 || servicios.length === 0;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setPendiente(false);

    const form = new FormData(event.currentTarget);
    const response = await crearTarifa({
      tipo_prenda: Number(form.get("tipo_prenda")),
      servicio: Number(form.get("servicio")),
      valor: String(form.get("valor") ?? "0"),
      plazo_entrega_dias: Number(form.get("plazo_entrega_dias") ?? 1),
      vigente_desde: String(form.get("vigente_desde") ?? ""),
      vigente_hasta: null,
    }).catch(() => null);
    setPending(false);

    if (response?.ok) {
      event.currentTarget.reset();
    } else {
      setPendiente(true);
    }
  }

  // Sin tipos de prenda ni servicios no hay de donde elegir: mostramos el
  // aviso en vez de un formulario con selects vacios.
  if (sinCatalogo) {
    return (
      <AvisoPendiente>
        GET /api/catalogo/tipos-prenda y /api/catalogo/servicios todavia no
        existen: sin ellos no hay de donde elegir tipo de prenda ni servicio
        para una tarifa nueva. El formulario aparece en cuanto esos endpoints
        respondan.
      </AvisoPendiente>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cx("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      <ClayField label="Tipo de prenda">
        <ClaySelect name="tipo_prenda" required>
          {tiposPrenda.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </option>
          ))}
        </ClaySelect>
      </ClayField>
      <ClayField label="Servicio">
        <ClaySelect name="servicio" required>
          {servicios.map((servicio) => (
            <option key={servicio.id} value={servicio.id}>
              {servicio.nombre}
            </option>
          ))}
        </ClaySelect>
      </ClayField>
      <ClayField label="Valor (COP)">
        <ClayInput name="valor" type="number" min="0" step="0.01" required />
      </ClayField>
      <ClayField label="Plazo de entrega (dias)">
        <ClayInput name="plazo_entrega_dias" type="number" min="1" required />
      </ClayField>
      <ClayField label="Vigente desde">
        <ClayInput name="vigente_desde" type="date" required />
      </ClayField>

      <div className="sm:col-span-2">
        <ClayButton type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Agregar tarifa"}
        </ClayButton>
      </div>

      {pendiente && (
        <div className="sm:col-span-2">
          <AvisoPendiente>
            POST /api/catalogo/tarifas todavia no existe. El formulario queda
            listo para HU07.
          </AvisoPendiente>
        </div>
      )}
    </form>
  );
}
