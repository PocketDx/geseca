# HU04 — Historial de acciones de cada usuario

**Proyecto:** SmartWash
**Historia de usuario:** HU04 — Consultar el historial de acciones de cada usuario
**Subtarea Jira:** SCRUM-149 `[Documentación]`

> Cada sección la completa quien hizo esa parte, sin borrar lo que escribieron los demás. Cuando las dos estén completas, la subtarea pasa a **Finalizado**.

| Sección | Responsable | Estado |
|---|---|---|
| 1. Backend | Juan Daniel Torres Morales | ✅ Completo |
| 2. Frontend | sebastianij | ✅ Completo |

---

## 1. Backend

**Autor:** Juan Daniel Torres Morales · **Subtarea:** SCRUM-66
**PR:** #20, completado en el PR de cierre del Sprint 1 (inicio de sesión, detalle y autor del cambio).

### Resumen

Cada inicio de sesión y cada cambio sobre una cuenta interna queda en el modelo `RegistroAuditoria` (app `accounts`), con el detalle de qué cambió y quién lo hizo. Hay dos consultas: el historial de un usuario y la trazabilidad global con filtro por tipo de usuario.

### Decisiones tomadas

- **Se registra con señales, no desde las vistas.** `pre_save` y `post_save` sobre `User` (en `accounts/signals.py`) crean el registro sin importar si el cambio vino del API, del Django Admin o de un comando como `seed_usuarios`. `pre_save` lee los valores anteriores para distinguir `activado` y `desactivado` de `editado` y para saber qué campos cambiaron.
- **El inicio de sesión cuenta como uso del sistema.** La señal `user_logged_in` registra `inicio_sesion`. El guardado de `last_login` que hace Django al iniciar sesión no se registra como edición.
- **`detalle` dice qué cambió y quién lo hizo.** Por ejemplo, `nombre · rol: operario → recepcionista · por admin`. El rol se muestra con su valor anterior y el nuevo; de la contraseña solo se dice que cambió. El autor lo marcan las vistas del API (`_realizado_por`). Si el cambio viene del Django Admin o de la consola, el registro queda sin autor.
- **Los registros son inmutables.** No hay endpoint de escritura, y el Django Admin del modelo es de solo lectura: `has_add_permission`, `has_change_permission` y `has_delete_permission` devuelven `False`. Así se cumple la regla de negocio de que ningún rol modifica ni borra auditoría.
- **Se conserva el nombre aunque la cuenta desaparezca.** La FK `usuario` usa `SET_NULL` y `usuario_nombre` guarda el `username` del momento, para que el registro siga siendo legible.
- **Se guarda el rol del momento.** `tipo_usuario` copia el rol al registrar, de modo que la trazabilidad por rol refleja el rol que la cuenta tenía cuando ocurrió la acción.

### Endpoints entregados

| Método | Ruta | Parámetros | Respuesta |
|---|---|---|---|
| `GET` | `/api/usuarios/{id}/historial` | — | `200`, lista de `{id, accion, detalle, fecha}` del usuario, de la más reciente a la más antigua; `[]` si no tiene acciones |
| `GET` | `/api/usuarios/trazabilidad` | `?rol=administrador\|recepcionista\|operario\|cliente` (opcional) | `200`, lista de `{id, usuario_id, usuario, tipo_usuario, accion, detalle, fecha}`; `[]` si no hay coincidencias |

`accion` es `creado`, `editado`, `activado`, `desactivado` o `inicio_sesion`. Los tipos `HistorialAccion` y `AccionAuditoria` de `frontend/lib/api.ts` coinciden con estas respuestas.

### Pruebas automatizadas

`accounts/tests.py`, clase `AuditoriaTests`, con 13 pruebas que cubren:
- las cinco acciones, y que un inicio de sesión no se registre como edición;
- el detalle y el autor de una edición y de una desactivación hechas desde el API;
- que el historial devuelva solo las acciones del usuario;
- la lista vacía, tanto en el historial como en la trazabilidad (escenario "Sin resultados");
- la trazabilidad global y su filtro por rol;
- la inmutabilidad en el Django Admin.

### Desviaciones y pendientes

- **Las acciones en otros módulos no entran al historial.** Lo que un usuario hace en el catálogo o en las reglas de descuento queda en `creado_por` y `actualizado_por` de cada registro (T3), pero no aparece en este historial. Hay que decidir si HU04 se amplía cuando existan órdenes o si eso queda para EP10.
- **El tipo `cliente` nunca se registra.** Está en `TipoUsuario`, pero los clientes no son `User`, así que filtrar por `cliente` siempre devuelve una lista vacía.
- **No hay filtro por fechas ni paginación en el backend.** El filtro por fechas de la pantalla de historial se hace en el navegador sobre la lista completa. Funciona con pocos registros, pero no escala.
- **Escribir en la base desde la consola no está bloqueado.** La inmutabilidad depende de que no haya endpoints ni Admin. Un `delete()` desde `manage.py shell` sí borra.
- **No hay control por rol.** Cualquier sesión consulta el historial y la trazabilidad. Lo resuelve T8 (SCRUM-57).

---

## 2. Frontend

**Autor:** sebastianij · **Subtarea:** SCRUM-67
**PR:** #29 (historial por usuario) y #33 (trazabilidad legible y solo para administrador).

### Resumen

