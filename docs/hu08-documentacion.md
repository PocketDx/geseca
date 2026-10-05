# HU08 — Reglas de descuento

**Proyecto:** SmartWash
**Historia de usuario:** HU08 — Configurar reglas de descuento
**Subtarea Jira:** SCRUM-161 `[Documentación]`

> Cada sección la completa quien hizo esa parte, sin borrar lo que escribieron los demás. Cuando las dos estén completas, la subtarea pasa a **Finalizado**.

| Sección | Responsable | Estado |
|---|---|---|
| 1. Backend | Juan Daniel Torres Morales | ✅ Completo |
| 2. Frontend | Dairo Javier Rodríguez Gómez | ⬜ Pendiente |

---

## 1. Backend

**Autor:** Juan Daniel Torres Morales · **Subtarea:** SCRUM-74
**PR:** #21, ajustado en el #30.

### Resumen

El administrador define reglas de descuento: un porcentaje o un monto fijo, opcionalmente limitadas a una clasificación de cliente y con vigencia. Vive en la app nueva `fidelizacion`, modelo `ReglaDescuento`, que hereda de `ModeloConAutoria`.

### Decisiones tomadas

- **Dos tipos de descuento.** `porcentaje` o `monto_fijo`, con `valor` en `DecimalField(10, 2)` porque el dinero nunca va en `float`.
- **La regla de negocio se aplica en dos capas.** "El descuento no puede superar el 100 %" se valida en el serializer, que responde `400` con un mensaje, y también es una `CheckConstraint` en la base. Lo mismo vale para `valor >= 0` y para que `vigente_hasta` sea posterior a `vigente_desde`. El monto fijo no tiene tope porque es una suma en pesos y no un porcentaje.
- **Segmentación opcional.** `clasificacion_cliente` toma los valores de `Cliente.Clasificacion` (`Ocasional`, `Frecuente`, `VIP`). Vacío significa que aplica a cualquier cliente.
- **Una regla se desactiva, no se borra.** `activa` permite apagarla y no hay endpoint de borrado. Así, una orden futura que use la regla no pierde la referencia.
- **Autoría en cada escritura.** `create` y `update` llaman a `registrar_autoria(request.user)`, como pide plot.md.

### Endpoints entregados

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `GET` | `/api/fidelizacion/reglas-descuento` | — | `200`, lista ordenada por `-vigente_desde, nombre` |
| `POST` | `/api/fidelizacion/reglas-descuento` | `{nombre, tipo, valor, clasificacion_cliente, activa, vigente_desde, vigente_hasta}` | `201`, o `400` por campo |
| `GET` | `/api/fidelizacion/reglas-descuento/{id}` | — | `200` |
| `PATCH` | `/api/fidelizacion/reglas-descuento/{id}` | Cualquier subconjunto | `200`, o `400`; las validaciones combinan lo enviado con lo guardado |

El tipo `ReglaDescuento` de `frontend/lib/api.ts` coincide campo por campo, incluidos los valores de `tipo` y de `clasificacion_cliente`.

### Pruebas automatizadas

`fidelizacion/tests.py`, con 14 pruebas (4 de modelo y 10 de API):
- el tope del 100 % al crear y al editar, y que el monto fijo puede pasar de 100;
- el valor negativo y la vigencia invertida, con `400` y no con `500`;
- crear, listar y editar;
- que se exija sesión.

### Desviaciones y pendientes

- **Valor negativo y vigencia invertida devolvían `500`.** Solo los frenaba la `CheckConstraint`. En el PR #30 se agregó la validación en el serializer, con sus pruebas.
- **La regla queda disponible, pero todavía no se aplica a ninguna orden.** Es lo que pide el escenario de éxito ("disponible para aplicarse en órdenes futuras"). Aplicarla es trabajo de HU09 y debe resolver dos puntos:
  - qué pasa si varias reglas vigentes aplican al mismo cliente;
  - que un monto fijo mayor que el total de la orden se recorte al total, para respetar el "no superar el 100 % del valor de la orden".
- **No se impide que dos reglas se solapen.** Es coherente con lo anterior: hasta que HU09 defina cómo se combinan, no hay un criterio para rechazarlas.
- **No hay control por rol en el API.** La pantalla solo deja entrar al administrador (PR #30), pero el endpoint acepta cualquier sesión. Lo resuelve T8 (SCRUM-57).

---

## 2. Frontend
*(Responsable: Dairo Javier Rodríguez Gómez — completar con lo entregado en HU08 [Desarrollo Frontend], SCRUM-75)*

- **Resumen:**
- **Decisiones de diseño/implementación:**
- **Pantallas entregadas:** (nombre de cada pantalla/componente, qué permite hacer, capturas si aplica)
- **Desviaciones frente a la especificación original:**

