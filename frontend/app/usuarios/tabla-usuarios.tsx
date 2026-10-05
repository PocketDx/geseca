"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";

import { activarUsuario, desactivarUsuario, type UsuarioAdmin } from "@/lib/api";
import { ClayBadge, ClayCard, clayBtnClass } from "../components/ui/clay";
import { AlertaErrores, mensajesDeError } from "./errores";
import UsuarioForm from "./usuario-form";

export default function TablaUsuarios({ usuarios }: { usuarios: UsuarioAdmin[] }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [editando, setEditando] = useState<number | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [accionFallida, setAccionFallida] = useState("desactivar");

  async function cambiarEstado(id: number, activar: boolean) {
    const accion = activar ? "activar" : "desactivar";
    setOcupado(id);
    setErrores([]);
    const response = await (activar ? activarUsuario : desactivarUsuario)(id).catch(() => null);
    setOcupado(null);

    if (response?.ok) {
      router.refresh();
      return;
    }
    setAccionFallida(accion);
    setErrores(await mensajesDeError(response, `${accion} el usuario`));
  }

  if (usuarios.length === 0) {
    return (
      <ClayCard>
        <p className="text-sm text-(--sw-ink-soft)">Todavia no hay usuarios registrados.</p>
      </ClayCard>
    );
  }

  return (
    <>
      {errores.length > 0 && (
        <div className="mb-4">
          <AlertaErrores titulo={`No se pudo ${accionFallida} el usuario`} mensajes={errores} />
        </div>
      )}
      <ClayCard className="overflow-x-auto p-0">
        <table className="sw-tabla w-full text-left text-sm">
          <thead>
            <tr className="text-xs font-bold tracking-wide text-(--sw-ink-soft) uppercase">
              <th className="px-5 py-3">Usuario</th>
              <th className="px-5 py-3">Rol</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <Fragment key={usuario.id}>
                <tr className="border-t border-(--sw-hairline)">
                  <td data-label="Usuario" className="px-5 py-3 font-semibold text-(--sw-ink)">{usuario.username}</td>
                  <td data-label="Rol" className="px-5 py-3">
                    <ClayBadge>{usuario.rol}</ClayBadge>
                  </td>
                  <td data-label="Estado" className="px-5 py-3">
                    <ClayBadge color={usuario.is_active ? "mint" : "peach"}>
                      {usuario.is_active ? "Activo" : "Inactivo"}
                    </ClayBadge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link href={`/usuarios/${usuario.id}/historial`} className={clayBtnClass("secundario")}>
                        Historial
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditando(editando === usuario.id ? null : usuario.id)}
                        className={clayBtnClass("secundario")}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => cambiarEstado(usuario.id, !usuario.is_active)}
                        disabled={ocupado === usuario.id}
                        className={clayBtnClass("secundario")}
                      >
                        {ocupado === usuario.id ? "..." : usuario.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
                {editando === usuario.id && (
                  <tr className="border-t border-(--sw-hairline)">
                    <td colSpan={4} className="px-5 py-4">
                      <UsuarioForm usuario={usuario} onTerminar={() => setEditando(null)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </ClayCard>
    </>
  );
}
