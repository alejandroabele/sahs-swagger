## Why

Para la materia (especificación de software) necesitamos mostrar la arquitectura de SAHS: qué componentes tiene y cómo se comunican los microservicios. Hoy esa información está repartida en el `docker-compose.yml`, en las llamadas `new ClienteServicio(...)` y en las entidades, y un dibujo hecho a mano queda viejo apenas cambia el código. Queremos un gráfico que salga del código, pero que una persona del grupo revise antes de que se muestre.

## What Changes

- App nueva `apps/arquitectura` (paquete `@sahs/arquitectura`, React + Vite + React Flow), con su propio contenedor nginx. El nginx de `web` la publica en `http://localhost:8100/arquitectura/`.
- Dos diagramas, de alto nivel y pensados para presentar:
  - **Componentes** (`/arquitectura/`): usuarios → aplicación web → API Gateway → los 6 microservicios (con ícono y responsabilidad) → base de datos.
  - **Comunicación** (`/arquitectura/comunicacion`): las llamadas HTTP entre microservicios. Los pares que se llaman entre sí van en azul.
- **Modelo generado y validado:** `tools/arquitectura.mjs` lee el código (servicios y contenedores del compose, llamadas entre servicios y tablas de cada uno) y escribe `generado.json`. Los diagramas muestran `validado.json`, que va en el repo y solo cambia cuando una persona aprueba las diferencias con `npm run arquitectura:validar`. Lo que el código tiene y todavía no se validó aparece con borde punteado y en la pantalla **Validar** (`/arquitectura/validar`). `npm run verificar-arquitectura` falla si hay diferencias sin validar.
- **Solo modo presentación:** la app es una lámina, sin estado de los servicios ni avisos; Validar no tiene pestaña y se entra por su URL. La llamada de Pago a Planificación no se dibuja, para simplificar la lámina.
- El API Gateway se dibuja como se diseñó: valida el token que emite Usuario. Hoy el gateway no lo valida; implementar esa validación no es parte de este cambio y queda anotado en el README.

## Capabilities

### New Capabilities

- `vista-arquitectura`: la app `/arquitectura` (los dos diagramas, la pantalla Validar y el modo presentación) y el modelo de arquitectura (generación desde el código, validación humana y verificación).

### Modified Capabilities

- `despliegue-docker`: el compose suma el contenedor `arquitectura` y el nginx de `web` publica `/arquitectura/`.

## Impact

- **Código nuevo:** `apps/arquitectura` (app, Dockerfile, nginx, `modelo/validado.json`), `tools/arquitectura.mjs`.
- **Docker:** `docker-compose.yml` (servicio `arquitectura`), `apps/web/nginx.conf` (proxy `/arquitectura/`), y los Dockerfiles que hacen `npm ci` copian el `package.json` del workspace nuevo.
- **Dependencias:** `@xyflow/react` en `apps/arquitectura`.
- **Scripts raíz:** `arquitectura:validar`, `verificar-arquitectura`, `dev:arquitectura`; workspace nuevo en `package.json`.
- **Documentación:** README (URL nueva, cómo validar el modelo, el gateway sin validación de token) y AGENTS.md (el modelo lo aprueba una persona, no un agente).
- La API de los servicios no cambia y el cliente de la web no se regenera.
