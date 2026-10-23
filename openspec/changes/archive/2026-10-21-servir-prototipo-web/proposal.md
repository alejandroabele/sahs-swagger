## Why

El prototipo navegable de SAHS (vista del administrativo y vista del profesor) vive suelto en `/home/jano/sahs-prototipo`, fuera del repo, y para verlo hay que abrir los HTML a mano. Queremos que el grupo lo tenga versionado junto con los contratos y lo levante con el mismo comando que ya usa para Swagger UI.

## What Changes

- Se agrega la carpeta `prototipo/` con los dos HTML ejecutables del prototipo: `admin.html` y `profesor.html`. Ambos son autónomos: traen su propio runtime y todas sus pantallas.
- Se agrega `prototipo/index.html`, una portada para elegir rol (Administrativo / Profesor).
- `docker-compose.yml` suma un servicio `prototipo` (nginx con versión de imagen fija) que sirve `prototipo/` en `http://localhost:8090`. Swagger UI sigue en `http://localhost:8080`.
- El `README.md` suma una sección "Prototipo" con la URL y qué contiene.
- **Fuera de alcance:** los `*.dc.html` sueltos (no funcionan sin `support.js`), `planilla-horarios-sahs.html` (lienzo de diseño de 3 MB que depende de internet), `canvas.json`, los diagramas drawio/xml y `datos-de-ejemplo.md`. Quedan donde están.

## Capabilities

### New Capabilities
- `prototipo-web`: servir el prototipo HTML (portada, vista del administrativo y vista del profesor) desde el mismo `docker compose` que Swagger UI.

### Modified Capabilities
<!-- Ninguna: los requisitos de swagger-ui-docker siguen valiendo sin cambios. -->

## Impact

- `docker-compose.yml`: nuevo servicio y puerto 8090 ocupado en el host.
- Nuevos archivos en `prototipo/` (unos 600 KB en total).
- `README.md`: nueva sección.
- Sin cambios en `specs/` ni en los contratos OpenAPI. No se agregan dependencias de Node ni de Python.
