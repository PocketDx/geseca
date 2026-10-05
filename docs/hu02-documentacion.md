# HU02 — Recuperar la contraseña por correo electrónico

**Proyecto:** SmartWash
**Historia de usuario:** HU02 — Recuperar mi contraseña por correo electrónico
**Subtarea Jira:** SCRUM-143 `[Documentación]`

> Cada sección la completa quien hizo esa parte, sin borrar lo que escribieron los demás. Cuando las dos estén completas, la subtarea pasa a **Finalizado**.

| Sección | Responsable | Estado |
|---|---|---|
| 1. Backend | Juan Daniel Torres Morales | ✅ Completo |
| 2. Frontend | sebastianij | ✅ Completo |

---

## 1. Backend

**Autor:** Juan Daniel Torres Morales · **Subtarea:** SCRUM-62
**PR:** #26. Ese PR alineó el contrato con el frontend y agregó el límite por IP. El límite por cuenta llegó después, en el PR #32.

### Resumen

El usuario interno que olvidó su contraseña la pide con su nombre de usuario o su correo, recibe por correo un enlace de un solo uso y con él fija una contraseña nueva. Vive en la app `accounts` y no usa modelos nuevos: el token lo genera `default_token_generator` de Django.

### Decisiones tomadas

- **Contrato de dos pasos.** Solicitar recibe `{identificador}`; confirmar recibe `{uid, token, password}`. El primer borrador del backend usaba `new_password` y la ruta `/api/auth/recuperar-password/confirmar`. En el #26 se renombró a `password` y `/api/auth/confirmar-recuperacion`, que es lo que ya consumía `frontend/lib/api.ts`.
- **El identificador es el usuario o el correo.** Se busca por `username` exacto o por `email` sin distinguir mayúsculas. Solo reciben correo las cuentas **activas** y con correo registrado, que es la precondición de la historia. Si varias cuentas comparten correo, cada una recibe su propio enlace.
- **La respuesta nunca revela si la cuenta existe.** Cuenta existente, inexistente, desactivada, sin correo o con el envío caído: todas responden `200` con el mismo mensaje. Si el envío falla, el error queda en el log (`logger.exception`) y no en la respuesta.
- **El enlace apunta a la pantalla `/restablecer-password`.** Tiene la forma `{FRONTEND_URL}/restablecer-password?uid=<uid>&token=<token>`. El `uid` es el `pk` en base64 seguro para URL.
- **Expira en 1 hora y se usa una sola vez.** `PASSWORD_RESET_TIMEOUT = 3600` segundos. El correo calcula los minutos a partir de ese valor y dice 60. El token se invalida además cuando cambia la contraseña, el correo o `last_login` de la cuenta, por la forma en que Django arma el hash: un inicio de sesión posterior a la solicitud también deja sin efecto el enlace.
- **La contraseña nueva pasa por `AUTH_PASSWORD_VALIDATORS`.** Longitud mínima, contraseñas comunes, solo números y parecido con los datos de la cuenta, igual que en HU03. Primero se valida el enlace y después la contraseña, así que un enlace inválido siempre responde lo mismo, sin importar la contraseña enviada.
- **Dos límites de solicitudes (RNF-03).** Los dos se aplican a `POST /api/auth/recuperar-password` y responden `429` al excederse.

  | Límite | Clave | Tasa | Dónde |
  |---|---|---|---|
  | Por IP | La IP de quien llama | 5 por hora | `ScopedRateThrottle`, scope `recuperar-password` |
  | Por cuenta | El `identificador` escrito, recortado y en minúsculas | 3 por hora | `RecuperarPasswordPorCuentaThrottle`, scope `recuperar-password-cuenta` |

  Las tasas están en `REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]`. El límite por cuenta existe porque la clave por IP se puede falsear: DRF toma la cabecera `X-Forwarded-For` completa cuando viene y `NUM_PROXIES` no está configurado. Con el límite por cuenta, cambiar de IP no sirve para llenar de correos la bandeja de otra persona.
