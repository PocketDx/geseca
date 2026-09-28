"use client";

import { useState, type FormEvent } from "react";

import { rastrearOrden, type SeguimientoOrden } from "@/lib/api";
import { AvisoPendiente, ClayBadge, ClayButton, ClayCard, ClayField, ClayInput } from "../components/ui/clay";

export default function RastreoForm() {
  const [resultado, setResultado] = useState<SeguimientoOrden | null>(null);
  const [pendiente, setPendiente] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setPendiente(false);
    setResultado(null);

    const form = new FormData(event.currentTarget);
    const codigo = String(form.get("codigo") ?? "").trim();

    const orden = await rastrearOrden(codigo).catch(() => null);
    setPending(false);

    if (orden) {
      setResultado(orden);
    } else {
      setPendiente(true);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <ClayField label="Codigo de tu pedido">
            <ClayInput name="codigo" placeholder="Ej. SW-2026-00123" required />
          </ClayField>
        </div>
        <ClayButton type="submit" disabled={pending}>
          {pending ? "Buscando..." : "Rastrear"}
        </ClayButton>
      </form>

      {resultado && (
        <ClayCard>
          <p className="text-xs font-extrabold tracking-[0.08em] text-(--sw-ink-soft) uppercase">
            Pedido {resultado.codigo}
          </p>
          <div className="mt-2">
            <ClayBadge>{resultado.estado}</ClayBadge>
          </div>
          {resultado.fecha_estimada_entrega && (
            <p className="mt-3 text-sm text-(--sw-ink-soft)">
              Entrega estimada: {new Date(resultado.fecha_estimada_entrega).toLocaleString("es-CO")}
            </p>
          )}
        </ClayCard>
      )}

      {pendiente && (
        <AvisoPendiente>
          GET /api/ordenes/rastrear todavia no existe: la app ordenes solo
          tiene los modelos. El formulario queda listo para consultar por
          codigo en cuanto se implemente el endpoint (EP04/EP05).
        </AvisoPendiente>
      )}
    </div>
  );
}
