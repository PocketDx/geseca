import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser, getReglasDescuento } from "@/lib/api";
import { ClayCard } from "../components/ui/clay";
import ReglaDescuentoForm from "./regla-form";
import TablaReglas from "./tabla-reglas";

export default async function FidelizacionPage() {
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);
  if (!user) redirect("/login");
  if (user.rol !== "administrador") redirect("/");

  const reglas = await getReglasDescuento(cookieStore);

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-(--sw-ink)">Fidelizacion</h1>
        <p className="mt-1 text-sm text-(--sw-ink-soft)">
          Configura reglas de descuento para tus clientes (HU08).
        </p>
      </header>

      <ClayCard className="mb-6">
        <h2 className="text-sm font-bold text-(--sw-ink)">Nueva regla de descuento</h2>
        <ReglaDescuentoForm className="mt-4" />
      </ClayCard>

      {reglas === null ? (
        <ClayCard>
          <p className="text-sm text-(--sw-ink-soft)">
            No se pudieron cargar las reglas. Verifica que el backend este en ejecucion.
          </p>
        </ClayCard>
      ) : (
        <TablaReglas reglas={reglas} />
      )}
    </main>
  );
}