Dos pantallas de solo consulta, ambas exclusivas del administrador, que leen los endpoints de la sección 1: el historial de un usuario (`/usuarios/{id}/historial`) y la trazabilidad global (`/trazabilidad`). Comparten el módulo `frontend/lib/auditoria.ts`, así que muestran las acciones y las fechas de la misma forma.

### Decisiones tomadas

- **Solo consulta.** Ninguna de las dos pantallas ofrece editar ni borrar: los registros de auditoría son inmutables (regla de negocio de la historia).
- **Un módulo compartido, `lib/auditoria.ts`.** Exporta `ACCIONES` (etiqueta y color de cada acción), `FECHA_LEGIBLE` y `DIA_ISO`. En #33 se movió ahí lo que vivía dentro de la página del historial, para que la trazabilidad no repita ni se desvíe de esas reglas.
- **Etiquetas legibles para la acción.** `ACCIONES` cubre las cinco acciones del backend: Creado, Editado, Activado, Desactivado e Inicio de sesión. Si llegara una acción desconocida, la tabla muestra el valor tal cual.
- **Fecha en `America/Bogota`.** `FECHA_LEGIBLE` formatea con `es-CO` (fecha y hora cortas) en la zona del `TIME_ZONE` del backend, en lugar de mostrar el ISO en crudo. `DIA_ISO` calcula el día en la misma zona, porque en UTC una acción hecha a las 8 p. m. caería en el día siguiente y el filtro por fechas la dejaría por fuera.
- **El filtro por fechas se aplica en el navegador.** El endpoint del historial no recibe fechas, así que la página trae la lista completa y filtra por día, con ambos extremos incluidos. Las fechas viajan en la URL (`?desde=&hasta=`) y un valor que no sea `AAAA-MM-DD` se ignora.
- **El filtro de la trazabilidad es del lado del servidor.** Elegir un tipo de usuario navega a `/trazabilidad?rol=...` y la página pide `GET /api/usuarios/trazabilidad?rol=...`. Un `rol` que no esté en la lista se ignora y se muestran todos los tipos.
- **Solo el administrador entra.** Ambas páginas, en el servidor, redirigen a `/login` si no hay sesión y a `/` si el rol no es `administrador`. En la barra de navegación y en el inicio, el acceso a Trazabilidad solo aparece para ese rol.
- **Escenario "sin resultados" con dos mensajes.** En el historial, si el usuario no tiene acciones se muestra "Este usuario no tiene acciones registradas."; si las tiene pero el filtro no deja ninguna, "No hay registros para el filtro aplicado.". En la trazabilidad, una lista vacía muestra "No hay acciones registradas para este filtro.".
- **Error de conexión en lugar de aviso de "pendiente".** Se quitaron los avisos de "backend pendiente" (en #33, el de que el backend no tenía modelo de auditoría). Si la petición falla, o responde con un error, ambas páginas muestran "No se pudo cargar ...".
- **Seguimiento por usuario desde ambos lados.** La tabla de usuarios internos tiene un botón "Historial" por fila, y en la trazabilidad el nombre del usuario enlaza a su historial. Cuando `usuario_id` es nulo, el nombre se muestra sin enlace.
- **El encabezado del historial muestra el nombre de usuario.** Lo obtiene con `getUsuario(id)`; si no se puede leer, muestra `Usuario #id`.

### Pantallas entregadas

| Ruta | Qué permite hacer |
|---|---|
| `/usuarios/{id}/historial` | Ver las acciones de un usuario, de la más reciente a la más antigua, con columnas Fecha, Acción y Detalle. Filtrar por rango de fechas (Desde, Hasta, Filtrar y Limpiar). Enlace de regreso a Usuarios internos. |
| `/trazabilidad` | Ver las acciones de todos los usuarios, con columnas Usuario, Tipo, Acción, Detalle y Fecha. Filtrar por tipo de usuario: administrador, recepcionista, operario o cliente. |

Archivos: `app/usuarios/[id]/historial/{page,filtro-fechas}.tsx`, `app/trazabilidad/{page,tabla-trazabilidad,filtro-tipo}.tsx`, `app/trazabilidad/tipos.ts` y `lib/auditoria.ts`. Las llamadas pasan por `getHistorialUsuario`, `getUsuario` y `getTrazabilidad` de `lib/api.ts`; en #33 el campo `accion` de `AccionAuditoria` pasó de `string` a `AccionUsuario`.

### Desviaciones y pendientes

- **La trazabilidad no filtra por fechas.** RF11 habla de filtrar por usuario y/o rango de fechas. El historial cubre ambos (el usuario lo fija la URL), pero la trazabilidad global solo filtra por tipo de usuario.
- **Sin paginación ni filtro de fechas en el servidor.** Las dos pantallas descargan la lista completa y la pintan entera, y el historial filtra en el navegador. Funciona con pocos registros, pero no escala. Depende de lo mismo que se anota en la sección 1.
- **Filtrar por `cliente` siempre queda vacío.** El filtro de la trazabilidad lo ofrece, pero el backend nunca registra ese tipo (sección 1), así que siempre aparece "No hay acciones registradas para este filtro.".
- **El control de acceso es solo de pantalla.** La redirección por rol vive en estas páginas y el backend sigue sin exigir rol. El control general lo resuelve T8 (SCRUM-57).
