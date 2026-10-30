## Context

Así se levanta SAHS hoy:

```
 docker-compose.yml          docker-compose.app.yml (name: sahs-app)
 prototipo  :8090            db-init · 6 servicios Nest (:3000, red interna)
                             web       :8100  nginx: React + proxy /<servicio>/ + /docs/<s>/ y /docs/<s>-json
                             swagger   :8180  swaggerapi/swagger-ui, URLS → http://localhost:8100/docs/<s>-json
```

- Cada Nest publica su UI en `/docs` y su JSON en `/docs-json` (`libs/comun/src/swagger.ts`).
- El contenedor `swagger` es otro origen, así que los servicios habilitan CORS para `:8180` (`CORS_ORIGEN` en el compose y el valor por defecto en `libs/comun/src/arrancar.ts`).
- El prototipo es estático (`prototipo/index.html`, rutas en el hash, sin rutas absolutas propias) y se monta como volumen para editarlo en caliente.
- `swagger-ui-dist` 5.32.13 ya está en el `package-lock.json`, como dependencia de `@nestjs/swagger` 11.4.7.

## Goals / Non-Goals

**Goals:**
- Un solo `docker-compose.yml` que levante todo con `docker compose up -d --build`.
- Un solo puerto (`8100`) con cuatro entradas: la app (`/`), la API (`/<servicio>/`), el Swagger UI (`/docs/`) y el prototipo (`/prototipo/`).
- Una sola UI de swagger en producción, en el mismo origen que la API.
- Mantener la edición del prototipo en caliente y la UI por servicio en desarrollo.

**Non-Goals:**
- Juntar los 6 servicios en un contenedor o en un proceso: la separación en microservicios viene del documento del grupo.
- Fusionar los 6 OpenAPI en un documento único: cada servicio sigue siendo su propia fuente de verdad.
- Cambiar la API, las entidades o el cliente de la web.
- Tocar `specs/*.json`, `tools/generar_specs.py` o `tools/generar_scaffold.mjs`.

## Decisions

### 1. El compose de la app pasa a llamarse `docker-compose.yml`

El contenido de `docker-compose.app.yml` se mueve a `docker-compose.yml`, sin el servicio `swagger`, y se borra `docker-compose.app.yml`. Se conservan `name: sahs-app`, los nombres de contenedor `sahs-app-*`, la red y el volumen `sahs-data`. Así, a quien ya tenía la app levantada no le quedan contenedores huérfanos con otro nombre de proyecto.

- *Alternativa:* conservar `docker-compose.app.yml` y usar perfiles. Se descarta porque seguiría habiendo dos archivos y un `-f` que recordar.
- *Alternativa:* renombrar el proyecto a `sahs`. Es solo estético, y obligaría a hacer un `down` con el nombre viejo. Se puede hacer más adelante.

### 2. Swagger UI estático en el nginx de la web

En la etapa de build de `apps/web/Dockerfile`, `node_modules/swagger-ui-dist` ya está instalado por `npm ci`. La imagen final copia esos archivos a `/usr/share/nginx/html/docs/` y reemplaza `swagger-initializer.js` por uno propio, versionado en `apps/web/swagger/swagger-initializer.js`, con:

- `urls`: las 6 definiciones con URL **relativa** (`/docs/usuario-json`, ...) y los mismos nombres que hoy;
- `urls.primaryName: "Usuario"`, `docExpansion: "list"`, `defaultModelsExpandDepth: 1`, iguales al contenedor actual.

Como el spec se carga desde `:8100` y `servers` es `[{ "url": "/" }]`, "Try it out" llama a `http://localhost:8100/<servicio>/...`, que pasa por el proxy. Al ser el mismo origen, no hace falta CORS.

- *Alternativa:* un contenedor `swagger-ui` detrás del nginx (`/docs/` → `swagger:8080`). Se descarta porque mantiene un contenedor solo para servir archivos estáticos.
- *Alternativa:* una página índice con links a las UIs de cada Nest. Se descarta porque se pierde el selector y se siguen sirviendo 6 UIs.
- *Alternativa:* agregar `swagger-ui-dist` como dependencia explícita de `apps/web`. Hoy no hace falta, porque viene con `@nestjs/swagger` y el lockfile fija la versión. Si algún día `@nestjs/swagger` deja de traerlo, el build de la web falla en el `COPY`, que es un error visible.

