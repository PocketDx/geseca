// Cliente HTTP unico hacia la API de Django.
//
// En el navegador las rutas son relativas (/api/...) y Next.js las reenvia al
// backend con el rewrite de next.config.ts, asi que la cookie de sesion viaja
// sola. En el servidor hay que reenviar las cookies a mano.

export type Rol = "administrador" | "recepcionista" | "operario";

/** Lo que devuelve UserSerializer en el backend. */
export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol: Rol;
};

type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type OpcionesApi = {
  method?: Metodo;
  body?: unknown;
};

/** Cookies ya resueltas de `await cookies()`, lo unico que necesita el server. */
type CookieStore = { toString(): string };

const UNSAFE: ReadonlySet<Metodo> = new Set<Metodo>([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

/** Peticion desde el navegador. Adjunta el token CSRF en metodos de escritura. */
export async function api(
  path: string,
  { method = "GET", body }: OpcionesApi = {},
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (UNSAFE.has(method)) {
    // GET /api/auth/me lleva @ensure_csrf_cookie: siembra csrftoken si falta.
    if (!readCookie("csrftoken")) await fetch("/api/auth/me");
    headers["X-CSRFToken"] = readCookie("csrftoken") ?? "";
  }

  return fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Usuario autenticado leido desde un Server Component, o null si no hay sesion.
 *
 * Devuelve null tambien si el backend no responde. Sin esto, un Django caido
 * hace que fetch lance y la pagina entera falle con 500; asi el usuario cae en
 * /login, que al menos es una pantalla util.
 */
export async function getCurrentUser(
  cookieStore: CookieStore,
): Promise<User | null> {
  const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
  try {
    const response = await fetch(`${backend}/api/auth/me`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });
    return response.ok ? ((await response.json()) as User) : null;
  } catch {
    return null;
  }
}

/** Cuentas sembradas para el selector "actuar como". Null si no aplica (prod). */
export async function getCuentasDesarrollo(): Promise<User[] | null> {
  const response = await api("/auth/actuar-como");
  return response.ok ? ((await response.json()) as User[]) : null;
}

export async function actuarComo(username: string): Promise<User | null> {
  const response = await api("/auth/actuar-como", {
    method: "POST",
    body: { username },
  });
  return response.ok ? ((await response.json()) as User) : null;
}

/* --------------------------------------------------------------------------
 * Lo de aqui abajo consume endpoints que todavia no existen en el backend
 * (clientes/, catalogo/ y ordenes/ solo tienen modelos; fidelizacion/ ni
 * siquiera existe como app). Las rutas y formas de datos son las que se
 * acordaron en el modelo de plot.md; cuando alguien implemente el endpoint
 * en Django, esta capa deja de devolver null sin que el resto del frontend
 * cambie.
 * -------------------------------------------------------------------------- */

/** GET server-side generico: reenvia cookies y nunca lanza. Un backend caido
 * y un endpoint que aun no existe (404) se ven igual desde la pagina: null. */
async function fetchBackend<T>(
  path: string,
  cookieStore: CookieStore,
): Promise<T | null> {
  const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
  try {
    const response = await fetch(`${backend}/api${path}`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

/* ------------------------------- Clientes (HU05, app clientes) ------------------------------- */

export type Cliente = {
  id: number;
  nombre_completo: string;
  documento: string;
  telefono: string;
  correo: string;
  clasificacion: "Ocasional" | "Frecuente" | "VIP";
};

export type ClienteFormulario = Omit<Cliente, "id" | "clasificacion">;

export async function getClientes(cookieStore: CookieStore): Promise<Cliente[] | null> {
  return fetchBackend<Cliente[]>("/clientes", cookieStore);
}

export async function crearCliente(datos: ClienteFormulario): Promise<Response> {
  return api("/clientes", { method: "POST", body: datos });
}

export async function actualizarCliente(
  id: number,
  datos: Partial<ClienteFormulario>,
): Promise<Response> {
  return api(`/clientes/${id}`, { method: "PATCH", body: datos });
}

/* ------------------------- Usuarios internos (HU03, HU04) ------------------------- */

/** Forma prevista para /api/usuarios: agrega is_active, que el UserSerializer
 * de /auth/me no expone porque solo lo necesita esta pantalla de administracion. */
export type UsuarioAdmin = User & { is_active: boolean };

export type UsuarioFormulario = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol: Rol;
  password?: string;
};

export async function getUsuarios(cookieStore: CookieStore): Promise<UsuarioAdmin[] | null> {
  return fetchBackend<UsuarioAdmin[]>("/usuarios", cookieStore);
}

export async function crearUsuario(datos: UsuarioFormulario): Promise<Response> {
  return api("/usuarios", { method: "POST", body: datos });
}

export async function actualizarUsuario(
  id: number,
  datos: Partial<UsuarioFormulario>,
): Promise<Response> {
  return api(`/usuarios/${id}`, { method: "PATCH", body: datos });
}

export async function desactivarUsuario(id: number): Promise<Response> {
  return api(`/usuarios/${id}/desactivar`, { method: "POST" });
}

export type HistorialAccion = {
  id: number;
  accion: string;
  detalle: string;
  fecha: string;
};

export async function getHistorialUsuario(
  id: number,
  cookieStore: CookieStore,
): Promise<HistorialAccion[] | null> {
  return fetchBackend<HistorialAccion[]>(`/usuarios/${id}/historial`, cookieStore);
}

/** Trazabilidad global: lo mismo que el historial por usuario, pero cruzando
 * todos los usuarios y filtrable por tipo de usuario (rol). Modulo solo para
 * administrador. "cliente" no es un Rol de accounts.User (no inicia sesion,
 * ver rastrear-pedido/ y pqrs/): aqui agrupa las acciones publicas que deja
 * un visitante sin cuenta, por eso usuario_id puede ser null. */
export type TipoUsuarioAuditoria = Rol | "cliente";

export type AccionAuditoria = {
  id: number;
  usuario_id: number | null;
  usuario: string;
  tipo_usuario: TipoUsuarioAuditoria;
  accion: string;
  detalle: string;
  fecha: string;
};

export async function getTrazabilidad(
  cookieStore: CookieStore,
  tipoUsuario?: TipoUsuarioAuditoria,
): Promise<AccionAuditoria[] | null> {
  const query = tipoUsuario ? `?rol=${encodeURIComponent(tipoUsuario)}` : "";
  return fetchBackend<AccionAuditoria[]>(`/usuarios/trazabilidad${query}`, cookieStore);
}

/* --------------------------- Catalogo de servicios y tarifas (HU07) --------------------------- */

export type TipoPrenda = { id: number; nombre: string; material: string };
export type Servicio = { id: number; nombre: string; descripcion: string };
export type Tarifa = {
  id: number;
  tipo_prenda: number;
  servicio: number;
  valor: string;
  plazo_entrega_dias: number;
  vigente_desde: string;
  vigente_hasta: string | null;
};

export async function getTiposPrenda(cookieStore: CookieStore): Promise<TipoPrenda[] | null> {
  return fetchBackend<TipoPrenda[]>("/catalogo/tipos-prenda", cookieStore);
}

export async function getServicios(cookieStore: CookieStore): Promise<Servicio[] | null> {
  return fetchBackend<Servicio[]>("/catalogo/servicios", cookieStore);
}

export async function getTarifas(cookieStore: CookieStore): Promise<Tarifa[] | null> {
  return fetchBackend<Tarifa[]>("/catalogo/tarifas", cookieStore);
}

export async function crearServicio(datos: Omit<Servicio, "id">): Promise<Response> {
  return api("/catalogo/servicios", { method: "POST", body: datos });
}

export async function crearTarifa(datos: Omit<Tarifa, "id">): Promise<Response> {
  return api("/catalogo/tarifas", { method: "POST", body: datos });
}

export async function actualizarTarifa(
  id: number,
  datos: Partial<Omit<Tarifa, "id">>,
): Promise<Response> {
  return api(`/catalogo/tarifas/${id}`, { method: "PATCH", body: datos });
}

/* ------------------------- Fidelizacion: reglas de descuento (HU08) ------------------------- */

export type ReglaDescuento = {
  id: number;
  nombre: string;
  tipo: "porcentaje" | "monto_fijo";
  valor: string;
  clasificacion_cliente: Cliente["clasificacion"] | "";
  activa: boolean;
  vigente_desde: string;
  vigente_hasta: string | null;
};

export async function getReglasDescuento(
  cookieStore: CookieStore,
): Promise<ReglaDescuento[] | null> {
  return fetchBackend<ReglaDescuento[]>("/fidelizacion/reglas-descuento", cookieStore);
}

export async function crearReglaDescuento(
  datos: Omit<ReglaDescuento, "id">,
): Promise<Response> {
  return api("/fidelizacion/reglas-descuento", { method: "POST", body: datos });
}

export async function actualizarReglaDescuento(
  id: number,
  datos: Partial<Omit<ReglaDescuento, "id">>,
): Promise<Response> {
  return api(`/fidelizacion/reglas-descuento/${id}`, { method: "PATCH", body: datos });
}

/* --------------------------- Recuperacion de contrasena (HU02) --------------------------- */

export async function solicitarRecuperacionPassword(identificador: string): Promise<Response> {
  return api("/auth/recuperar-password", {
    method: "POST",
    body: { identificador },
  });
}

/* --------------------------------- Ordenes (staff, EP04/EP05) --------------------------------- */

export type EstadoOrden =
  | "Recibida"
  | "Clasificada"
  | "En proceso"
  | "Control de calidad"
  | "Lista para entrega"
  | "Entregada"
  | "Cancelada"
  | "En espera";

export type Orden = {
  id: number;
  codigo: string;
  cliente: number;
  estado: EstadoOrden;
  estado_pago: "Pendiente" | "Parcial" | "Pagada";
  fecha_estimada_entrega: string | null;
  fecha_entrega: string | null;
  valor_total: string;
};

export async function getOrdenes(cookieStore: CookieStore): Promise<Orden[] | null> {
  return fetchBackend<Orden[]>("/ordenes", cookieStore);
}

/* ------------------------- Rastreo publico de pedidos (sin cuenta de cliente) ------------------------- *
 * Orden.codigo se diseno para esto: "codigo de rastreo... publico" (ver
 * backend/ordenes/models.py). No hay rol "cliente" en accounts.User, asi que
 * el seguimiento del pedido es publico por codigo en vez de requerir login. */

export type SeguimientoOrden = {
  codigo: string;
  estado: EstadoOrden;
  fecha_estimada_entrega: string | null;
  fecha_entrega: string | null;
};

export async function rastrearOrden(codigo: string): Promise<SeguimientoOrden | null> {
  const response = await api(`/ordenes/rastrear?codigo=${encodeURIComponent(codigo)}`);
  return response.ok ? ((await response.json()) as SeguimientoOrden) : null;
}

/* ------------------------------------- PQRS (EP06, publico) ------------------------------------- */

export type PqrsFormulario = {
  tipo: "peticion" | "queja" | "reclamo" | "sugerencia";
  nombre: string;
  documento: string;
  correo: string;
  telefono: string;
  codigo_orden: string;
  mensaje: string;
};

export async function crearPqrs(datos: PqrsFormulario): Promise<Response> {
  return api("/pqrs", { method: "POST", body: datos });
}

