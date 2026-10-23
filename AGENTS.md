# AGENTS.md

Guía para agentes de IA que trabajan en este repo. Para personas, el punto de entrada es el [README](README.md).

## Fuentes de verdad

Las fuentes de verdad son el diseño, el documento del grupo y el diagrama de clases. Sus links están en [`docs/referencias.md`](docs/referencias.md) y solo ahí se mantienen, así que no los copies a otros archivos. Leelo antes de proponer o cambiar algo.

Dentro del repo, **la fuente de verdad de la API es el swagger que publica cada servicio NestJS** (`/docs-json`), es decir, el código de `apps/<servicio>`. Los contratos `specs/*.json` y `tools/generar_specs.py` quedaron congelados como historial del corte inicial.

## Reglas

- Si el repo y una fuente no coinciden, la fuente tiene razón. No lo corrijas por tu cuenta: avisá y preguntá.
- Los artifacts de diseño se leen con la herramienta `Artifact` (`action: "read"`), no con WebFetch.
- Un cambio en la API se hace en el código del servicio (controller, DTOs de `dto/entradas.ts` y `dto/modelos.ts`, interfaz en `libs/contratos`). No edites `specs/*.json` ni corras `tools/generar_specs.py` ni `tools/generar_scaffold.mjs`.
- Si la API se aparta del documento, se anota en "Cambios respecto del documento" del README. Una operación nueva también se agrega a `AGREGADOS` en `tools/verificar_contratos.mjs`.
- Cada tabla tiene un servicio dueño (prefijo `usuario_`, `pago_`, ...). Un servicio solo escribe sus tablas y pide los datos de otro por HTTP (`ClienteServicio` de `@sahs/comun`). Las referencias a otro servicio son ids sin clave foránea.
- Un cambio de entidades lleva su migración en `apps/db/src/migraciones` (ver "Mantenimiento" en el README). Nunca `synchronize`.
- Después de cambiar un servicio, regenerá el cliente de la web (`node tools/generar_cliente_web.mjs`) y corré `npm test` y `npm run verificar-contratos`.
- La web (`apps/web`) reproduce las pantallas del prototipo (`prototipo/index.html`), que es la referencia visual. Los estilos se copian del diseño con `css('...')`.
- Las convenciones de la API están en el README ("Convenciones") y en `openspec/specs/api-conventions/`.
- Toda la documentación va en español.
