## Context

El servicio Planificación tiene una entidad, `Propuesta`, que en las pantallas ya se muestra como "Planificación" (A12 Planificaciones, A13 Planificación manual). En la API, el código y la base sigue llamándose propuesta: rutas `/planificacion/propuestas`, nueve operaciones `*_propuesta*`, los schemas `Propuesta`, `EstadoPropuesta` y `ArmadoPropuesta`, los campos `id_propuesta` y `descripcion_propuesta`, y las tablas `planificacion_propuesta`, `planificacion_estado_propuesta` y `planificacion_propuesta_clase`.

Restricciones:

- Toda la API pasa por un único nginx (`apps/web/nginx.conf`), en el mismo origen que la web. Hoy cada servicio vive bajo `/<servicio>/` y la web usa `/planificaciones`, `/planificaciones/:id`, `/planificaciones/:id/cursos/:idCurso` y `/planificaciones/:id/generacion[/:idCurso]` como URLs de pantalla.
- `specs/*.json` está congelado y `tools/verificar_contratos.mjs` compara contra él por `operationId`.
- `ClienteServicio` (`@sahs/comun`) arma `<url del servicio>/<prefijo>/<ruta>`, y `tools/generar_cliente_web.mjs` solo toma las rutas que empiezan con `/<prefijo>/`.
- La base es SQLite y los cambios van por migración, nunca con `synchronize`.

## Goals / Non-Goals

**Goals:**

- Que el swagger, el código, la base y el documento del grupo digan "planificación" donde hoy dicen "propuesta".
- Que el recurso se publique como `/planificaciones`, sin repetir el nombre del servicio.
- Que las URLs de pantalla de la web no cambien.

**Non-Goals:**

- Cambiar "Espacio de propuesta de área" (tipo de materia), ni en el prototipo ni en la web.
- Cambiar las demás rutas de Planificación (`/planificacion/clases`, `/planificacion/cursos`, etc.).
- Editar `specs/*.json`, `tools/generar_specs.py` o el artifact de diseño.
- Editar el documento del grupo o el diagrama de clases desde el repo: el cambio deja el texto y el grupo lo pasa a mano.
- Mantener alias con los nombres viejos. El único cliente de la API es este repo.

## Decisions

### 1. Tabla de renombres

| Hoy | Nuevo |
|---|---|
| `GET /planificacion/propuestas` (`get_propuestas`) | `GET /planificaciones` (`get_planificaciones`) |
| `POST /planificacion/propuestas` (`crear_propuesta`) | `POST /planificaciones` (`crear_planificacion`) |
| `GET /planificacion/propuestas/{id}` (`get_propuesta`) | `GET /planificaciones/{id}` (`get_planificacion`) |
| `GET /planificacion/propuestas/{id}/armado` (`get_armado_propuesta`) | `GET /planificaciones/{id}/armado` (`get_armado_planificacion`) |
| `GET /planificacion/propuestas/{id}/estado` (`get_estado_actual_de_propuesta`) | `GET /planificaciones/{id}/estado` (`get_estado_actual_de_planificacion`) |
| `PUT /planificacion/propuestas/{id}/estado` (`asignar_estado_a_propuesta`) | `PUT /planificaciones/{id}/estado` (`asignar_estado_a_planificacion`) |
| `POST /planificacion/propuestas/{id}/clases` (`asignar_clase_a_propuesta`) | `POST /planificaciones/{id}/clases` (`asignar_clase_a_planificacion`) |
| `POST /planificacion/propuestas/{id}/generacion` (`generar_planilla`) | `POST /planificaciones/{id}/generacion` (`generar_planilla`) |
| `GET /planificacion/estados-propuesta` (`get_posibles_estados_de_propuestas`) | `GET /planificaciones/estados` (`get_posibles_estados_de_planificaciones`) |
| `POST /planificacion/estados-propuesta` (`crear_estado_propuesta`) | `POST /planificaciones/estados` (`crear_estado_planificacion`) |
| Schemas `Propuesta`, `EstadoPropuesta`, `ArmadoPropuesta` | `Planificacion`, `EstadoPlanificacion`, `ArmadoPlanificacion` |
| DTOs `CrearPropuestaBody`, `AsignarEstadoAPropuestaBody`, `AsignarClaseAPropuestaBody`, `CrearEstadoPropuestaBody`, `GetPropuestasQuery` | `CrearPlanificacionBody`, `AsignarEstadoAPlanificacionBody`, `AsignarClaseAPlanificacionBody`, `CrearEstadoPlanificacionBody`, `GetPlanificacionesQuery` |
| Campos `id_propuesta`, `descripcion_propuesta` (y el filtro `id_propuesta` de `get_clases`) | `id_planificacion`, `descripcion_planificacion` |
| Tablas `planificacion_propuesta`, `planificacion_estado_propuesta`, `planificacion_propuesta_clase` | `planificacion_planificacion`, `planificacion_estado_planificacion`, `planificacion_planificacion_clase` |
| Carpetas `src/propuesta`, `src/estado-de-propuesta`, clases `PropuestaService`, `EstadoDePropuestaService` | `src/planificacion`, `src/estado-de-planificacion`, `PlanificacionService`, `EstadoDePlanificacionService` |

