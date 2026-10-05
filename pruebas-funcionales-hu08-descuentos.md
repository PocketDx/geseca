# Pruebas funcionales — HU08 Configurar reglas de descuento

- **Ticket:** SCRUM-160 (peer review del frontend de HU08)
- **Historia / requisito:** HU08 · RF07 Descuentos (CU03)
- **Rama probada:** `dev` en `4cf8259`
- **Fecha:** 2026-10-04
- **Tipo:** pruebas funcionales. Por solicitud expresa, las correcciones se hicieron después en una rama aparte, `fix/hu08-reglas-descuento` (ver "Correcciones aplicadas").

## Criterios de referencia (RF07)

| | |
|---|---|
| Actor | Administrador |
| Precondición | El administrador tiene sesión activa |
| Flujo básico | 1) Define una regla de descuento · 2) Configura sus condiciones · 3) El sistema guarda la regla |
| Regla de negocio | El descuento configurado no puede superar el 100 % del valor de la orden |
| Poscondición | La regla queda disponible para órdenes futuras |
| RNF | RNF-04 (integridad: validaciones que eviten datos inconsistentes) |

## Entorno

- Backend Django con una base SQLite **nueva**, creada solo para la prueba (`migrate` + `seed_usuarios`), en el puerto 8765. No se tocó ninguna base de un integrante.
- Peticiones HTTP reales con sesión y token CSRF, igual que las envía `lib/api.ts`.
- La pantalla `/fidelizacion` se revisó sobre el código (`page.tsx`, `regla-form.tsx`, `tabla-reglas.tsx`). Los casos marcados con 👁 conviene confirmarlos visualmente en el navegador.

## Resultados

| # | Caso | Esperado | Obtenido | Resultado |
|---|------|----------|----------|-----------|
| C1 | Crear regla válida: 10 %, clientes Frecuentes | Se guarda | HTTP 201, regla creada | ✅ Pasa |
| C2 | Porcentaje 150 % | Se rechaza con mensaje | HTTP 400: "Un descuento porcentual no puede superar el 100% del valor de la orden." | ✅ Pasa (API) |
| C3 | Porcentaje exactamente 100 % | Se acepta (límite) | HTTP 201 | ✅ Pasa |
| C4 | Monto fijo de $15.000 para VIP | Se acepta (el tope del 100 % aplica solo a porcentajes) | HTTP 201 | ✅ Pasa |
| C5 | Valor negativo (−5) por API | Se rechaza con mensaje | **HTTP 500 `IntegrityError`** | ❌ Falla (H3) |
| C6 | Vigencia "hasta" anterior a "desde" por API | Se rechaza con mensaje | **HTTP 500 `IntegrityError`** | ❌ Falla (H3) |
| C7 | Nombre vacío | Se rechaza | HTTP 400: "Este campo no puede estar en blanco." | ✅ Pasa |
| C8 | Editar una regla (PATCH, valor 20) | Se actualiza | HTTP 200 | ✅ Pasa (API) |
| C9 | Editar una regla a 120 % | Se rechaza | HTTP 400 con el mensaje del 100 % | ✅ Pasa (API) |
| C10 | Listar reglas | Aparecen las creadas | HTTP 200, 3 reglas | ✅ Pasa |
| C11 | Sin sesión, listar reglas | Acceso denegado | HTTP 403 | ✅ Pasa |
| C12 | `operario1` lista reglas | Acceso denegado (actor = Administrador) | HTTP 200 | ❌ Falla (H5) |
| C13 | `operario1` crea una regla del 50 % | Acceso denegado | **HTTP 201, la regla se crea** | ❌ Falla (H5) |
| C14 | En pantalla (ejecutado en navegador): crear una regla válida | El formulario se limpia y la regla aparece en la tabla | Next muestra `Runtime TypeError: Cannot read properties of null (reading 'reset')` en `regla-form.tsx:36`; el formulario no se limpia | ❌ Falla (H1) |
| C15 👁 | En pantalla: crear una regla del 150 % | Mensaje "no puede superar el 100 %" | Muestra "Backend pendiente: POST … todavía no existe" | ❌ Falla (H2) |
| C16 👁 | En pantalla: editar una regla existente | Opción para editar | No existe | ⚠️ Observación (H4) |
| C17 | En pantalla (ejecutado en navegador): monto fijo de $1.111.111.111, "Cualquiera", vigente desde 04/10/2026 | Mensaje que explique el límite | El backend responde 400 "Asegúrese de que no haya más de 8 dígitos en la parte entera." y la pantalla muestra "Backend pendiente: POST … todavía no existe…" | ❌ Falla (H2) |

