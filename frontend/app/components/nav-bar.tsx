import Link from "next/link";

import ActuarComoSelector from "./actuar-como";

const enlaces = [
  { href: "/", label: "Inicio" },
  { href: "/clientes", label: "Clientes" },
  { href: "/ordenes", label: "Ordenes" },
];

export default function NavBar() {
  return (
    <nav className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <span className="text-lg font-semibold">SmartWash</span>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <ul className="flex flex-wrap gap-3 text-sm sm:gap-6">
            {enlaces.map((enlace) => (
              <li key={enlace.href}>
                <Link href={enlace.href} className="hover:underline">
                  {enlace.label}
                </Link>
              </li>
            ))}
          </ul>

          <ActuarComoSelector />
        </div>
      </div>
    </nav>
  );
}