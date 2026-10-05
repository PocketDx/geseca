# Pruebas funcionales — HU02 Recuperar mi contraseña por correo electrónico (backend)

- **Ticket:** SCRUM-141 (peer review del backend de HU02, SCRUM-62)
- **Historia / requisito:** HU02 · RF02 (CU01) · RNF-03
- **Rama probada:** `dev` en `ee8d20e` (incluye el PR #26)
- **Fecha:** 2026-10-04
- **Probó:** Juan Daniel Torres Morales

> **Conflicto de revisión que hay que declarar.** La regla del proyecto es que no prueba quien desarrolló. Al revisar el PR #26 corregí parte de este backend (commit `d24b429`): el contrato con el frontend, el enlace del correo y el límite de solicitudes. El resto lo escribió Yoset. El hallazgo H1 está justo en el código que agregué yo, así que el equipo puede pedir que otra persona repita estas pruebas.

## Criterios de referencia

| | |
|---|---|
| Actor | Usuario interno |
| Precondición | El usuario tiene un correo electrónico registrado |
| Escenario 1 — Caso exitoso | La contraseña del usuario queda actualizada |
| Escenario 2 — Cancelar | Se descartan los datos y no hay cambios |
| Reglas de negocio | El enlace expira; se limita el número de solicitudes en un lapso corto (RNF-03) |

## Entorno

- Backend Django con una base SQLite **nueva** (`migrate` + `seed_usuarios`), sin tocar la base de nadie.
- Peticiones con el cliente HTTP de Django (`django.test.Client` con `enforce_csrf_checks=True`). Recorren la pila completa: middleware, sesión y token CSRF, igual que los envía `lib/api.ts`.
- El correo se capturó con el backend de correo en memoria para leer el enlace generado.
- Pruebas automatizadas del backend: `manage.py test` con 99 pruebas OK, 19 de ellas de esta historia (`RecuperarPasswordTests`).

## Resultados

| # | Caso | Esperado | Obtenido | Resultado |
|---|------|----------|----------|-----------|
| C0 | Preparación: el administrador crea `pf_ana` con correo (HU03) | 201 | 201 | ✅ Pasa |
| C1 | Solicitar sin token CSRF | 403 | 403 | ✅ Pasa |
| C2 | Solicitar para una cuenta sembrada **sin correo** (`recepcion`) | 200 con la respuesta genérica y sin envío | 200, 0 correos | ✅ Pasa |
| C3 | Solicitar para una cuenta inexistente | 200 con la misma respuesta y sin envío | 200, 0 correos | ✅ Pasa |
| C4 | E1: solicitar por correo, con otras mayúsculas (`PF.ANA@smartwash.co`) | 200, 1 correo, la misma respuesta que C3 | 200, 1 correo, respuesta idéntica | ✅ Pasa |
| C5 | El enlace del correo | `http://localhost:3000/restablecer-password?uid=…&token=…` | Igual | ✅ Pasa |
| C6 | E2 Cancelar: pedir el enlace y no usarlo | La contraseña no cambia | No cambia | ✅ Pasa |
| C7 | Confirmar con el token alterado | 400 | 400 | ✅ Pasa |
| C8 | Confirmar con la contraseña `123` | 400 con el motivo en `password` | 400 con el motivo en `password` | ✅ Pasa |
| C9 | E1: confirmar con un enlace válido | 200 | 200 | ✅ Pasa |
| C10 | Iniciar sesión con la contraseña nueva | 200 | 200 | ✅ Pasa |
| C11 | Iniciar sesión con la contraseña anterior | Rechazado | 401 | ✅ Pasa |
| C12 | Reutilizar el mismo enlace | 400 | 400 | ✅ Pasa |
| C13 | RNF-03: sexta solicitud en la hora desde la misma IP | 429 | 429 | ✅ Pasa |
| C14 | RNF-03: seis solicitudes cambiando la cabecera `X-Forwarded-For` | 429 en la sexta | **200: el límite no se aplica** | ❌ Falla (H1) |

La expiración del enlace (una hora, `PASSWORD_RESET_TIMEOUT`) no se probó a mano porque habría que esperar una hora. La cubre la prueba automatizada `test_un_enlace_de_hace_mas_de_una_hora_expira`.

## Hallazgos

### H1 — El límite de solicitudes se evade cambiando `X-Forwarded-For`

`ScopedRateThrottle` identifica al cliente por la IP. Sin `NUM_PROXIES` configurado, DRF toma esa IP de la cabecera `X-Forwarded-For` tal como la manda el cliente, así que basta cambiarla en cada petición para no llegar nunca al límite:

```bash
curl -X POST http://127.0.0.1:8000/api/auth/recuperar-password \
  -H "X-Forwarded-For: 10.0.0.$RANDOM" -H "X-CSRFToken: <token>" -b "csrftoken=<token>" \
  -H "Content-Type: application/json" -d '{"identificador": "pf_ana"}'
```

Con eso se puede llenar de correos la bandeja de una cuenta. Tampoco sirve fijar `NUM_PROXIES=0`: detrás del rewrite de Next.js todas las peticiones llegan con la IP del servidor de Next, y el límite pasaría a ser uno solo para todos los usuarios.

**Propuesta:** limitar además por `identificador` (normalizado a minúsculas) con un throttle propio, que no depende de cabeceras. Y definir `NUM_PROXIES` cuando se conozca el despliegue del backend.

### Observación O1 — Las cuentas sembradas no tienen correo

`seed_usuarios` crea las cuatro cuentas sin correo, así que con ellas no se puede probar HU02 ni hacer una demo. Hay que crear una cuenta con correo desde HU03, como en C0, o agregar correos al seed.

## Resultado final

**Aprobado con observaciones.** Los dos escenarios de aceptación y la expiración del enlace se cumplen. La regla de limitar solicitudes se cumple solo frente a un cliente que no manipula cabeceras (H1).