**Resumen:** 9 pasan, 7 fallan y 1 observación. El backend cumple el flujo básico de RF07 y la regla del 100 %. Las fallas están en la pantalla, en la validación de datos inválidos que llegan por API y en el control de acceso por rol.

## Hallazgos

### H1 — Tras crear una regla, el formulario lanza un error y la tabla no se actualiza
**Severidad:** alta (afecta el caso exitoso visto por el usuario) · **Archivo:** `frontend/app/fidelizacion/regla-form.tsx`

`onSubmit` llama a `event.currentTarget.reset()` **después** de un `await`. React deja `currentTarget` en `null` cuando termina el despacho del evento, así que esa línea lanza `TypeError: Cannot read properties of null (reading 'reset')`. La regla sí se guarda, pero el formulario no se limpia. Además, el componente no llama a `router.refresh()`, y como `page.tsx` es un Server Component, la tabla no muestra la regla nueva hasta recargar la página. El usuario queda con la impresión de que no se guardó y puede crearla dos veces.

**Confirmado en el navegador (C14):** al crear una regla válida, Next muestra `Runtime TypeError: Cannot read properties of null (reading 'reset')` en `app/fidelizacion/regla-form.tsx (36:27) @ onSubmit`, sobre la línea `event.currentTarget.reset();`.

> El mismo patrón (`event.currentTarget.reset()` después de `await`) aparece en `clientes/cliente-form.tsx` y `usuarios/usuario-form.tsx`. Se reporta para que la tarea de corrección lo revise en conjunto.

### H2 — Cualquier error se muestra como "Backend pendiente"
**Severidad:** media · **Archivo:** `frontend/app/fidelizacion/regla-form.tsx`

Cuando la respuesta no es `ok`, el formulario siempre muestra "POST /api/fidelizacion/reglas-descuento todavía no existe…". El endpoint ya existe, y el backend devuelve un mensaje útil ("no puede superar el 100%…") que nunca se muestra. Como el campo Valor tiene `min="0"` pero no tiene `max`, un porcentaje del 150 % llega al backend y el usuario ve un mensaje engañoso en vez de la regla de negocio de RF07.

**Confirmado en el navegador (C17):** al crear un monto fijo de 1111111111, el backend rechaza el valor porque `valor` es `DecimalField(max_digits=10, decimal_places=2)` y admite como máximo 99.999.999,99. La pantalla muestra que el endpoint "todavía no existe", así que el usuario no puede saber qué corregir. El campo tampoco limita la cantidad de dígitos, de modo que la restricción no se puede descubrir desde la interfaz.

### H3 — Valor negativo o vigencia invertida devuelven un error 500
**Severidad:** media (integridad, RNF-04) · **Archivo:** `backend/fidelizacion/serializers.py`

El modelo protege estos casos con `CheckConstraint` (`valor >= 0` y `vigente_hasta > vigente_desde`), pero el serializer no los valida. La petición llega a la base de datos y se cae con `IntegrityError` (HTTP 500 con la página de depuración de Django) en lugar de un 400 con mensaje. Hoy la pantalla no lo expone, porque `min="0"` bloquea los negativos y no hay campo "vigente hasta", pero cualquier cliente de la API sí puede provocarlo. Las pruebas del backend cubren estos casos solo a nivel de modelo, no de API.

### H4 — La pantalla no permite editar ni definir el fin de vigencia
**Severidad:** baja / observación · **Archivos:** `regla-form.tsx`, `tabla-reglas.tsx`

El backend soporta `PATCH /api/fidelizacion/reglas-descuento/{id}` y `lib/api.ts` ya tiene `actualizarReglaDescuento()`, pero ningún botón ni formulario los usa. El formulario tampoco tiene el campo "vigente hasta" (siempre envía `null`), así que una regla no se puede desactivar ni vencer desde la interfaz. El flujo de RF07 solo exige definir y guardar, pero "configurar reglas" (CU03) y el campo `activa` sugieren que el administrador debería poder ajustarlas. Queda a criterio del equipo si entra en HU08.

