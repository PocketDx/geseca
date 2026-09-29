"use client";

import { useState, type FormEvent } from "react";

import { crearPqrs, type PqrsFormulario } from "@/lib/api";
import { AvisoPendiente, ClayButton, ClayField, ClayInput, ClaySelect, ClayTextarea } from "../components/ui/clay";

const TIPOS: { valor: PqrsFormulario["tipo"]; etiqueta: string }[] = [
  { valor: "peticion", etiqueta: "Peticion" },
  { valor: "queja", etiqueta: "Queja" },
  { valor: "reclamo", etiqueta: "Reclamo" },
  { valor: "sugerencia", etiqueta: "Sugerencia" },
];

export default function PqrsForm() {
  const [enviado, setEnviado] = useState(false);
  const [pendiente, setPendiente] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setPendiente(false);

    const form = new FormData(event.currentTarget);
    const datos: PqrsFormulario = {
      tipo: (form.get("tipo") as PqrsFormulario["tipo"]) ?? "peticion",
      nombre: String(form.get("nombre") ?? ""),
      documento: String(form.get("documento") ?? ""),
      correo: String(form.get("correo") ?? ""),
      telefono: String(form.get("telefono") ?? ""),
      codigo_orden: String(form.get("codigo_orden") ?? ""),
      mensaje: String(form.get("mensaje") ?? ""),
    };

    const response = await crearPqrs(datos).catch(() => null);
    setPending(false);

    if (response?.ok) {
      setEnviado(true);
    } else {
      setPendiente(true);
    }
  }

  if (enviado) {
    return (
      <p className="text-sm text-(--sw-ink)">
        Recibimos tu solicitud. Te respondemos por el correo o telefono que nos dejaste.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ClayField label="Tipo de solicitud">
        <ClaySelect name="tipo" defaultValue="peticion" required>
          {TIPOS.map((tipo) => (
            <option key={tipo.valor} value={tipo.valor}>
              {tipo.etiqueta}
            </option>
          ))}
        </ClaySelect>
      </ClayField>
      <ClayField label="Codigo de tu pedido (opcional)">
        <ClayInput name="codigo_orden" placeholder="Si tu solicitud es sobre una orden" />
      </ClayField>
      <ClayField label="Nombre completo">
        <ClayInput name="nombre" required />
      </ClayField>
      <ClayField label="Documento">
        <ClayInput name="documento" required />
      </ClayField>
      <ClayField label="Correo">
        <ClayInput name="correo" type="email" required />
      </ClayField>
      <ClayField label="Telefono">
        <ClayInput name="telefono" />
      </ClayField>

      <div className="sm:col-span-2">
        <ClayField label="Cuentanos que paso">
          <ClayTextarea name="mensaje" required />
        </ClayField>
      </div>

      <div className="sm:col-span-2">
        <ClayButton type="submit" disabled={pending}>
          {pending ? "Enviando..." : "Enviar solicitud"}
        </ClayButton>
      </div>

      {pendiente && (
        <div className="sm:col-span-2">
          <AvisoPendiente>
            POST /api/pqrs todavia no existe: EP06 (incidencias y postventa)
            esta pendiente en el backend. El formulario queda listo para
            conectarse cuando exista el endpoint.
          </AvisoPendiente>
        </div>
      )}
    </form>
  );
}
