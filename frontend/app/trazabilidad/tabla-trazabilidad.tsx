import Link from "next/link";

import type { AccionAuditoria, TipoUsuarioAuditoria } from "@/lib/api";
import { ACCIONES, FECHA_LEGIBLE } from "@/lib/auditoria";
import { ClayBadge, ClayCard } from "../components/ui/clay";
import { TIPOS_USUARIO } from "./tipos";

const ETIQUETA_TIPO = Object.fromEntries(TIPOS_USUARIO.map((t) => [t.valor, t.etiqueta]));

const COLOR_TIPO: Record<TipoUsuarioAuditoria, "blue" | "mint" | "lavender" | "peach"> = {
  administrador: "lavender",
  recepcionista: "blue",
  operario: "mint",
  cliente: "peach",
};

export default function TablaTrazabilidad({ acciones }: { acciones: AccionAuditoria[] }) {
  if (acciones.length === 0) {
    return (
      <ClayCard>
        <p className="text-sm text-(--sw-ink-soft)">No hay acciones registradas para este filtro.</p>
      </ClayCard>
    );
  }

  return (
    <ClayCard className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs font-bold tracking-wide text-(--sw-ink-soft) uppercase">
            <th className="px-5 py-3">Usuario</th>
            <th className="px-5 py-3">Tipo</th>
            <th className="px-5 py-3">Accion</th>
            <th className="px-5 py-3">Detalle</th>
            <th className="px-5 py-3">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {acciones.map((accion) => {
            const etiquetaAccion = ACCIONES[accion.accion];
            return (
              <tr key={accion.id} className="border-t border-(--sw-bg-deep)">
                <td className="px-5 py-3 font-semibold text-(--sw-ink)">
                  {accion.usuario_id ? (
                    <Link href={`/usuarios/${accion.usuario_id}/historial`} className="hover:underline">
                      {accion.usuario}
                    </Link>
                  ) : (
                    accion.usuario
                  )}
                </td>
                <td className="px-5 py-3">
                  <ClayBadge color={COLOR_TIPO[accion.tipo_usuario]}>
                    {ETIQUETA_TIPO[accion.tipo_usuario] ?? accion.tipo_usuario}
                  </ClayBadge>
                </td>
                <td className="px-5 py-3">
                  <ClayBadge color={etiquetaAccion?.color}>{etiquetaAccion?.etiqueta ?? accion.accion}</ClayBadge>
                </td>
                <td className="px-5 py-3 text-(--sw-ink-soft)">{accion.detalle}</td>
                <td className="px-5 py-3 whitespace-nowrap text-(--sw-ink-soft)">
                  {FECHA_LEGIBLE.format(new Date(accion.fecha))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ClayCard>
  );
}
