import type { TipoUsuarioAuditoria } from "@/lib/api";

export const TIPOS_USUARIO: { valor: TipoUsuarioAuditoria; etiqueta: string }[] = [
  { valor: "administrador", etiqueta: "Administrador" },
  { valor: "recepcionista", etiqueta: "Recepcionista" },
  { valor: "operario", etiqueta: "Operario" },
  { valor: "cliente", etiqueta: "Cliente" },
];
