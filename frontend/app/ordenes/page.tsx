import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser, getOrdenes } from "@/lib/api";
import { AvisoPendiente } from "../components/ui/clay";
import TablaOrdenes from "./tabla-ordenes";

export default async function OrdenesPage() {
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);
  if (!user) redirect("/login");

  const ordenes = await getOrdenes(cookieStore);

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-(--sw-ink)">Ordenes</h1>
        <p className="mt-1 text-sm text-(--sw-ink-soft)">
          Sigue el estado de las ordenes en curso (EP04/EP05).
        </p>
      </header>

      {ordenes === null ? (
        <AvisoPendiente>
          GET /api/ordenes todavia no existe: la app ordenes solo tiene los
          modelos Orden, Prenda y OrdenServicio. Esta pantalla ya esta lista
          para listar en cuanto se agreguen el serializer y el viewset.
        </AvisoPendiente>
      ) : (
        <TablaOrdenes ordenes={ordenes} />
      )}
    </main>
  );
}
