# SAHS · Sistema de Administración de Horarios

Monorepo de SAHS: los 6 microservicios en NestJS, la base de datos SQLite creada por código con TypeORM y la app web en React, todo levantado con Docker Compose.

> Los links al diseño, al documento del grupo y al diagrama de clases están en [`docs/referencias.md`](docs/referencias.md). Es el único lugar donde se mantienen. Las instrucciones para agentes de IA están en [`AGENTS.md`](AGENTS.md).

| Servicio | App | Prefijo | Puerto de desarrollo |
|---|---|---|---|
| Usuario | `apps/usuario` | `/usuario` | 8081 |
| Pago | `apps/pago` | `/pago` | 8082 |
| Horarios | `apps/horarios` | `/horarios` | 8083 |
| Planificación | `apps/planificacion` | `/planificacion` | 8084 |
| Orientación | `apps/orientacion` | `/orientacion` | 8085 |
| Profesor y Suplencias | `apps/profesor-suplencias` | `/profesor_suplencias` | 8086 |

## Aplicación

```bash
docker compose -f docker-compose.app.yml up -d --build   # construye y levanta todo
docker compose -f docker-compose.app.yml down            # baja todo; los datos quedan en el volumen
docker compose -f docker-compose.app.yml down -v         # baja todo y borra la base (al volver a levantar se crea de cero)
```

- **Web:** http://localhost:8100
- **Swagger UI:** http://localhost:8180 (elegir el servicio en "Select a definition"; "Try it out" responde de verdad)
- **Usuarios de ejemplo:** `secretaria` (Administrativo), `jramirez` (Profesor) y `sferreyra` (Coordinador de área), entre otros. La contraseña de todos es **`sahs2026`**.

Qué levanta el compose:

| Contenedor | Qué hace |
|---|---|
| `db-init` | Aplica las migraciones y carga los datos de ejemplo en las tablas vacías. Termina y recién entonces arrancan los servicios. |
| `usuario`, `pago`, `horarios`, `planificacion`, `orientacion`, `profesor-suplencias` | Los microservicios, en el puerto 3000 de la red interna. No se publican en el host. |
| `web` | nginx con el build de React. Redirige `/usuario/`, `/pago/`, etc. a cada servicio, y publica el swagger de cada uno en `/docs/<servicio>-json`. |
| `swagger` | Swagger UI con los 6 servicios. |

La base es un solo archivo, `/data/sahs.sqlite`, en el volumen **`sahs-data`**. Cada tabla tiene un servicio dueño (el prefijo de la tabla: `usuario_`, `pago_`, ...), que es el único que escribe en ella. Las referencias a datos de otro servicio se guardan como ids sin clave foránea, y esos datos se piden por HTTP.

Los dos compose pueden estar levantados a la vez: el original (`docker-compose.yml`) usa los puertos 8080 y 8090.

### Desarrollo local

Requiere Node 22.

```bash
npm ci
npm run build                 # compila las librerías, los servicios y la web
npm run db:init               # crea data/sahs.sqlite con los datos de ejemplo
npm run dev:usuario           # y así cada servicio (en su puerto 808x)
npm run dev:web               # http://localhost:5173, con proxy a los servicios
npm test                      # pruebas e2e: levanta los 6 servicios sobre una base temporal
npm run verificar-contratos   # compara el swagger de cada servicio con specs/*.json
```

## Estructura del monorepo

```
apps/
  usuario/ pago/ horarios/ planificacion/ orientacion/ profesor-suplencias/   microservicios NestJS
  db/                    data source de TypeORM, migraciones y seeds (contenedor db-init)
  web/                   React + Vite; nginx.conf y Dockerfile de producción
  Dockerfile.servicio    imagen de cada servicio y de db-init
libs/
  contratos/             interfaces TypeScript de la API (las usan los servicios y la web)
  comun/                 errores, health, swagger, conexión a la base y cliente HTTP entre servicios
  entidades/             entidades TypeORM, una carpeta por servicio dueño
tests/e2e/               pruebas de los servicios
tools/                   scripts (ver "Mantenimiento")
specs/                   contratos OpenAPI originales (congelados)
prototipo/               prototipo HTML (referencia visual de la web)
```

