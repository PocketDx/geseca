# HU04 — Historial de acciones de cada usuario

**Proyecto:** SmartWash
**Historia de usuario:** HU04 — Consultar el historial de acciones de cada usuario
**Subtarea Jira:** SCRUM-149 `[Documentación]`

> Cada sección la completa quien hizo esa parte, sin borrar lo que escribieron los demás. Cuando las dos estén completas, la subtarea pasa a **Finalizado**.

| Sección | Responsable | Estado |
|---|---|---|
| 1. Backend | Juan Daniel Torres Morales | ✅ Completo |
| 2. Frontend | sebastianij | ⬜ Pendiente |

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
*(Responsable: sebastianij — completar con lo entregado en HU04 [Desarrollo Frontend], SCRUM-67)*

- **Resumen:**
- **Decisiones de diseño/implementación:**
- **Pantallas entregadas:** (nombre de cada pantalla/componente, qué permite hacer, capturas si aplica)
- **Desviaciones frente a la especificación original:**

