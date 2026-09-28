import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser, getHistorialUsuario } from "@/lib/api";
import { AvisoPendiente, ClayCard } from "../../../components/ui/clay";

export default async function HistorialUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);
  if (!user) redirect("/login");

  const historial = await getHistorialUsuario(Number(id), cookieStore);

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-(--sw-ink)">
          Historial de acciones
        </h1>
        <p className="mt-1 text-sm text-(--sw-ink-soft)">Usuario #{id} (HU04).</p>
      </header>

      {historial === null ? (
        <AvisoPendiente>
          GET /api/usuarios/{id}/historial todavia no existe: el backend no
          tiene modelo de auditoria. Esta pantalla ya esta lista para listar
          accion, detalle y fecha en cuanto se implemente HU04.
        </AvisoPendiente>
      ) : historial.length === 0 ? (
        <ClayCard>
          <p className="text-sm text-(--sw-ink-soft)">Sin acciones registradas.</p>
        </ClayCard>
      ) : (
        <ClayCard className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-bold tracking-wide text-(--sw-ink-soft) uppercase">
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Accion</th>
                <th className="px-5 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((entrada) => (
                <tr key={entrada.id} className="border-t border-(--sw-bg-deep)">
                  <td className="px-5 py-3 text-(--sw-ink-soft)">{entrada.fecha}</td>
                  <td className="px-5 py-3 font-semibold text-(--sw-ink)">{entrada.accion}</td>
                  <td className="px-5 py-3 text-(--sw-ink-soft)">{entrada.detalle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ClayCard>
      )}
    </main>
  );
}