Cada servicio tiene un controller y un service por tag del swagger, `dto/modelos.ts` (respuestas), `dto/entradas.ts` (bodies y queries con validación) y `armado.ts` (arma las respuestas con sus anidados). Cada app tiene su `README.md`.

## Swagger y fuente de verdad

**El swagger que publica cada servicio NestJS es la fuente de verdad de la API.** Cada servicio lo expone en `/docs` (UI) y `/docs-json`; en Docker se ven todos juntos en http://localhost:8180.

Los contratos originales (`specs/*.json`) y su generador (`tools/generar_specs.py`) quedan congelados como historial del corte inicial: el código de los servicios se generó una vez a partir de ellos (`tools/generar_scaffold.mjs`) y `npm run verificar-contratos` confirma que el swagger de los servicios no se apartó de ellos, salvo los agregados documentados abajo. Un cambio en la API se hace en el código del servicio, no en `specs/`.

### Llamadas entre servicios

Un servicio pide los datos de otro solo por HTTP (`URL_<SERVICIO>`, timeout de 5 s). Los anidados que vienen de otro servicio se piden con un listado por request. Si otro servicio no responde, la respuesta es `503`.

Las llamadas entre servicios son **planas**: llevan el header `x-sahs-anidados: no` y la respuesta no arma los anidados que vienen de terceros (las listas devuelven solo los ids). Así se evitan los ciclos que hay entre Planificación, Orientación y Profesor y Suplencias (por ejemplo, clase → suplencia → clase).

### Errores

Todas las respuestas de error tienen el cuerpo `Error { codigo, mensaje }`, con el mensaje en español:

| Código HTTP | `codigo` | Cuándo |
|---|---|---|
| 400 | `VALIDACION` | Body, query o id inválidos |
| 400 | `REFERENCIA_INEXISTENTE` | Un id de otra entidad que no existe |
| 404 | `NO_ENCONTRADO` | La entidad de la ruta no existe |
| 409 | `CONFLICTO` | Una regla de negocio (choque de horarios, transición de estado inválida, recibo ya firmado...) |
| 503 | `SERVICIO_NO_DISPONIBLE` | Otro servicio no responde |

## Prototipo

El prototipo HTML quedó como **referencia visual** de la app web (`apps/web` reproduce sus pantallas con datos reales). Se levanta con el compose original:

```bash
docker compose up -d      # Swagger UI de los contratos originales (:8080) y el prototipo (:8090)
docker compose down
```

La carpeta `prototipo/` tiene el prototipo navegable de SAHS, servido con nginx en **http://localhost:8090**. Es una sola aplicación, en un solo archivo (`index.html`) y con una sola URL. No hay backend: los datos son de ejemplo y no se guardan.

- **Entrar:** la URL abre el Login (L1). Sirve cualquier usuario de ejemplo (por nombre o por email) con cualquier contraseña que no esté vacía. La lista de la derecha completa el usuario con un toque: `secretaria` es Administrativo, `jramirez` es Profesor y `sferreyra` es Coordinador de área.
- **Cambiar de rol:** se toca "Cerrar sesión" en la cabecera y se entra con otro usuario, en la misma URL. La sesión es de cada pestaña y se mantiene al recargar, así que se pueden tener dos roles abiertos en dos pestañas.
- **Menú:** el inicio (A1) es el mismo para todos los roles. Muestra una tarjeta por cada privilegio del rol del usuario que entró: `login` → `usuario.rol.id_rol` → `get_rol_privilegios`. No hay grupos, y el título de cada tarjeta es `descripcion_privilegio`. El front decide qué pantalla abre cada tarjeta según el `id_privilegio` (`CONFIG.privilegios`). Las que todavía no tienen pantalla ("Recibos de sueldo" y "Áreas") figuran como "Pendiente". Los privilegios se asignan y se quitan en Usuarios → Roles (A17), y el cambio se ve en el menú sin recargar.
- **Cabecera:** es una sola, la del diseño. Muestra el usuario que entró y su rol, el candado de "Cambiar mi contraseña" (A18, la misma pantalla para todos, con `cambiar_contrasenia` y el id del usuario que entró) y "Cerrar sesión". El logo SAHS lleva al inicio.
- **Acceso:** cada pantalla pertenece a un privilegio. Si se pide por URL (`#A17`) una pantalla que el rol no tiene, se vuelve al inicio.
- **Pantallas:** L1 (Login), A1 a A18 y P2 a P4. El código de cada una es el del canvas del diseño.

