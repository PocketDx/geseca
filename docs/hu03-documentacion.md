# HU03 — Gestión de usuarios internos

**Proyecto:** SmartWash
**Historia de usuario:** HU03 — Crear, editar y desactivar usuarios internos asignándoles un rol
**Subtarea Jira:** SCRUM-146 `[Documentación]`

> Cada sección la completa quien hizo esa parte, sin borrar lo que escribieron los demás. Cuando las dos estén completas, la subtarea pasa a **Finalizado**.

| Sección | Responsable | Estado |
|---|---|---|
| 1. Backend | Juan Daniel Torres Morales | ✅ Completo |
| 2. Frontend | Dairo Javier Rodríguez Gómez | ✅ Completo |

---

## 1. Backend

**Autor:** Juan Daniel Torres Morales · **Subtarea:** SCRUM-64
**PR:** #19, restaurado en #22 tras perderse en un merge, y completado en el PR de cierre del Sprint 1 (contraseña segura y último administrador).

### Resumen

Permite crear, editar y desactivar las cuentas internas (administrador, recepcionista, operario). Vive en la app `accounts`, sobre el modelo `User` con `rol` que dejó T3 (SCRUM-55).

### Decisiones tomadas

- **Baja lógica, no borrado.** Desactivar pone `is_active = False` y no existe un endpoint para borrar. Así se conserva el historial de auditoría (HU04) y no se rompen las referencias a la cuenta.
- **`is_active` solo cambia por su endpoint.** En el serializer de escritura es de solo lectura, para que un `PATCH` de edición no pueda desactivar ni reactivar una cuenta sin dejar claro que esa es la acción.
- **Contraseña obligatoria solo al crear, y siempre segura.** En `PATCH`, si no se envía `password` no se toca; si se envía, se vuelve a hashear con `set_password`. En ambos casos pasa por `AUTH_PASSWORD_VALIDATORS` (longitud, contraseñas comunes, solo números y parecido con los datos de la cuenta), igual que en la recuperación de HU02.
- **Siempre queda un administrador activo.** No se puede desactivar ni quitarle el rol al último administrador activo: el sistema quedaría sin nadie que gestione cuentas.
- **Un serializer para leer y otro para escribir.** `UsuarioAdminSerializer` (con `is_active` y sin `password`) se usa para `GET`. `UsuarioInternoSerializer` (con `password` de solo escritura) se usa para `POST` y `PATCH`.
- **Un solo rol por usuario.** La regla de negocio "un usuario interno solo puede tener un rol activo a la vez" la garantiza el modelo: `rol` es un único campo con tres valores posibles.
- **Rutas sin el prefijo `auth/`.** `accounts.urls` se monta en `api/`. Solo login, logout, me y actuar-como llevan `auth/`.

### Endpoints entregados

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `GET` | `/api/usuarios` | — | `200`, lista de `{id, username, email, first_name, last_name, rol, is_active}` ordenada por `username` |
| `POST` | `/api/usuarios` | `{username, email, first_name, last_name, rol, password}` | `201` con el usuario, o `400` por campo (por ejemplo, `username` repetido, `password` ausente o débil) |
| `GET` | `/api/usuarios/{id}` | — | `200` con el usuario |
| `PATCH` | `/api/usuarios/{id}` | Cualquier subconjunto de los campos anteriores | `200` con el usuario, o `400` (contraseña débil, o quitar el rol al último administrador activo) |
| `POST` | `/api/usuarios/{id}/desactivar` | — | `200` con el usuario y `is_active: false`, o `400` si es el último administrador activo |

Los nombres de campo y los valores de `rol` coinciden con los tipos `UsuarioAdmin` y `UsuarioFormulario` de `frontend/lib/api.ts`.

### Pruebas automatizadas

`accounts/tests.py`, clase `UsuarioInternoTests`, con 11 pruebas que cubren:
- que se exija sesión;
- crear un usuario con su rol y rechazar la creación sin contraseña o con una contraseña débil;
- que la lista incluya el estado activo;
- editar el rol y que el usuario tenga un solo rol;
- desactivar sin borrar;
- la protección del último administrador activo, tanto al desactivarlo como al quitarle el rol.

El backend completo suma 107 pruebas OK.

### Desviaciones y pendientes

- **No hay control por rol.** Cualquier sesión puede usar estos endpoints, incluso un operario que se crea a sí mismo una cuenta de administrador. Lo resuelve T8 (SCRUM-57, sprint S4).
- **No hay endpoint para reactivar.** La historia pide crear, editar y desactivar. Reactivar se hace desde el Django Admin, y HU04 lo registra como `activado`.
- **La protección del último administrador no bloquea filas.** Dos bajas simultáneas de los dos últimos administradores pasarían. Con el volumen del proyecto no compensa un `select_for_update`.
- **Incidente de integración (ya resuelto).** En el merge de HU04 sobre `dev` se perdieron las vistas de HU03 y `accounts.urls` quedó montado en `api/auth/`. Se restauró en el PR #22. La misma regresión volvió a aparecer en el PR #28 y se corrigió antes del merge. Las pruebas de `accounts` la detectan: si alguna falla con 404 en `/api/auth/...` o en `/api/usuarios`, el problema es el montaje de rutas.

---

## 2. Frontend

**Subtarea:** SCRUM-65 · **PR:** #36 (editar, errores reales y cancelar sobre la pantalla de crear y desactivar que ya existía).

### Resumen

