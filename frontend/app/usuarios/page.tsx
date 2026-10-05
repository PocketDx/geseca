import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser, getUsuarios } from "@/lib/api";
import { AvisoPendiente, ClayCard, Encabezado } from "../components/ui/clay";
import UsuarioForm from "./usuario-form";
import TablaUsuarios from "./tabla-usuarios";

export default async function UsuariosPage() {
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);
  if (!user) redirect("/login");
  if (user.rol !== "administrador") redirect("/");

  const usuarios = await getUsuarios(cookieStore);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
      <Encabezado eyebrow="Administracion · EP01" titulo="Usuarios internos">
        Crea, edita y desactiva usuarios asignandoles un rol. El historial de cada usuario
        esta en su fila.
      </Encabezado>

      <ClayCard className="mb-6">
        <h2 className="sw-eyebrow">Nuevo usuario</h2>
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
