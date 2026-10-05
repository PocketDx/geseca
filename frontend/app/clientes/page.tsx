import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getClientes, getCurrentUser } from "@/lib/api";
import { ClayCard } from "../components/ui/clay";
import ClienteForm from "./cliente-form";
import TablaClientes from "./tabla-clientes";

export default async function ClientesPage() {
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);
  if (!user) redirect("/login");
  if (user.rol === "operario") redirect("/");

  const clientes = await getClientes(cookieStore);

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-(--sw-ink)">Clientes</h1>
        <p className="mt-1 text-sm text-(--sw-ink-soft)">
          Registra y edita los datos de tus clientes.
        </p>
      </header>

      <ClayCard className="mb-6">
        <h2 className="text-sm font-bold text-(--sw-ink)">Nuevo cliente</h2>
        <ClienteForm className="mt-4" />
      </ClayCard>

      {clientes === null ? (
        <ClayCard>
          <p className="text-sm text-(--sw-ink-soft)">
            No se pudieron cargar los clientes. Verifica que el backend este en ejecucion.
          </p>
        </ClayCard>
      ) : (
        <TablaClientes clientes={clientes} />
      )}
    </main>
  );
}
