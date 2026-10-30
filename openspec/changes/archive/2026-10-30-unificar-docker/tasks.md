## 0. Antes de empezar

- [x] 0.1 Archivar `limpieza-y-rutas` (`/opsx:archive`), para que las specs base de `despliegue-docker`, `swagger-ui-docker`, `prototipo-web` y `microservicios-nest` sean las que modifica este change
- [x] 0.2 Bajar los entornos actuales: `docker compose -f docker-compose.app.yml down` y `docker compose down`, sin `-v`

## 1. Servicios Nest

- [x] 1.1 En `libs/comun/src/swagger.ts`, pasar `ui: process.env.NODE_ENV !== 'production'` a `SwaggerModule.setup`, mantener `jsonDocumentUrl: 'docs-json'` y actualizar el comentario
- [x] 1.2 En `libs/comun/src/arrancar.ts`, sacar `http://localhost:8180` del `CORS_ORIGEN` por defecto (queda `http://localhost:5173`) y ajustar el log de arranque para que mencione `/docs` solo si la UI está activa
- [x] 1.3 Comprobar que `npm run dev:pago` sigue mostrando la UI en `http://localhost:8082/docs`

## 2. Swagger UI en la web

- [x] 2.1 Crear `apps/web/swagger/swagger-initializer.js` con las 6 definiciones (URLs relativas `/docs/<servicio>-json`, nombres actuales), `urls.primaryName: "Usuario"`, `docExpansion: "list"` y `defaultModelsExpandDepth: 1`
- [x] 2.2 En `apps/web/Dockerfile`, copiar `node_modules/swagger-ui-dist` de la etapa de build a `/usr/share/nginx/html/docs/` y encima el `swagger-initializer.js` propio

## 3. Prototipo en la web

- [x] 3.1 En `apps/web/Dockerfile`, copiar `prototipo/` a `/usr/share/nginx/html/prototipo/`

## 4. nginx

- [x] 4.1 En `apps/web/nginx.conf`, quitar las 6 `location /docs/<servicio>/` y dejar las `location = /docs/<servicio>-json`
- [x] 4.2 Agregar `location /docs/` con `try_files $uri $uri/index.html =404` y `Cache-Control: no-cache`
- [x] 4.3 Agregar `location /prototipo/` con `try_files $uri $uri/index.html =404` y `no-cache`, y `location = /prototipo { return 301 /prototipo/; }`
- [x] 4.4 Actualizar los comentarios del archivo

## 5. Compose único

- [x] 5.1 Reemplazar el contenido de `docker-compose.yml` con el de `docker-compose.app.yml`, sin el servicio `swagger` y sin `CORS_ORIGEN`, y con el volumen `./prototipo:/usr/share/nginx/html/prototipo:ro` en `web`. Conservar `name: sahs-app`, los nombres de contenedor, la red y `sahs-data`
- [x] 5.2 Actualizar el comentario de cabecera (comandos sin `-f` y las URLs bajo `:8100`)
- [x] 5.3 Borrar `docker-compose.app.yml`

## 6. Documentación

- [x] 6.1 README "Aplicación": un solo comando, las URLs `:8100`, `:8100/docs/` y `:8100/prototipo/`, la tabla de contenedores sin `swagger` y sin `prototipo`, y quitar el párrafo de los dos compose a la vez. Agregar una nota de migración: bajar los compose viejos antes de usar el nuevo
- [x] 6.2 README "Swagger y fuente de verdad": la UI unificada en `:8100/docs/`; cada servicio publica `/docs-json` siempre y su UI `/docs` solo en desarrollo
- [x] 6.3 README "Prototipo": URL `http://localhost:8100/prototipo/`, sin `docker compose up -d` aparte ni la nota del puerto 8090
- [x] 6.4 `docs/referencias.md`: el diagrama de "Cómo se baja cada cambio" (prototipo en `:8100/prototipo/` y swagger en `:8100/docs/`) y el paso "Diseño" (recargar en `:8100/prototipo/`, levantado con `docker compose up -d --build`)
- [x] 6.5 Revisar `apps/web/README.md` y los READMEs de los servicios por menciones a `:8180`, `/docs/<servicio>/` o `docker-compose.app.yml`
- [x] 6.6 Deltas de `acceso-web`, `rutas-web` y `base-de-datos`, cuyos escenarios nombraban `:8090` o `docker-compose.app.yml`

## 7. Verificación

- [x] 7.1 `docker compose up -d --build` levanta todo, y `docker compose ps` muestra solo el puerto `8100` publicado
- [x] 7.2 `http://localhost:8100` muestra el Login y se entra con `secretaria` / `sahs2026`. Recargar `/planificaciones/5` no da 404
- [x] 7.3 `http://localhost:8100/docs/` muestra el selector con los 6 servicios. En Horarios, "Try it out" de `GET /horarios/turnos` devuelve los turnos de los seeds
- [x] 7.4 `http://localhost:8100/docs/pago-json` devuelve el OpenAPI, y `http://localhost:8100/docs/pago/` no muestra la UI del servicio
- [x] 7.5 `http://localhost:8100/prototipo` redirige a `/prototipo/`, se entra con `secretaria`, se navegan pantallas sin 404 en la consola de red, y un cambio en `prototipo/index.html` se ve al recargar
- [x] 7.6 `:8090` y `:8180` no responden
- [x] 7.7 `npm test` y `npm run verificar-contratos` pasan
- [x] 7.8 `node tools/generar_cliente_web.mjs --url http://localhost:8100/docs` no deja diferencias en `apps/web/src/api`
