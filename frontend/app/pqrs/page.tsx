import { ClayCard } from "../components/ui/clay";
import PqrsForm from "./pqrs-form";

export default function PqrsPage() {
  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-(--sw-ink)">PQRS</h1>
        <p className="mt-1 text-sm text-(--sw-ink-soft)">
          Peticiones, quejas, reclamos y sugerencias. No necesitas iniciar sesion.
        </p>
      </header>

      <ClayCard>
        <PqrsForm />
      </ClayCard>
    </main>
  );
}
