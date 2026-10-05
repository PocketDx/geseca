# HU03 — Gestión de usuarios internos

**Proyecto:** SmartWash
**Historia de usuario:** HU03 — Crear, editar y desactivar usuarios internos asignándoles un rol
**Subtarea Jira:** SCRUM-146 `[Documentación]`

> Cada sección la completa quien hizo esa parte, sin borrar lo que escribieron los demás. Cuando las cuatro estén completas, la subtarea pasa a **Finalizado**.

| Sección | Responsable | Estado |
|---|---|---|
| 1. Backend | Juan Daniel Torres Morales | ✅ Completo |
| 2. Frontend | Dairo Javier Rodríguez Gómez | ⬜ Pendiente |
| 3. Pruebas Funcionales Backend | Faiber Sleyder Galvis Romero | ⬜ Pendiente |
| 4. Pruebas Funcionales Frontend | sebastianij | ⬜ Pendiente |

---

## 1. Backend

**Autor:** Juan Daniel Torres Morales · **Subtarea:** SCRUM-64
**PR:** #19, restaurado en #22 tras perderse en un merge. Vigente en `dev` (`ee8d20e`).

### Resumen

Permite crear, editar y desactivar las cuentas internas (administrador, recepcionista, operario). Vive en la app `accounts`, sobre el modelo `User` con `rol` que dejó T3 (SCRUM-55).

### Decisiones tomadas

- **Baja lógica, no borrado.** Desactivar pone `is_active = False` y no existe un endpoint para borrar. Así se conserva el historial de auditoría (HU04) y no se rompen las referencias a la cuenta.
- **`is_active` solo cambia por su endpoint.** En el serializer de escritura es de solo lectura, para que un `PATCH` de edición no pueda desactivar ni reactivar una cuenta sin dejar claro que esa es la acción.
- **Contraseña obligatoria solo al crear.** En `PATCH`, si no se envía `password` no se toca; si se envía, se vuelve a hashear con `set_password`.
- **Un serializer para leer y otro para escribir.** `UsuarioAdminSerializer` (con `is_active` y sin `password`) se usa para `GET`. `UsuarioInternoSerializer` (con `password` de solo escritura) se usa para `POST` y `PATCH`.
- **Un solo rol por usuario.** La regla de negocio "un usuario interno solo puede tener un rol activo a la vez" la garantiza el modelo: `rol` es un único campo con tres valores posibles.
- **Rutas sin el prefijo `auth/`.** `accounts.urls` se monta en `api/`. Solo login, logout, me y actuar-como llevan `auth/`.

### Endpoints entregados

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `GET` | `/api/usuarios` | — | `200`, lista de `{id, username, email, first_name, last_name, rol, is_active}` ordenada por `username` |
| `POST` | `/api/usuarios` | `{username, email, first_name, last_name, rol, password}` | `201` con el usuario, o `400` por campo (por ejemplo, `username` repetido o `password` ausente) |
| `GET` | `/api/usuarios/{id}` | — | `200` con el usuario |
| `PATCH` | `/api/usuarios/{id}` | Cualquier subconjunto de los campos anteriores | `200` con el usuario |
| `POST` | `/api/usuarios/{id}/desactivar` | — | `200` con el usuario y `is_active: false` |

Los nombres de campo y los valores de `rol` coinciden con los tipos `UsuarioAdmin` y `UsuarioFormulario` de `frontend/lib/api.ts`.

### Pruebas automatizadas

`accounts/tests.py`, clase `UsuarioInternoTests`, con 7 pruebas que cubren:
- que se exija sesión;
- crear un usuario con su rol y rechazar la creación sin contraseña;
- que la lista incluya el estado activo;
- editar el rol y que el usuario tenga un solo rol;
- desactivar sin borrar.

El backend completo suma 99 pruebas OK. No hay prueba del cambio de contraseña por `PATCH` ni de que `PATCH` ignore `is_active`.

### Desviaciones y pendientes

- **No hay control por rol.** Cualquier sesión puede usar estos endpoints, incluso un operario que se crea a sí mismo una cuenta de administrador. Lo resuelve T8 (SCRUM-57, sprint S4).
- **No se valida la fortaleza de la contraseña al crear o editar.** `AUTH_PASSWORD_VALIDATORS` solo se aplica en la recuperación de HU02. Conviene llamar a `validate_password` también aquí.
- **No hay endpoint para reactivar.** Hoy solo se reactiva desde el Django Admin, aunque HU04 ya registra la acción `activado`.
- **Nada impide desactivar al último administrador ni a uno mismo.** Si pasa, la única salida es el Django Admin o la consola.
- **Incidente de integración (ya resuelto).** En el merge de HU04 sobre `dev` se perdieron las vistas de HU03 y `accounts.urls` quedó montado en `api/auth/`. Se restauró en el PR #22. La misma regresión volvió a aparecer en el PR #28 y se corrigió antes del merge. Las pruebas de `accounts` la detectan: si alguna falla con 404 en `/api/auth/...` o en `/api/usuarios`, el problema es el montaje de rutas.

---

## 2. Frontend
*(Responsable: Dairo Javier Rodríguez Gómez — completar con lo entregado en HU03 [Desarrollo Frontend], SCRUM-65)*

- **Resumen:**
- **Decisiones de diseño/implementación:**
- **Pantallas entregadas:** (nombre de cada pantalla/componente, qué permite hacer, capturas si aplica)
- **Desviaciones frente a la especificación original:**

---

## 3. Pruebas Funcionales Backend
*(Responsable: Faiber Sleyder Galvis Romero — completar con lo ejecutado en HU03 [Pruebas Funcionales Backend], SCRUM-144)*

- **Criterios de aceptación verificados:**
- **Casos probados** (endpoint, entrada, resultado esperado, resultado obtenido):
- **Hallazgos / incidencias encontradas:**
- **Resultado final:** (Aprobado / Aprobado con observaciones / Rechazado)

---

## 4. Pruebas Funcionales Frontend
*(Responsable: sebastianij — completar con lo ejecutado en HU03 [Pruebas Funcionales Frontend], SCRUM-145)*

- **Criterios de aceptación verificados:**
- **Casos probados** (pantalla/acción, pasos, resultado esperado, resultado obtenido):
- **Hallazgos / incidencias encontradas:**
- **Resultado final:** (Aprobado / Aprobado con observaciones / Rechazado)
