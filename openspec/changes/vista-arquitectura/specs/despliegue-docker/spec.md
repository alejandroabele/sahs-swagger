## ADDED Requirements

### Requirement: Contenedor de la vista de arquitectura
El compose SHALL tener el servicio `arquitectura`, construido desde `apps/arquitectura/Dockerfile` en varias etapas (build de Vite sobre `node:22-slim` y nginx con versión fija), en la red interna y sin puertos publicados en el host. El build MUST generar el modelo de arquitectura desde el código del repo.

#### Scenario: Contenedor levantado
- **WHEN** se ejecuta `docker compose up -d --build`
- **THEN** `docker compose ps` muestra `arquitectura` en ejecución y sin puertos publicados

### Requirement: nginx publica la vista de arquitectura
El nginx de `web` SHALL pasar `/arquitectura/` al contenedor `arquitectura`, resolviendo el nombre en cada pedido, y redirigir `/arquitectura` a `/arquitectura/`. Esas rutas MUST NOT devolver el `index.html` de la app React de SAHS.

#### Scenario: Vista por el proxy
- **WHEN** se pide `http://localhost:8100/arquitectura/`
- **THEN** responde la app de arquitectura

#### Scenario: Sin barra final
- **WHEN** se pide `http://localhost:8100/arquitectura`
- **THEN** redirige a `/arquitectura/`
