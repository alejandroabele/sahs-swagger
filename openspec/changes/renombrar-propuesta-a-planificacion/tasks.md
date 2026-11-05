## 1. Base de datos

- [x] 1.1 `libs/entidades/src/planificacion`: `PlanificacionEntidad` (`planificacion_planificacion`, `id_planificacion`, `descripcion_planificacion`), `EstadoPlanificacionEntidad` (`planificacion_estado_planificacion`) y `PlanificacionClaseEntidad` (`planificacion_planificacion_clase`, `id_planificacion`), con sus relaciones (`ClaseEntidad.planificaciones`) y `ENTIDADES_PLANIFICACION`
- [x] 1.2 Migración `RenombrarPropuestaAPlanificacion` en `apps/db/src/migraciones` con `ALTER TABLE ... RENAME` de tablas y columnas, `down` inverso, e índices o claves que lleven el nombre viejo. `Inicial` y `ReglasDeNegocio` no se tocan
- [x] 1.3 Seeds (`apps/db/src/seeds/datos.ts` y `seeds.ts`) con las entidades y campos nuevos
- [x] 1.4 Correr `db-init` sobre una copia de una base con datos y comparar la cantidad de filas de las tres tablas antes y después. Correr `migration:generate` y confirmar que no hay diferencias

## 2. Contratos y comunes

- [x] 2.1 `libs/contratos`: `Planificacion`, `EstadoPlanificacion`, `ArmadoPlanificacion`, `id_planificacion` y `descripcion_planificacion`, y la interfaz del servicio con los `operationId` nuevos
- [x] 2.2 `ClienteServicio.url()` (`@sahs/comun`): una ruta que empieza con `/` se usa sin el prefijo del servicio. Prueba unitaria
- [x] 2.3 `configurarSwagger` (`libs/comun/src/swagger.ts`): servers `/api` (primero) y `/`

## 3. Servicio Planificación

- [x] 3.1 Mover `src/propuesta` a `src/planificacion` y `src/estado-de-propuesta` a `src/estado-de-planificacion`, con `PlanificacionService`, `EstadoDePlanificacionService` y sus controllers
- [x] 3.2 Controllers con `@Controller('planificaciones')`: `GET|POST /planificaciones`, `GET /planificaciones/{id}`, `/{id}/armado`, `/{id}/estado` (`GET` y `PUT`), `/{id}/clases`, `/{id}/generacion` y `GET|POST /planificaciones/estados`. El controller de estados se registra antes y `{id}` usa `ParseIntPipe`
- [x] 3.3 Renombrar los `operationId` según la tabla del diseño (`crear_planificacion`, `get_planificacion`, `get_planificaciones`, `get_armado_planificacion`, `asignar_estado_a_planificacion`, `asignar_clase_a_planificacion`, `crear_estado_planificacion`, `get_posibles_estados_de_planificaciones`, `get_estado_actual_de_planificacion`)
- [x] 3.4 DTOs (`dto/entradas.ts` y `dto/modelos.ts`): `CrearPlanificacionBody`, `AsignarEstadoAPlanificacionBody`, `AsignarClaseAPlanificacionBody`, `CrearEstadoPlanificacionBody`, `GetPlanificacionesQuery`, schemas `Planificacion`, `EstadoPlanificacion`, `ArmadoPlanificacion`, y el filtro `id_planificacion` de `get_clases`
- [x] 3.5 `reglas.ts`, `armado.ts`, `generacion.ts`, `clase.service.ts` y `rutas.ts`: identificadores, consultas y mensajes de error (`409`, `404`) con "planificación"
- [x] 3.6 `swagger.ts` del servicio: tags, descripciones y dependencias con los nombres nuevos

## 4. Otros servicios

- [x] 4.1 `apps/profesor-suplencias` (`profesor.service.ts` y controller): `listar('/planificaciones/estados')`, `listar('/planificaciones?…')`, `id_planificacion`, el mensaje del `409` de la baja y el texto "Invoca: …"
- [x] 4.2 `apps/pago` (`armado.ts`, `swagger.ts`, `README.md`): `listar('/planificaciones', …)`, filtro `id_planificacion` de `get_clases` y textos
- [x] 4.3 Buscar con `grep -rni propuesta apps libs` y dejar solo "Espacio de propuesta de área" y las migraciones viejas

