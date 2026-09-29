import type { ReglaDescuento } from "@/lib/api";
import { formatCOP, formatFecha } from "@/lib/format";
import { ClayBadge, ClayCard } from "../components/ui/clay";

export default function TablaReglas({ reglas }: { reglas: ReglaDescuento[] }) {
  if (reglas.length === 0) {
    return (
      <ClayCard>
        <p className="text-sm text-(--sw-ink-soft)">Todavia no hay reglas de descuento.</p>
      </ClayCard>
    );
  }

  return (
    <ClayCard className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs font-bold tracking-wide text-(--sw-ink-soft) uppercase">
            <th className="px-5 py-3">Regla</th>
            <th className="px-5 py-3">Valor</th>
            <th className="px-5 py-3">Aplica a</th>
            <th className="px-5 py-3">Desde</th>
            <th className="px-5 py-3">Estado</th>
          </tr>
        </thead>
        <tbody>
          {reglas.map((regla) => (
            <tr key={regla.id} className="border-t border-(--sw-bg-deep)">
              <td className="px-5 py-3 font-semibold text-(--sw-ink)">{regla.nombre}</td>
              <td className="px-5 py-3 text-(--sw-ink-soft) tabular-nums">
                {regla.tipo === "porcentaje" ? `${regla.valor}%` : formatCOP(regla.valor)}
              </td>
              <td className="px-5 py-3 text-(--sw-ink-soft)">
                {regla.clasificacion_cliente || "Cualquier cliente"}
              </td>
              <td className="px-5 py-3 text-(--sw-ink-soft)">{formatFecha(regla.vigente_desde)}</td>
              <td className="px-5 py-3">
                <ClayBadge color={regla.activa ? "mint" : "peach"}>
                  {regla.activa ? "Activa" : "Inactiva"}
                </ClayBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ClayCard>
  );
}
