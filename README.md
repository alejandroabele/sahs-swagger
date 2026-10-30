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

Todo se levanta con un solo compose (`docker-compose.yml`). En la máquina, la app responde en el puerto 8100; desde afuera se entra por HTTPS (ver "HTTPS"):

```bash
docker compose up -d --build   # construye y levanta todo
docker compose down            # baja todo; los datos quedan en el volumen
docker compose down -v         # baja todo y borra la base (al volver a levantar se crea de cero)
```

- **Web:** http://localhost:8100
- **Swagger UI:** http://localhost:8100/docs/ (elegir el servicio en "Select a definition"; "Try it out" responde de verdad)
- **Prototipo:** http://localhost:8100/prototipo/ (referencia visual, ver "Prototipo")
- **Usuarios de ejemplo:** `secretaria` (Administrativo), `jramirez` (Profesor) y `sferreyra` (Coordinador de área), entre otros. La contraseña de todos es **`sahs2026`**.

Rutas de la web (las mismas que usa el prototipo, en el hash):

| Pantalla | Ruta |
|---|---|
| Login | `/login` |
| Inicio | `/` |
| Materias y su ficha | `/materias`, `/materias/:id` |
| Profesores, alta y ficha | `/profesores`, `/profesores/nuevo`, `/profesores/:id` |
| Relevamiento de disponibilidad | `/disponibilidad`, `/disponibilidad/:idProfesor` |
| Cursos, alta y edición | `/cursos`, `/cursos/nuevo`, `/cursos/:id` |
| Planificaciones, armado y generación | `/planificaciones`, `/planificaciones/:id`, `/planificaciones/:id/cursos/:idCurso`, `/planificaciones/:id/generacion[/:idCurso]` |
| Suplencias, orientaciones, ciclos lectivos y turnos | `/suplencias`, `/orientaciones`, `/ciclos-lectivos`, `/turnos` |
| Usuarios y roles | `/usuarios`, `/roles` |
| Cambiar mi contraseña | `/mi-cuenta/contrasenia` |
| Profesor: mi horario, mi disponibilidad y mis recibos | `/mi-horario`, `/mi-disponibilidad`, `/mis-recibos` |

Cada pantalla consulta el servicio dueño de lo que muestra. A otro servicio lo consulta solo para mostrar el nombre de un id, para llenar un selector que una acción necesita o cuando cruzar datos es su función (generación, suplencias, armado y mi horario). No hay totales ni avances calculados en el front cruzando servicios: si hace falta uno, se agrega como query del servicio dueño.

Qué levanta el compose:

| Contenedor | Qué hace |
|---|---|
| `db-init` | Aplica las migraciones y carga los datos de ejemplo en las tablas vacías. Termina y recién entonces arrancan los servicios. |
| `usuario`, `pago`, `horarios`, `planificacion`, `orientacion`, `profesor-suplencias` | Los microservicios, en el puerto 3000 de la red interna. No se publican en el host. |
| `web` | nginx, publicado solo en `127.0.0.1:8100`. Sirve el build de React, redirige `/usuario/`, `/pago/`, etc. a cada servicio, publica el OpenAPI de cada uno en `/docs/<servicio>-json`, el Swagger UI con los 6 servicios en `/docs/` y el prototipo en `/prototipo/`. |
| `caddy` | HTTPS delante de `web`, en los puertos 80 y 443: saca y renueva el certificado y redirige `http://` a `https://`. |

La base es un solo archivo, `/data/sahs.sqlite`, en el volumen **`sahs-data`**. Cada tabla tiene un servicio dueño (el prefijo de la tabla: `usuario_`, `pago_`, ...), que es el único que escribe en ella. Las referencias a datos de otro servicio se guardan como ids sin clave foránea, y esos datos se piden por HTTP.

Antes había dos compose (`docker-compose.app.yml` para la app y `docker-compose.yml` para el prototipo en `:8090`) y un Swagger UI propio en `:8180`. Si quedaron contenedores de antes, se borran una vez con `docker rm -f sahs-app-swagger sahs-prototipo`. El resto de los contenedores y el volumen `sahs-data` se reutilizan con el compose nuevo.

