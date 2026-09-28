import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser, getServicios, getTarifas, getTiposPrenda } from "@/lib/api";
import { AvisoPendiente, ClayCard } from "../components/ui/clay";
import ServicioForm from "./servicio-form";
import TarifaForm from "./tarifa-form";
import TablaTarifas from "./tabla-tarifas";

export default async function CatalogoPage() {
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);
  if (!user) redirect("/login");

  const [tiposPrenda, servicios, tarifas] = await Promise.all([
    getTiposPrenda(cookieStore),
    getServicios(cookieStore),
    getTarifas(cookieStore),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-(--sw-ink)">Catalogo</h1>
        <p className="mt-1 text-sm text-(--sw-ink-soft)">
          Administra servicios y sus tarifas por tipo de prenda (HU07).
        </p>
      </header>

      <ClayCard className="mb-6">
        <h2 className="text-sm font-bold text-(--sw-ink)">Nuevo servicio</h2>
        <ServicioForm className="mt-4" />
      </ClayCard>

      <ClayCard className="mb-6">
        <h2 className="text-sm font-bold text-(--sw-ink)">Nueva tarifa</h2>
        <div className="mt-4">
          <TarifaForm tiposPrenda={tiposPrenda ?? []} servicios={servicios ?? []} />
        </div>
      </ClayCard>

      {tarifas === null ? (
        <AvisoPendiente>
          GET /api/catalogo/tarifas (y /servicios, /tipos-prenda) todavia no
          existen: catalogo solo tiene los modelos. Esta pantalla ya esta
          lista para listar en cuanto se agreguen los endpoints.
        </AvisoPendiente>
      ) : (
        <TablaTarifas
          tarifas={tarifas}
          tiposPrenda={tiposPrenda ?? []}
          servicios={servicios ?? []}
        />
      )}
    </main>
  );
}
