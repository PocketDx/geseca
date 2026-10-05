# HU05 — Registrar y editar clientes

**Proyecto:** SmartWash
**Historia de usuario:** HU05 — Registrar y editar los datos de un cliente
**Subtarea Jira:** SCRUM-152 `[Documentación]`

> Cada sección la completa quien hizo esa parte, sin borrar lo que escribieron los demás. Cuando las dos estén completas, la subtarea pasa a **Finalizado**.

| Sección | Responsable | Estado |
|---|---|---|
| 1. Backend | Yoset Alfonso Piedrahita Ramírez | ✅ Completo |
| 2. Frontend | sebastianij | ✅ Completo |

---

## 1. Backend

**Autor:** Yoset Alfonso Piedrahita Ramírez · **Subtarea:** SCRUM-68
**PR:** #37.

### Resumen

Expone la lista, el alta, la consulta y la edición de clientes sobre el modelo `Cliente` que ya existía en la app `clientes` (hereda de `ModeloConAutoria`). El modelo y su migración no cambian; el PR agrega serializer, vistas, rutas y pruebas, y monta `clientes.urls` en `api/`.

### Decisiones tomadas

- **El documento se guarda sin espacios.** `validate_documento` elimina todos los espacios, también los internos: `" 1090 123 456 "` se guarda como `1090123456`.
- **La unicidad del documento no distingue mayúsculas.** Se compara con `documento__iexact` y se excluye al propio cliente al editar, de modo que reenviar el mismo documento no cuenta como duplicado. El `UniqueValidator` automático de DRF se desactiva (`validators: []`) porque compararía el valor sin normalizar. El `unique` del modelo queda como respaldo en la base. El mensaje de error es `Ya existe un cliente con el documento "<documento>".`, bajo la clave `documento`.
- **`nombre_completo` con espacios colapsados.** Se recortan los extremos y los espacios repetidos pasan a uno solo: `"  Luis   Perez "` se guarda como `Luis Perez`.
- **`clasificacion` es de solo lectura.** La respuesta la incluye, pero se ignora si llega en el cuerpo. Todo cliente nace `Ocasional` (valor por defecto del modelo) y solo RF38 la recalculará.
- **Sin borrado.** Las vistas son `ListCreateAPIView` y `RetrieveUpdateAPIView`, así que `DELETE` responde `405`. Las órdenes referenciarán al cliente con `PROTECT` y un cliente con historial no debe poder desaparecer.
- **Autoría por `ConAutoriaSerializer`.** Se reutiliza el de `catalogo`: al crear se llena `creado_por` y `actualizado_por`; al editar solo cambia `actualizado_por`. Los campos no se exponen en la API.
- **Solo exige sesión.** Aplica el `IsAuthenticated` por defecto de DRF, sin permiso por rol: administrador, recepcionista y operario pueden usar los endpoints. El control por rol es T8 (SCRUM-57, sprint S4).
- **Una edición inválida no cambia nada.** La validación corre antes de guardar, así que un `400` deja intactos los datos y `actualizado_por`.
- **Rutas sin barra final y sin el prefijo `auth/`.** `clientes.urls` se monta en `api/` y define `clientes` y `clientes/<int:pk>`. No se toca el montaje de `accounts`.
- **Lista sin paginar, ordenada por `nombre_completo`.** Es el orden del `Meta` del modelo; el proyecto no configura paginación en DRF.

### Endpoints entregados

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `GET` | `/api/clientes` | — | `200`, lista de `{id, nombre_completo, documento, telefono, correo, clasificacion}` |
| `POST` | `/api/clientes` | `{nombre_completo, documento, telefono, correo?}` | `201` con el cliente (`clasificacion: "Ocasional"`), o `400` por campo (documento duplicado, correo inválido, campo obligatorio ausente) |
| `GET` | `/api/clientes/{id}` | — | `200` con el cliente |
| `PATCH` | `/api/clientes/{id}` | Cualquier subconjunto de los campos editables | `200` con el cliente, o `400` sin modificar nada |
| `DELETE` | `/api/clientes/{id}` | — | `405` |

Sin sesión, las cuatro operaciones válidas responden `403` (autenticación por sesión de DRF). Los campos obligatorios son `nombre_completo`, `documento` y `telefono`; `correo` puede omitirse o ir vacío. Los nombres de campo coinciden con los tipos `Cliente` y `ClienteFormulario` de `frontend/lib/api.ts`.

### Pruebas automatizadas

`clientes/tests.py`, clase `ClienteApiTests`, con 14 pruebas nuevas que cubren:
- registrar un cliente, que nazca `Ocasional` y que el correo sea opcional;
- registrar quién creó y quién editó, aun cuando editen usuarios distintos;
- editar los datos, y que reenviar el propio documento no cuente como duplicado;
- rechazar un documento duplicado, aunque cambien los espacios, y rechazar editar con el documento de otro cliente sin alterar nada;
- normalizar documento y nombre al guardar;
- que una edición inválida no cambie nada ni la autoría (escenario Cancelar);
- que `clasificacion` sea de solo lectura al crear y al editar;
- listar y consultar;
- que borrar responda `405`;
- que sin sesión todas las operaciones respondan `403` y no se escriba nada.

