# swagger-ui-docker Specification

## Purpose
TBD - created by archiving change swagger-microservicios-sahs. Update Purpose after archive.
## Requirements
### Requirement: Swagger UI con Docker
El proyecto SHALL publicar un único Swagger UI en `http://localhost:8100/docs/`, servido por el nginx de `web` con `swagger-ui-dist` (la versión del `package-lock.json`, sin contenedor propio). Muestra el `/docs-json` que publica cada servicio (la API que corre) y lo lee por rutas relativas (`/docs/<servicio>-json`), en el mismo origen que la API. "Try it out" MUST obtener respuestas reales sin necesitar CORS. Los contratos congelados `specs/*.json` MUST NOT publicarse en ningún Swagger UI: quedan solo como historial y para `npm run verificar-contratos`.

#### Scenario: Levantar el entorno
- **WHEN** se ejecuta `docker compose up -d --build` en `swagger/`
- **THEN** `http://localhost:8100/docs/` muestra Swagger UI con las rutas REST que publican los servicios

#### Scenario: Probar un endpoint
- **WHEN** en `http://localhost:8100/docs/` se elige "Horarios" y se ejecuta `GET /horarios/turnos` con "Try it out"
- **THEN** se ven los turnos de los seeds, y la petición sale hacia `http://localhost:8100/horarios/turnos`

#### Scenario: Sin Swagger de los contratos congelados
- **WHEN** se recorren las definiciones del selector
- **THEN** ninguna carga un archivo de `specs/`

### Requirement: Selector de servicios
Swagger UI SHALL ofrecer un selector con los 6 servicios: Usuario, Pago, Horarios, Planificación, Orientación, y Profesor y Suplencias. Usuario es el que se carga por defecto.

#### Scenario: Cambiar de servicio
- **WHEN** el usuario elige "Profesor y Suplencias" en el selector de `http://localhost:8100/docs/`
- **THEN** se carga `/docs/profesor-suplencias-json` y se ven rutas como `GET /profesor-suplencias/profesores/{id}` y `POST /profesor-suplencias/profesores/{id}/suplencias`

### Requirement: Instrucciones de uso
El proyecto SHALL incluir un `README.md` que explique cómo levantar y bajar el entorno, las convenciones de rutas y los criterios señalados para que el grupo los revise.

#### Scenario: Lectura del README
- **WHEN** alguien del grupo abre `README.md`
- **THEN** encuentra los comandos `docker compose up -d` y `docker compose down`, y la lista de criterios a revisar