Las tablas conservan el prefijo del servicio dueño (`planificacion_`), como pide la regla de la base, aunque la palabra se repita: eso no se ve en la API.

### 2. Todas las APIs bajo `/api` en nginx

Las rutas nuevas de la API coinciden con las URLs de las pantallas. Si nginx mandara `/planificaciones/` al servicio, al recargar `/planificaciones/5` llegaría JSON en lugar de la app. Se publican todas las APIs bajo `/api/` y nginx quita ese prefijo antes de pasar al servicio:

```
 navegador                       nginx                              servicio
 /planificaciones/5           →  index.html (React)
 /api/planificaciones/5       →  proxy_pass http://planificacion:3000/   → /planificaciones/5
 /api/planificacion/clases    →  proxy_pass http://planificacion:3000/   → /planificacion/clases
 /api/pago/pagos              →  proxy_pass http://pago:3000/            → /pago/pagos
```

En nginx, `/api/planificaciones/` y `/api/planificacion/` van a Planificación. Con `proxy_pass` terminado en `/` dentro de `location /api/<x>/`, nginx reemplaza el prefijo, así que cada bloque reescribe a `/<x>/`.

Los servicios no cambian sus rutas: siguen escuchando en `/<servicio>/...` (y Planificación además en `/planificaciones/...`). Las llamadas entre servicios van directo a `http://<servicio>:3000` y no pasan por `/api`.

En la web, `pedir()` (`apps/web/src/api/http.ts`) antepone `/api` a toda ruta, así el cliente generado sigue usando las rutas del swagger tal cual. El proxy de Vite pasa a escuchar `/api/<x>` y reescribe igual que nginx.

El swagger de cada servicio publica dos servers: `/api` (por nginx, el que usa el Swagger UI unificado en `/docs/`) y `/` (servicio directo en su puerto de desarrollo).

Alternativas descartadas:

- `/planificacion/planificaciones`: respeta la convención pero repite la palabra, que es justo lo que se quiere evitar.
- Distinguir en nginx por el header `Accept` (HTML va a la app, JSON a la API): depende de lo que mande cada cliente (`curl` manda `*/*`) y es difícil de seguir.
- Cambiar las URLs de las pantallas: rompe links ya compartidos y la API seguiría compartiendo el espacio de nombres con la web.

### 3. `ClienteServicio` con rutas absolutas

`ClienteServicio.url()` hoy arma `${base}/${prefijo}/${ruta}`. Una ruta que empieza con `/` se toma tal cual: `this.planificacion.listar('/planificaciones', …)` → `http://planificacion:3000/planificaciones`. Las rutas relativas siguen como hoy. Así no hace falta un segundo cliente ni un parámetro extra.

### 4. Generador del cliente web

`tools/generar_cliente_web.mjs` filtra con `ruta.startsWith('/<prefijo>/')`. Se agrega `/planificaciones` como prefijo aceptado del servicio Planificación, en una tabla `PREFIJOS_EXTRA = { planificacion: ['/planificaciones'] }`. Las operaciones nuevas quedan en el mismo objeto `planificacion` del cliente.

### 5. Orden de las rutas en el controller

`GET /planificaciones/estados` y `GET /planificaciones/{id}` comparten el primer segmento. El controller de estados se registra antes en el módulo y `{id}` lleva `ParseIntPipe`, así `estados` nunca cae en `get_planificacion`. Una prueba e2e lo cubre.

### 6. Verificador de contratos

`specs/planificacion.json` (congelado) sigue con los nombres viejos. En `tools/verificar_contratos.mjs` se agrega `RENOMBRES`:

