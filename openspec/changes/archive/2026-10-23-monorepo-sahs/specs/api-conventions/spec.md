## MODIFIED Requirements

### Requirement: Un contrato OpenAPI por servicio
Cada uno de los 6 servicios SHALL publicar su propio contrato OpenAPI 3, generado por `@nestjs/swagger` a partir del código del servicio, en `GET /docs-json` (y la UI en `/docs`). Ese contrato es la fuente de verdad de la API. Los archivos `specs/<servicio>.json` y `tools/generar_specs.py` quedan congelados como historial del corte inicial, y MUST NOT usarse para definir cambios nuevos: un cambio en la API se hace en el código del servicio. `AGENTS.md`, `docs/referencias.md` y el README MUST describir la cadena documento → código Nest → swagger.

#### Scenario: Validación de los contratos
- **WHEN** se valida con un linter de OpenAPI el `/docs-json` de cada uno de los 6 servicios
- **THEN** los 6 documentos son válidos y no tienen errores

#### Scenario: Cambio en la API
- **WHEN** el grupo agrega una operación a un servicio
- **THEN** la agrega en el controller de NestJS, aparece en el `/docs-json` del servicio, y `specs/` no cambia