- **El correo sale por consola en desarrollo.** `EMAIL_BACKEND` es por defecto `django.core.mail.backends.console.EmailBackend`: el correo, con el enlace incluido, se imprime en la terminal de `runserver`. Para enviarlo de verdad basta con apuntar `EMAIL_BACKEND` al backend SMTP desde el `.env`.
- **Los dos endpoints exigen CSRF y no exigen sesión.** `AllowAny` más `csrf_protect`: sin token CSRF responden `403`.
- **El cambio queda en la auditoría.** Confirmar guarda la contraseña con `save(update_fields=["password"])`, así que la señal de HU04 registra una acción `editado` con `detalle` igual a `contraseña`. No lleva autor (`por ...`), porque quien cambia la clave no tiene sesión.

### Endpoints entregados

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `POST` | `/api/auth/recuperar-password` | `{identificador}` (texto, máximo 254) | `200 {"detail": "Si la cuenta existe, recibiras un correo con los pasos a seguir."}`; `400` si falta `identificador`; `429` al pasar un límite |
| `POST` | `/api/auth/confirmar-recuperacion` | `{uid, token, password}` | `200 {"detail": "Contraseña actualizada. Ya puedes iniciar sesión."}`; `400 {"non_field_errors": ["El enlace de recuperación no es válido o expiró."]}` si el `uid` o el token no sirven, la cuenta está desactivada o el enlace expiró; `400 {"password": [...]}` si la contraseña es débil; `400` por campo si falta alguno |

Ninguna de las dos rutas lleva barra final. Los nombres de campo coinciden con `solicitarRecuperacionPassword` y `confirmarRecuperacionPassword` de `frontend/lib/api.ts`.

### Variables de entorno

Documentadas en `backend/.env.example`.