`index.html` se genera desde las pantallas del diseño (`*.dc.html`) con `tools/exportar_prototipo.py`. No se edita a mano, salvo el armazón (ver abajo).

```bash
python3 tools/exportar_prototipo.py ..           # .. = sahs-prototipo/, con los .dc.html
python3 tools/exportar_prototipo.py .. --check   # solo avisa si index.html quedó desactualizado
```

El script reemplaza tres partes del HTML: los estilos, un `<template>` por pantalla y la lógica de cada pantalla (el script del `.dc.html` envuelto en `DC.registrar`). No toca lo que está hecho a mano:

- el armazón, que es solo el contenedor que escala la pantalla y la navegación (sesión, privilegios y hash);
- el runtime que reemplaza a `support.js`;
- `CONFIG`, que define las pantallas, el privilegio de cada una, qué pantalla abre cada tarjeta y los atajos entre pantallas.

Para sumar una pantalla, se agrega a `CONFIG.pantallas` con el id del `.dc.html` en minúsculas y su privilegio. Como la carpeta está montada, alcanza con recargar la página: no hace falta reiniciar el contenedor.

- Las fuentes de diseño (`*.dc.html`, `planilla-horarios-sahs.html`, `canvas.json` y los diagramas) **no** forman parte de este repo. Los `*.dc.html` sueltos no funcionan solos, porque dependen de un runtime (`support.js`) que no viaja con ellos.
- Si el puerto 8090 está ocupado, se cambia en `docker-compose.yml` (`"8090:80"`).

## Convenciones

- **Una ruta por función** del documento: `/<prefijo>/<nombre_funcion>`. El `operationId` es el mismo nombre.
- **Verbos HTTP** según lo que hace cada función:

  | Función | Verbo | Respuesta |
  |---|---|---|
  | `crear_*` | `POST` | `201` |
  | `get_*` y acciones sin efectos (`bajar_recibo_sueldo`, `calcular_monto_a_liquidar`) | `GET` | `200` |
  | `cambiar_*` / `modificar_*` | `PATCH` | `200` |
  | `asignar_*` que reemplaza un valor o una lista (`asignar_rol`, `asignar_disponibilidad`) | `PUT` | `200` |
  | `editar_*`, que reemplaza todos los datos editables (`editar_profesor`, `editar_usuario`) | `PUT` | `200` |
  | `asignar_*` que agrega a una colección (`asignar_privilegio`, `asignar_franja_a_turno`) | `POST` | `200` |
  | `eliminar_*` | `DELETE` | `204` |
  | `quitar_*`, `eliminar_franja_horaria_turno` | `DELETE` | `200` + entidad modificada |
  | Acciones de negocio (`login`, `validar_pago`, `firmar_recibo_de_sueldo`) | `POST` | `200` |

  Las rutas mantienen el nombre de la función, así que el verbo y el nombre se repiten (`DELETE /usuario/eliminar_usuario/{id}`). Lo eligió el grupo para mantener el mapeo 1 a 1 con el documento.