### 3. UI de cada Nest solo fuera de producción

En `configurarSwagger` se pasa `ui: process.env.NODE_ENV !== 'production'` a `SwaggerModule.setup`, y `/docs-json` se sigue publicando siempre. Con eso:

- en Docker (`NODE_ENV=production`) cada servicio publica solo el JSON;
- en desarrollo (`npm run dev:<servicio>`) sigue estando `http://localhost:808x/docs`;
- `generar_cliente_web`, `verificar_contratos` y los e2e usan `/docs-json`, así que no cambian.

El mensaje de arranque de `arrancarServicio` deja de decir "swagger en /docs" cuando la UI está apagada.

### 4. nginx

En `apps/web/nginx.conf`:

- se quitan las 6 `location /docs/<servicio>/` y quedan las `location = /docs/<servicio>-json`, que son de coincidencia exacta y le ganan a `/docs/`;
- se agrega `location /docs/ { try_files $uri $uri/index.html =404; }` para que no caiga en el `index.html` de React, con `Cache-Control: no-cache` para el initializer;
- se agrega `location /prototipo/` con `try_files $uri $uri/index.html =404;` y `no-cache`, y `location = /prototipo { return 301 /prototipo/; }`.

### 5. El prototipo, en la imagen y montado

`apps/web/Dockerfile` copia `prototipo/` en `/usr/share/nginx/html/prototipo/`, así la imagen funciona sola. El compose, además, monta `./prototipo` en esa ruta, en modo solo lectura, en el servicio `web`, y el bind mount tapa la copia. Así se conserva la recarga en caliente de hoy.

- *Alternativa:* solo el volumen. Es más simple, pero entonces la imagen de `web` no lleva el prototipo y fuera del repo responde 404.

### 6. CORS

Se quita `CORS_ORIGEN` del compose y `http://localhost:8180` del valor por defecto de `arrancar.ts`, que queda en `http://localhost:5173`. En Docker todo es del mismo origen. En desarrollo, Vite hace de proxy, y el valor por defecto se mantiene para quien llame directo a un servicio desde `:5173`.

## Risks / Trade-offs

- [Quien tenga levantados los compose viejos queda con contenedores en `:8090` y `:8180`] → En el README y en la tarea de migración se indica bajarlos primero: `docker compose -f docker-compose.app.yml down` (antes de borrar el archivo) y `docker compose down` del prototipo, que es el proyecto `swagger` con el contenedor `sahs-prototipo`.
- [Para ver el prototipo hay que levantar toda la app, porque `web` depende de los 6 servicios sanos] → Se acepta. Si hiciera falta mostrarlo sin backend, se puede abrir `prototipo/index.html` directamente o levantar un nginx aparte. Queda como pregunta abierta.
- [`swagger-ui-dist` cambia el nombre o la forma de `swagger-initializer.js` en una versión futura] → La versión está fijada por el lockfile, y el escenario "Levantar el entorno" de `swagger-ui-docker` lo detecta al actualizar.
- [Un recurso del prototipo con ruta absoluta (`/algo`) se rompería bajo `/prototipo/`] → Hoy `index.html` solo carga Google Fonts por URL completa. El escenario "Navegar dentro del prototipo" lo cubre. `tools/exportar_prototipo.py` no debe generar rutas absolutas.
- [Las UIs por servicio en `:8100/docs/<servicio>/` desaparecen y alguien puede tenerlas guardadas] → El selector de `/docs/` las reemplaza. Se menciona en el README.

## Migration Plan

1. Con el código nuevo, bajar los entornos viejos: `docker compose -f docker-compose.app.yml down` y `docker compose down`.
2. Levantar con `docker compose up -d --build`. El volumen `sahs-data` ya existe y `db-init` solo aplica migraciones pendientes.
3. Comprobar `:8100`, `:8100/docs/` y `:8100/prototipo/`.

Rollback: `git revert` del change y volver a los dos compose. Los datos no se tocan.

## Open Questions

- ¿Hace falta poder levantar el prototipo solo, sin la app? Por ahora no: si aparece la necesidad, se agrega un servicio con `profiles: [prototipo]`.
