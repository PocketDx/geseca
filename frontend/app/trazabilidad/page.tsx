import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser, getTrazabilidad, type TipoUsuarioAuditoria } from "@/lib/api";
import { AvisoPendiente } from "../components/ui/clay";
import FiltroTipo from "./filtro-tipo";
import TablaTrazabilidad from "./tabla-trazabilidad";
import { TIPOS_USUARIO } from "./tipos";

export default async function TrazabilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string }>;
}) {
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);
  if (!user) redirect("/login");

  const { rol } = await searchParams;
  const rolValido = TIPOS_USUARIO.some((t) => t.valor === rol)
    ? (rol as TipoUsuarioAuditoria)
    : undefined;

  const acciones = await getTrazabilidad(cookieStore, rolValido);

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-(--sw-ink)">
            Trazabilidad
          </h1>
          <p className="mt-1 text-sm text-(--sw-ink-soft)">
            Seguimiento a las acciones de cada tipo de usuario: administrador,
            recepcionista, operario y cliente.
          </p>
        </div>
        <FiltroTipo tipoActual={rolValido} />
      </header>

      {acciones === null ? (
        <AvisoPendiente>
          GET /api/usuarios/trazabilidad todavia no existe: el backend no
          tiene modelo de auditoria (lo mismo que bloquea a HU04, el
          historial por usuario). Esta pantalla ya esta lista para listar y
          filtrar por tipo de usuario (?rol=administrador|recepcionista|
          operario|cliente) en cuanto exista el endpoint.
        </AvisoPendiente>
      ) : (
        <TablaTrazabilidad acciones={acciones} />
      )}
    </main>
  );
}
