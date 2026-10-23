# AGENTS.md

Guía para agentes de IA que trabajan en este repo. Para personas, el punto de entrada es el [README](README.md).

## Fuentes de verdad

Las tres fuentes de verdad son el diseño, el documento del grupo y el diagrama de clases. Sus links están en [`docs/referencias.md`](docs/referencias.md) y solo ahí se mantienen, así que no los copies a otros archivos. Leelo antes de proponer o cambiar algo.

## Reglas

- Si el repo y una fuente no coinciden, la fuente tiene razón. No lo corrijas por tu cuenta: avisá y preguntá.
- Los artifacts de diseño se leen con la herramienta `Artifact` (`action: "read"`), no con WebFetch.
- No edites `specs/*.json` a mano. Se cambia `tools/generar_specs.py` y se regenera (ver "Mantenimiento" en el README).
- Las convenciones de la API están en el README ("Convenciones") y en `openspec/specs/api-conventions/`.
- Toda la documentación va en español.