- `operaciones`: `operationId` viejo → nuevo, para emparejar cada operación con la del contrato congelado.
- `schemas`: `Propuesta` → `Planificacion`, etc.
- `propiedades`: `id_propuesta` → `id_planificacion`, `descripcion_propuesta` → `descripcion_planificacion`.

Antes de comparar, el verificador aplica los renombres al contrato congelado. Así siguen controlándose verbo, códigos, parámetros y schemas. `get_armado_propuesta` sale de `AGREGADOS` y entra `get_armado_planificacion`. Para las operaciones de `/planificaciones` el verificador controla la ruta, como ya hace con `EXCEPCIONES`.

### 7. Migración

Una migración `RenombrarPropuestaAPlanificacion` con SQL directo, como `ReglasDeNegocio`:

```sql
ALTER TABLE "planificacion_estado_propuesta" RENAME TO "planificacion_estado_planificacion";
ALTER TABLE "planificacion_propuesta" RENAME TO "planificacion_planificacion";
ALTER TABLE "planificacion_planificacion" RENAME COLUMN "id_propuesta" TO "id_planificacion";
ALTER TABLE "planificacion_planificacion" RENAME COLUMN "descripcion_propuesta" TO "descripcion_planificacion";
ALTER TABLE "planificacion_propuesta_clase" RENAME TO "planificacion_planificacion_clase";
ALTER TABLE "planificacion_planificacion_clase" RENAME COLUMN "id_propuesta" TO "id_planificacion";
```

SQLite (3.26 o más nuevo) actualiza solo las claves foráneas que apuntan a una tabla o columna renombrada. El `down` hace lo inverso. Si TypeORM nombra índices o claves con el nombre de la tabla, se renombran en la misma migración. Después se corre la generación de migraciones de TypeORM para confirmar que no quedan diferencias con las entidades.

Se descartó dejar las tablas con el nombre viejo y mapear las entidades con `@Entity('planificacion_propuesta')`, porque el grupo pidió que la base también hable de planificación.

### 8. Documento del grupo y diagrama

El cambio deja `documento-grupo.md` con los reemplazos de la pestaña "Microservicios" (función por función, sección PLANIFICACIÓN y las llamadas desde PAGO y PROFESOR Y SUPLENCIAS) y de "Reglas de negocio" (regla por regla). El grupo lo pega en el documento. El diagrama de clases se cambia a mano: `Propuesta` → `Planificación`, `EstadoPropuesta` → `EstadoPlanificación`, `id_propuesta` → `id_planificacion`, `descripcion_propuesta` → `descripcion_planificacion`.

Mientras el documento no esté actualizado, el README anota los nombres nuevos en "Cambios respecto del documento".

## Risks / Trade-offs

- [Un reemplazo masivo toca "Espacio de propuesta de área"] → Renombrar por identificador y revisar a mano los textos. Al final, `grep -rni propuesta` solo debe encontrar ese texto, los contratos congelados, el historial de `openspec/changes/archive` y la migración.
- [Links o scripts que llaman a `/planificacion/propuestas` o a `/<servicio>/...` desde afuera dejan de andar] → El único cliente es la web del repo. Se anota en el README y en la sección de cambios.
- [nginx con `proxy_pass` y barra final reescribe mal una ruta] → Prueba manual con `curl` de `/api/planificaciones`, `/api/planificacion/clases`, `/api/usuario/login` y recarga de `/planificaciones/5`, con `docker compose up -d --build`.
- [`/planificaciones/estados` cae en `get_planificacion`] → Orden de registro, `ParseIntPipe` y una prueba e2e.
- [La base de un despliegue ya en uso pierde datos] → La migración solo renombra. Se prueba sobre una copia de `sahs.sqlite` con datos de los seeds y se controla que la cantidad de filas no cambie.
- [El documento queda desfasado del swagger mientras el grupo no lo actualiza] → README y `documento-grupo.md` con el texto listo.

## Migration Plan

1. Implementar todo en una rama y correr `npm test`, `npm run verificar-contratos` y `node tools/generar_cliente_web.mjs`.
2. `docker compose up -d --build`: `db-init` corre la migración al arrancar.
3. Rollback: volver a la imagen anterior y correr el `down` de la migración (`migration:revert`) antes de levantar los servicios viejos.

## Open Questions

Ninguna. Las decisiones de alcance (base incluida, documento y diagrama a mano, `/api`) ya están tomadas.
