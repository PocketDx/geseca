import { ClayCard } from "../components/ui/clay";
import RastreoForm from "./rastreo-form";

export default function RastrearPedidoPage() {
  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-(--sw-ink)">
          Rastrea tu pedido
        </h1>
        <p className="mt-1 text-sm text-(--sw-ink-soft)">
          Ingresa el codigo que te dimos al recibir tus prendas. No necesitas una cuenta.
        </p>
      </header>

      <ClayCard>
        <RastreoForm />
      </ClayCard>
    </main>
  );
}
