import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser, getUsuarios } from "@/lib/api";
import { AvisoPendiente, ClayCard } from "../components/ui/clay";
import UsuarioForm from "./usuario-form";
import TablaUsuarios from "./tabla-usuarios";

export default async function UsuariosPage() {
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);
  if (!user) redirect("/login");

  const usuarios = await getUsuarios(cookieStore);

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-(--sw-ink)">
          Usuarios internos
        </h1>
        <p className="mt-1 text-sm text-(--sw-ink-soft)">
          Crea, edita y desactiva usuarios asignandoles un rol. El
          historial de cada usuario esta en su fila.
        </p>
      </header>

      <ClayCard className="mb-6">
        <h2 className="text-sm font-bold text-(--sw-ink)">Nuevo usuario</h2>
        <UsuarioForm className="mt-4" />
      </ClayCard>

      {usuarios === null ? (
        <AvisoPendiente>
          No se pudo cargar la lista de usuarios. Recarga la pagina o intenta de nuevo mas tarde.
        </AvisoPendiente>
      ) : (
        <TablaUsuarios usuarios={usuarios} />
      )}
    </main>
  );
}
