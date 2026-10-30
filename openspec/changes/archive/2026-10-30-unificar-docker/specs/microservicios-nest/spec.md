## MODIFIED Requirements

### Requirement: Swagger publicado por cada servicio
Cada servicio SHALL publicar su OpenAPI 3 con `@nestjs/swagger` en `GET /docs-json`, siempre. La UI en `GET /docs` MUST publicarse solo fuera de producción (`NODE_ENV` distinto de `production`); en producción el Swagger UI es el unificado de la web. `info` incluye la descripción con las dependencias y `x-dependencias`. `servers` es `[{ "url": "/" }]`.

#### Scenario: Documento del servicio
- **WHEN** se pide `GET /docs-json` al servicio Pago
- **THEN** devuelve un OpenAPI 3 con las 8 operaciones de Pago (incluido el health check) y `x-dependencias` con `profesor_suplencias.get_profesor`

#### Scenario: UI en desarrollo
- **WHEN** se levanta Pago con `npm run dev:pago` y se abre `http://localhost:8082/docs`
- **THEN** se ve la UI de Swagger del servicio Pago

#### Scenario: Sin UI en producción
- **WHEN** Pago corre con `NODE_ENV=production` y se pide `GET /docs`
- **THEN** responde `404`, y `GET /docs-json` sigue devolviendo el OpenAPI
