## ADDED Requirements

### Requirement: Compose de producción
El repo SHALL incluir `docker-compose.app.yml`, que construye y levanta, con `docker compose -f docker-compose.app.yml up -d --build`, estos servicios:
- `db-init`;
- `usuario`, `pago`, `horarios`, `planificacion`, `orientacion` y `profesor-suplencias`;
- `web`;
- `swagger`.

Las imágenes base MUST tener una versión fija. `docker-compose.yml` MUST NOT cambiar, y los dos compose MUST poder estar levantados a la vez sin conflictos de puertos ni de nombres de contenedor.

#### Scenario: Levantar desde cero
- **WHEN** en una máquina con Docker se clona el repo y se ejecuta `docker compose -f docker-compose.app.yml up -d --build`
- **THEN** `http://localhost:8100` muestra el Login y se puede entrar con `secretaria` / `sahs2026`

#### Scenario: Convivencia con el entorno anterior
- **WHEN** están levantados `docker-compose.yml` y `docker-compose.app.yml`
- **THEN** responden `:8080`, `:8090`, `:8100` y `:8180`

### Requirement: Imágenes en varias etapas
Los servicios Nest y `db-init` SHALL construirse con un Dockerfile de varias etapas sobre `node:22-slim`. La imagen final MUST incluir solo la salida del build y las dependencias de producción. `web` SHALL construirse con el build de Vite y servirse con `nginx` con versión fija.

#### Scenario: Imagen final sin dependencias de desarrollo
- **WHEN** se inspecciona la imagen final de un servicio
- **THEN** no tiene `typescript` ni `@nestjs/cli` en `node_modules`

### Requirement: Volumen de datos
El compose SHALL declarar el volumen con nombre `sahs-data`, montado en `/data` en `db-init` y en los 6 servicios, con `DB_PATH=/data/sahs.sqlite`.

#### Scenario: Volumen creado
- **WHEN** se levanta el compose por primera vez
- **THEN** `docker volume ls` muestra el volumen `sahs-data` del proyecto y contiene `sahs.sqlite`

### Requirement: Red interna y puertos publicados
Los 6 servicios SHALL escuchar en el puerto 3000 de la red interna y MUST NOT publicar puertos en el host. Solo se publican `web` en `8100` y `swagger` en `8180`. Cada servicio recibe las URLs de los demás por variables `URL_<SERVICIO>` y tiene un `healthcheck` contra `/actuator/health`. Los servicios MUST NOT tener `depends_on` entre sí, solo hacia `db-init`.

#### Scenario: Servicio no expuesto
- **WHEN** desde el host se pide `http://localhost:3000`
- **THEN** no responde ningún servicio de SAHS

### Requirement: nginx como proxy por prefijo
El nginx de `web` SHALL:
- servir el build de React, devolviendo `index.html` para cualquier ruta de la app;
- redirigir `/usuario/`, `/pago/`, `/horarios/`, `/planificacion/`, `/orientacion/` y `/profesor_suplencias/` al servicio correspondiente;
- exponer el swagger de cada servicio en `/docs/<servicio>/` y `/docs/<servicio>-json`.

#### Scenario: Recargar una ruta de la app
- **WHEN** se recarga `http://localhost:8100/A13`
- **THEN** nginx devuelve la app y no un 404

#### Scenario: Documento de un servicio por el proxy
- **WHEN** se pide `http://localhost:8100/docs/pago-json`
- **THEN** devuelve el OpenAPI del servicio Pago

### Requirement: Swagger UI agregado
El servicio `swagger` (`swaggerapi/swagger-ui` con versión fija) SHALL publicar en `http://localhost:8180` un selector con los 6 servicios, que lee el OpenAPI de cada uno a través de `http://localhost:8100/docs/<servicio>-json`. "Try it out" MUST obtener respuestas reales: los servicios habilitan CORS para ese origen.

#### Scenario: Probar un endpoint
- **WHEN** en `:8180` se elige "Horarios" y se ejecuta `GET /horarios/get_turnos` con "Try it out"
- **THEN** se ven los turnos de los seeds

### Requirement: Documentación de uso
El README SHALL tener una sección "Aplicación" que explique:
- cómo levantar, bajar y reiniciar la base (`up -d --build`, `down`, `down -v`);
- las URLs `:8100` y `:8180`;
- los usuarios de ejemplo y la contraseña `sahs2026`;
- cómo desarrollar localmente con los scripts de npm.

#### Scenario: Lectura del README
- **WHEN** alguien del grupo abre el README
- **THEN** encuentra los comandos, las URLs y los usuarios de ejemplo para entrar a la aplicación
