import type { Cliente } from "@/lib/api";
import { ClayBadge, ClayCard } from "../components/ui/clay";

export default function TablaClientes({ clientes }: { clientes: Cliente[] }) {
  if (clientes.length === 0) {
    return (
      <ClayCard>
        <p className="text-sm text-(--sw-ink-soft)">Todavia no hay clientes registrados.</p>
      </ClayCard>
    );
  }

  return (
    <ClayCard className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs font-bold tracking-wide text-(--sw-ink-soft) uppercase">
            <th className="px-5 py-3">Nombre</th>
            <th className="px-5 py-3">Documento</th>
            <th className="px-5 py-3">Telefono</th>
            <th className="px-5 py-3">Clasificacion</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <tr key={cliente.id} className="border-t border-(--sw-bg-deep)">
              <td className="px-5 py-3 font-semibold text-(--sw-ink)">{cliente.nombre_completo}</td>
              <td className="px-5 py-3 text-(--sw-ink-soft)">{cliente.documento}</td>
              <td className="px-5 py-3 text-(--sw-ink-soft)">{cliente.telefono}</td>
              <td className="px-5 py-3">
                <ClayBadge color="mint">{cliente.clasificacion}</ClayBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ClayCard>
  );
}