### HTTPS

El contenedor `caddy` sirve la app por HTTPS en el dominio de la variable `SAHS_DOMINIO`. Saca y renueva solo el certificado (Let's Encrypt y, si falla, ZeroSSL) y lo guarda en el volumen `sahs-caddy-data`, así no pide uno nuevo en cada deploy. El puerto 8100 queda solo para la propia máquina (`127.0.0.1`): desde afuera no se entra por HTTP plano.

- **En el servidor:** `SAHS_DOMINIO` va en el `.env` junto al compose (hay un ejemplo en `.env.example`). En la VPS es `vps-6558769-x.dattaweb.com`, y la app queda en https://vps-6558769-x.dattaweb.com. Los puertos 80 y 443 tienen que estar abiertos (Let's Encrypt valida por el 80) y el dominio tiene que apuntar a la IP del servidor.
- **En local:** sin `SAHS_DOMINIO`, Caddy usa `localhost` con su CA interna: https://localhost (el navegador puede pedir aceptar el certificado; con curl, `-k`).
- **Si no sale el certificado:** `docker compose logs caddy` muestra el error de validación (puertos cerrados en el firewall del proveedor, DNS, o el límite de emisión de Let's Encrypt).

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

**El swagger que publica cada servicio NestJS es la fuente de verdad de la API.** Cada servicio publica siempre su OpenAPI en `/docs-json`. En Docker se ven todos juntos en un único Swagger UI, http://localhost:8100/docs/, que lo sirve el nginx de la web en el mismo origen que la API. La UI propia de cada servicio (`/docs`) solo está en desarrollo (`npm run dev:<servicio>`, por ejemplo http://localhost:8082/docs); en producción (`NODE_ENV=production`) está apagada.

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

El prototipo HTML quedó como **referencia visual** de la app web (`apps/web` reproduce sus pantallas con datos reales). Se levanta con el resto de la aplicación (`docker compose up -d --build`).

La carpeta `prototipo/` tiene el prototipo navegable de SAHS, servido por el nginx de la web en **http://localhost:8100/prototipo/**. La imagen de `web` lleva una copia, y el compose monta la carpeta encima, así que los cambios se ven al recargar. Es una sola aplicación, en un solo archivo (`index.html`) y con una sola URL. No hay backend: los datos son de ejemplo y no se guardan.

- **Entrar:** la URL abre el Login. Sirve cualquier usuario de los datos del prototipo (por nombre o por email) con cualquier contraseña que no esté vacía: `secretaria` es Administrativo, `jramirez` es Profesor y `sferreyra` es Coordinador de área.
- **Cambiar de rol:** se toca "Cerrar sesión" en la cabecera y se entra con otro usuario, en la misma URL. La sesión es de cada pestaña y se mantiene al recargar, así que se pueden tener dos roles abiertos en dos pestañas.
- **Menú:** el inicio (A1) es el mismo para todos los roles. Muestra una tarjeta por cada privilegio del rol del usuario que entró: `login` → `usuario.rol.id_rol` → `get_rol_privilegios`. No hay grupos, y el título de cada tarjeta es `descripcion_privilegio`. El front decide qué pantalla abre cada tarjeta según el `id_privilegio` (`CONFIG.privilegios`). Los privilegios que todavía no tienen pantalla ("Recibos de sueldo" y "Áreas") no se muestran. Los privilegios se asignan y se quitan en Usuarios → Roles, y el cambio se ve en el menú sin recargar.
- **Cabecera:** es una sola, la del diseño. Muestra el usuario que entró y su rol, el candado de "Cambiar mi contraseña" (la misma pantalla para todos, con `cambiar_contrasenia` y el id del usuario que entró) y "Cerrar sesión". El logo SAHS lleva al inicio.
- **Direcciones:** son las mismas rutas que la web, en el hash (`#/materias`, `#/profesores/3`). En las fichas, el id es la posición de la fila en los datos del prototipo.
- **Acceso:** cada pantalla pertenece a un privilegio. Si se pide por URL (`#/usuarios`) una pantalla que el rol no tiene, o una ruta que no existe, se vuelve al inicio.
- **Pantallas:** L1 (Login), A1 a A18 y P2 a P4. El código de cada una es el del canvas del diseño y es interno: no aparece en las URLs.

`index.html` se genera desde las pantallas del diseño (`*.dc.html`) con `tools/exportar_prototipo.py`. No se edita a mano, salvo el armazón (ver abajo).

```bash
python3 tools/exportar_prototipo.py ..           # .. = sahs-prototipo/, con los .dc.html
python3 tools/exportar_prototipo.py .. --check   # solo avisa si index.html quedó desactualizado
```

El script reemplaza tres partes del HTML: los estilos, un `<template>` por pantalla y la lógica de cada pantalla (el script del `.dc.html` envuelto en `DC.registrar`). No toca lo que está hecho a mano:

- el armazón, que es solo el contenedor que escala la pantalla y la navegación (sesión, privilegios y rutas en el hash);
- el runtime que reemplaza a `support.js`;
- `CONFIG`, que define las pantallas, el privilegio y las rutas de cada una, qué pantalla abre cada tarjeta y los atajos entre pantallas.

Para sumar una pantalla, se agrega a `CONFIG.pantallas` con el id del `.dc.html` en minúsculas, su privilegio y sus rutas. Como la carpeta está montada, alcanza con recargar la página: no hace falta reconstruir ni reiniciar el contenedor.

- Las fuentes de diseño (`*.dc.html`, `planilla-horarios-sahs.html`, `canvas.json` y los diagramas) **no** forman parte de este repo. Los `*.dc.html` sueltos no funcionan solos, porque dependen de un runtime (`support.js`) que no viaja con ellos.
- Si el puerto 8100 está ocupado, se cambia en `docker-compose.yml` (`"8100:80"` del servicio `web`).

## Convenciones

- **Rutas REST:** cada función del documento es una operación sobre un recurso: `/<prefijo>/<recurso>[/{id}[/<subrecurso>[/{id_secundario}]]]`. El prefijo es el nombre del servicio y todos los segmentos van en kebab-case: `/planificacion/ciclos-lectivos`, `/profesor-suplencias/profesores/{id}/materias-habilitadas`. El `operationId` es el nombre de la función del documento (`get_materias`), así que el mapeo con el documento se mantiene por `operationId` y no por la ruta. La tabla completa está en "Cambios respecto del documento".
- **Verbos HTTP** según lo que hace cada función:

  | Función | Verbo | Ejemplo | Respuesta |
  |---|---|---|---|
  | `get_*` y acciones sin efectos | `GET` | `GET /orientacion/materias`, `GET /pago/recibos-de-sueldo/{id}/pdf` | `200` |
  | `crear_*` | `POST` | `POST /usuario/usuarios` | `201` |
  | `asignar_*` que agrega a una colección | `POST` | `POST /usuario/roles/{id}/privilegios` | `200` |
  | `asignar_*` que reemplaza un valor o una lista, y `editar_*` | `PUT` | `PUT /usuario/usuarios/{id}/rol`, `PUT /profesor-suplencias/profesores/{id}` | `200` |
  | `cambiar_*` / `modificar_*` | `PATCH` | `PATCH /usuario/usuarios/{id}/contrasenia` | `200` |
  | `eliminar_*` | `DELETE` | `DELETE /usuario/usuarios/{id}` | `204` |
  | `quitar_*`, `eliminar_franja_horaria_turno` | `DELETE` | `DELETE /orientacion/areas/{id}/materias/{id_materia}` | `200` + entidad modificada |
  | Acciones de negocio, como sub-recurso | `POST` | `POST /pago/pagos/{id}/validacion`, `POST /pago/recibos-de-sueldo/{id}/firma` | `200` |

  La única excepción es `POST /usuario/login`.
- **Nombres:** el `operationId` va tal cual el documento, en snake_case y sin tildes (`ñ` → `ni`): `get_día_lectivo` → `get_dia_lectivo` (`GET /horarios/dias-lectivos/{id}`). Los segmentos de ruta van en kebab-case, también sin tildes.
- **Ids:** el id de la entidad principal va en la ruta (`/{id}`) y el resto de los datos en el body JSON. En los `asignar_X_a_Y`, el id de la ruta es el de la entidad del propio servicio y el otro id va en el body. Por ejemplo, `POST /horarios/turnos/{id}/franjas-horarias` con body `{ "id_franja_horaria": 7 }`.
  - Cuando la operación actúa sobre un elemento de una sub-colección, ese id va como segundo parámetro de ruta: `DELETE /orientacion/areas/{id}/materias/{id_materia}`, `PATCH /planificacion/cursos/{id}/materias/{id_materia}`.
  - `GET` y `DELETE` no llevan body: `calcular_monto_a_liquidar` recibe el período como query (`?periodo=2026-03`).
- **Datos anidados:** si una relación tiene un solo elemento (la materia de una clase, el rol de un usuario), el dato viene **anidado** en la entidad y no tiene query propia. Las relaciones con varios elementos tienen su query de listado como sub-recurso (`GET /planificacion/cursos/{id}/clases`, `GET /usuario/roles/{id}/privilegios`).
- **Filtros:** algunos listados aceptan filtros opcionales por query, con el nombre del campo que filtran. Se combinan con AND y, si no se pasa ninguno, el listado devuelve todo. Por ejemplo, `GET /planificacion/clases?id_profesor=12&id_propuesta=5` devuelve la grilla de un profesor.

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

- **Rutas REST (todas las operaciones):** el documento nombra funciones y el corte inicial publicaba una ruta por función (`GET /orientacion/get_materias`). Ahora cada función es una operación REST sobre un recurso, y el nombre de la función queda como `operationId`, así que el cliente web y la trazabilidad con el documento no cambian. Las únicas operaciones que cambian de forma, además de la ruta, son:
  - `cambiar_horas_materia_curso`: `id_materia` pasa del body a la ruta (`PATCH /planificacion/cursos/{id}/materias/{id_materia}`, body `{ horas_semanales }`).
  - `asignar_curso_a_anio_academico`: pasa a `POST /planificacion/anios-academicos/{id}/cursos`.
  - ORIENTACIÓN suma `get_plan_de_estudios` (`GET /orientacion/plan-de-estudios`, filtros `id_orientacion` e `id_anio_academico`): el plan armado en tres niveles, año académico → orientación → materias (con su área). Así el cliente no cruza `get_materias` con `get_anios_academicos` para agrupar. El nombre del año lo pide el servicio a Planificación. El verificador la tiene en `AGREGADOS`.
  - La materia anidada en el curso (`Curso.materias[]`) y en la clase (`Clase.materia`) suma `id_area` y `nombre_area`, para mostrar el área sin pedir el catálogo de materias. El verificador la tiene en `PROPIEDADES_AGREGADAS`.
  - PLANIFICACIÓN suma `generar_planilla` (`POST /planificacion/propuestas/{id}/generacion`, body opcional `{ id_curso }`): genera la planilla en el servidor y la guarda. Completa las horas que faltan en todos los cursos del ciclo de la propuesta (o solo en `id_curso`) respetando lo ya ubicado, la disponibilidad declarada, que un docente no esté en dos clases a la vez y el tope de 2 horas diarias por materia. Guarda con `crear_clase` + `asignar_clase_a_propuesta` o `editar_clase` (corren las mismas reglas) y responde `ResultadoGeneracion { horas_ubicadas, sin_ubicar[], cambios[], errores[] }`, donde `cambios` trae lo que tenía cada clase antes, para deshacer. Solo en Borrador (`409`). Antes la generación corría en el navegador y obligaba a bajar todos los profesores y todas las clases. El verificador la tiene en `AGREGADOS`.
  - PLANIFICACIÓN suma la fachada `get_armado_propuesta` (`GET /planificacion/propuestas/{id}/armado`): devuelve `ArmadoPropuesta { propuesta, estados[], cursos[] }`, todo lo que necesita la pantalla de armado (A13) para abrir, en lugar de `get_propuesta` + `get_posibles_estados_de_propuestas` + `get_cursos` + `get_anios_academicos`. Por detrás lee sus tablas y hace 3 llamadas HTTP, una por catálogo y sin importar cuántos cursos haya: `orientacion.get_materias`, `orientacion.get_orientaciones` y `horarios.get_turnos`. No trae clases: la pantalla las pide al elegir un curso (`get_clases?id_propuesta&id_curso`). El detalle paso a paso está en la descripción de la operación en el swagger. El verificador la tiene en `AGREGADOS`.
  - El curso suma `anio_academico` anidado (`{ id_anio_academico, anio_curricular, codigo }`), para armar el nombre "1° A" sin pedir `get_anios_academicos`. El verificador lo tiene en `PROPIEDADES_AGREGADAS`.
  - `crear_suplencia`: la suplencia es del profesor que la cubre, así que el suplente pasa del body a la ruta (`POST /profesor-suplencias/profesores/{id}/suplencias`, con `404` si el profesor no existe).

  `npm run verificar-contratos` compara contra `specs/*.json` por `operationId`, con esas diferencias como excepciones.

<details>
<summary>Tabla de rutas por operación</summary>

**usuario**
| operationId | Ruta nueva |
|---|---|
| login | `POST /usuario/login` |
| get_privilegios | `GET /usuario/privilegios` |
| crear_rol / get_roles | `POST` / `GET /usuario/roles` |
| eliminar_rol / cambiar_nombre_rol | `DELETE` / `PATCH /usuario/roles/{id}` |
| asignar_privilegio / get_rol_privilegios | `POST` / `GET /usuario/roles/{id}/privilegios` |
| quitar_privilegio | `DELETE /usuario/roles/{id}/privilegios/{id_privilegio}` |
| crear_usuario / get_usuarios | `POST` / `GET /usuario/usuarios` |
| get_usuario / editar_usuario / eliminar_usuario | `GET` / `PUT` / `DELETE /usuario/usuarios/{id}` |
| asignar_rol | `PUT /usuario/usuarios/{id}/rol` |
| cambiar_contrasenia | `PATCH /usuario/usuarios/{id}/contrasenia` |

**horarios**
| operationId | Ruta nueva |
|---|---|
| crear_dia_lectivo / get_dias_lectivos | `POST` / `GET /horarios/dias-lectivos` |
| get_dia_lectivo / eliminar_dia_lectivo | `GET` / `DELETE /horarios/dias-lectivos/{id}` |
| get_franja_horaria_dia_lectivo | `GET /horarios/dias-lectivos/{id}/franjas-horarias` |
| crear_franja_horaria / get_franjas_horarias | `POST` / `GET /horarios/franjas-horarias` |
| get_franja_horaria | `GET /horarios/franjas-horarias/{id}` |
| crear_turno / get_turnos | `POST` / `GET /horarios/turnos` |
| get_turno / eliminar_turno | `GET` / `DELETE /horarios/turnos/{id}` |
| asignar_franja_a_turno | `POST /horarios/turnos/{id}/franjas-horarias` |
| eliminar_franja_horaria_turno | `DELETE /horarios/turnos/{id}/franjas-horarias/{id_franja_horaria}` |

**orientacion**
| operationId | Ruta nueva |
|---|---|
| crear_area / get_areas | `POST` / `GET /orientacion/areas` |
| get_area / eliminar_area | `GET` / `DELETE /orientacion/areas/{id}` |
| asignar_materia_area / get_materias_area | `POST` / `GET /orientacion/areas/{id}/materias` |
| quitar_materia_area | `DELETE /orientacion/areas/{id}/materias/{id_materia}` |
| get_profesores_area | `GET /orientacion/areas/{id}/profesores` |
| crear_materia / get_materias | `POST` / `GET /orientacion/materias` |
| get_materia / eliminar_materia | `GET` / `DELETE /orientacion/materias/{id}` |
| asignar_materia_orientacion | `PUT /orientacion/materias/{id}/orientacion` |
| asignar_anio_academico_a_materia | `PUT /orientacion/materias/{id}/anio-academico` |
| asignar_clase_a_materia | `POST /orientacion/materias/{id}/clases` |
| get_profesores_materia | `GET /orientacion/materias/{id}/profesores` |
| crear_orientacion / get_orientaciones | `POST` / `GET /orientacion/orientaciones` |
| get_orientacion / eliminar_orientacion | `GET` / `DELETE /orientacion/orientaciones/{id}` |
| asignar_curso_a_orientacion | `POST /orientacion/orientaciones/{id}/cursos` |
| get_materias_orientacion | `GET /orientacion/orientaciones/{id}/materias` |

**planificacion**
| operationId | Ruta nueva |
|---|---|
| crear_anio_academico / get_anios_academicos | `POST` / `GET /planificacion/anios-academicos` |
| get_anio_academico | `GET /planificacion/anios-academicos/{id}` |
| asignar_curso_a_anio_academico / get_cursos_anio_academico | `POST` / `GET /planificacion/anios-academicos/{id}/cursos` |
| crear_ciclo_lectivo / get_ciclos_lectivos | `POST` / `GET /planificacion/ciclos-lectivos` |
| get_ciclo_lectivo | `GET /planificacion/ciclos-lectivos/{id}` |
| crear_clase / get_clases | `POST` / `GET /planificacion/clases` |
| get_clase / editar_clase / eliminar_clase | `GET` / `PUT` / `DELETE /planificacion/clases/{id}` |
| asignar_curso_a_clase | `PUT /planificacion/clases/{id}/curso` |
| crear_curso / get_cursos | `POST` / `GET /planificacion/cursos` |
| get_curso | `GET /planificacion/cursos/{id}` |
| asignar_materia_a_curso | `POST /planificacion/cursos/{id}/materias` |
| cambiar_horas_materia_curso | `PATCH /planificacion/cursos/{id}/materias/{id_materia}` (body `{ horas_semanales }`) |
| quitar_materia_curso | `DELETE /planificacion/cursos/{id}/materias/{id_materia}` |
| get_curso_clases | `GET /planificacion/cursos/{id}/clases` |
| crear_estado_propuesta / get_posibles_estados_de_propuestas | `POST` / `GET /planificacion/estados-propuesta` |
| crear_propuesta / get_propuestas | `POST` / `GET /planificacion/propuestas` |
| get_propuesta | `GET /planificacion/propuestas/{id}` |
| asignar_estado_a_propuesta / get_estado_actual_de_propuesta | `PUT` / `GET /planificacion/propuestas/{id}/estado` |
| asignar_clase_a_propuesta | `POST /planificacion/propuestas/{id}/clases` |
| generar_planilla (agregada) | `POST /planificacion/propuestas/{id}/generacion` |
| get_armado_propuesta (agregada, fachada) | `GET /planificacion/propuestas/{id}/armado` |

**pago**
| operationId | Ruta nueva |
|---|---|
| crear_pago / get_pagos | `POST` / `GET /pago/pagos` |
| validar_pago | `POST /pago/pagos/{id}/validacion` |
| calcular_monto_a_liquidar | `GET /pago/profesores/{id}/monto-a-liquidar` |
| get_recibos_de_sueldo | `GET /pago/recibos-de-sueldo` |
| bajar_recibo_sueldo | `GET /pago/recibos-de-sueldo/{id}/pdf` |
| firmar_recibo_de_sueldo | `POST /pago/recibos-de-sueldo/{id}/firma` |

**profesor_suplencias**
| operationId | Ruta nueva |
|---|---|
| crear_profesor / get_profesores | `POST` / `GET /profesor-suplencias/profesores` |
| get_profesor / editar_profesor | `GET` / `PUT /profesor-suplencias/profesores/{id}` |
| asignar_usuario_profesor | `PUT /profesor-suplencias/profesores/{id}/usuario` |
| asignar_materias_habilitadas | `PUT /profesor-suplencias/profesores/{id}/materias-habilitadas` |
| asignar_disponibilidad / get_disponibilidad_profesor | `PUT` / `GET /profesor-suplencias/profesores/{id}/disponibilidad` |
| crear_suplencia | `POST /profesor-suplencias/profesores/{id}/suplencias` (`{id}` = suplente) |
| get_suplencias | `GET /profesor-suplencias/suplencias` (cruza profesores; filtros `id_profesor`, `id_clase`, fechas…) |

</details>

- **USUARIO:**
  - `asignar_roles` pasa a `asignar_rol`, porque cada usuario tiene un solo rol.
  - `eliminar_rol`, que aparecía dos veces, queda una sola vez.
  - Se agregan `login`, `get_usuarios`, `get_roles` y `get_privilegios`.
  - Los privilegios se cargan por configuración, así que se sacan `crear_privilegio`, `modificar_privilegio`, `eliminar_privilegio` y `get_privilegio`.
  - Se sacan `cambiar_email`, `cambiar_nombre`, `get_rol` y `get_usuario_privilegios`. Los privilegios de un usuario se obtienen con su rol anidado y `get_rol_privilegios`.
  - Se agrega `editar_usuario` (`PUT /usuario/usuarios/{id}`), que reemplaza el nombre de usuario y el email. No cambia la contraseña ni el rol. Lo usa la ficha del profesor para editar su usuario.
  - Se agrega `quitar_privilegio` (`DELETE /usuario/roles/{id}/privilegios/{id_privilegio}`), el espejo de `asignar_privilegio`.
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
  - ORIENTACIÓN: cada materia tiene **una sola orientación** (`Materia.id_orientacion`, obligatoria). Dos materias con el mismo nombre en distintas orientaciones son materias distintas. `asignar_materia_orientacion` pasa a `PUT /orientacion/materias/{id}/orientacion` y se elimina `quitar_materia_orientacion`.
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
  - PLANIFICACIÓN: se agregan `editar_clase` (`PUT /planificacion/clases/{id}`, reemplaza franjas y docentes) y `eliminar_clase` (`DELETE /planificacion/clases/{id}`). Solo funcionan si todas las propuestas que incluyen la clase están en Borrador. Sin ellas no se podía mover ni quitar una hora en el armado de la planificación.
  - PLANIFICACIÓN: `crear_clase` controla que el curso dicte la materia, que las franjas sean del turno del curso y no sean recreos, y que los docentes estén habilitados y disponibles. Los choques (dos clases del curso en la misma franja, un docente en dos clases a la vez) se controlan en `asignar_clase_a_propuesta`, porque `crear_clase` no sabe a qué propuesta va la clase. Una propuesta solo recibe clases en Borrador. Para pasar a En revisión o a Validada, `asignar_estado_a_propuesta` exige que la propuesta esté completa (todas las materias de todos los cursos del ciclo con sus horas ubicadas) y, si no, responde `409` con los cursos que faltan.
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
- **Cliente de la web:** `apps/web/src/api/*.ts` se genera a partir del swagger de los servicios (levantados en sus puertos de desarrollo): `node tools/generar_cliente_web.mjs`. Con la app de Docker levantada: `node tools/generar_cliente_web.mjs --url http://localhost:8100/docs`.
- **Pruebas:** `npm test` (e2e de los servicios) y `npm run verificar-contratos` (diferencias con los contratos originales, por `operationId`; las operaciones agregadas y las diferencias de forma aceptadas están en `AGREGADOS` y `EXCEPCIONES` del script).
- **Historial:** `tools/generar_specs.py` generó los contratos originales de `specs/` y `tools/generar_scaffold.mjs` generó el código inicial de los servicios a partir de ellos. Los dos quedan congelados; el segundo no corre si las apps ya existen, para no pisar el código.

Para validar con redocly el swagger que publican los servicios (con la app levantada; usa la configuración de `redocly.yaml`):

```bash
mkdir -p /tmp/sahs-docs && for s in usuario pago horarios planificacion orientacion profesor-suplencias; do
  curl -s http://localhost:8100/docs/$s-json > /tmp/sahs-docs/$s.json; done
docker run --rm -v "$PWD:/work:ro" -v /tmp/sahs-docs:/docs:ro -w /work redocly/cli:1.25.11 lint /docs/*.json
```
