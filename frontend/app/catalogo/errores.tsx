import { leerErroresApi } from "@/lib/api";

export async function mensajesDeError(
  response: Response | null,
  etiquetas: Record<string, string>,
  porDefecto: string,
): Promise<string[]> {
  if (!response) return ["No se pudo conectar con el servidor. Intenta de nuevo."];
  const mensajes = Object.entries(await leerErroresApi(response)).flatMap(([campo, lista]) =>
    lista.map((mensaje) => (etiquetas[campo] ? `${etiquetas[campo]}: ${mensaje}` : mensaje)),
  );
  return mensajes.length ? mensajes : [`${porDefecto} (error ${response.status}).`];
}

export function AlertaErrores({ titulo, errores }: { titulo: string; errores: string[] }) {
  if (errores.length === 0) return null;
  return (
    <div role="alert" className="clay-sm border-l-4 border-(--sw-peach) p-4 text-sm">
      <p className="font-semibold text-(--sw-ink)">{titulo}</p>
      <ul className="mt-1 list-inside list-disc text-(--sw-ink-soft)">
        {errores.map((mensaje) => (
          <li key={mensaje}>{mensaje}</li>
        ))}
      </ul>
    </div>
  );
}
