## MODIFIED Requirements

### Requirement: Compose de producción
El repo SHALL incluir un único compose, `docker-compose.yml`, que construye y levanta con `docker compose up -d --build` estos servicios:
- `db-init`;
- `usuario`, `pago`, `horarios`, `planificacion`, `orientacion` y `profesor-suplencias`;
- `web`.

Las imágenes base MUST tener una versión fija. El repo MUST NOT tener otro archivo de compose: `docker-compose.app.yml` no existe.

#### Scenario: Levantar desde cero
- **WHEN** en una máquina con Docker se clona el repo y se ejecuta `docker compose up -d --build`
- **THEN** `http://localhost:8100` muestra el Login y se puede entrar con `secretaria` / `sahs2026`

#### Scenario: Un solo compose
- **WHEN** se listan los archivos de la raíz del repo
- **THEN** está `docker-compose.yml` y no está `docker-compose.app.yml`

#### Scenario: Bajar todo
- **WHEN** se ejecuta `docker compose down`
- **THEN** se detienen todos los contenedores de SAHS, y el volumen `sahs-data` sigue existiendo

### Requirement: Red interna y puertos publicados
Los 6 servicios SHALL escuchar en el puerto 3000 de la red interna y MUST NOT publicar puertos en el host. El único puerto publicado es el `8100`, de `web`. Cada servicio recibe las URLs de los demás por variables `URL_<SERVICIO>` y tiene un `healthcheck` contra `/actuator/health`. Los servicios MUST NOT tener `depends_on` entre sí, solo hacia `db-init`.

#### Scenario: Servicio no expuesto
- **WHEN** desde el host se pide `http://localhost:3000`
- **THEN** no responde ningún servicio de SAHS

#### Scenario: Un solo puerto
- **WHEN** con el compose levantado se ejecuta `docker compose ps`
- **THEN** el único puerto publicado en el host es `8100`, y `:8090` y `:8180` no responden

### Requirement: nginx como proxy por prefijo
El nginx de `web` SHALL:
- servir el build de React, devolviendo `index.html` para cualquier ruta de la app;
- redirigir `/usuario/`, `/pago/`, `/horarios/`, `/planificacion/`, `/orientacion/` y `/profesor-suplencias/` al servicio correspondiente;
- exponer el OpenAPI de cada servicio en `/docs/<servicio>-json`;
- servir el Swagger UI unificado en `/docs/` (ver `swagger-ui-docker`);
- servir el prototipo en `/prototipo/` (ver `prototipo-web`).

El nginx MUST NOT exponer la UI propia de cada servicio (`/docs/<servicio>/`). Las rutas `/docs/` y `/prototipo/` MUST NOT devolver el `index.html` de la app React.

#### Scenario: Recargar una ruta de la app
- **WHEN** se recarga `http://localhost:8100/planificaciones/5`
- **THEN** nginx devuelve la app y no un 404

#### Scenario: Documento de un servicio por el proxy
- **WHEN** se pide `http://localhost:8100/docs/pago-json`
- **THEN** devuelve el OpenAPI del servicio Pago

#### Scenario: Sin UI por servicio
- **WHEN** se pide `http://localhost:8100/docs/pago/`
- **THEN** no se muestra la UI del servicio Pago

### Requirement: Documentación de uso
El README SHALL tener una sección "Aplicación" que explique:
- cómo levantar, bajar y reiniciar la base (`docker compose up -d --build`, `docker compose down`, `docker compose down -v`);
- las URLs `http://localhost:8100` (app), `http://localhost:8100/docs/` (Swagger UI) y `http://localhost:8100/prototipo/` (prototipo);
- los usuarios de ejemplo y la contraseña `sahs2026`;
- cómo desarrollar localmente con los scripts de npm.

#### Scenario: Lectura del README
- **WHEN** alguien del grupo abre el README
- **THEN** encuentra un solo comando para levantar todo, las tres URLs bajo `:8100` y los usuarios de ejemplo para entrar a la aplicación

## REMOVED Requirements

### Requirement: Swagger UI agregado
**Reason**: El contenedor `swagger` en `:8180` se elimina. El Swagger UI lo sirve ahora el nginx de la web, en el mismo origen que la API, y ya no hace falta CORS.
**Migration**: El requisito queda en `swagger-ui-docker` ("Swagger UI con Docker" y "Selector de servicios"), con la URL `http://localhost:8100/docs/`.
