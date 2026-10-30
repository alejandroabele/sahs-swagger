## ADDED Requirements

### Requirement: HTTPS con Caddy
El compose SHALL incluir un servicio `caddy` (imagen con versión fija) que publique los puertos 80 y 443 y haga de proxy hacia `web:80`. El dominio sale de la variable `SAHS_DOMINIO` (por defecto `localhost`). Caddy MUST obtener y renovar solo el certificado del dominio, guardarlo en el volumen `caddy-data` y redirigir `http://` a `https://`. Con `localhost` usa su CA interna.

#### Scenario: HTTPS en la VPS
- **WHEN** en la VPS el `.env` tiene `SAHS_DOMINIO=vps-6558769-x.dattaweb.com` y se ejecuta `docker compose up -d --build`
- **THEN** `https://vps-6558769-x.dattaweb.com/` muestra el Login con un certificado válido

#### Scenario: Redirección a HTTPS
- **WHEN** se pide `http://<SAHS_DOMINIO>/docs/`
- **THEN** responde con una redirección a `https://<SAHS_DOMINIO>/docs/`

#### Scenario: HTTPS local
- **WHEN** sin `SAHS_DOMINIO` se levanta el compose y se pide `https://localhost/docs/pago-json` aceptando la CA interna de Caddy
- **THEN** devuelve el OpenAPI del servicio Pago

#### Scenario: El certificado sobrevive al deploy
- **WHEN** se vuelve a ejecutar `docker compose up -d --build`
- **THEN** Caddy reutiliza el certificado de `caddy-data` y no pide uno nuevo

## MODIFIED Requirements

### Requirement: Compose de producción
El repo SHALL incluir un único compose, `docker-compose.yml`, que construye y levanta con `docker compose up -d --build` estos servicios:
- `db-init`;
- `usuario`, `pago`, `horarios`, `planificacion`, `orientacion` y `profesor-suplencias`;
- `web`;
- `caddy`.

Las imágenes base MUST tener una versión fija. El repo MUST NOT tener otro archivo de compose: `docker-compose.app.yml` no existe.

#### Scenario: Levantar desde cero
- **WHEN** en una máquina con Docker se clona el repo y se ejecuta `docker compose up -d --build`
- **THEN** `http://localhost:8100` muestra el Login y se puede entrar con `secretaria` / `sahs2026`

#### Scenario: Un solo compose
- **WHEN** se listan los archivos de la raíz del repo
- **THEN** está `docker-compose.yml` y no está `docker-compose.app.yml`

#### Scenario: Bajar todo
- **WHEN** se ejecuta `docker compose down`
- **THEN** se detienen todos los contenedores de SAHS, y los volúmenes `sahs-data` y `caddy-data` siguen existiendo

### Requirement: Red interna y puertos publicados
Los 6 servicios SHALL escuchar en el puerto 3000 de la red interna y MUST NOT publicar puertos en el host. Los puertos publicados son el 80 y el 443 de `caddy`, en todas las interfaces, y el `8100` de `web`, solo en `127.0.0.1`. Cada servicio recibe las URLs de los demás por variables `URL_<SERVICIO>` y tiene un `healthcheck` contra `/actuator/health`. Los servicios MUST NOT tener `depends_on` entre sí, solo hacia `db-init`.

#### Scenario: Servicio no expuesto
- **WHEN** desde el host se pide `http://localhost:3000`
- **THEN** no responde ningún servicio de SAHS

#### Scenario: Puertos publicados
- **WHEN** con el compose levantado se ejecuta `docker compose ps`
- **THEN** `caddy` publica `80` y `443`, `web` publica `127.0.0.1:8100`, y `:8090` y `:8180` no responden

#### Scenario: Sin HTTP plano desde afuera
- **WHEN** desde otra máquina se pide `http://<ip-de-la-vps>:8100/`
- **THEN** no responde

### Requirement: Documentación de uso
El README SHALL tener una sección "Aplicación" que explique:
- cómo levantar, bajar y reiniciar la base (`docker compose up -d --build`, `docker compose down`, `docker compose down -v`);
- las URLs `http://localhost:8100` (app), `http://localhost:8100/docs/` (Swagger UI) y `http://localhost:8100/prototipo/` (prototipo);
- HTTPS: la variable `SAHS_DOMINIO` en el `.env`, `https://localhost` con la CA interna de Caddy y los puertos 80 y 443 abiertos en el servidor;
- los usuarios de ejemplo y la contraseña `sahs2026`;
- cómo desarrollar localmente con los scripts de npm.

#### Scenario: Lectura del README
- **WHEN** alguien del grupo abre el README
- **THEN** encuentra un solo comando para levantar todo, las tres URLs bajo `:8100`, cómo configurar el dominio para HTTPS y los usuarios de ejemplo para entrar a la aplicación
