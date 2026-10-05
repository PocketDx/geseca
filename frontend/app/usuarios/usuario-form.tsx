"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import {
  actualizarUsuario,
  crearUsuario,
  type Rol,
  type UsuarioAdmin,
  type UsuarioFormulario,
} from "@/lib/api";
import { cx } from "@/lib/cx";
import { ClayButton, ClayField, ClayInput, ClaySelect } from "../components/ui/clay";
import { AlertaErrores, mensajesDeError } from "./errores";

const ROLES: Rol[] = ["administrador", "recepcionista", "operario"];

type Props = {
  className?: string;
  usuario?: UsuarioAdmin;
  onTerminar?: () => void;
};

export default function UsuarioForm({ className, usuario, onTerminar }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [creado, setCreado] = useState(false);
  const [pending, setPending] = useState(false);
  const editando = usuario !== undefined;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // React deja currentTarget en null al terminar el evento; despues del
    // await ya no se puede leer.
    const formulario = event.currentTarget;
    setPending(true);
    setErrores([]);
    setCreado(false);

    const form = new FormData(formulario);
    const datos: UsuarioFormulario = {
      username: String(form.get("username") ?? ""),
      email: String(form.get("email") ?? ""),
      first_name: String(form.get("first_name") ?? ""),
      last_name: String(form.get("last_name") ?? ""),
      rol: (form.get("rol") as Rol) ?? "operario",
    };
    const password = String(form.get("password") ?? "");
    if (password || !editando) datos.password = password;

    const response = await (editando ? actualizarUsuario(usuario.id, datos) : crearUsuario(datos)).catch(
      () => null,
    );
    setPending(false);

    if (response?.ok) {
      formulario.reset();
      setCreado(!editando);
      router.refresh();
      onTerminar?.();
      return;
    }
    setErrores(await mensajesDeError(response, editando ? "guardar los cambios" : "crear el usuario"));
  }

  function onCancelar() {
    formRef.current?.reset();
    setErrores([]);
    setCreado(false);
    onTerminar?.();
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className={cx("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}
    >
      <ClayField label="Usuario">
        <ClayInput name="username" defaultValue={usuario?.username} required />
      </ClayField>
      <ClayField label="Correo">
        <ClayInput name="email" type="email" defaultValue={usuario?.email} required />
      </ClayField>
      <ClayField label="Nombres">
        <ClayInput name="first_name" defaultValue={usuario?.first_name} />
      </ClayField>
      <ClayField label="Apellidos">
        <ClayInput name="last_name" defaultValue={usuario?.last_name} />
      </ClayField>
      <ClayField label="Rol">
        <ClaySelect name="rol" defaultValue={usuario?.rol ?? "operario"} required>
          {ROLES.map((rol) => (
            <option key={rol} value={rol}>
              {rol}
            </option>
          ))}
        </ClaySelect>
      </ClayField>
      <ClayField label={editando ? "Contrasena nueva (opcional)" : "Contrasena temporal"}>
        <ClayInput
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={editando ? "Vacia para conservar la actual" : undefined}
          required={!editando}
        />
      </ClayField>

      <div className="flex items-center gap-3 sm:col-span-2">
        <ClayButton type="submit" disabled={pending}>
          {pending ? "Guardando..." : editando ? "Guardar cambios" : "Crear usuario"}
        </ClayButton>
        <ClayButton type="button" variant="secundario" onClick={onCancelar} disabled={pending}>
          Cancelar
        </ClayButton>
        {creado && (
          <p role="status" className="text-sm text-(--sw-ink-soft)">
            Usuario creado.
          </p>
        )}
      </div>

      {errores.length > 0 && (
        <div className="sm:col-span-2">
          <AlertaErrores
            titulo={editando ? "No se pudieron guardar los cambios" : "No se pudo crear el usuario"}
            mensajes={errores}
          />
        </div>
      )}
    </form>
  );
}
