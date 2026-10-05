# HU08 — Reglas de descuento

**Proyecto:** SmartWash
**Historia de usuario:** HU08 — Configurar reglas de descuento
**Subtarea Jira:** SCRUM-161 `[Documentación]`

> Cada sección la completa quien hizo esa parte, sin borrar lo que escribieron los demás. Cuando las dos estén completas, la subtarea pasa a **Finalizado**.

| Sección | Responsable | Estado |
|---|---|---|
| 1. Backend | Juan Daniel Torres Morales | ✅ Completo |
| 2. Frontend | Dairo Javier Rodríguez Gómez | ✅ Completo |

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

**Responsable:** Dairo Javier Rodríguez Gómez · **Subtarea:** SCRUM-75
**PR:** esqueleto de la pantalla en el #18, y conexión con el backend en el #30.

### Resumen

La pantalla `/fidelizacion` permite al administrador crear reglas de descuento y ver las que existen. Consume los endpoints de la sección 1 a través de `frontend/lib/api.ts`. Editar una regla desde la pantalla quedó fuera de alcance por decisión del equipo.

### Decisiones tomadas

- **Solo el administrador entra.** La página es un Server Component que lee el usuario con `getCurrentUser`. Sin sesión redirige a `/login`, y con otro rol redirige a `/`. El enlace "Fidelizacion" de la barra de navegación y el acceso de la página de inicio solo se muestran al administrador.
- **Crear y listar, sin editar.** El formulario solo crea. La lista es de lectura. No hay botón para activar, desactivar ni modificar una regla ya creada.
- **El formulario ayuda a respetar el tope antes de enviar.** El campo `valor` cambia de etiqueta según el tipo (`Valor (%)` o `Valor (COP)`) y su `max` es 100 para `porcentaje` y 99 999 999,99 para `monto_fijo`, que es lo que admite `DecimalField(10, 2)`. La validación definitiva sigue siendo la del backend.
- **Los errores salen del backend.** `leerErroresApi` convierte el `400` de DRF en una lista, y cada mensaje de campo se antepone con su etiqueta (por ejemplo, `Valor: Un descuento porcentual no puede superar el 100% del valor de la orden.`). Si el backend no responde se muestra "No se pudo conectar con el servidor", y si responde sin cuerpo legible, "No se pudo crear la regla (error N)".
- **Tras crear, el formulario se limpia y la tabla se refresca.** Se guarda la referencia al formulario antes del `await` (después de él, `event.currentTarget` es `null` y `reset()` fallaba) y se llama a `router.refresh()` para que la tabla incluya la regla nueva sin recargar la página. Se muestra "Regla creada."
- **Si el listado falla, el formulario sigue disponible.** Cuando `getReglasDescuento` devuelve `null` (backend caído o respuesta no válida), en lugar de la tabla aparece un aviso para verificar que el backend esté en ejecución.

### Pantallas entregadas

| Pantalla | Archivo | Qué permite |
|---|---|---|
| Fidelización | `frontend/app/fidelizacion/page.tsx` | Controla el acceso, carga las reglas y compone el formulario y la tabla |
| Nueva regla de descuento | `frontend/app/fidelizacion/regla-form.tsx` | Crea una regla con `POST /api/fidelizacion/reglas-descuento` |
| Tabla de reglas | `frontend/app/fidelizacion/tabla-reglas.tsx` | Lista las reglas en el orden en que las entrega el backend |

**Formulario.**

| Campo | Control | Notas |
|---|---|---|
| Nombre de la regla | Texto | Obligatorio |
| Tipo | Selector | `Porcentaje` o `Monto fijo` |
| Valor | Número, paso 0,01, mínimo 0 | Obligatorio; el máximo depende del tipo |
| Clasificación del cliente | Selector | `Cualquiera` (se envía vacío), `Ocasional`, `Frecuente` o `VIP` |
| Vigente desde | Fecha | Obligatorio |
| Activa desde que se crea | Casilla | Marcada por defecto |

**Tabla.** Columnas Regla, Valor, Aplica a, Desde y Estado:
- el valor se muestra como porcentaje o en pesos (`formatCOP`);
- "Aplica a" muestra la clasificación, o "Cualquier cliente" si está vacía;
- el estado es una etiqueta "Activa" o "Inactiva";
- sin reglas, muestra "Todavia no hay reglas de descuento."

### Desviaciones frente a la especificación

- **No se pueden editar las reglas desde la pantalla.** Fue una decisión del equipo (SCRUM-75). El backend sí acepta `PATCH` y `actualizarReglaDescuento` existe en `frontend/lib/api.ts`, pero ninguna pantalla la usa. Una consecuencia directa: una regla no se puede desactivar desde la interfaz, porque `activa` solo se fija al crearla. Para apagar una regla hay que llamar al `PATCH` del API.
- **No hay botón Cancelar.** El escenario 2 pide que, al cancelar, se descarten los datos y no cambie nada. El formulario no guarda nada hasta que se pulsa "Crear regla", así que salir de la pantalla descarta lo escrito, pero no hay un control explícito de cancelar.
- **La vigencia final no se puede definir.** El formulario siempre envía `vigente_hasta: null`, aunque el backend lo acepta y lo valida. La tabla tampoco lo muestra: solo aparece "Desde". Una regla creada desde la pantalla no tiene fecha de fin.
- **El control de acceso es solo de interfaz.** Redirigir al no administrador evita que vea la pantalla, pero el API acepta cualquier sesión (ver los pendientes de la sección 1). Lo resuelve T8 (SCRUM-57).
- **La pantalla no dice que la regla todavía no se aplica.** La regla queda disponible, como pide el escenario 1, pero ninguna orden la usa hasta que se haga HU09.
