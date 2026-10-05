# HU07 — Catálogo de servicios y tarifas

**Proyecto:** SmartWash
**Historia de usuario:** HU07 — Administrar el catálogo de servicios y sus tarifas
**Subtarea Jira:** SCRUM-158 `[Documentación]`

> Cada sección la completa quien hizo esa parte, sin borrar lo que escribieron los demás. Cuando las dos estén completas, la subtarea pasa a **Finalizado**.

| Sección | Subtareas | PR | Estado |
|---|---|---|---|
| 1. Backend | SCRUM-72 y SCRUM-120 | #28 y #35 | ✅ Completo |
| 2. Frontend | SCRUM-73 | #39 | ✅ Completo |

---

## 1. Backend

**Subtareas:** SCRUM-72 y SCRUM-120 (`[Desarrollo Backend]` y `[Desarrollo Backend 2]`)
**PR:** #28 (endpoints del catálogo) y #35 (validación de solape de tarifas).

### Resumen

El administrador gestiona tres entidades: **tipos de prenda**, **servicios** y **tarifas**. Una tarifa fija el valor y el plazo de entrega de un par (tipo de prenda, servicio) durante un periodo de vigencia, y los periodos anteriores se conservan como histórico. Vive en la app `catalogo`; los modelos ya existían en `dev` y no hay migraciones nuevas. Las rutas se montan en `config/urls.py` con el prefijo `api/catalogo/`.

### Decisiones tomadas

