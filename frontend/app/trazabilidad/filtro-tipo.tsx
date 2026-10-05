"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";

import type { TipoUsuarioAuditoria } from "@/lib/api";
import { ClaySelect } from "../components/ui/clay";
import { TIPOS_USUARIO } from "./tipos";

export default function FiltroTipo({ tipoActual }: { tipoActual?: TipoUsuarioAuditoria }) {
  const router = useRouter();

  function onChange(event: ChangeEvent<HTMLSelectElement>) {
    const rol = event.target.value;
    router.push(rol ? `/trazabilidad?rol=${rol}` : "/trazabilidad");
  }

  return (
    <ClaySelect
      onChange={onChange}
      defaultValue={tipoActual ?? ""}
      aria-label="Filtrar por tipo de usuario"
      className="w-full sm:w-auto"
    >
      <option value="">Todos los tipos de usuario</option>
      {TIPOS_USUARIO.map((tipo) => (
        <option key={tipo.valor} value={tipo.valor}>
          {tipo.etiqueta}
        </option>
      ))}
    </ClaySelect>
  );
}
