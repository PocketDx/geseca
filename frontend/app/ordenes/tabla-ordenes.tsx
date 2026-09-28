import type { Orden } from "@/lib/api";
import { formatCOP } from "@/lib/format";
import { ClayBadge, ClayCard } from "../components/ui/clay";

const COLOR_ESTADO: Record<Orden["estado"], "blue" | "mint" | "lavender" | "peach"> = {
  Recibida: "blue",
  Clasificada: "blue",
  "En proceso": "lavender",
  "Control de calidad": "lavender",
  "Lista para entrega": "mint",
  Entregada: "mint",
  Cancelada: "peach",
  "En espera": "peach",
};

export default function TablaOrdenes({ ordenes }: { ordenes: Orden[] }) {
  if (ordenes.length === 0) {
    return (
      <ClayCard>
        <p className="text-sm text-(--sw-ink-soft)">Todavia no hay ordenes registradas.</p>
      </ClayCard>
    );
  }

  return (
    <ClayCard className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs font-bold tracking-wide text-(--sw-ink-soft) uppercase">
            <th className="px-5 py-3">Codigo</th>
            <th className="px-5 py-3">Estado</th>
            <th className="px-5 py-3">Pago</th>
            <th className="px-5 py-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {ordenes.map((orden) => (
            <tr key={orden.id} className="border-t border-(--sw-bg-deep)">
              <td className="px-5 py-3 font-semibold text-(--sw-ink)">{orden.codigo}</td>
              <td className="px-5 py-3">
                <ClayBadge color={COLOR_ESTADO[orden.estado]}>{orden.estado}</ClayBadge>
              </td>
              <td className="px-5 py-3 text-(--sw-ink-soft)">{orden.estado_pago}</td>
              <td className="px-5 py-3 font-semibold text-(--sw-ink) tabular-nums">
                {formatCOP(orden.valor_total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ClayCard>
  );
}