### H5 — Cualquier usuario autenticado puede crear reglas de descuento
**Severidad:** alta (seguridad, RNF-03) · **Ligado a:** T8 / SCRUM-57

El actor de RF07 es solo el administrador. Con `operario1`, el API permite listar (200) y **crear** reglas (201). La página `/fidelizacion` solo comprueba que haya sesión, no el rol: el menú oculta el enlace a los no administradores, pero la URL abre igual. Es el mismo caso pendiente de T8 que se vio en HU01 y HU03, y se deja registrado para que T8 incluya este módulo.

## Correcciones aplicadas

Rama `fix/hu08-reglas-descuento`, creada desde `dev` (`4cf8259`), con PR hacia `dev`.

| Hallazgo | Estado | Qué se cambió | Verificación |
|---|---|---|---|
| H1 — error al limpiar el formulario y tabla sin refrescar | ✅ Resuelto | `regla-form.tsx`: se guarda la referencia al formulario **antes** del `await` y, al crear, se llama a `router.refresh()` para que el Server Component vuelva a pedir las reglas. Se muestra "Regla creada." | Build y tipos OK. Repetir C14 en el navegador |
| H2 — "Backend pendiente" ante cualquier error | ✅ Resuelto | Nueva función `leerErroresApi()` en `lib/api.ts`, que lee los errores de DRF por campo. El formulario muestra cada mensaje con su campo (p. ej. "Valor: Asegúrese de que no haya más de 8 dígitos…"), distingue "sin conexión" de un error del servidor y quita el aviso desactualizado. El campo Valor ahora limita el máximo según el tipo: 100 para porcentaje y 99.999.999,99 para monto fijo. `page.tsx` cambia el aviso "Backend pendiente" de la lista por un error de conexión | Build y tipos OK. Repetir C15 y C17 en el navegador |
| H3 — HTTP 500 con valor negativo o vigencia invertida | ✅ Resuelto | `fidelizacion/serializers.py` valida `valor >= 0` y `vigente_hasta > vigente_desde`, también en ediciones parciales (PATCH), y responde 400 con mensaje. Las `CheckConstraint` del modelo se mantienen como respaldo en la base de datos | 3 pruebas nuevas de API en `fidelizacion/tests.py`. Backend completo: 67 pruebas OK |
| H4 — no se puede editar ni poner fin de vigencia | ⏸ Sin cambios | Es una decisión de alcance del equipo, no un defecto | — |
| H5 — cualquier usuario autenticado gestiona reglas | 🟡 Parcial | `page.tsx` redirige al inicio a quien no sea administrador, que es el actor de RF07. **El API sigue abierto** a cualquier sesión: el permiso por rol es transversal y le corresponde a T8 (SCRUM-57) | Build OK. Repetir C12 y C13 tras T8 |

**Fuera de esta corrección:** `clientes/cliente-form.tsx` y `usuarios/usuario-form.tsx` repiten el error de H1 (`event.currentTarget.reset()` después de `await`) y el aviso "Backend pendiente". No se tocaron porque pertenecen a HU05 y HU03; `leerErroresApi()` queda disponible para corregirlos.

**Verificación general:** `manage.py test` con 67 pruebas OK; `npm run lint` sin errores (la única advertencia es previa, en `restablecer-password/page.tsx`); `npm run build` OK.

## Recomendación

Con la rama de corrección integrada, HU08 queda en condiciones de **re-prueba**:
1. Repetir en el navegador C14 (crear una regla válida: el formulario se limpia y la regla aparece sin recargar), C15 (150 % muestra el mensaje del 100 %) y C17 (monto de 10 dígitos muestra el límite).
2. Llevar al API la parte pendiente de H5 dentro de T8 (SCRUM-57).
3. Decidir en equipo si H4 entra en HU08 o en otra historia.
4. Abrir tickets para corregir el mismo error de H1 y H2 en los formularios de clientes (HU05) y usuarios (HU03).
