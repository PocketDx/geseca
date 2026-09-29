import { cookies } from "next/headers";
import Link from "next/link";

import { getCurrentUser, type Rol } from "@/lib/api";
import { Landing } from "./components/landing";
import { ClayBadge, ClayCard } from "./components/ui/clay";
import LogoutButton from "./logout-button";

const ACCESOS = [
  {
    href: "/clientes",
    titulo: "Clientes",
    texto: "Registra y edita los datos de tus clientes.",
    color: "blue" as const,
    roles: ["administrador", "recepcionista"] as Rol[],
  },
  {
    href: "/usuarios",
    titulo: "Usuarios",
    texto: "Crea, edita y desactiva cuentas internas.",
    color: "lavender" as const,
    roles: ["administrador"] as Rol[],
  },
  {
    href: "/catalogo",
    titulo: "Catalogo",
    texto: "Servicios y tarifas por tipo de prenda.",
    color: "mint" as const,
    roles: ["administrador", "recepcionista"] as Rol[],
  },
  {
    href: "/fidelizacion",
    titulo: "Fidelizacion",
    texto: "Reglas de descuento para tus clientes.",
    color: "peach" as const,
    roles: ["administrador"] as Rol[],
  },
  {
    href: "/ordenes",
    titulo: "Ordenes",
    texto: "Sigue el estado de las ordenes en curso.",
    color: "blue" as const,
    roles: ["administrador", "recepcionista", "operario"] as Rol[],
  },
  {
    href: "/trazabilidad",
    titulo: "Trazabilidad",
    texto: "Seguimiento a las acciones de todos los usuarios, por tipo.",
    color: "lavender" as const,
    roles: ["administrador"] as Rol[],
  },
];

export default async function HomePage() {
  const user = await getCurrentUser(await cookies());
  if (!user) return <Landing />;

  const accesos = ACCESOS.filter((acceso) => acceso.roles.includes(user.rol));

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-(--sw-ink)">
            Hola, {user.first_name || user.username}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-(--sw-ink-soft)">
            Sesion iniciada como <strong className="text-(--sw-ink)">{user.username}</strong>
            <ClayBadge>{user.rol}</ClayBadge>
          </p>
        </div>
        <LogoutButton />
      </header>

      {accesos.length === 0 ? (
        <ClayCard>
          <p className="text-sm text-(--sw-ink-soft)">
            Tu rol ({user.rol}) todavia no tiene modulos asignados en el panel.
          </p>
        </ClayCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {accesos.map((acceso) => (
            <Link key={acceso.href} href={acceso.href}>
              <ClayCard className="clay-btn h-full">
                <ClayBadge color={acceso.color}>{acceso.titulo}</ClayBadge>
                <p className="mt-3 text-sm text-(--sw-ink-soft)">{acceso.texto}</p>
              </ClayCard>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
