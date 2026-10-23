## Why

SAHS hoy existe solo como contrato (6 OpenAPI generados por `tools/generar_specs.py`) y como prototipo HTML con datos de ejemplo que no se guardan. El grupo necesita la aplicación funcionando: microservicios que implementen esos contratos sobre una base de datos real y una app web que los use, todo en un solo repo y levantable con un comando en un entorno productivo.

## What Changes

- El repo pasa a ser un **monorepo con npm workspaces**: `apps/web`, `apps/<6 servicios>`, `apps/db`, `libs/entidades` y `libs/comun`.
- Se crean los **6 microservicios en NestJS** (Usuario, Pago, Horarios, Planificación, Orientación, Profesor y Suplencias), con las 102 rutas de `specs/*.json` implementadas y conectadas a la base: mismas rutas, verbos, códigos, datos anidados, filtros y llamadas HTTP entre servicios ("Invoca:").
- Se crea la **base de datos por código** con TypeORM: una sola SQLite compartida (`/data/sahs.sqlite`) en el volumen Docker `sahs-data`, con migraciones y seeds (privilegios, roles, estados de propuesta y los datos de ejemplo del prototipo).
- **BREAKING (proceso):** la fuente de verdad de la API pasa a ser el **swagger que genera NestJS** (`@nestjs/swagger`). El código de los servicios se arma una vez a partir de `specs/*.json`, y después `specs/` y `tools/generar_specs.py` quedan congelados como historial. La cadena pasa a ser documento → código Nest → swagger. Se actualizan `AGENTS.md`, `docs/referencias.md` y el README.
- Cada servicio publica su swagger en `/docs` y `/docs-json`, y además hay un **Swagger UI agregado** con los 6.
- Se crea una **app React nueva** (Vite + TypeScript) que reproduce todas las pantallas del prototipo (L1, A1 a A18, P2 a P4) con datos reales de la API: login, menú según los privilegios del rol, cabecera, cambio de contraseña, cerrar sesión y acceso por privilegio. `prototipo/index.html` queda sin cambios, como referencia visual.
- Se agrega **`docker-compose.app.yml`** de producción: `db-init` (migraciones + seeds), los 6 servicios, `web` (nginx con el build de React y proxy por prefijo) en `:8100` y Swagger UI agregado en `:8180`. El `docker-compose.yml` actual (Swagger UI `:8080` y prototipo `:8090`) no cambia.

## Capabilities

### New Capabilities
- `monorepo`: estructura del repo con npm workspaces, librerías compartidas, scripts de build y cómo se agrega una app.
- `base-de-datos`: SQLite compartida en un volumen, entidades TypeORM, migraciones, seeds y el contenedor `db-init`.
- `microservicios-nest`: los 6 servicios NestJS que implementan los contratos sobre la base, las llamadas entre servicios, los errores y el swagger publicado por cada servicio.
- `app-web`: la app React que reproduce el prototipo contra la API real (login, sesión, menú por privilegios, cabecera, pantallas L1, A1 a A18 y P2 a P4).
- `despliegue-docker`: `docker-compose.app.yml` de producción, el proxy de nginx, el Swagger UI agregado y el volumen de datos.

### Modified Capabilities
- `api-conventions`: el contrato de cada servicio deja de ser `specs/<servicio>.json`, que se genera con Python, y pasa a ser el OpenAPI que publica cada servicio NestJS. Las demás convenciones (rutas, verbos, ids, anidados, errores, filtros y dependencias) siguen igual y ahora las cumple el código.

## Impact

- **Código nuevo:** `apps/`, `libs/`, `package.json` raíz con workspaces, Dockerfiles y `docker-compose.app.yml`.
- **Dependencias:** NestJS, `@nestjs/swagger`, TypeORM, `better-sqlite3`, `bcryptjs`, `class-validator`, React, Vite y React Router. Imagen base `node:22-slim`, por el módulo nativo de `better-sqlite3`.
- **Documentación:** README (cómo levantar la app, fuente de verdad, mantenimiento), `AGENTS.md` y `docs/referencias.md`.
- **Lo que no cambia:** `prototipo/`, `docker-compose.yml`, `specs/` y `tools/` (estos dos quedan congelados).
- **Riesgos:** la concurrencia de escritura en SQLite entre 6 procesos (se mitiga con WAL y `busy_timeout`) y las dependencias cíclicas entre Planificación, Orientación y Profesor y Suplencias (los servicios arrancan independientes y no tienen `depends_on` entre sí).
