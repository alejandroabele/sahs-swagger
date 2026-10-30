## Why

Hoy SAHS se levanta con dos compose (`docker-compose.yml` para el prototipo y `docker-compose.app.yml` para la app) y publica tres puertos (`:8090`, `:8100` y `:8180`). La UI del swagger está repetida: cada servicio Nest sirve la suya en `/docs` (nginx las expone en `:8100/docs/<servicio>/`) y, además, un contenedor `swagger-ui` en `:8180` muestra los mismos documentos. Ese contenedor es otro origen, así que obliga a habilitar CORS y tiene las URLs fijas a `http://localhost:8100`. Queremos un solo comando y una sola puerta de entrada.

## What Changes

- **BREAKING** Queda un solo `docker-compose.yml`, que levanta toda la aplicación con `docker compose up -d --build`. Se borra `docker-compose.app.yml`.
- **BREAKING** Toda la aplicación se publica en un solo puerto, `http://localhost:8100`:
  - `/`: la app React (sin cambios);
  - `/prototipo/`: el prototipo HTML de referencia. Desaparecen el contenedor `prototipo` y el puerto `:8090`;
  - `/docs/`: un único Swagger UI con el selector de los 6 servicios, servido por el nginx de la web con `swagger-ui-dist`. Desaparecen el contenedor `swagger` y el puerto `:8180`;
  - `/docs/<servicio>-json`: el OpenAPI de cada servicio (sin cambios).
- En producción, los servicios Nest dejan de servir su propia UI en `/docs` y siguen publicando `/docs-json`, que es la fuente de verdad. En desarrollo (`npm run dev:<servicio>`), cada servicio sigue mostrando su UI en `http://localhost:808x/docs`.
- Se quitan los proxies `/docs/<servicio>/` del nginx, y el origen `:8180` de la configuración de CORS.
- El prototipo sigue montado como volumen, así que un cambio en `prototipo/` se ve al recargar, sin reconstruir.
- Se actualizan el README, `docs/referencias.md` y las specs de despliegue, del swagger y del prototipo.
- `specs/*.json` y `tools/generar_specs.py` quedan congelados y no se tocan.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `despliegue-docker`: un solo compose, sin el servicio `swagger`; un solo puerto publicado (`8100`); el nginx sirve también `/prototipo/` y `/docs/`, y deja de exponer `/docs/<servicio>/`; la documentación de uso cambia de URLs.
- `swagger-ui-docker`: el único Swagger UI pasa de `:8180` (contenedor propio) a `http://localhost:8100/docs/`, en el mismo origen que la API.
- `prototipo-web`: el prototipo deja de tener su propio compose y su puerto; lo sirve el nginx de la web en `/prototipo/`.
- `microservicios-nest`: cada servicio publica la UI de `/docs` solo fuera de producción; `/docs-json` se publica siempre.
- `acceso-web`, `rutas-web`: los escenarios del prototipo pasan de `http://localhost:8090/` a `http://localhost:8100/prototipo/` (sin cambios de comportamiento).
- `base-de-datos`: los escenarios usan `docker compose` sin `-f docker-compose.app.yml`.

## Impact

- **Docker:** `docker-compose.yml` (se reescribe), `docker-compose.app.yml` (se borra), `apps/web/Dockerfile` (copia `swagger-ui-dist` y el prototipo), `apps/web/nginx.conf`.
- **Código:** `libs/comun/src/swagger.ts` (opción `ui` de `@nestjs/swagger`) y `libs/comun/src/arrancar.ts` (el origen de CORS por defecto y el mensaje de arranque). La API no cambia y el cliente de la web no se regenera.
- **Dependencias:** ninguna nueva. `swagger-ui-dist` ya está en el lockfile como dependencia de `@nestjs/swagger`.
- **Documentación:** README ("Aplicación", "Prototipo", "Swagger y fuente de verdad", "Mantenimiento") y el diagrama de `docs/referencias.md`.
- **Entorno local:** antes de levantar el compose nuevo hay que bajar los dos anteriores. El volumen `sahs-data` se conserva, porque tiene un nombre fijo.
- **Dependencia con otro change:** `limpieza-y-rutas` está terminado pero sin archivar, y modifica las mismas specs. Conviene archivarlo antes que este.