- **Nombres:** tal cual el documento, en snake_case y sin tildes (`ñ` → `ni`). Por ejemplo, `get_día_lectivo` → `get_dia_lectivo` y `crear_año_academico` → `crear_anio_academico`.
- **Ids:** el id de la entidad principal va en la ruta (`/{id}`) y el resto de los datos en el body JSON. En los `asignar_X_a_Y`, el id de la ruta es el de la entidad del propio servicio y el otro id va en el body. Por ejemplo, `POST /horarios/asignar_franja_a_turno/{id_turno}` con body `{ "id_franja_horaria": 7 }`.
  - **Excepción:** `DELETE` y `GET` no llevan body. Por eso los `quitar_*` y `eliminar_franja_horaria_turno` llevan el segundo id en la ruta (`DELETE /orientacion/quitar_materia_area/{id}/{id_materia}`) y `calcular_monto_a_liquidar` recibe el período como query (`?periodo=2026-03`).
- **Datos anidados:** si una relación tiene un solo elemento (la materia de una clase, el rol de un usuario), el dato viene **anidado** en la entidad y no tiene query propia. Las relaciones con varios elementos tienen su query de listado (`get_curso_clases`, `get_rol_privilegios`…).
- **Filtros:** algunos listados aceptan filtros opcionales por query, con el nombre del campo que filtran. Se combinan con AND y, si no se pasa ninguno, el listado devuelve todo. Por ejemplo, `GET /planificacion/get_clases?id_profesor=12&id_propuesta=5` devuelve la grilla de un profesor.

  | Listado | Filtros |
  |---|---|
  | `get_clases` | `id_profesor`, `id_curso`, `id_propuesta` |
  | `get_propuestas` | `id_ciclo_lectivo`, `id_estado` |
  | `get_cursos` | `id_ciclo_lectivo` |
  | `get_profesores` | `id_usuario` |
  | `get_suplencias` | `fecha_desde`, `fecha_hasta`, `id_profesor`, `id_curso`, `id_clase` |
  | `get_pagos`, `get_recibos_de_sueldo` | `id_profesor`, `periodo` |
- **Errores:** hay `400` con el schema `Error` cuando la operación tiene body o parámetros de query (también los filtros), y `404` cuando tiene `{id}`.
- **Health check:** cada servicio expone `GET /actuator/health`.
- **Dependencias:** cada contrato las declara en `info.x-dependencias` y se ven en la descripción del servicio. Cada operación que consume a otro servicio lo indica con "Invoca: servicio.endpoint".
- **Seguridad:** no hay por ahora. `POST /usuario/login` devuelve el token como texto simple.
- **Contraseñas:** son `writeOnly`, así que nunca aparecen en las respuestas.

## Cambios respecto del documento

- **USUARIO:**
  - `asignar_roles` pasa a `asignar_rol`, porque cada usuario tiene un solo rol.
  - `eliminar_rol`, que aparecía dos veces, queda una sola vez.
  - Se agregan `login`, `get_usuarios`, `get_roles` y `get_privilegios`.
  - Los privilegios se cargan por configuración, así que se sacan `crear_privilegio`, `modificar_privilegio`, `eliminar_privilegio` y `get_privilegio`.
  - Se sacan `cambiar_email`, `cambiar_nombre`, `get_rol` y `get_usuario_privilegios`. Los privilegios de un usuario se obtienen con su rol anidado y `get_rol_privilegios`.
  - Se agrega `editar_usuario` (`PUT /usuario/editar_usuario/{id}`), que reemplaza el nombre de usuario y el email. No cambia la contraseña ni el rol. Lo usa la ficha del profesor para editar su usuario.
  - Se agrega `quitar_privilegio` (`DELETE /usuario/quitar_privilegio/{id}/{id_privilegio}`), el espejo de `asignar_privilegio`.
- **Duplicados:**
  - Queda `asignar_estado_a_propuesta` en PLANIFICACIÓN.
  - Se saca `asignar_suplencias_a_clase` de PLANIFICACIÓN: las clases de una suplencia se cargan en `crear_suplencia` (PROFESOR Y SUPLENCIAS).
