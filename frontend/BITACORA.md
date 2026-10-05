# Bitácora del frontend

Registro de trazabilidad de los cambios, acciones y decisiones del frontend
(`frontend/`). Lo mantienen las personas y los agentes de IA que trabajan en esta
carpeta. Las reglas de uso están en [AGENTS.md](AGENTS.md).

## Cómo registrar una entrada

- Una entrada por cambio o acción relevante, **la más reciente arriba**.
- Se escribe al terminar la tarea, antes de entregar el resultado al usuario.
- Incluso los cambios menores (un texto, un estilo, un ajuste de tipos) llevan
  una línea.
- Si el cambio toca la comunicación con el backend, la sección **Sincronía**
  es obligatoria y debe decir qué se verificó y cómo.
- No se registran secretos, tokens ni datos personales.

Plantilla:

```markdown
### AAAA-MM-DD · Título corto

- **Tipo:** feat | fix | refactor | estilo | chore | docs | investigación
- **Ticket / rama:** SCRUM-NN · `feature/tema` (o "sin ticket")
- **Autor:** persona o agente
- **Qué cambió:** resumen en una o dos líneas.
- **Archivos:** `app/...`, `lib/...`
- **Sincronía con el backend:** endpoints usados y resultado de la verificación
  (o "no aplica").
- **Validación:** `npm run lint`, `npm run build`, prueba manual, etc.
- **Pendientes / notas:** lo que quedó abierto o lo que alguien podría
  "arreglar" sin saber por qué está así.
```

## Entradas

### 2026-10-05 · Creación de la bitácora y reglas del frontend

- **Tipo:** docs
- **Ticket / rama:** sin ticket · `dev`
- **Autor:** Claude Code
- **Qué cambió:** se crea esta bitácora y se amplían las reglas de
  [AGENTS.md](AGENTS.md) y [CLAUDE.md](CLAUDE.md) del frontend: no tocar el
  backend sin petición explícita, confirmar la sincronía frontend-backend, no
  hacer commits sin petición explícita y dividir las peticiones grandes en
  tareas por agentes.
- **Archivos:** `frontend/BITACORA.md`, `frontend/AGENTS.md`, `frontend/CLAUDE.md`
- **Sincronía con el backend:** no aplica.
- **Validación:** solo documentación; no se ejecutó lint ni build.
- **Pendientes / notas:** el estado previo del frontend se puede consultar con
  `git log -- frontend`; la bitácora empieza a partir de esta fecha.
