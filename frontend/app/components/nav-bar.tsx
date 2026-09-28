import { cookies } from "next/headers";
import Link from "next/link";

import { getCurrentUser, type Rol } from "@/lib/api";
import { clayBtnClass } from "./ui/clay";
import ActuarComoSelector from "./actuar-como";

type Enlace = { href: string; label: string };

// Sin sesion: nav de cara al cliente que entra a la lavanderia, no al panel
// interno. Con sesion: cada rol ve solo sus modulos (T8/SCRUM-57 hace esto
// exigible tambien en el backend; aqui es solo lo que se muestra).
const PUBLICOS: Enlace[] = [
  { href: "/#servicios", label: "Nuestros servicios" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/rastrear-pedido", label: "Rastrear mi pedido" },
  { href: "/pqrs", label: "PQRS" },
];

const POR_ROL: Record<Rol, Enlace[]> = {
  administrador: [
    { href: "/clientes", label: "Clientes" },
    { href: "/usuarios", label: "Usuarios" },
    { href: "/catalogo", label: "Catalogo" },
    { href: "/fidelizacion", label: "Fidelizacion" },
    { href: "/ordenes", label: "Ordenes" },
    { href: "/trazabilidad", label: "Trazabilidad" },
  ],
  recepcionista: [
    { href: "/clientes", label: "Clientes" },
    { href: "/catalogo", label: "Catalogo" },
    { href: "/ordenes", label: "Ordenes" },
  ],
  operario: [{ href: "/ordenes", label: "Ordenes" }],
};

export default async function NavBar() {
  const user = await getCurrentUser(await cookies());
  const enlaces = user ? POR_ROL[user.rol] : PUBLICOS;

  return (
    <header className="sticky top-0 z-40 border-b border-(--sw-bg-deep) bg-(--sw-surface)/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-(--sw-ink)">
          Smart<span className="text-[#5b8fb0]">Wash</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <ul className="flex flex-wrap gap-1 text-sm">
            {enlaces.map((enlace) => (
              <li key={enlace.href}>
                <Link
                  href={enlace.href}
                  className="rounded-full px-3 py-1.5 font-semibold text-(--sw-ink-soft) transition-colors hover:bg-(--sw-bg-deep) hover:text-(--sw-ink)"
                >
                  {enlace.label}
                </Link>
              </li>
            ))}
          </ul>

          {user ? (
            <ActuarComoSelector />
          ) : (
            <Link href="/login" className={clayBtnClass("primario")}>
              Iniciar sesion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
