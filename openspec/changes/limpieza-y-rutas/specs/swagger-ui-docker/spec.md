## MODIFIED Requirements

### Requirement: Swagger UI con Docker
El proyecto SHALL publicar un único Swagger UI, el del `docker-compose.app.yml`, con `swaggerapi/swagger-ui` en una versión de imagen fija, en `http://localhost:8180`, que muestre el `/docs-json` que publica cada servicio (la API que corre), a través del proxy de la web. Los contratos congelados `specs/*.json` MUST NOT publicarse en ningún Swagger UI: quedan solo como historial y para `npm run verificar-contratos`.

#### Scenario: Levantar el entorno
- **WHEN** se ejecuta `docker compose -f docker-compose.app.yml up -d` en `swagger/`
- **THEN** `http://localhost:8180` muestra Swagger UI con las rutas REST que publican los servicios

#### Scenario: Sin Swagger de los contratos congelados
- **WHEN** se ejecuta `docker compose up -d` con el `docker-compose.yml` original
- **THEN** solo se levanta el prototipo en `http://localhost:8090`, y no hay Swagger UI en `http://localhost:8080`

### Requirement: Selector de servicios
Swagger UI SHALL ofrecer un selector con los 6 servicios: Usuario, Pago, Horarios, Planificación, Orientación, y Profesor y Suplencias.

#### Scenario: Cambiar de servicio
- **WHEN** el usuario elige "Profesor y Suplencias" en el selector de `http://localhost:8180`
- **THEN** se carga `http://localhost:8100/docs/profesor-suplencias-json` y se ven rutas como `GET /profesor-suplencias/profesores/{id}` y `POST /profesor-suplencias/profesores/{id}/suplencias`
