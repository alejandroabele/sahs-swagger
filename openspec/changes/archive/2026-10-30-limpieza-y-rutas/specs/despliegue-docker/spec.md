## MODIFIED Requirements

### Requirement: nginx como proxy por prefijo
El nginx de `web` SHALL:
- servir el build de React, devolviendo `index.html` para cualquier ruta de la app;
- redirigir `/usuario/`, `/pago/`, `/horarios/`, `/planificacion/`, `/orientacion/` y `/profesor-suplencias/` al servicio correspondiente;
- exponer el swagger de cada servicio en `/docs/<servicio>/` y `/docs/<servicio>-json`.

#### Scenario: Recargar una ruta de la app
- **WHEN** se recarga `http://localhost:8100/planificaciones/5`
- **THEN** nginx devuelve la app y no un 404

#### Scenario: Documento de un servicio por el proxy
- **WHEN** se pide `http://localhost:8100/docs/pago-json`
- **THEN** devuelve el OpenAPI del servicio Pago

### Requirement: Swagger UI agregado
El servicio `swagger` (`swaggerapi/swagger-ui` con versión fija) SHALL publicar en `http://localhost:8180` un selector con los 6 servicios, que lee el OpenAPI de cada uno a través de `http://localhost:8100/docs/<servicio>-json`. "Try it out" MUST obtener respuestas reales: los servicios habilitan CORS para ese origen.

#### Scenario: Probar un endpoint
- **WHEN** en `:8180` se elige "Horarios" y se ejecuta `GET /horarios/turnos` con "Try it out"
- **THEN** se ven los turnos de los seeds
