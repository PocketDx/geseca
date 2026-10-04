"use client";

import { useState, type FormEvent } from "react";

import { crearUsuario, type Rol, type UsuarioFormulario } from "@/lib/api";
import { cx } from "@/lib/cx";
import { AvisoPendiente, ClayButton, ClayField, ClayInput, ClaySelect } from "../components/ui/clay";

const ROLES: Rol[] = ["administrador", "recepcionista", "operario"];

export default function UsuarioForm({ className }: { className?: string }) {
  const [pendiente, setPendiente] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setPendiente(false);

    const form = new FormData(event.currentTarget);
    const datos: UsuarioFormulario = {
      username: String(form.get("username") ?? ""),
      email: String(form.get("email") ?? ""),
      first_name: String(form.get("first_name") ?? ""),
      last_name: String(form.get("last_name") ?? ""),
      rol: (form.get("rol") as Rol) ?? "operario",
      password: String(form.get("password") ?? ""),
    };

    const response = await crearUsuario(datos).catch(() => null);
    setPending(false);

    if (response?.ok) {
      event.currentTarget.reset();
    } else {
      setPendiente(true);
    }
  }

  return (
    <form onSubmit={onSubmit} className={cx("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      <ClayField label="Usuario">
        <ClayInput name="username" required />
      </ClayField>
      <ClayField label="Correo">
        <ClayInput name="email" type="email" required />
      </ClayField>
      <ClayField label="Nombres">
        <ClayInput name="first_name" />
      </ClayField>
      <ClayField label="Apellidos">
        <ClayInput name="last_name" />
      </ClayField>
      <ClayField label="Rol">
        <ClaySelect name="rol" defaultValue="operario" required>
          {ROLES.map((rol) => (
            <option key={rol} value={rol}>
              {rol}
            </option>
          ))}
        </ClaySelect>
      </ClayField>
      <ClayField label="Contrasena temporal">
        <ClayInput name="password" type="password" required />
      </ClayField>

      <div className="sm:col-span-2">
        <ClayButton type="submit" disabled={pending}>
          {pending ? "Creando..." : "Crear usuario"}
        </ClayButton>
      </div>

      {pendiente && (
        <div className="sm:col-span-2">
          <AvisoPendiente>
            POST /api/usuarios todavia no existe: accounts solo expone
            login/logout/me/actuar-como. El formulario queda listo para HU03.
          </AvisoPendiente>
        </div>
      )}
    </form>
  );
}
