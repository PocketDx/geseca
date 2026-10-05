# HU01 — Iniciar sesión con usuario y contraseña

**Proyecto:** SmartWash
**Historia de usuario:** HU01 — Iniciar sesión con mi usuario y contraseña
**Subtarea Jira:** SCRUM-140 `[Documentación]`

> Cada sección la completa quien hizo esa parte, sin borrar lo que escribieron los demás. Cuando las dos estén completas, la subtarea pasa a **Finalizado**.

| Sección | Responsable | Estado |
|---|---|---|
| 1. Backend | Juan Daniel Torres Morales | ✅ Completo |
| 2. Frontend | Juan Daniel Torres Morales | ✅ Completo |

---

## 1. Backend

**Autor:** Juan Daniel Torres Morales · **Subtarea:** SCRUM-60
**PR:** #38 (límite de intentos fallidos). El resto de la sesión (login, logout, me y actuar-como) ya estaba en `dev` y este documento solo lo describe.

### Resumen

Autenticación por sesión de Django sobre el modelo `User` con `rol`. Vive en la app `accounts`. Un usuario interno entra con su **nombre de usuario** (no con el correo) y su contraseña; la cuenta debe existir y estar activa, con el rol que le asignó un administrador (HU03). Al entrar se crea la sesión y la respuesta incluye el `rol`, que el frontend usa para decidir qué módulos muestra.

La regla de negocio de la historia, limitar los intentos fallidos consecutivos (RNF-03), la añadió el PR #38. La historia en Jira solo remite a RNF-03, sin cifras: el 5 y los 15 minutos son constantes definidas en `accounts/views.py` (`MAX_INTENTOS_LOGIN`, `BLOQUEO_LOGIN_SEGUNDOS`).

### Decisiones tomadas

- **Sesión de Django con cookie, sin tokens.** `SessionAuthentication` es la única clase de autenticación de DRF y `IsAuthenticated` el permiso por defecto. Django guarda la sesión en base de datos y entrega la cookie `sessionid`. Su duración es la que Django trae por defecto, porque `settings.py` no la configura.
- **CSRF obligatorio.** `LoginView` y `ActuarComoView` llevan `csrf_protect`. `LogoutView` no lo lleva, pero `SessionAuthentication` exige el token a toda petición con sesión, así que un `POST /api/auth/logout` con sesión y sin `X-CSRFToken` responde `403`. `MeView` lleva `ensure_csrf_cookie`: un `GET /api/auth/me` siembra la cookie `csrftoken` aunque no haya sesión, y de ahí la toma el frontend antes del primer login.
- **Origen de confianza.** El navegador habla con Next.js, que reenvía `/api/*` a Django (`rewrites` en `next.config.ts`). El `Origin` sigue siendo el del frontend, por lo que debe estar en `DJANGO_CSRF_TRUSTED_ORIGINS` (por defecto `http://localhost:3000` y `http://127.0.0.1:3000`, documentado en `backend/.env.example`). Con otro puerto, como el 3100 en local, hay que añadirlo al `.env`.
- **Cookies seguras fuera de desarrollo.** `SESSION_COOKIE_SECURE` y `CSRF_COOKIE_SECURE` valen `not DEBUG`.
- **`/api/auth/me` responde `403`, no `401`,** cuando no hay sesión. DRF devuelve `403` porque `SessionAuthentication` no define cabecera `WWW-Authenticate`. El frontend solo comprueba `response.ok`.
- **Una sola respuesta ante credenciales malas.** Contraseña incorrecta, usuario inexistente y cuenta desactivada devuelven el mismo `401` con `"Credenciales invalidas."`, para no revelar qué cuentas existen.
- **Cada login queda auditado.** `login()` dispara `user_logged_in` y `accounts/signals.py` crea un `RegistroAuditoria` con acción `inicio_sesion` (HU04). Lo mismo ocurre con `actuar-como`, que también llama a `login()`.
- **Rutas.** `accounts.urls` se monta en `api/`; login, logout, me y actuar-como llevan el prefijo `auth/` en su propia ruta. Sin barra final.