## 5. nginx, Vite y Swagger UI

- [x] 5.1 `apps/web/nginx.conf`: `location /api/<servicio>/ { proxy_pass http://<servicio>:3000/<servicio>/; }` para los seis servicios y `location /api/planificaciones/ { proxy_pass http://planificacion:3000/planificaciones/; }`. Quitar los `location /<servicio>/` y actualizar el comentario de cabecera
- [x] 5.2 Proxy de Vite (`apps/web/vite.config.ts`): `/api/<x>` con `rewrite` que quita `/api`, incluido `/api/planificaciones`
- [x] 5.3 `apps/web/swagger/swagger-initializer.js`: confirmar que "Try it out" usa el server `/api`

## 6. Web

- [x] 6.1 `apps/web/src/api/http.ts`: `pedir()` antepone `/api` a la ruta y el comentario explica por qué
- [x] 6.2 `tools/generar_cliente_web.mjs`: tabla `PREFIJOS_EXTRA = { planificacion: ['/planificaciones'] }` para incluir esas rutas en el cliente de Planificación
- [x] 6.3 `node tools/generar_cliente_web.mjs` y revisar `apps/web/src/api/planificacion.ts`
- [x] 6.4 Pantallas `A3GeneracionPlanilla`, `A4Suplencias`, `A12Planificaciones`, `A13PlanificacionManual`, `a13/modelo.ts` y `P2MiHorario`: operaciones y campos nuevos. Las variables locales también pasan a `planificacion`. `app/rutas.ts` queda con las mismas URLs (`idPropuesta` pasa a `idPlanificacion`)
- [x] 6.5 `npm run build` de la web sin errores de tipos

## 7. Verificador y pruebas

- [x] 7.1 `tools/verificar_contratos.mjs`: `RENOMBRES` (operaciones, schemas y propiedades) aplicado al contrato congelado antes de comparar. `get_armado_propuesta` pasa a `get_armado_planificacion` en `AGREGADOS`, y se controla la ruta de las operaciones de `/planificaciones`
- [x] 7.2 `tests/e2e/servicios.test.mjs`: rutas y nombres nuevos, `GET /planificaciones/estados` devuelve la lista, `GET /planificacion/propuestas` da `404`
- [x] 7.3 `npm test` y `npm run verificar-contratos` sin errores

## 8. Documentación

- [x] 8.1 README: tabla de rutas, convenciones (excepción `/planificaciones` y publicación bajo `/api`), ejemplos con `curl` o URLs (`/api/...`) y "Cambios respecto del documento" con todos los renombres
- [x] 8.2 `AGENTS.md` y `docs/referencias.md`: revisar menciones a "propuesta" y a las URLs de la API
- [x] 8.3 Escribir `openspec/changes/renombrar-propuesta-a-planificacion/documento-grupo.md` con los reemplazos de la pestaña "Microservicios" (función por función en PLANIFICACIÓN y las llamadas desde PAGO y PROFESOR Y SUPLENCIAS) y de "Reglas de negocio" (regla por regla)
- [ ] 8.4 (Manual, grupo) Pegar el texto de 8.3 en el documento del grupo
- [ ] 8.5 (Manual, grupo) Diagrama de clases: `Propuesta` → `Planificación`, `EstadoPropuesta` → `EstadoPlanificación`, `id_propuesta` → `id_planificacion`, `descripcion_propuesta` → `descripcion_planificacion`

## 9. Prueba con Docker

- [x] 9.1 `docker compose up -d --build` con la base existente: la migración corre y las planificaciones siguen ahí
- [x] 9.2 Recargar `/planificaciones`, `/planificaciones/5` y `/planificaciones/5/generacion` en el navegador: se ve la app
- [x] 9.3 `curl /api/planificaciones/5`, `/api/planificaciones/estados`, `/api/planificacion/clases` y `POST /api/usuario/login`: responden los servicios
- [ ] 9.4 En `/docs/`, Planificación muestra `/planificaciones` y "Try it out" funciona. Recorrer A12, A13 (cambiar de estado, ver el `409` de plan incompleto), A3 (generar) y A7/A9 (baja bloqueada por la Vigente)
