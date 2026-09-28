"use client";

import Link from "next/link";
import { useState } from "react";

import { desactivarUsuario, type UsuarioAdmin } from "@/lib/api";
import { ClayBadge, ClayCard, clayBtnClass } from "../components/ui/clay";

export default function TablaUsuarios({ usuarios }: { usuarios: UsuarioAdmin[] }) {
  const [ocupado, setOcupado] = useState<number | null>(null);

  async function onDesactivar(id: number) {
    setOcupado(id);
    await desactivarUsuario(id).catch(() => null);
    setOcupado(null);
  }

  if (usuarios.length === 0) {
    return (
      <ClayCard>
        <p className="text-sm text-(--sw-ink-soft)">Todavia no hay usuarios registrados.</p>
      </ClayCard>
    );
  }

  return (
    <ClayCard className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
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
            <tr key={usuario.id} className="border-t border-(--sw-bg-deep)">
              <td className="px-5 py-3 font-semibold text-(--sw-ink)">{usuario.username}</td>
              <td className="px-5 py-3">
                <ClayBadge>{usuario.rol}</ClayBadge>
              </td>
              <td className="px-5 py-3">
                <ClayBadge color={usuario.is_active ? "mint" : "peach"}>
                  {usuario.is_active ? "Activo" : "Inactivo"}
                </ClayBadge>
              </td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-2">
                  <Link href={`/usuarios/${usuario.id}/historial`} className={clayBtnClass("secundario")}>
                    Historial
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDesactivar(usuario.id)}
                    disabled={ocupado === usuario.id || !usuario.is_active}
                    className={clayBtnClass("secundario")}
                  >
                    {ocupado === usuario.id ? "..." : "Desactivar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ClayCard>
  );
}