- **Dos tarifas con el mismo par no pueden estar vigentes a la vez.** Lo garantiza la base con una restricción única parcial (`tarifa_vigente_unica_por_par`, sobre las filas con `vigente_hasta` vacío). Una tarifa cerrada queda como histórico y no se borra.
- **Una tarifa nueva abierta cierra la vigente.** Si se crea una tarifa sin `vigente_hasta` para un par que ya tiene una vigente, `create` (dentro de una transacción y con `select_for_update` sobre la vigente) pone como `vigente_hasta` de la anterior el `vigente_desde` de la nueva. La anterior queda cerrada y la nueva, abierta. DRF traduciría la restricción única a un rechazo, por eso el serializer desactiva sus validadores propios (`validators = []`) y aplica las reglas a mano.
- **Los periodos son semiabiertos `[desde, hasta)`.** `vigente_hasta` es el primer día en que la tarifa ya no rige, así que la tarifa que sigue puede empezar exactamente ese día. Esto es lo que hace contiguas a la cerrada y a su sucesora.
- **Validación de solape (#35).** Antes solo se comprobaba el choque cuando la tarifa nueva quedaba abierta, y se aceptaba una tarifa cerrada que se cruzaba con la vigente o con otras históricas (por ejemplo, del 2026-07-01 al 2026-08-01 con la vigente desde el 2026-06-01). Ahora se rechaza cualquier tarifa del mismo par cuyo rango se cruce con el de otra:
  - un `vigente_hasta` vacío cuenta como infinito;
  - en una edición se excluye la propia tarifa;
  - al crear una tarifa abierta, la vigente que va a cerrarse no cuenta como cruce, pero sí cualquier otra tarifa del par (por ejemplo, una cerrada posterior);
  - el solape solo se evalúa dentro del mismo par: el mismo periodo en otro tipo de prenda o servicio se acepta;
  - el rechazo es un `400` con la clave `vigente_desde` y el periodo con el que choca, por ejemplo `El periodo se cruza con otra tarifa de esta prenda y servicio (2026-06-01 a hoy en adelante).`
- **Otras reglas de las tarifas** (en `TarifaSerializer.validate`):
  - `vigente_hasta` debe ser posterior a `vigente_desde`;
  - una tarifa nueva abierta debe empezar después del inicio de la vigente;
  - editar una tarifa para dejarla abierta se rechaza si el par ya tiene otra vigente;
  - el par `tipo_prenda`/`servicio` no se puede cambiar en una edición: hay que registrar una tarifa nueva;
  - `valor` no puede ser negativo y `plazo_entrega_dias` debe ser al menos 1. El valor es `DecimalField(10, 2)`, y la API lo devuelve como cadena (`"8000.00"`).
- **Nombres únicos sin distinguir mayúsculas.** `nombre` de `Servicio` y de `TipoPrenda` es único en la base, pero el índice distingue mayúsculas. Por eso el serializer compara con `iexact` y sin espacios en los extremos, y responde `400` con `Ya existe "<nombre>" en el catalogo.`
- **Sin borrado.** No hay `DELETE`: la vista es de lectura y actualización. Las tarifas referencian a `TipoPrenda` y `Servicio` con `PROTECT`, y el histórico no debe perderse.
- **Autoría en cada escritura.** `create` y `update` llaman a `registrar_autoria(request.user)` (`ConAutoriaSerializer`). Al cerrar la tarifa anterior también se registra quién lo hizo. `creado_por` y `actualizado_por` no se exponen en las respuestas.
- **`?vigentes=1`.** `GET /api/catalogo/tarifas` devuelve todas las tarifas, con su histórico. Con `?vigentes=1` (o `true`) devuelve solo las abiertas (`vigente_hasta` vacío), que son las que se usarán para cotizar.

### Endpoints entregados

Todos exigen sesión. Las rutas no llevan barra final.

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `GET` | `/api/catalogo/tipos-prenda` | — | `200`, lista de `{id, nombre, material}` ordenada por `nombre` |
| `POST` | `/api/catalogo/tipos-prenda` | `{nombre, material}` | `201`, o `400` (por ejemplo, nombre repetido) |
| `GET` | `/api/catalogo/tipos-prenda/{id}` | — | `200` |
| `PATCH` | `/api/catalogo/tipos-prenda/{id}` | Cualquier subconjunto | `200`, o `400` |
| `GET` | `/api/catalogo/servicios` | — | `200`, lista de `{id, nombre, descripcion}` ordenada por `nombre` |
| `POST` | `/api/catalogo/servicios` | `{nombre, descripcion}` | `201`, o `400` (por ejemplo, nombre repetido sin importar mayúsculas) |
| `GET` | `/api/catalogo/servicios/{id}` | — | `200` |
| `PATCH` | `/api/catalogo/servicios/{id}` | Cualquier subconjunto | `200`, o `400` |
| `GET` | `/api/catalogo/tarifas` | — (`?vigentes=1` opcional) | `200`, lista ordenada por prenda, servicio y `vigente_desde` descendente |
| `POST` | `/api/catalogo/tarifas` | `{tipo_prenda, servicio, valor, plazo_entrega_dias, vigente_desde, vigente_hasta}` | `201`, o `400` por campo (valor negativo, plazo cero, periodo incoherente, solape) |
| `GET` | `/api/catalogo/tarifas/{id}` | — | `200` |
| `PATCH` | `/api/catalogo/tarifas/{id}` | Cualquier subconjunto de los campos anteriores, salvo `tipo_prenda` y `servicio` | `200`, o `400` |

Cada tarifa incluye además `tipo_prenda_nombre` y `servicio_nombre`, de solo lectura. Los nombres de campo coinciden con los tipos `TipoPrenda`, `Servicio` y `Tarifa` de `frontend/lib/api.ts`.

### Pruebas automatizadas

`catalogo/tests.py`: 18 pruebas en `dev` (PR #28) y 27 con el PR #35, que suma 9. Cubren:
- el modelo: una sola tarifa vigente por par, cerrar la vigencia para registrar la nueva, valor negativo, vigencia invertida y valor decimal exacto;
- crear un servicio y registrar quién lo creó, editarlo, y rechazar un nombre repetido sin importar mayúsculas;
- crear un tipo de prenda y una tarifa para un par, y rechazar una tarifa negativa o vacía;
- que una tarifa nueva cierre la vigente y conserve el histórico, y que no pueda empezar antes que ella;
- que no se pueda mover una tarifa a otro servicio ni reabrirla si ya hay otra vigente;
- que una edición rechazada no cambie nada (escenario Cancelar de la historia);
- que se exija sesión (`403` sin ella);
- el solape (#35): cerrada contra la vigente, contra una histórica, que envuelve a otra, abierta contra una cerrada posterior y extensión de una tarifa hasta cruzarse; y los casos válidos: cerradas contiguas, cerrada anterior a la vigente, otro par con el mismo periodo y edición que no choca consigo misma.

El backend completo suma 116 pruebas OK con el PR #35 (las 107 previas intactas).

### Desviaciones y pendientes

- **No hay control por rol.** La historia dice "como administrador", pero los endpoints usan los permisos por defecto de DRF (`IsAuthenticated`): cualquier sesión puede leer y escribir el catálogo, incluido un operario. Lo resuelve T8 (SCRUM-57, sprint S4).
- **"Vigente" significa abierta, no "rige hoy".** El filtro `?vigentes=1` solo mira que `vigente_hasta` esté vacío y no compara fechas. Una tarifa con `vigente_desde` futuro se considera vigente, y la anterior queda cerrada en esa fecha. Las órdenes (sprint 2) deberán decidir con qué fecha cotizar.
- **El solape no está protegido contra concurrencia.** La base solo impide dos tarifas abiertas por par; el cruce entre tarifas cerradas se comprueba en el serializer, sin bloquear filas. Dos solicitudes simultáneas podrían crear periodos que se cruzan. Con el volumen del proyecto no compensa una restricción de exclusión.
- **El error de solape siempre se reporta en `vigente_desde`**, también cuando lo causa extender un `vigente_hasta` en una edición.

---

## 2. Frontend

**Subtarea:** SCRUM-73
**PR:** #39.

### Resumen

La pantalla `/catalogo` concentra el alta de tipos de prenda, servicios y tarifas, y la tabla de tarifas con su edición. Es un Server Component (`page.tsx`) que carga en paralelo tipos de prenda, servicios y tarifas con `getTiposPrenda`, `getServicios` y `getTarifas`, y delega los formularios y la tabla en componentes de cliente.

### Decisiones de diseño e implementación

- **Una pantalla, tres formularios.** `tipo-prenda-form.tsx`, `servicio-form.tsx` y `tarifa-form.tsx` tienen el mismo patrón: envían con `crearTipoPrenda`, `crearServicio` o `crearTarifa`, muestran el estado de guardado, limpian el formulario al acertar y llaman a `router.refresh()` para que la tabla se actualice.
- **Errores reales de la API.** `errores.tsx` convierte la respuesta `400` con `leerErroresApi` en mensajes por campo (`Nombre: Ya existe "Lavado" en el catalogo.`) y los muestra en un bloque de alerta. Si no hay respuesta, avisa de que no se pudo conectar con el servidor. Reemplazan a los `AvisoPendiente` que decían que los endpoints no existían.
- **Referencia al formulario antes del `await`.** `event.currentTarget` queda en `null` después del `await`, así que los tres formularios guardan la referencia antes (el `reset()` de `servicio-form.tsx` fallaba por esto).
- **Una tarifa necesita un tipo de prenda y un servicio.** Por eso se añadió el formulario de tipos de prenda (`POST /api/catalogo/tipos-prenda` con `{nombre, material}`). Mientras falte algún tipo o servicio, `tarifa-form` lo indica en lugar de mostrar el formulario.
- **La tarifa siempre se crea abierta.** El formulario no pide `vigente_hasta` y envía `null`: es la tarifa vigente, y el backend cierra la anterior. La pantalla no necesita calcular nada del histórico.
- **Edición en la propia fila.** `tabla-tarifas.tsx` cambia la fila a campos editables de valor, plazo y `vigente_hasta`, con **Guardar** y **Cancelar**, y llama a `actualizarTarifa` (`PATCH /api/catalogo/tarifas/{id}`). Solo se edita una fila a la vez: los botones **Editar** de las demás se deshabilitan. Los errores (por ejemplo, un solape) salen debajo de la fila editada. Dejar `vigente_hasta` vacío envía `null`.
- **La tabla muestra el histórico completo.** Usa `GET /api/catalogo/tarifas` sin filtro. La vigencia se muestra con una etiqueta: **Vigente** (verde) si `vigente_hasta` está vacío, o **Hasta `<fecha>`** si está cerrada. El valor sale con `formatCOP` y sin decimales.

### Pantallas entregadas

| Pantalla o componente | Qué permite |
|---|---|
| `/catalogo` (`page.tsx`) | Reúne las tres altas y la tabla. Si no se pueden cargar las tarifas, muestra un aviso para verificar el backend. |
| `tipo-prenda-form.tsx` | Crear un tipo de prenda (`nombre` obligatorio, `material` opcional). |
| `servicio-form.tsx` | Crear un servicio (`nombre` obligatorio, `descripcion` opcional). |
| `tarifa-form.tsx` | Crear una tarifa: tipo de prenda, servicio, valor en COP, plazo en días y `vigente_desde`. |
| `tabla-tarifas.tsx` | Ver todas las tarifas con su vigencia y editar valor, plazo y `vigente_hasta`. |
| `errores.tsx` | Mensajes de error compartidos por los formularios y la tabla. |

### Desviaciones frente a la especificación

- **Acceso por rol.** La historia dice "como administrador". Hoy `/catalogo` aparece en la navegación del **administrador y del recepcionista**, y la página solo comprueba que haya sesión (si no, redirige a `/login`), sin exigir un rol. El backend tampoco restringe por rol (ver la sección 1). Los permisos por rol son T8 (SCRUM-57, sprint S4).
- **Servicios y tipos de prenda solo se crean.** El backend admite `PATCH`, pero la pantalla no ofrece editarlos; solo se pueden editar tarifas.
- **Cancelar solo existe al editar una tarifa**, donde descarta lo ingresado. Los formularios de alta no tienen botón Cancelar: si no se envía, no se guarda nada, y el formulario solo se limpia tras un guardado exitoso.
- **No se pueden crear tarifas cerradas desde la pantalla.** El alta siempre deja la tarifa abierta; las cerradas se obtienen cerrando una vigente (creando una nueva o editando su `vigente_hasta`). La edición no cambia `vigente_desde` ni el par prenda/servicio.
- **`?vigentes=1` no se usa en la pantalla.** El filtro existe para cotizar en las órdenes (sprint 2); la tabla pide todas las tarifas.
- **No hay borrado**, tampoco en la pantalla, por la misma razón que en el backend.
