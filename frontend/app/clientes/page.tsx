import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getClientes, getCurrentUser } from "@/lib/api";
import { AvisoPendiente, ClayCard } from "../components/ui/clay";
import ClienteForm from "./cliente-form";
import TablaClientes from "./tabla-clientes";

export default async function ClientesPage() {
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);
  if (!user) redirect("/login");

  const clientes = await getClientes(cookieStore);

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-(--sw-ink)">Clientes</h1>
        <p className="mt-1 text-sm text-(--sw-ink-soft)">
          Registra y edita los datos de tus clientes (HU05).
        </p>
      </header>

      <ClayCard className="mb-6">
        <h2 className="text-sm font-bold text-(--sw-ink)">Nuevo cliente</h2>
        <ClienteForm className="mt-4" />
      </ClayCard>

      {clientes === null ? (
        <AvisoPendiente>
          GET /api/clientes todavia no existe: la app clientes solo tiene el
          modelo (ver plot.md). Esta pantalla ya esta lista para listar y
          editar en cuanto se agregue el serializer y el viewset.
        </AvisoPendiente>
      ) : (
        <TablaClientes clientes={clientes} />
      )}
    </main>
  );
}