### Límite de intentos fallidos (PR #38)

Cuenta los fallos por nombre de usuario en la caché de Django.

| Intento | Respuesta |
|---|---|
| Fallos 1 a 5 | `401` `"Credenciales invalidas."`. El quinto fallo ya activa el bloqueo, pero su propia respuesta sigue siendo `401` |
| Desde el sexto intento y durante 15 minutos | `429` `"Demasiados intentos fallidos. Intenta de nuevo en 15 minutos."`, incluso con la contraseña correcta |
| Tras 15 minutos desde el quinto fallo | El contador desaparece y el siguiente intento se evalúa con normalidad |
| Un acierto antes del bloqueo | Borra el contador: los fallos anteriores no se acumulan |

Cómo funciona exactamente:

- **Clave.** `login-fallos:` más el SHA-256 del nombre escrito, sin espacios en los extremos y en minúsculas. `ana`, `ANA` y ` ana ` comparten contador. El hash evita caracteres inválidos en la clave de caché.
- **Se cuenta el nombre, exista o no la cuenta.** Un usuario inexistente se bloquea igual que uno real y la respuesta es idéntica (mismo código y mismo cuerpo), de modo que el bloqueo no delata qué cuentas existen.
- **La comprobación va antes de `authenticate`.** Una cuenta bloqueada no llega a validar la contraseña; de lo contrario, la diferencia entre `200` y `429` revelaría si el intento acertó.
- **Ventana.** El contador nace con 15 minutos de vida desde el primer fallo, y los incrementos no la renuevan. Al llegar al quinto fallo la vida se reinicia a 15 minutos (`cache.touch`), de modo que el bloqueo dura 15 minutos completos desde ese fallo. Cuatro fallos espaciados más de 15 minutos desde el primero no suman.
- **Una petición inválida no cuenta.** Si falta `username` o `password`, el serializador responde `400` antes de tocar el contador.
- **El bloqueo es por cuenta.** Bloquear a `ana` no afecta a `luis`.

Limitaciones del diseño actual, a propósito y sin arreglo en este PR:

- **Caché en memoria del proceso.** `settings.py` no define `CACHES`, así que se usa `LocMemCache`, que es local a cada proceso. Reiniciar el servidor borra los contadores y, con varios procesos o instancias, cada uno cuenta por separado: el límite efectivo se multiplica por el número de procesos. Para que sea fiable en producción hay que configurar una caché compartida (Redis, Memcached o la de base de datos).
- **Bloqueo por usuario, no por IP.** No hay límite por origen: quien conozca un nombre de usuario puede bloquearle la cuenta a su dueño repitiendo contraseñas malas, y puede probar nombres distintos sin tope. Es el costo de no filtrar por una IP que el cliente puede falsear con `X-Forwarded-For`, el mismo criterio que usa la recuperación de contraseña (HU02).
- **Sin `Retry-After`.** La respuesta `429` no lleva esa cabecera. El tiempo de espera solo está en el texto de `detail`.

### Endpoints entregados

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `POST` | `/api/auth/login` | `{username, password}` | `200` con `{id, username, email, first_name, last_name, rol}` y las cookies `sessionid` y `csrftoken`; `400` por campo si falta alguno (por ejemplo `{"password": ["Este campo es requerido."]}`); `401` credenciales inválidas; `403` sin token CSRF; `429` cuenta bloqueada |
| `POST` | `/api/auth/logout` | — | `204` y la sesión termina; `403` si no hay sesión o falta el token CSRF |
| `GET` | `/api/auth/me` | — | `200` con el usuario autenticado; `403` sin sesión. Siembra la cookie `csrftoken` en ambos casos |
| `GET` | `/api/auth/actuar-como` | — | `200` con las cuentas sembradas que se pueden tomar (`admin`, `recepcion`, `operario1`, `operario2` que existan); `403` sin sesión; `404` si `DEBUG=False` |
| `POST` | `/api/auth/actuar-como` | `{username}` | `200` con el usuario y la sesión pasa a esa cuenta; `400` `"Cuenta no permitida."` si el nombre no está en la lista; `403` sin sesión; `404` si `DEBUG=False` |

