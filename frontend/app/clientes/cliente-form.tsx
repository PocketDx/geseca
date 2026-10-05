"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  actualizarCliente,
  crearCliente,
  leerErroresApi,
  type Cliente,
  type ClienteFormulario,
} from "@/lib/api";
import { cx } from "@/lib/cx";
import { ClayButton, ClayField, ClayInput } from "../components/ui/clay";

const ETIQUETAS: Record<string, string> = {
  nombre_completo: "Nombre completo",
  documento: "Documento",
  telefono: "Telefono",
  correo: "Correo",
};

export default function ClienteForm({
  cliente,
  onTerminar,
  className,
}: {
  cliente?: Cliente;
  onTerminar?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [errores, setErrores] = useState<string[]>([]);
  const [guardado, setGuardado] = useState(false);
  const [pending, setPending] = useState(false);
  const editando = cliente !== undefined;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // React deja currentTarget en null al terminar el evento; despues del
    // await ya no se puede leer.
    const formulario = event.currentTarget;
    setPending(true);
    setErrores([]);
    setGuardado(false);

    const form = new FormData(formulario);
    const datos: ClienteFormulario = {
      nombre_completo: String(form.get("nombre_completo") ?? ""),
      documento: String(form.get("documento") ?? ""),
      telefono: String(form.get("telefono") ?? ""),
      correo: String(form.get("correo") ?? ""),
    };

    const response = await (cliente ? actualizarCliente(cliente.id, datos) : crearCliente(datos)).catch(
      () => null,
    );
    setPending(false);

    if (response?.ok) {
      if (editando) {
        onTerminar?.();
      } else {
        formulario.reset();
        setGuardado(true);
      }
      router.refresh();
      return;
    }

    if (!response) {
      setErrores(["No se pudo conectar con el servidor. Intenta de nuevo."]);
      return;
    }
    const mensajes = Object.entries(await leerErroresApi(response)).flatMap(([campo, lista]) =>
      lista.map((mensaje) => (ETIQUETAS[campo] ? `${ETIQUETAS[campo]}: ${mensaje}` : mensaje)),
    );
    setErrores(
      mensajes.length
        ? mensajes
        : [`No se pudo ${editando ? "actualizar" : "registrar"} el cliente (error ${response.status}).`],
    );
  }

  function onReset() {
    setErrores([]);
    setGuardado(false);
    onTerminar?.();
  }

  return (
    <form
      onSubmit={onSubmit}
      onReset={onReset}
      className={cx("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}
    >
      <ClayField label="Nombre completo">
        <ClayInput name="nombre_completo" defaultValue={cliente?.nombre_completo} required />
      </ClayField>
      <ClayField label="Documento">
        <ClayInput name="documento" defaultValue={cliente?.documento} required />
      </ClayField>
      <ClayField label="Telefono">
        <ClayInput name="telefono" defaultValue={cliente?.telefono} required />
      </ClayField>
      <ClayField label="Correo">
        <ClayInput name="correo" type="email" defaultValue={cliente?.correo} />
      </ClayField>

      <div className="flex items-center gap-3 sm:col-span-2">
        <ClayButton type="submit" disabled={pending}>
          {pending ? "Guardando..." : editando ? "Guardar cambios" : "Guardar cliente"}
        </ClayButton>
        <ClayButton type="reset" variant="secundario" disabled={pending}>
          Cancelar
        </ClayButton>
        {guardado && (
          <p role="status" className="text-sm text-(--sw-ink-soft)">
            Cliente registrado.
          </p>
        )}
      </div>

      {errores.length > 0 && (
        <div role="alert" className="clay-sm border-l-4 border-(--sw-peach) p-4 text-sm sm:col-span-2">
          <p className="font-semibold text-(--sw-ink)">
            No se pudo {editando ? "actualizar" : "registrar"} el cliente
          </p>
          <ul className="mt-1 list-inside list-disc text-(--sw-ink-soft)">
            {errores.map((mensaje) => (
              <li key={mensaje}>{mensaje}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
