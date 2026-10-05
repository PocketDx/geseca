"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { actualizarTarifa, type Servicio, type Tarifa, type TipoPrenda } from "@/lib/api";
import { formatCOP, formatFecha } from "@/lib/format";
import { ClayBadge, ClayButton, ClayCard, ClayInput } from "../components/ui/clay";
import { AlertaErrores, mensajesDeError } from "./errores";
import { ETIQUETAS_TARIFA } from "./tarifa-form";

export default function TablaTarifas({
  tarifas,
  tiposPrenda,
  servicios,
}: {
  tarifas: Tarifa[];
  tiposPrenda: TipoPrenda[];
  servicios: Servicio[];
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<Tarifa | null>(null);
  const [valor, setValor] = useState("");
  const [plazo, setPlazo] = useState("");
  const [hasta, setHasta] = useState("");
  const [errores, setErrores] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  if (tarifas.length === 0) {
    return (
      <ClayCard>
        <p className="text-sm text-(--sw-ink-soft)">Todavia no hay tarifas registradas.</p>
      </ClayCard>
    );
  }

  const nombreTipo = (id: number) => tiposPrenda.find((t) => t.id === id)?.nombre ?? `#${id}`;
  const nombreServicio = (id: number) => servicios.find((s) => s.id === id)?.nombre ?? `#${id}`;

  function empezarEdicion(tarifa: Tarifa) {
    setEditando(tarifa);
    setValor(tarifa.valor);
    setPlazo(String(tarifa.plazo_entrega_dias));
    setHasta(tarifa.vigente_hasta ?? "");
    setErrores([]);
  }

  function cancelar() {
    setEditando(null);
    setErrores([]);
  }

  async function guardar() {
    if (!editando) return;
    setPending(true);
    setErrores([]);
    const response = await actualizarTarifa(editando.id, {
      valor,
      plazo_entrega_dias: Number(plazo),
      vigente_hasta: hasta === "" ? null : hasta,
    }).catch(() => null);
    setPending(false);

    if (response?.ok) {
      setEditando(null);
      router.refresh();
      return;
    }
    setErrores(await mensajesDeError(response, ETIQUETAS_TARIFA, "No se pudo actualizar la tarifa"));
  }

  return (
    <ClayCard className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs font-bold tracking-wide text-(--sw-ink-soft) uppercase">
            <th className="px-5 py-3">Prenda</th>
            <th className="px-5 py-3">Servicio</th>
            <th className="px-5 py-3">Valor</th>
            <th className="px-5 py-3">Plazo</th>
            <th className="px-5 py-3">Vigencia</th>
            <th className="px-5 py-3">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tarifas.map((tarifa) => {
            const enEdicion = editando?.id === tarifa.id;
            return (
              <FilaTarifa
                key={tarifa.id}
                tarifa={tarifa}
                prenda={nombreTipo(tarifa.tipo_prenda)}
                servicio={nombreServicio(tarifa.servicio)}
                enEdicion={enEdicion}
                deshabilitado={editando !== null && !enEdicion}
                valor={valor}
                plazo={plazo}
                hasta={hasta}
                pending={pending}
                errores={enEdicion ? errores : []}
                onValor={setValor}
                onPlazo={setPlazo}
                onHasta={setHasta}
                onEditar={() => empezarEdicion(tarifa)}
                onGuardar={guardar}
                onCancelar={cancelar}
              />
            );
          })}
        </tbody>
      </table>
    </ClayCard>
  );
}

function FilaTarifa({
  tarifa,
  prenda,
  servicio,
  enEdicion,
  deshabilitado,
  valor,
  plazo,
  hasta,
  pending,
  errores,
  onValor,
  onPlazo,
  onHasta,
  onEditar,
  onGuardar,
  onCancelar,
}: {
  tarifa: Tarifa;
  prenda: string;
  servicio: string;
  enEdicion: boolean;
  deshabilitado: boolean;
  valor: string;
  plazo: string;
  hasta: string;
  pending: boolean;
  errores: string[];
  onValor: (valor: string) => void;
  onPlazo: (plazo: string) => void;
  onHasta: (hasta: string) => void;
  onEditar: () => void;
  onGuardar: () => void;
  onCancelar: () => void;
}) {
  return (
    <>
      <tr className="border-t border-(--sw-bg-deep)">
        <td className="px-5 py-3 font-semibold text-(--sw-ink)">{prenda}</td>
        <td className="px-5 py-3 text-(--sw-ink-soft)">{servicio}</td>
        {enEdicion ? (
          <>
            <td className="px-5 py-3">
              <ClayInput
                aria-label="Valor (COP)"
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(event) => onValor(event.target.value)}
                className="min-w-24"
                required
              />
            </td>
            <td className="px-5 py-3">
              <ClayInput
                aria-label="Plazo de entrega (dias)"
                type="number"
                min="1"
                value={plazo}
                onChange={(event) => onPlazo(event.target.value)}
                className="min-w-16"
                required
              />
            </td>
            <td className="px-5 py-3">
              <ClayInput
                aria-label="Vigente hasta"
                type="date"
                value={hasta}
                onChange={(event) => onHasta(event.target.value)}
                className="min-w-36"
              />
            </td>
            <td className="px-5 py-3">
              <div className="flex flex-wrap gap-2">
                <ClayButton type="button" onClick={onGuardar} disabled={pending}>
                  {pending ? "Guardando..." : "Guardar"}
                </ClayButton>
                <ClayButton type="button" variant="secundario" onClick={onCancelar} disabled={pending}>
                  Cancelar
                </ClayButton>
              </div>
            </td>
          </>
        ) : (
          <>
            <td className="px-5 py-3 font-semibold text-(--sw-ink) tabular-nums">
              {formatCOP(tarifa.valor)}
            </td>
            <td className="px-5 py-3 text-(--sw-ink-soft)">{tarifa.plazo_entrega_dias} dias</td>
            <td className="px-5 py-3">
              <ClayBadge color={tarifa.vigente_hasta ? "peach" : "mint"}>
                {tarifa.vigente_hasta ? `Hasta ${formatFecha(tarifa.vigente_hasta)}` : "Vigente"}
              </ClayBadge>
            </td>
            <td className="px-5 py-3">
              <ClayButton type="button" variant="secundario" onClick={onEditar} disabled={deshabilitado}>
                Editar
              </ClayButton>
            </td>
          </>
        )}
      </tr>
      {errores.length > 0 && (
        <tr>
          <td colSpan={6} className="px-5 pb-3">
            <AlertaErrores titulo="No se pudo actualizar la tarifa" errores={errores} />
          </td>
        </tr>
      )}
    </>
  );
}
