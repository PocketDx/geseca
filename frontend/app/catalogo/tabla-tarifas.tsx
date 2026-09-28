import type { Servicio, Tarifa, TipoPrenda } from "@/lib/api";
import { formatCOP, formatFecha } from "@/lib/format";
import { ClayBadge, ClayCard } from "../components/ui/clay";

export default function TablaTarifas({
  tarifas,
  tiposPrenda,
  servicios,
}: {
  tarifas: Tarifa[];
  tiposPrenda: TipoPrenda[];
  servicios: Servicio[];
}) {
  if (tarifas.length === 0) {
    return (
      <ClayCard>
        <p className="text-sm text-(--sw-ink-soft)">Todavia no hay tarifas registradas.</p>
      </ClayCard>
    );
  }

  const nombreTipo = (id: number) => tiposPrenda.find((t) => t.id === id)?.nombre ?? `#${id}`;
  const nombreServicio = (id: number) => servicios.find((s) => s.id === id)?.nombre ?? `#${id}`;

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
          </tr>
        </thead>
        <tbody>
          {tarifas.map((tarifa) => (
            <tr key={tarifa.id} className="border-t border-(--sw-bg-deep)">
              <td className="px-5 py-3 font-semibold text-(--sw-ink)">{nombreTipo(tarifa.tipo_prenda)}</td>
              <td className="px-5 py-3 text-(--sw-ink-soft)">{nombreServicio(tarifa.servicio)}</td>
              <td className="px-5 py-3 font-semibold text-(--sw-ink) tabular-nums">
                {formatCOP(tarifa.valor)}
              </td>
              <td className="px-5 py-3 text-(--sw-ink-soft)">{tarifa.plazo_entrega_dias} dias</td>
              <td className="px-5 py-3">
                <ClayBadge color={tarifa.vigente_hasta ? "peach" : "mint"}>
                  {tarifa.vigente_hasta ? `Hasta ${formatFecha(tarifa.vigente_hasta)}` : "Vigente"}
                </ClayBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ClayCard>
  );
}
