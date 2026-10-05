# Pruebas funcionales — HU07 Administrar el catálogo de servicios y sus tarifas (backend)

- **Ticket:** SCRUM-156 (peer review del backend de HU07, SCRUM-120)
- **Historia / requisito:** HU07 · RF05, RF06 (CU03) · RNF-04
- **Rama probada:** `dev` en `ee8d20e` (incluye el PR #28)
- **Fecha:** 2026-10-04
- **Probó:** Juan Daniel Torres Morales. El backend lo desarrolló Faiber; en el PR #28 yo solo corregí el montaje de rutas en `config/urls.py`, que no forma parte de la lógica del catálogo.

## Criterios de referencia

| | |
|---|---|
| Actor | Administrador |
| Precondición | El administrador tiene una sesión activa |
| Escenario 1 — Caso exitoso | El catálogo de servicios queda actualizado |
| Escenario 2 — Cancelar | Se descartan los datos y no hay cambios |
| Reglas del modelo (plot.md) | Una sola tarifa vigente por par prenda/servicio; dinero en `Decimal`; lo cerrado queda como histórico |

## Entorno

- Backend Django con una base SQLite **nueva** (`migrate` + `seed_usuarios`), sin tocar la base de nadie.
- Peticiones con `django.test.Client` (`enforce_csrf_checks=True`), con sesión del administrador sembrado (`admin`) y del operario (`operario1`).
- Pruebas automatizadas del backend: `manage.py test` con 99 pruebas OK, 18 de ellas de `catalogo`.

## Resultados

| # | Caso | Esperado | Obtenido | Resultado |
|---|------|----------|----------|-----------|
| C1 | Crear un servicio sin sesión | 403 | 403 | ✅ Pasa |
| C2 | Escribir sin token CSRF | 403 | 403 | ✅ Pasa |
| C3 | E1: crear el servicio "PF Lavado" | 201 | 201 | ✅ Pasa |
| C4 | Autoría del servicio creado | `creado_por = admin` | `admin` | ✅ Pasa |
| C5 | Crear un servicio duplicado (`"  pf lavado "`) | 400 | 400 | ✅ Pasa |
| C6 | E1: editar la descripción del servicio | 200 y el cambio guardado | 200 | ✅ Pasa |
| C7 | E1: crear el tipo de prenda "PF Camisa" | 201 | 201 | ✅ Pasa |
| C8 | E1: crear la tarifa del par a $8.000, 2 días | 201, `valor = "8000.00"` | Igual | ✅ Pasa |
| C9 | Tarifa con valor negativo | 400 | 400 | ✅ Pasa |
| C10 | Tarifa con valor vacío | 400 | 400 | ✅ Pasa |
| C11 | Tarifa con más de 2 decimales (`10.555`) | 400 | 400 | ✅ Pasa |
| C12 | Plazo de entrega de 0 días | 400 | 400 | ✅ Pasa |
| C13 | Tarifa con un tipo de prenda inexistente | 400 | 400 | ✅ Pasa |
| C14 | Nueva tarifa vigente que empieza antes que la actual | 400 | 400 | ✅ Pasa |
| C15 | Nueva tarifa a $9.000 desde el 2026-06-01 | 201, y la anterior se cierra el 2026-06-01 | Igual | ✅ Pasa |
| C16 | Histórico y filtro `?vigentes=1` | Se listan 2 tarifas; las vigentes son solo `9000.00` | Igual | ✅ Pasa |
| C17 | E2 Cancelar: edición inválida (valor 1 y plazo 0) | 400, sin cambios en la tarifa | 400, sigue en `8000.00` | ✅ Pasa |
| C18 | Mover una tarifa a otro servicio | 400 | 400 | ✅ Pasa |
| C19 | Reabrir una tarifa cerrada habiendo otra vigente | 400 | 400 | ✅ Pasa |
| C20 | Borrar una tarifa | 405, no hay borrado | 405 | ✅ Pasa |
| C21 | Crear una tarifa histórica del 2026-07-01 al 2026-08-01, que se cruza con la vigente | 400 | **201, se guarda** | ❌ Falla (H1) |
| C22 | Un `operario1` crea un servicio | 403, el actor es el administrador | **201, se crea** | ❌ Falla (H2) |

## Hallazgos

### H1 — Se aceptan tarifas cerradas que se solapan con otra

La validación de `TarifaSerializer` solo revisa los choques cuando la tarifa nueva queda abierta (`vigente_hasta` vacío). Si viene cerrada, no comprueba si se cruza con la vigente ni con otras históricas. El par puede quedar con dos precios para el mismo día, y "la tarifa de una fecha" deja de ser única cuando una orden la necesite (HU09).

**Propuesta:** en `validate`, rechazar cualquier tarifa del mismo par cuyo rango `[vigente_desde, vigente_hasta)` se cruce con otro, tratando `vigente_hasta` vacío como infinito.

### H2 — Cualquier usuario autenticado administra el catálogo

Es el mismo caso que el H5 de las pruebas de HU08. El API solo pide sesión iniciada, así que un operario o un recepcionista crea y edita servicios, tipos de prenda y tarifas. El autor lo dejó anotado en el PR #28. El control por rol es transversal y le corresponde a T8 (SCRUM-57, sprint S4).

### Observación O1 — Editar el valor de una tarifa reescribe su histórico

`PATCH /api/catalogo/tarifas/{id}` permite cambiar `valor` en una tarifa ya cerrada. Las órdenes no se afectan, porque `OrdenServicio.valor_aplicado` congela el precio. Lo que se pierde es el histórico de precios que pide la historia. Hay que decidir si una tarifa cerrada debe ser de solo lectura.

## Resultado final

**Aprobado con observaciones.** Los dos escenarios se cumplen para el administrador. H1 es un defecto del backend que conviene corregir antes de HU09. H2 depende de T8.
