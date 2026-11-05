## MODIFIED Requirements

### Requirement: nginx como proxy por prefijo
El nginx de `web` SHALL:
- servir el build de React, devolviendo `index.html` para cualquier ruta de la app;
- redirigir `/api/usuario/`, `/api/pago/`, `/api/horarios/`, `/api/planificacion/`, `/api/planificaciones/`, `/api/orientacion/` y `/api/profesor-suplencias/` al servicio correspondiente, quitando el `/api` (`/api/pago/pagos` → `pago:3000/pago/pagos`, `/api/planificaciones/5` → `planificacion:3000/planificaciones/5`);
- exponer el OpenAPI de cada servicio en `/docs/<servicio>-json`;
- servir el Swagger UI unificado en `/docs/` (ver `swagger-ui-docker`);
- servir el prototipo en `/prototipo/` (ver `prototipo-web`).

Fuera de `/api/` nginx MUST NOT redirigir ninguna ruta a un servicio: `/pago/pagos` o `/planificaciones/5` devuelven la app. El nginx MUST NOT exponer la UI propia de cada servicio (`/docs/<servicio>/`). Las rutas `/docs/` y `/prototipo/` MUST NOT devolver el `index.html` de la app React.

#### Scenario: Recargar una ruta de la app
- **WHEN** se recarga `http://localhost:8100/planificaciones/5`
- **THEN** nginx devuelve la app y no un 404

#### Scenario: Documento de un servicio por el proxy
- **WHEN** se pide `http://localhost:8100/docs/pago-json`
- **THEN** devuelve el OpenAPI del servicio Pago

#### Scenario: Sin UI por servicio
- **WHEN** se pide `http://localhost:8100/docs/pago/`
- **THEN** no se muestra la UI del servicio Pago

#### Scenario: API por /api
- **WHEN** se pide `http://localhost:8100/api/planificacion/clases`
- **THEN** responde el servicio Planificación con la lista de clases