- **PROFESOR Y SUPLENCIAS** (pedido del grupo del 22/10/2026):
  - Se eliminan `asignar_profesor_suplencia`, `asignar_suplencia_a_clase`, `cambiar_correo`, `cambiar_direccion`, `asignar_legajo`, `asignar_cargo`, `cambiar_cargo`, `eliminar_cargo`, `asignar_materias_area`, `get_suplencia` y `asignar_rol_profesor`. La tabla del documento todavía lista `asignar_cargo`, `cambiar_cargo` y `eliminar_cargo`, pero el grupo decidió sacarlos: el cargo se edita con `editar_profesor`.
  - `crear_suplencia` recibe `id_profesor` (suplente) e `ids_clases[]`: la suplencia se crea completa y la referencia a las clases la guarda la suplencia.
  - `crear_profesor` ya no crea el usuario. `Profesor.id_usuario` es opcional y el usuario se vincula después con `asignar_usuario_profesor` (`PUT`, body `{ id_usuario }`), que reemplaza a `asignar_rol_profesor`.
  - Se agrega `editar_profesor` (`PUT`), que reemplaza todos los datos del profesor, incluidos legajo y cargo.
  - `get_suplencias` suma el filtro `id_clase`. PLANIFICACIÓN lo usa en `get_clase` para anidar la suplencia vigente, en lugar de `get_suplencia`.
- **Agregados:**
  - `eliminar_materia` y los listados que faltaban: `get_materias`, `get_orientaciones`, `get_areas`, `get_profesores`, `get_suplencias`, `get_turnos`, `get_dias_lectivos` y `get_franjas_horarias`.
  - La disponibilidad del profesor: `asignar_disponibilidad` y `get_disponibilidad_profesor`.
  - Los recreos se marcan con `es_recreo` en la franja horaria.
- **Alineación con el prototipo:**
  - ORIENTACIÓN: cada materia tiene **una sola orientación** (`Materia.id_orientacion`, obligatoria). Dos materias con el mismo nombre en distintas orientaciones son materias distintas. `asignar_materia_orientacion` pasa a `PUT /orientacion/asignar_materia_orientacion/{id_materia}` y se elimina `quitar_materia_orientacion`.
  - PLANIFICACIÓN: la orientación del curso es obligatoria, también en el ciclo básico, que tiene su propia orientación (por ejemplo "Básica"). `crear_curso` la recibe en el body.
  - PLANIFICACIÓN: cada curso define qué materias dicta y cuántas horas tiene cada una (`MateriaCurso`). Se agregan `asignar_materia_a_curso`, `cambiar_horas_materia_curso` y `quitar_materia_curso`.
  - PLANIFICACIÓN: el catálogo de estados de propuesta arranca con Borrador, En revisión, Validada y Cerrada. La propuesta nace en Borrador y se valida completa, no curso por curso.
  - PAGO: cada pago tiene un único recibo, anidado en `Pago.recibo_sueldo`, así que se elimina `get_pago_recibos_de_sueldo`. El recibo trae `conceptos` (haberes y descuentos), `total_bruto`, `total_descuentos`, `neto` y `emisor`. `monto` pasa a `neto` y `fecha` a `fecha_pago`. La firma del profesor no se puede revertir.
  - Filtros opcionales en los listados (ver "Convenciones").
- **Queries que pasan a datos anidados:**
  - PLANIFICACIÓN: `get_materia_clase`, `get_franja_horaria_clase`, `get_profesores_clase`, `get_turno_curso`, `get_franja_horarios_curso`, `get_orientacion_curso`, `get_curso_materias` y `get_suplencia_clase`. Además, `get_clases_curso` se unifica en `get_curso_clases`.
  - USUARIO: `get_usuario_roles`.
  - ORIENTACIÓN: `get_area_materia` y `get_orientacion_materia`.
  - HORARIOS: `get_nombre_dia_lectivo` y `get_cantidad_franjas_total`.
  - PROFESOR Y SUPLENCIAS: `get_profesor_suplencia` y `get_clase_suplencia`.
