# HU04 — Historial de acciones de cada usuario

**Proyecto:** SmartWash
**Historia de usuario:** HU04 — Consultar el historial de acciones de cada usuario
**Subtarea Jira:** SCRUM-149 `[Documentación]`

> Cada sección la completa quien hizo esa parte, sin borrar lo que escribieron los demás. Cuando las cuatro estén completas, la subtarea pasa a **Finalizado**.

| Sección | Responsable | Estado |
|---|---|---|
| 1. Backend | Juan Daniel Torres Morales | ✅ Completo |
| 2. Frontend | sebastianij | ⬜ Pendiente |
| 3. Pruebas Funcionales Backend | YOSET ALFONSO PIEDRAHITA RAMIREZ | ⬜ Pendiente |
| 4. Pruebas Funcionales Frontend | Dairo Javier Rodríguez Gómez | ⬜ Pendiente |

---

## 1. Backend

**Autor:** Juan Daniel Torres Morales · **Subtarea:** SCRUM-66
**PR:** #20. Vigente en `dev` (`ee8d20e`).

### Resumen

Cada cambio sobre una cuenta interna queda en el modelo `RegistroAuditoria` (app `accounts`). Hay dos consultas: el historial de un usuario y la trazabilidad global con filtro por tipo de usuario.

### Decisiones tomadas

- **Se registra con señales, no desde las vistas.** `pre_save` y `post_save` sobre `User` (en `accounts/signals.py`) crean el registro sin importar si el cambio vino del API, del Django Admin o de un comando como `seed_usuarios`. `pre_save` lee el `is_active` anterior para distinguir `activado` y `desactivado` de `editado`.
- **Los registros son inmutables.** No hay endpoint de escritura, y el Django Admin del modelo es de solo lectura: `has_add_permission`, `has_change_permission` y `has_delete_permission` devuelven `False`. Así se cumple la regla de negocio de que ningún rol modifica ni borra auditoría.
- **Se conserva el nombre aunque la cuenta desaparezca.** La FK `usuario` usa `SET_NULL` y `usuario_nombre` guarda el `username` del momento, para que el registro siga siendo legible.
- **Se guarda el rol del momento.** `tipo_usuario` copia el rol al registrar, de modo que la trazabilidad por rol refleja el rol que la cuenta tenía cuando ocurrió la acción.

### Endpoints entregados

| Método | Ruta | Parámetros | Respuesta |
|---|---|---|---|
| `GET` | `/api/usuarios/{id}/historial` | — | `200`, lista de `{id, accion, detalle, fecha}` del usuario, de la más reciente a la más antigua; `[]` si no tiene acciones |
| `GET` | `/api/usuarios/trazabilidad` | `?rol=administrador\|recepcionista\|operario\|cliente` (opcional) | `200`, lista de `{id, usuario_id, usuario, tipo_usuario, accion, detalle, fecha}`; `[]` si no hay coincidencias |

`accion` es `creado`, `editado`, `activado` o `desactivado`. Los tipos `HistorialAccion` y `AccionAuditoria` de `frontend/lib/api.ts` coinciden con estas respuestas.

### Pruebas automatizadas

`accounts/tests.py`, clase `AuditoriaTests`, con 10 pruebas que cubren:
- las cuatro acciones;
- que el historial devuelva solo las acciones del usuario;
- la lista vacía, tanto en el historial como en la trazabilidad (escenario "Sin resultados");
- la trazabilidad global y su filtro por rol;
- la inmutabilidad en el Django Admin.

### Desviaciones y pendientes

- **Se registra lo que le pasa a la cuenta, no lo que hace el usuario.** La historia pide auditar el uso del sistema, es decir, qué hizo cada persona. Lo entregado registra cambios **sobre** la cuenta: alta, edición y (des)activación. No guarda quién hizo el cambio, ni las acciones del usuario en otros módulos (catálogo, reglas de descuento, órdenes). Los modelos de dominio ya guardan `creado_por` y `actualizado_por` (T3), pero eso no se expone en el historial. Hay que decidir si HU04 se amplía o si eso queda para una historia de EP10.
- **Cada inicio de sesión crea un registro `editado`.** Al hacer login, Django actualiza `last_login` y eso dispara la señal. En el historial no se distingue de una edición real. Corrección propuesta: no registrar cuando `update_fields` es solo `{"last_login"}`.
- **`detalle` siempre llega vacío.** Ninguna señal lo rellena. Podría decir qué campos cambiaron.
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

---

## 3. Pruebas Funcionales Backend
*(Responsable: YOSET ALFONSO PIEDRAHITA RAMIREZ — completar con lo ejecutado en HU04 [Pruebas Funcionales Backend], SCRUM-147)*

- **Criterios de aceptación verificados:**
- **Casos probados** (endpoint, entrada, resultado esperado, resultado obtenido):
- **Hallazgos / incidencias encontradas:**
- **Resultado final:** (Aprobado / Aprobado con observaciones / Rechazado)

---

## 4. Pruebas Funcionales Frontend
*(Responsable: Dairo Javier Rodríguez Gómez — completar con lo ejecutado en HU04 [Pruebas Funcionales Frontend], SCRUM-148)*

- **Criterios de aceptación verificados:**
- **Casos probados** (pantalla/acción, pasos, resultado esperado, resultado obtenido):
- **Hallazgos / incidencias encontradas:**
- **Resultado final:** (Aprobado / Aprobado con observaciones / Rechazado)
