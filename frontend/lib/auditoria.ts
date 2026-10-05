import type { AccionUsuario } from "@/lib/api";

// El dia de cada accion se calcula en la hora de Bogota (TIME_ZONE del
// backend): en UTC, una accion hecha a las 8 p. m. caeria en el dia siguiente
// y el filtro por fechas la dejaria por fuera.
const ZONA_HORARIA = "America/Bogota";
export const DIA_ISO = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA });
export const FECHA_LEGIBLE = new Intl.DateTimeFormat("es-CO", {
  timeZone: ZONA_HORARIA,
  dateStyle: "medium",
  timeStyle: "short",
});

export const ACCIONES: Record<AccionUsuario, { etiqueta: string; color: "blue" | "mint" | "lavender" | "peach" }> = {
  creado: { etiqueta: "Creado", color: "blue" },
  editado: { etiqueta: "Editado", color: "lavender" },
  activado: { etiqueta: "Activado", color: "mint" },
  desactivado: { etiqueta: "Desactivado", color: "peach" },
  inicio_sesion: { etiqueta: "Inicio de sesion", color: "blue" },
};