- **Dependencias agregadas:**
  - PAGO → `profesor_suplencias.get_profesor`.
  - PROFESOR → `usuario.get_usuario` (para `asignar_usuario_profesor`).
  - PROFESOR → `horarios.get_franja_horaria`.
  - PLANIFICACIÓN → `profesor_suplencias.get_disponibilidad_profesor`.

- **Implementación (monorepo NestJS):**
  - PLANIFICACIÓN: se agregan `editar_clase` (`PUT /planificacion/editar_clase/{id}`, reemplaza franjas y docentes) y `eliminar_clase` (`DELETE /planificacion/eliminar_clase/{id}`). Solo funcionan si todas las propuestas que incluyen la clase están en Borrador. Sin ellas no se podía mover ni quitar una hora en el armado (A13).
  - PLANIFICACIÓN: `crear_clase` controla que el curso dicte la materia, que las franjas sean del turno del curso y no sean recreos, y que los docentes estén habilitados y disponibles. Los choques (dos clases del curso en la misma franja, un docente en dos clases a la vez) se controlan en `asignar_clase_a_propuesta`, porque `crear_clase` no sabe a qué propuesta va la clase. Una propuesta solo recibe clases en Borrador.
  - PLANIFICACIÓN: transiciones de estado de la propuesta: Borrador → En revisión → Validada → Cerrada, y En revisión → Borrador. Cualquier otra responde `409`. Al validar una propuesta, la que estaba validada en el mismo ciclo pasa a Cerrada. No se puede enviar a revisión una propuesta sin clases.
  - ORIENTACIÓN es el dueño de la orientación de cada curso (`Orientacion.ids_cursos`): `crear_curso` la registra llamando a `orientacion.asignar_curso_a_orientacion`, y `Curso.id_orientacion` se lee de ahí. Así se puede cambiar después desde Orientación, como dice el contrato. Del mismo modo, `crear_clase` registra la clase en `Materia.ids_clases` (`asignar_clase_a_materia`, que responde `409` si la clase es de otra materia).
  - USUARIO: `login` acepta en `email` también el nombre de usuario (sin distinguir mayúsculas), como el prototipo. Las contraseñas se guardan con bcrypt y tienen al menos 6 caracteres. El token es un JWT con el id del usuario; la API todavía no lo valida.
  - PAGO: `firmar_recibo_de_sueldo` responde `409` si el recibo ya estaba firmado, si el pago todavía no está validado o si quien firma no es el usuario del profesor del recibo. La fórmula de la liquidación está en "A revisar".
  - PROFESOR Y SUPLENCIAS: `crear_suplencia` responde `409` si el suplente ya es docente de la clase o si la clase ya tiene una suplencia que se superpone.
  - Respuestas `409` (conflicto con una regla de negocio) y `503` (otro servicio no responde) en todas las operaciones.
  - Dependencias: para no hacer una llamada por elemento, los listados con anidados usan los listados de los otros servicios (`get_materias`, `get_franjas_horarias`, `get_profesores`, `get_turnos`, `get_orientaciones`, `get_clases`). La lista real de cada servicio está en su swagger (`x-dependencias`).
  - Las listas anidadas `clases`, `profesores`, `franjas_horarias`, `suplencia` de las clases: los listados (`get_clases`, `get_curso_clases`) no anidan la suplencia vigente; solo `get_clase`.

## A revisar por el grupo

