import { ClayCard, Encabezado } from "../components/ui/clay";
import PqrsForm from "./pqrs-form";

export default function PqrsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-8 sm:py-12">
      <Encabezado eyebrow="Atencion al cliente" titulo="PQRS">
        Peticiones, quejas, reclamos y sugerencias. No necesitas iniciar sesion.
      </Encabezado>

      <ClayCard>
        <PqrsForm />
      </ClayCard>
    </main>
  );
}
