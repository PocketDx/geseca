"use client";

import { useLayoutEffect, useSyncExternalStore, type ReactNode } from "react";

type Tema = "system" | "light" | "dark";

const CLAVE = "sw-tema";
const EVENTO = "sw-tema";
const SIGUIENTE: Record<Tema, Tema> = { system: "light", light: "dark", dark: "system" };
const ETIQUETA: Record<Tema, string> = {
  system: "Tema del sistema",
  light: "Tema claro",
  dark: "Tema oscuro",
};

function leer(): Tema {
  try {
    const guardado = localStorage.getItem(CLAVE);
    return guardado === "light" || guardado === "dark" ? guardado : "system";
  } catch {
    return "system";
  }
}

function aplicar(tema: Tema) {
  if (tema === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", tema);
  }
}

function suscribir(avisar: () => void) {
  window.addEventListener(EVENTO, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(EVENTO, avisar);
    window.removeEventListener("storage", avisar);
  };
}

const ICONOS: Record<Tema, ReactNode> = {
  system: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  dark: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
};

export default function ThemeToggle() {
  const tema = useSyncExternalStore(suscribir, leer, () => "system" as Tema);

  // React borra data-theme de <html> al remontar en desarrollo.
  useLayoutEffect(() => {
    aplicar(leer());
  }, []);

  function cambiar() {
    const siguiente = SIGUIENTE[tema];
    try {
      if (siguiente === "system") localStorage.removeItem(CLAVE);
      else localStorage.setItem(CLAVE, siguiente);
    } catch {}
    aplicar(siguiente);
    window.dispatchEvent(new Event(EVENTO));
  }

  return (
    <button
      type="button"
      onClick={cambiar}
      title={`${ETIQUETA[tema]} (clic para cambiar)`}
      aria-label={`${ETIQUETA[tema]}. Cambiar tema`}
      className="clay-btn grid size-11 place-items-center rounded-full border-2 bg-(--sw-surface) text-(--sw-ink) sm:size-10"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ICONOS[tema]}
      </svg>
    </button>
  );
}
