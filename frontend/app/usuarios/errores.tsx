import { leerErroresApi } from "@/lib/api";

const ETIQUETAS: Record<string, string> = {
  username: "Usuario",
  email: "Correo",
  first_name: "Nombres",
  last_name: "Apellidos",
  rol: "Rol",
  password: "Contrasena",
};

export async function mensajesDeError(response: Response | null, accion: string): Promise<string[]> {
  if (!response) return ["No se pudo conectar con el servidor. Intenta de nuevo."];
  const mensajes = Object.entries(await leerErroresApi(response)).flatMap(([campo, lista]) =>
    lista.map((mensaje) => (ETIQUETAS[campo] ? `${ETIQUETAS[campo]}: ${mensaje}` : mensaje)),
  );
  return mensajes.length ? mensajes : [`No se pudo ${accion} (error ${response.status}).`];
}

export function AlertaErrores({ titulo, mensajes }: { titulo: string; mensajes: string[] }) {
  if (mensajes.length === 0) return null;
  return (
    <div role="alert" className="clay-sm border-l-8 border-l-(--sw-coral) p-4 text-sm">
      <p className="font-semibold text-(--sw-ink)">{titulo}</p>
      <ul className="mt-1 list-inside list-disc text-(--sw-ink-soft)">
        {mensajes.map((mensaje) => (
          <li key={mensaje}>{mensaje}</li>
        ))}
      </ul>
    </div>
  );
}
