import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getClientes, getCurrentUser } from "@/lib/api";
import { ClayCard, Encabezado } from "../components/ui/clay";
import ClienteForm from "./cliente-form";
import TablaClientes from "./tabla-clientes";

export default async function ClientesPage() {
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);
  if (!user) redirect("/login");
  if (user.rol === "operario") redirect("/");

  const clientes = await getClientes(cookieStore);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
      <Encabezado eyebrow="Administracion · EP02" titulo="Clientes">
        Registra y edita los datos de tus clientes.
      </Encabezado>

      <ClayCard className="mb-6">
        <h2 className="sw-eyebrow">Nuevo cliente</h2>
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
