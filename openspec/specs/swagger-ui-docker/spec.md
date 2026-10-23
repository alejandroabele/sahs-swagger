# swagger-ui-docker Specification

## Purpose
TBD - created by archiving change swagger-microservicios-sahs. Update Purpose after archive.
## Requirements
### Requirement: Swagger UI con Docker
El proyecto SHALL incluir un `docker-compose.yml` que levante `swaggerapi/swagger-ui`, con una versión de imagen fija, en `http://localhost:8080`, y sirva los archivos de `specs/`.

#### Scenario: Levantar el entorno
- **WHEN** se ejecuta `docker compose up -d` en `swagger/`
- **THEN** `http://localhost:8080` muestra Swagger UI con el servicio Usuario cargado por defecto

### Requirement: Selector de servicios
Swagger UI SHALL ofrecer un selector con los 6 servicios: Usuario, Pago, Horarios, Planificación, Orientación, y Profesor y Suplencias.

#### Scenario: Cambiar de servicio
- **WHEN** el usuario elige "Planificación" en el selector
- **THEN** se carga `specs/planificacion.json` y se muestran sus endpoints

### Requirement: Instrucciones de uso
El proyecto SHALL incluir un `README.md` que explique cómo levantar y bajar el entorno, las convenciones de rutas y los criterios señalados para que el grupo los revise.

#### Scenario: Lectura del README
- **WHEN** alguien del grupo abre `README.md`
- **THEN** encuentra los comandos `docker compose up -d` y `docker compose down`, y la lista de criterios a revisar