1. **Recibos:** el documento no tiene un command para crear recibos. Se tomó como criterio que `crear_pago` genera el único recibo del pago, con sus conceptos y el neto que da `calcular_monto_a_liquidar`. Falta definir si el emisor es un dato fijo de la institución.
2. **Clases:** no hay commands para asignar a una clase su materia, sus franjas o sus profesores. Van en el body de `crear_clase`, que consulta la disponibilidad del profesor. Para poder corregirlas se agregaron `editar_clase` y `eliminar_clase` (ver "Cambios respecto del documento").
3. **`get_estado_actual_de_propuesta`:** se mantuvo, aunque el estado también viene anidado en la propuesta.
4. **Dependencias cíclicas:** PLANIFICACIÓN ⇄ ORIENTACIÓN ⇄ PROFESOR Y SUPLENCIAS se consumen entre sí. Conviene revisarlo en el diseño de los microservicios. En la implementación se resolvió con llamadas planas entre servicios (ver "Llamadas entre servicios").
5. **Commands que son `GET`:** `bajar_recibo_sueldo` y `calcular_monto_a_liquidar` figuran como commands en el documento, pero en el swagger son `GET` porque no modifican nada. Conviene moverlos a queries en el documento.
6. **Relación Clase–Suplencia en el diagrama de clases:** hoy la flecha va de Clase a Suplencia. En el swagger la referencia la guarda Suplencia (`ids_clases`): una clase validada no se edita, una clase tiene muchas suplencias en el año y así Suplencias no escribe en Planificación. Hay que invertir la flecha en draw.io.
7. **`eliminar_suplencia`:** sin los `asignar_*`, una suplencia no se puede corregir después de creada. La sección "7. Suplencias" del documento tiene `DELETE /suplencias/{id}`, pero PROFESOR Y SUPLENCIAS no. Falta definir si se agrega.
8. **Liquidación de sueldo:** el documento no tiene la fórmula. Se tomó la del recibo de ejemplo del prototipo (P4): horas cátedra semanales de cada materia en la propuesta vigente × valor de la hora del período, más 10 % de antigüedad y, en junio y diciembre, el sueldo anual complementario (50 % de horas + antigüedad). Descuentos: 11 % de jubilación, 3 % de obra social y 2 % sindical. Los valores (valor de la hora por período, porcentajes, día de pago y datos del emisor) son configuración del servicio Pago (tablas `pago_parametro` y `pago_valor_hora`). Las horas de las suplencias todavía no se suman.
9. **Orientación de los cursos:** está guardada en Orientación (ver "Cambios respecto del documento"). Conviene confirmar en el diagrama de clases de quién es el dato.
10. **Datos que el prototipo muestra y la API no guarda:** código y horarios de definición de un turno (inicio, fin, duración de la hora), fechas de inicio y fin de un ciclo lectivo, años asociados a una orientación, fecha de ingreso del profesor. La web los deriva o los omite.

## Mantenimiento

Desde el corte, **la API se cambia en el código de cada servicio** (controllers y DTOs en `apps/<servicio>/src`). El swagger se actualiza solo.

- **Entidades y base:** las entidades están en `libs/entidades/src/<servicio>/`. Después de cambiar una, se genera una migración nueva y se versiona:

  ```bash
  npm run build:libs && npm run build -w apps/db
  DB_PATH=/tmp/vacia.sqlite npm run db:init                  # base con el esquema actual
  DB_PATH=/tmp/vacia.sqlite npm run migration:generate -w apps/db -- src/migraciones/<Nombre>
  ```

  `db-init` aplica las migraciones pendientes en el siguiente `up`. Los datos de ejemplo están en `apps/db/src/seeds/`.
- **Cliente de la web:** `apps/web/src/api/*.ts` se genera a partir del swagger de los servicios (levantados en sus puertos de desarrollo): `node tools/generar_cliente_web.mjs`.
- **Pruebas:** `npm test` (e2e de los servicios) y `npm run verificar-contratos` (diferencias con los contratos originales; las operaciones agregadas a propósito están en la lista `AGREGADOS` del script).
- **Historial:** `tools/generar_specs.py` generó los contratos originales de `specs/` y `tools/generar_scaffold.mjs` generó el código inicial de los servicios a partir de ellos. Los dos quedan congelados; el segundo no corre si las apps ya existen, para no pisar el código.

Para validar los contratos originales con redocly (usa la configuración de `redocly.yaml`):

```bash
docker run --rm -v "$PWD:/work:ro" -w /work redocly/cli:1.25.11 lint specs/*.json
```