| Variable | Valor por defecto | Uso |
|---|---|---|
| `FRONTEND_URL` | `http://localhost:3000` | Base del enlace del correo. Debe ser el origen donde corre el frontend. |
| `EMAIL_BACKEND` | `django.core.mail.backends.console.EmailBackend` | Consola en desarrollo; SMTP en producción. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS` | `localhost`, `587`, vacío, vacío, `True` | Solo si se usa SMTP. |
| `DEFAULT_FROM_EMAIL` | `SmartWash <no-reply@smartwash.local>` | Remitente. |

### Pruebas automatizadas

`accounts/tests.py`, clase `RecuperarPasswordTests`, con 20 pruebas que cubren:
- el envío del enlace al frontend, por correo y por nombre de usuario, sin distinguir mayúsculas;
- que cuenta inexistente, desactivada o sin correo reciba la misma respuesta y no se envíe nada, y que un fallo de envío no se revele pero quede en el log;
- el límite de 5 por IP y el de 3 por cuenta aunque cambie la IP;
- el rechazo sin token CSRF y sin `identificador`;
- confirmar con un enlace válido y poder iniciar sesión con la clave nueva;
- que el enlace sirva una sola vez y que se rechace un token alterado, un `uid` inválido, el token de otro usuario, un enlace de hace más de una hora y una cuenta desactivada;
- que una contraseña débil se rechace con el motivo y sin cambiar nada, y que confirmar sin campos se rechace.

### Desviaciones y pendientes

- **Los contadores viven en la caché local del proceso.** No hay `CACHES` configurado, así que Django usa memoria local: los límites se reinician al reiniciar el servidor y no se comparten entre procesos. Con varios workers, el límite efectivo es mayor. Para producción hay que apuntar la caché a un almacén compartido.
- **El límite por cuenta cuenta lo que se escribe, no la cuenta resuelta.** El usuario `ana` y su correo `ana@smartwash.co` llevan contadores separados, de modo que una misma cuenta admite hasta 3 solicitudes por cada forma de identificarla. Combinado con el límite por IP, que se puede falsear, el tope real no es de 3 por hora para la cuenta.
- **Si varias cuentas comparten correo, todas reciben enlace.** `User.email` no es único. No se restringió porque la historia no lo pide.
- **Un enlace sin usar no se invalida al pedir otro.** Cada solicitud genera un token nuevo, pero los anteriores siguen vigentes hasta su expiración, mientras no cambie la contraseña, el correo ni `last_login`.
- **Ninguna prueba ejercita el envío por SMTP.** Las pruebas usan el backend de memoria de Django y en desarrollo se usa el de consola.

---

## 2. Frontend

**Autor:** sebastianij · **Subtarea:** SCRUM-63
**PR:** #27 entregó la pantalla de restablecer y completó la de solicitar. El #26 las alineó con el contrato del backend: ahora envían el `uid` y muestran el error real en lugar del aviso de backend pendiente.

### Resumen

Dos pantallas públicas, sin sesión, que recorren el flujo completo: pedir el enlace y fijar la contraseña nueva. La entrada es el enlace «Olvidaste tu contrasena?» de la pantalla de inicio de sesión.

### Decisiones de diseño e implementación

- **Pantallas públicas.** No consultan la sesión ni redirigen: el usuario que olvidó su contraseña no tiene una.
- **Todo pasa por `lib/api.ts`.** `solicitarRecuperacionPassword(identificador)` y `confirmarRecuperacionPassword(uid, token, password)` hacen `POST` a las dos rutas del backend. Como son escrituras, `api()` adjunta el token CSRF, y si falta la cookie `csrftoken` la siembra con `GET /api/auth/me`.
- **Mismo mensaje que el backend.** Tras solicitar, la pantalla muestra «Si la cuenta existe, recibiras un correo con los pasos a seguir.» sin importar si el correo salió. No lee el `detail` de la respuesta: el texto está fijo en la pantalla.
- **El enlace del correo trae `uid` y `token` en la URL.** La pantalla de restablecer los lee con `useSearchParams`, dentro de un `Suspense` como exige Next.js, y los reenvía tal cual.
- **Los errores del backend se muestran sin reinterpretarlos.** Con `leerErroresApi` se aplanan los mensajes de la respuesta `400` y se unen en un solo aviso. Así el usuario ve «El enlace de recuperación no es válido o expiró.» o los motivos exactos de una contraseña débil.

### Pantallas entregadas

| Pantalla | Ruta | Qué permite hacer |
|---|---|---|
| Recuperar contraseña | `/recuperar-password` | Escribir el usuario o el correo y pulsar «Enviar instrucciones». Al terminar, sustituye el formulario por el mensaje de confirmación. Si el servidor responde `429` muestra «Demasiadas solicitudes. Espera un momento antes de intentarlo de nuevo.»; ante cualquier otro fallo, «No se pudo enviar la solicitud. Intenta de nuevo.». «Cancelar» vuelve a `/login` sin enviar nada. |
| Restablecer contraseña | `/restablecer-password?uid=...&token=...` | Escribir la contraseña nueva y su confirmación y pulsar «Guardar». Si no coinciden, avisa en la pantalla sin llamar al backend. Al guardar, muestra «Tu contrasena quedo actualizada. Ya puedes iniciar sesion con ella.» «Cancelar» vuelve a `/login` y descarta lo escrito. Si no hay conexión, lo indica. |

Los dos campos de contraseña llevan `minLength={8}` y `autoComplete="new-password"`. Ambas pantallas tienen un enlace «Volver a iniciar sesion».

### Desviaciones frente a la especificación original

- **Escenario «Cancelar».** Se resuelve con el botón «Cancelar» de ambas pantallas, que vuelve a `/login`. Los datos escritos viven solo en el formulario y se pierden al salir; no se llama a la API.
- **No hay inicio de sesión automático al terminar.** Tras restablecer, el usuario debe volver a iniciar sesión por su cuenta. La historia no pide lo contrario.
- **La pantalla de restablecer no valida el enlace al abrirla.** No comprueba que `uid` y `token` existan ni que estén vigentes hasta que se pulsa «Guardar». Un enlace vencido o incompleto solo se descubre al enviar el formulario, con el mensaje del backend.
- **El mínimo de 8 caracteres del formulario es solo una ayuda del navegador.** La regla de verdad, con el resto de validadores, está en el backend.
- **La `Cancelar` de restablecer envuelve un botón dentro de un enlace.** Funciona, pero deja un elemento interactivo dentro de otro; la pantalla de solicitar usa el enlace con el estilo del botón. Queda anotado como detalle de accesibilidad para una limpieza posterior.