Los endpoints de recuperación de contraseña (`recuperar-password` y `confirmar-recuperacion`) también cuelgan de `auth/`, pero pertenecen a HU02 y se documentan allí.

**`actuar-como` es un andamio de desarrollo.** Permite cambiar de cuenta sin contraseña para probar los roles. Solo admite los cuatro nombres de una lista fija en el código, existe únicamente con `DEBUG=True` (en producción responde `404` y el selector del frontend se oculta solo) y se elimina cuando llegue el control de acceso por rol (T8, SCRUM-57). Al no pasar por `authenticate`, no está sujeto al límite de intentos.

### Pruebas automatizadas

`accounts/tests.py`:

- `AuthTests` (6 pruebas): `me` exige sesión; `me` siembra la cookie CSRF aunque no haya sesión; login válido crea la sesión y devuelve el rol; credenciales inválidas se rechazan; login sin token CSRF se rechaza; logout cierra la sesión.
- `ActuarComoTests` (3 pruebas): cambia la sesión a otra cuenta sembrada; rechaza un usuario fuera de la lista; no existe con `DEBUG=False`.
- `LimiteIntentosLoginTests` (9 pruebas, PR #38):
  - el quinto fallo bloquea los intentos siguientes;
  - con la cuenta bloqueada ni la clave correcta entra;
  - el bloqueo termina a los 15 minutos y sigue vigente antes;
  - un acierto reinicia el contador;
  - una cuenta inexistente se bloquea igual que una existente;
  - el bloqueo de una cuenta no afecta a las demás;
  - no distingue mayúsculas ni espacios;
  - una petición inválida no cuenta como fallo.

`AuthTests.setUp` y `LimiteIntentosLoginTests.setUp` llaman a `cache.clear()`, porque el contador vive en una caché compartida entre pruebas. En `dev` la suite completa suma 107 pruebas; el PR #38 añade 9.

### Desviaciones y pendientes

- **Sin control por rol.** Que la sesión lleve el `rol` no implica que el backend lo aplique: cualquier sesión puede usar cualquier endpoint. Lo resuelve T8 (SCRUM-57, sprint S4).
- **Sin expiración por inactividad.** La sesión dura lo que fija Django por defecto; la expiración por inactividad también queda para T8.
- **Login solo con nombre de usuario.** La historia dice "usuario y contraseña" y el serializador pide `username`; iniciar sesión con el correo no está implementado.
- **Límite de intentos con las limitaciones indicadas arriba:** memoria del proceso, por usuario y no por IP, sin `Retry-After`. Las cifras (5 intentos, 15 minutos) no vienen de la historia.
- **Fallos 1 a 5 responden `401`; el `429` llega desde el sexto intento.** Quien espere un `429` en el quinto fallo no lo verá: el quinto activa el bloqueo, pero lo notifica el intento siguiente.
- **`actuar-como` no estaba en la especificación.** Se añadió para probar roles (SCRUM-56), audita un `inicio_sesion` por cada cambio de cuenta y se retira en T8.

---

## 2. Frontend

**Autor:** Juan Daniel Torres Morales · **Subtarea:** SCRUM-61
**PR:** sin cambios de frontend en este sprint; el documento describe lo que hay en `dev`.

### Resumen

Pantalla pública `/login` y el manejo de sesión alrededor de ella: botón de cierre de sesión, navegación según el rol y redirección a `/login` desde los módulos privados cuando no hay sesión.

### Decisiones de diseño e implementación

- **Todo pasa por `lib/api.ts`.** La función `api()` pide a rutas relativas (`/api/...`), que Next.js reenvía a Django, y la cookie de sesión viaja sola. En los métodos de escritura (`POST`, `PUT`, `PATCH`, `DELETE`) adjunta `X-CSRFToken` leído de la cookie `csrftoken`; si la cookie no existe, antes hace un `GET /api/auth/me` para sembrarla.
- **La sesión se lee en el servidor.** `getCurrentUser(cookies)` pide `/api/auth/me` reenviando las cookies a mano y devuelve `null` si no hay sesión o si el backend no responde. Así, un Django caído lleva a `/login` y no a un error 500.
- **El rol viene de la sesión.** El tipo `User` de `api.ts` replica `UserSerializer` (`id, username, email, first_name, last_name, rol`).
- **Los módulos privados redirigen a `/login`.** `clientes`, `usuarios` (y el historial de cada usuario), `catalogo`, `fidelizacion`, `ordenes` y `trazabilidad` llaman a `getCurrentUser` y, sin sesión, hacen `redirect("/login")`.

### Pantallas entregadas

| Pantalla o componente | Ruta | Qué permite |
|---|---|---|
| Login (`app/login/page.tsx`) | `/login` | Formulario con **Usuario** y **Contrasena**, ambos obligatorios, y el botón **Iniciar sesion**. Envía `POST /api/auth/login` con `{username, password}`. Con `200` va a `/` (`router.replace` y `router.refresh`). Con otro código muestra en rojo (`role="alert"`) el `detail` de la respuesta: `"Credenciales invalidas."` en `401` y el mensaje de bloqueo en `429`; si la respuesta no trae `detail`, muestra `"No fue posible iniciar sesion."`. Si el servidor no responde muestra `"No hay conexion con el servidor. Intentalo de nuevo."`. Mientras espera, el botón queda deshabilitado y dice `Ingresando...`. Incluye el enlace `¿Olvidaste tu contrasena?` a `/recuperar-password` (HU02) |
| Inicio (`app/page.tsx`) | `/` | Sin sesión muestra la página de presentación pública. Con sesión muestra `Hola, <nombre o usuario>`, el usuario y el rol, los accesos a los módulos que corresponden al rol y el botón de cierre de sesión |
| Cerrar sesión (`app/logout-button.tsx`) | `/` | Botón **Cerrar sesion**: `POST /api/auth/logout` y luego `router.replace("/login")` y `router.refresh()`. Si el backend no responde, igualmente lleva a `/login` |
| Barra de navegación (`app/components/nav-bar.tsx`) | Todas | Sin sesión: enlaces públicos y el botón **Iniciar sesion**. Con sesión: los módulos del rol (tabla siguiente) y el selector `Actuar como...` |
| Selector `Actuar como...` (`app/components/actuar-como.tsx`) | Todas, con sesión | Lista las cuentas de `GET /api/auth/actuar-como` y, al elegir una, hace el `POST` y refresca la página. Si el backend responde `404` (producción) el componente no se muestra |

Módulos visibles en la navegación y en el inicio según el rol:

| Rol | Módulos |
|---|---|
| `administrador` | Clientes, Usuarios, Catalogo, Fidelizacion, Ordenes, Trazabilidad |
| `recepcionista` | Clientes, Catalogo, Ordenes |
| `operario` | Ordenes |

En la navegación sin sesión aparecen Nuestros servicios, Como funciona, Rastrear mi pedido y PQRS.

### Desviaciones frente a la especificación original

- **No hay botón Cancelar.** El escenario 2 de la historia pide que, al cancelar, el sistema descarte lo ingresado y no cambie nada. El formulario no tiene un control de cancelar: salir de la pantalla descarta lo escrito, porque no se guarda nada, pero no hay un botón explícito.
- **El rol solo oculta enlaces.** Los módulos que no corresponden al rol no se muestran, pero no están protegidos: `fidelizacion` y el historial de un usuario redirigen a `/` si el rol no es administrador, y las demás páginas privadas solo exigen sesión. El control real de acceso queda para T8 (SCRUM-57).
- **`/login` no redirige a quien ya tiene sesión.** Una persona autenticada que abra `/login` ve el formulario.
- **No se avisa de cuántos intentos quedan.** La pantalla solo muestra el mensaje del backend; el primer aviso de bloqueo llega con el `429` del sexto intento.
- **Cierre de sesión solo desde el inicio.** El botón está en `/`; la barra de navegación no lo incluye.
- **Textos sin tildes.** Las cadenas de la interfaz (`Contrasena`, `Iniciar sesion`) siguen la convención actual del frontend.