La pantalla `/usuarios` permite al administrador crear, editar y desactivar usuarios internos y consultar el historial de cada uno. Consume los endpoints de la sección 1 a través de `lib/api.ts` (`getUsuarios`, `crearUsuario`, `actualizarUsuario`, `desactivarUsuario`). Los archivos están en `frontend/app/usuarios/`.

### Decisiones de diseño e implementación

- **Un solo formulario para crear y editar.** `usuario-form.tsx` recibe un `usuario` opcional: sin él es el formulario de alta (`POST`); con él, el de edición (`PATCH`) precargado con los datos de la cuenta.
- **Edición en la misma fila.** El botón Editar de cada fila despliega el formulario debajo de ella. Solo hay una fila en edición a la vez; abrir otra o pulsar Editar de nuevo cierra la actual.
- **Contraseña opcional al editar.** El campo se llama "Contraseña nueva (opcional)" y el `PATCH` solo la incluye si se escribió algo. El resto de los campos (`username`, `email`, `first_name`, `last_name`, `rol`) se envían siempre.
- **Los errores son los del backend.** El frontend solo marca como obligatorios `username`, `email` (con formato de correo), `rol` y, al crear, `password`. Todo lo demás lo valida el backend y la pantalla muestra lo que responde. `errores.tsx` convierte cada respuesta `400` en una lista de mensajes con `leerErroresApi` y antepone la etiqueta del campo (`Usuario`, `Correo`, `Nombres`, `Apellidos`, `Rol`, `Contrasena`); los mensajes sin campo, como `detail`, se muestran tal cual.
- **Cancelar descarta sin llamar a la API.** Restablece el formulario, borra los mensajes y, si era una edición, cierra el editor. No se envía ninguna petición, así que no cambia nada (escenario 2 de la historia).
- **Los datos se refrescan desde el servidor.** Tras crear, editar o desactivar con éxito se llama a `router.refresh()`, que vuelve a ejecutar `getUsuarios` en el Server Component de la página. No hay estado local de la lista que pueda desincronizarse.
- **`reset()` con la referencia guardada.** El formulario se guarda en una variable antes del primer `await`, porque después `event.currentTarget` es `null` y el `reset()` fallaba.
- **El estado vive en la fila.** El botón Desactivar no se muestra en usuarios inactivos. Mientras la petición está en curso el botón queda deshabilitado y muestra `...`. Desactivar no pide confirmación.

### Pantallas entregadas

| Pantalla o componente | Qué permite |
|---|---|
| `/usuarios` (`page.tsx`) | Lista de usuarios internos con el formulario "Nuevo usuario" encima. Si la lista no se puede cargar, muestra un aviso en lugar de la tabla. |
| `usuario-form.tsx` | Alta y edición: usuario, correo, nombres, apellidos, rol (administrador, recepcionista, operario) y contraseña. Botones Crear usuario o Guardar cambios, y Cancelar. Tras crear muestra "Usuario creado." |
| `tabla-usuarios.tsx` | Tabla con usuario, rol y estado (Activo o Inactivo). Cada fila tiene Historial, Editar y, solo si la cuenta está activa, Desactivar. |
| `errores.tsx` | Convierte las respuestas de error en mensajes legibles y los muestra en una alerta. Si no hay conexión muestra "No se pudo conectar con el servidor. Intenta de nuevo."; si la respuesta no trae mensajes, "No se pudo … (error NNN)". |
| `/usuarios/{id}/historial` | Ya existía (HU04). El botón Historial de cada fila enlaza a ella. |

### Errores que muestra la pantalla

| Situación | Respuesta del backend | Se muestra en |
|---|---|---|
| Contraseña débil o ausente, al crear o editar | `400 {"password": [...]}`, una lista con cada regla incumplida | La alerta del formulario, una línea por regla con el prefijo "Contrasena:" |
| Quitar el rol de administrador al último administrador activo | `400 {"rol": ["Debe quedar al menos un administrador activo."]}` | La alerta del formulario, con el prefijo "Rol:" |
| Desactivar al último administrador activo | `400 {"detail": "Debe quedar al menos un administrador activo."}` (cadena, no lista) | La alerta sobre la tabla, "No se pudo desactivar el usuario" |
| Usuario repetido, correo o rol no válidos | `400` por campo | La alerta del formulario |
| Sin conexión con el servidor | — | Mensaje de conexión |

`leerErroresApi` normaliza ambas formas (lista o cadena) a una lista de mensajes.

### Desviaciones frente a la especificación

- **No se puede reactivar desde la pantalla.** La historia pide crear, editar y desactivar, y el backend no expone reactivación. Un usuario inactivo se puede editar, pero no volver a activar. Se reactiva desde el Django Admin (ver sección 1).
- **`/usuarios` no comprueba el rol en el servidor.** La página solo exige sesión: sin ella redirige a `/login`. Que solo el administrador la vea depende de que la barra de navegación (`nav-bar.tsx`) muestre el enlace únicamente a ese rol, pero quien conozca la URL puede abrirla con cualquier sesión, y el backend tampoco restringe los endpoints. Lo resuelve T8 (SCRUM-57, sprint S4). La página de historial, en cambio, ya redirige a quien no es administrador.
- **Sin confirmación al desactivar.** El botón actúa al primer clic. La baja es lógica y queda en el historial, pero no se puede deshacer desde la pantalla.
- **El rol se muestra con el valor interno** (`administrador`, `recepcionista`, `operario`), sin etiqueta traducida.
- **La contraseña se asigna a mano.** El formulario no genera contraseñas temporales ni obliga a cambiarla en el primer inicio de sesión.
