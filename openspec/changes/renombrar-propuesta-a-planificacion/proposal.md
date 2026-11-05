## Why

En la escuela y en las pantallas se habla de "planificación", pero la API, el código y la base llaman "propuesta" a lo mismo (`crear_propuesta`, `id_propuesta`, `/planificacion/propuestas`). Esa diferencia confunde a quien lee el swagger y obliga a traducir mentalmente entre la pantalla y la API. El grupo decidió usar "planificación" en todos lados, también en el documento del grupo y en el diagrama de clases.

## What Changes

- **BREAKING** Todas las APIs se publican bajo `/api` en nginx (`/api/pago/pagos`, `/api/planificacion/clases`). nginx le quita el `/api` antes de pasar al servicio, así que las rutas internas de los servicios no cambian. Hace falta porque las rutas nuevas `/planificaciones/...` son las mismas que usan las pantallas de la web.
- **BREAKING** El recurso propuesta pasa a ser `planificaciones` y se publica sin el prefijo del servicio: `/planificaciones`, `/planificaciones/{id}`, `/planificaciones/{id}/armado|estado|clases|generacion` y `/planificaciones/estados`. Es la segunda excepción a la convención `/<servicio>/<recurso>`, junto con `POST /usuario/login`. El resto del servicio sigue en `/planificacion/...`.
- **BREAKING** Se renombran las operaciones: `crear_propuesta`, `get_propuesta`, `get_propuestas`, `get_armado_propuesta`, `asignar_estado_a_propuesta`, `asignar_clase_a_propuesta`, `crear_estado_propuesta`, `get_posibles_estados_de_propuestas` y `get_estado_actual_de_propuesta` pasan a decir `planificacion` o `planificaciones`.
- **BREAKING** Se renombran los schemas (`Propuesta` → `Planificacion`, `EstadoPropuesta` → `EstadoPlanificacion`, `ArmadoPropuesta` → `ArmadoPlanificacion` y sus DTOs) y los campos (`id_propuesta` → `id_planificacion`, `descripcion_propuesta` → `descripcion_planificacion`), también el filtro `id_propuesta` de `get_clases`.
- Las descripciones del swagger y los mensajes de error dicen "planificación".
- Una migración renombra las tablas y columnas de la base. Los datos se conservan.
- Pago y profesor-suplencias llaman a las rutas y operaciones nuevas.
- La web usa el cliente regenerado. Las URLs de las pantallas no cambian.
- "Espacio de propuesta de área" (un tipo de materia) no se toca: es otro concepto.
- Documentación: README, specs, y un texto listo para pegar en el documento del grupo. El diagrama de clases lo actualiza el grupo a mano.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `api-conventions`: excepción de prefijo para `/planificaciones` y publicación de las APIs bajo `/api`.
- `planificacion-api`: rutas, operaciones, schemas, campos y mensajes con "planificación".
- `microservicios-nest`: estados de la planificación, choques dentro de una planificación y el filtro `id_planificacion` de `get_clases`.
- `profesor-suplencias-api`: dependencias con los nombres nuevos de planificación y el mensaje de la baja bloqueada.
- `base-de-datos`: migración que renombra tablas y columnas.
- `despliegue-docker`: nginx publica las APIs bajo `/api`.
- `rutas-web`: el escenario de la URL de armado usa `id_planificacion`.
- `swagger-ui-docker`: "Try it out" sale por `/api`, y Planificación muestra `/planificaciones`.
- `consultas-por-pantalla`: el texto del requisito habla de planificaciones (sin cambio de comportamiento).

## Impact

- **Servicios:** `apps/planificacion` (carpetas `propuesta` y `estado-de-propuesta`, `reglas.ts`, `armado.ts`, `rutas.ts`, `swagger.ts`, DTOs), `apps/pago` (`armado.ts`, `swagger.ts`) y `apps/profesor-suplencias` (`profesor.service.ts`, controller). También `libs/contratos` y `libs/entidades`.
- **Comunes:** `ClienteServicio` de `@sahs/comun` agrega el prefijo del servicio a toda ruta y tiene que aceptar rutas absolutas (`/planificaciones`). El swagger publica el server `/api`.
- **Base de datos:** migración nueva en `apps/db/src/migraciones` y seeds.
- **Web:** `apps/web/nginx.conf`, el proxy de Vite, `api/http.ts` (prefijo `/api`), el generador del cliente (`tools/generar_cliente_web.mjs` hoy solo toma rutas que empiezan con el prefijo del servicio) y las pantallas que usan `id_propuesta` (A3, A12, A13 y otras).
- **Verificador:** `tools/verificar_contratos.mjs` compara por `operationId` contra `specs/*.json`, que no se tocan. Necesita un mapa de renombres de operaciones, schemas y campos.
- **Pruebas:** `tests/e2e/servicios.test.mjs`.
- **Fuera del repo:** el documento del grupo (pestañas "Microservicios" y "Reglas de negocio") y el diagrama de clases.