### Desviaciones y pendientes

- **No hay control por rol.** Cualquier sesión puede crear y editar clientes, incluso la de un operario. La historia solo habla de la recepcionista con sesión activa. Lo resuelve T8 (SCRUM-57, sprint S4).
- **Sin sesión responde `403`, no `401`.** Es el comportamiento de `SessionAuthentication` en DRF y es el que fijan las pruebas.
- **El largo máximo se valida antes de quitar los espacios internos.** El límite de 20 caracteres de `documento` se aplica al valor con sus espacios internos (DRF solo recorta los extremos antes de validar el largo), y `validate_documento` los elimina después. Un documento de 20 dígitos o menos sin espacios pasa siempre; uno con espacios internos puede rechazarse aunque quede en 20 al normalizarlo.
- **`telefono` no se normaliza** y es obligatorio, aunque la historia solo fija el documento como regla de negocio.
- **La ruta de detalle también admite `PUT`** por heredar de `RetrieveUpdateAPIView`. No está cubierto por pruebas ni lo usa el frontend, que edita con `PATCH`.
- **No hay búsqueda, filtros ni paginación.** La historia no los pide.

---

## 2. Frontend

**Autor:** sebastianij · **Subtarea:** SCRUM-69
**PR:** #34.

### Resumen

La pantalla `/clientes` permite registrar un cliente nuevo y editar los existentes sin salir de la página. Consume los endpoints de la sección 1 a través de `getClientes`, `crearCliente` y `actualizarCliente` de `frontend/lib/api.ts`; no se agregan funciones ni tipos nuevos en `api.ts`.

### Decisiones de diseño/implementación

- **Un solo formulario para crear y editar.** `ClienteForm` recibe un `cliente` opcional: sin él hace `POST /clientes`; con él, `PATCH /clientes/{id}` con los cuatro campos.
- **Edición en línea.** `TablaClientes` guarda el `id` en edición y abre el formulario en una fila bajo el cliente. El botón Editar de esa fila queda deshabilitado mientras el formulario está abierto.
- **Cancelar descarta lo ingresado.** Es un botón `type="reset"`: limpia errores y mensajes y, al editar, cierra el formulario. No hay llamada al backend (escenario Cancelar de la historia).
- **Errores reales del backend.** Se leen con `leerErroresApi` y se muestran como lista, con la etiqueta del campo cuando se conoce (por ejemplo, `Documento: Ya existe un cliente con el documento "...".`). Si el servidor no responde se muestra un mensaje de conexión; si responde sin cuerpo legible, uno genérico con el código HTTP.
- **Refresco de datos.** Tras guardar se llama a `router.refresh()` para recargar la lista del servidor.
- **Corrección del `reset()`.** La referencia al formulario se guarda antes del `await`; después `event.currentTarget` ya es `null`.
- **Tras un alta correcta** el formulario se vacía y muestra "Cliente registrado". Tras una edición correcta, el formulario se cierra.
- **Acceso por rol.** La página exige sesión (sin ella redirige a `/login`) y redirige a `/` al operario. Administrador y recepcionista entran, igual que en la navegación (`nav-bar.tsx`) y los accesos de la portada, donde `/clientes` solo aparece para esos dos roles.
- **Sin el aviso de endpoint pendiente.** Se eliminó el `AvisoPendiente` que decía que `GET /api/clientes` no existía. Si la lista no carga se muestra un mensaje indicando que se verifique el backend.

### Pantallas entregadas

| Pantalla | Qué permite |
|---|---|
| `/clientes` (`page.tsx`) | Tarjeta "Nuevo cliente" con el formulario de alta y, debajo, la tabla de clientes. Si no hay ninguno, muestra "Todavia no hay clientes registrados." |
| `ClienteForm` (`cliente-form.tsx`) | Campos Nombre completo, Documento y Teléfono (obligatorios) y Correo (opcional, tipo `email`). Botones Guardar cliente / Guardar cambios y Cancelar. Deshabilita ambos mientras guarda. |
| `TablaClientes` (`tabla-clientes.tsx`) | Columnas Nombre, Documento, Teléfono y Clasificación (como insignia) más el botón Editar por fila. |

### Desviaciones frente a la especificación original

- **El operario no entra a la pantalla.** La historia habla de la recepcionista; el administrador también entra, según la navegación existente. Es solo lo que muestra el frontend: la API sigue abierta a cualquier sesión hasta T8 (SCRUM-57).
- **`clasificacion` no se puede editar.** Se muestra, pero ningún campo la envía; la fijará RF38.
- **El correo no aparece en la tabla.** Solo se ve y se edita dentro del formulario de edición.
- **No hay búsqueda, filtros ni paginación.** La historia no los pide.
- **No hay baja de clientes.** Es consistente con el backend, que responde `405` a `DELETE`.
- **El documento no se normaliza en el cliente.** La pantalla lo envía tal cual y es el backend quien quita los espacios; la tabla muestra el valor ya normalizado tras `router.refresh()`.
