import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  getCurrentUser,
  getHistorialUsuario,
  getUsuario,
  type HistorialAccion,
} from "@/lib/api";
import { ACCIONES, DIA_ISO, FECHA_LEGIBLE } from "@/lib/auditoria";
import { ClayBadge, ClayCard } from "../../../components/ui/clay";
import FiltroFechas from "./filtro-fechas";

function fechaValida(valor?: string): string | undefined {
  return valor && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : undefined;
}

function filtrarPorFechas(historial: HistorialAccion[], desde?: string, hasta?: string) {
  return historial.filter((entrada) => {
    const dia = DIA_ISO.format(new Date(entrada.fecha));
    return (!desde || dia >= desde) && (!hasta || dia <= hasta);
  });
}

function Mensaje({ children }: { children: string }) {
  return (
    <ClayCard>
      <p className="text-sm text-(--sw-ink-soft)">{children}</p>
    </ClayCard>
  );
}

export default async function HistorialUsuarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);
  if (!user) redirect("/login");
  if (user.rol !== "administrador") redirect("/");

  const id = Number((await params).id);
  const filtros = await searchParams;
  const desde = fechaValida(filtros.desde);
  const hasta = fechaValida(filtros.hasta);

  const [usuario, historial] = await Promise.all([
    getUsuario(id, cookieStore),
    getHistorialUsuario(id, cookieStore),
  ]);
  const entradas = historial && filtrarPorFechas(historial, desde, hasta);

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-6">
        <Link href="/usuarios" className="text-sm text-(--sw-ink-soft) hover:underline">
          ← Usuarios internos
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-(--sw-ink)">
          Historial de acciones
        </h1>
        <p className="mt-1 text-sm text-(--sw-ink-soft)">
          {usuario ? usuario.username : `Usuario #${id}`}
        </p>
      </header>

      {historial === null || entradas === null ? (
        <Mensaje>No se pudo cargar el historial. Verifica que el backend este en ejecucion.</Mensaje>
      ) : (
        <>
          <ClayCard className="mb-6">
            <FiltroFechas usuarioId={id} desde={desde} hasta={hasta} />
          </ClayCard>

          {historial.length === 0 ? (
            <Mensaje>Este usuario no tiene acciones registradas.</Mensaje>
          ) : entradas.length === 0 ? (
            <Mensaje>No hay registros para el filtro aplicado.</Mensaje>
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
                  {entradas.map((entrada) => {
                    const accion = ACCIONES[entrada.accion];
                    return (
                      <tr key={entrada.id} className="border-t border-(--sw-bg-deep)">
                        <td className="px-5 py-3 whitespace-nowrap text-(--sw-ink-soft)">
                          {FECHA_LEGIBLE.format(new Date(entrada.fecha))}
                        </td>
                        <td className="px-5 py-3">
                          <ClayBadge color={accion?.color}>{accion?.etiqueta ?? entrada.accion}</ClayBadge>
                        </td>
                        <td className="px-5 py-3 text-(--sw-ink-soft)">{entrada.detalle}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ClayCard>
          )}
        </>
      )}
    </main>
  );
}
