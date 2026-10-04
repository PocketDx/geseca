/** Formatea un valor monetario en pesos colombianos, sin decimales. */
export function formatCOP(valor: number | string): string {
  const n = typeof valor === "string" ? Number(valor) : valor;
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

/** Formatea una fecha ISO (YYYY-MM-DD) a formato corto legible en espanol. */
export function formatFecha(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
