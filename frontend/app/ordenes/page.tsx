import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser, getOrdenes } from "@/lib/api";
import { AvisoPendiente, Encabezado } from "../components/ui/clay";
import TablaOrdenes from "./tabla-ordenes";

export default async function OrdenesPage() {
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);
  if (!user) redirect("/login");

  const ordenes = await getOrdenes(cookieStore);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
      <Encabezado eyebrow="Operacion · EP04" titulo="Ordenes">
        Sigue el estado de las ordenes en curso (EP04/EP05).
      </Encabezado>

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
