<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas de trabajo en el frontend

Complementan el [AGENTS.md de la raíz](../AGENTS.md) y [plot.md](../plot.md).
Si hay conflicto, mandan las reglas de esta sección para todo lo que ocurra en
`frontend/`.

## Reglas del equipo

1. **No modificar el backend** (`backend/`) salvo petición explícita del
   usuario. Si el frontend necesita un cambio en la API, descríbelo (endpoint,
   campos, ejemplo de respuesta) y deja que el usuario decida.
2. **Confirmar siempre la sincronía frontend-backend.** Todo cambio que toque
   `lib/api.ts`, un formulario, un tipo de respuesta o una ruta de la API se
   contrasta con el backend real: rutas (sin barra final), métodos, nombres de
   campos, códigos de estado y formato de errores. Si es posible, se prueba el
   flujo contra el backend levantado; si no, se revisa el serializer y la vista
   correspondientes y se dice explícitamente que no se probó en ejecución. Si
   hay desajuste, se reporta; no se arregla del lado del backend.
3. **No hacer commits, push ni PR sin petición explícita.** Dejar los cambios
   en el árbol de trabajo y resumir qué quedó modificado. Una petición de
   commit no autoriza el push, y una de push no autoriza el PR.
4. **Dividir las peticiones grandes en tareas por agentes.** Si la petición
   abarca varias pantallas, módulos o capas independientes, se parte en tareas
   acotadas y cada una se delega a un agente, con alcance de archivos
   disjunto para que no se pisen. Cada agente recibe el contexto necesario
   (no hereda la conversación), y quien coordina integra, revisa el resultado y
   corre la validación final. Las peticiones pequeñas se resuelven directamente.

## Bitácora de trazabilidad

[BITACORA.md](BITACORA.md) registra los cambios y acciones del frontend.

- Léela al empezar para conocer el estado reciente y las decisiones tomadas.
- Al terminar cualquier cambio en `frontend/`, por menor que sea, agrega una
  entrada arriba con la plantilla del archivo, antes de dar la tarea por
  cerrada.
- Si dividiste el trabajo entre agentes, cada agente aporta su entrada o quien
  coordina las consolida.
- Registra también las acciones que no dejan código (investigaciones,
  verificaciones de sincronía, hallazgos fuera de alcance reportados).
- La bitácora no reemplaza el mensaje de commit ni el PR; los complementa.

## Antes de dar una tarea por terminada

```bash
cd frontend && npm run lint && npm run build
```

Además: confirmar la sincronía con el backend (regla 2), actualizar la
bitácora y reportar al usuario lo que se probó y lo que no.
