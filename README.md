# Swagger · Microservicios SAHS

Contratos OpenAPI 3.0 de los 6 microservicios definidos en la pestaña **"Microservicios"** del documento del grupo, con Swagger UI para navegarlos.

> Los links al diseño, al documento del grupo y al diagrama de clases están en [`docs/referencias.md`](docs/referencias.md). Es el único lugar donde se mantienen. Las instrucciones para agentes de IA están en [`AGENTS.md`](AGENTS.md).

| Servicio | Archivo | Prefijo |
|---|---|---|
| Usuario | `specs/usuario.json` | `/usuario` |
| Pago | `specs/pago.json` | `/pago` |
| Horarios | `specs/horarios.json` | `/horarios` |
| Planificación | `specs/planificacion.json` | `/planificacion` |
| Orientación | `specs/orientacion.json` | `/orientacion` |
| Profesor y Suplencias | `specs/profesor_suplencias.json` | `/profesor_suplencias` |

## Cómo usarlo

```bash
docker compose up -d      # levanta Swagger UI y el prototipo
# Swagger UI: http://localhost:8080 → elegir el servicio en "Select a definition"
# Prototipo:  http://localhost:8090 → elegir rol (Administrativo / Profesor)
docker compose down       # baja los dos
```

Si los JSON cambian, basta con recargar la página, porque la carpeta `specs/` está montada en el contenedor.

> No hay backend: los servidores de cada contrato (`localhost:8081` a `8086`) son ilustrativos, así que "Try it out" no obtiene respuesta.

## Prototipo

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

## A revisar por el grupo

1. **Recibos:** el documento no tiene un command para crear recibos. Se tomó como criterio que `crear_pago` genera el único recibo del pago, con sus conceptos y el neto que da `calcular_monto_a_liquidar`. Falta definir si el emisor es un dato fijo de la institución.
2. **Clases:** no hay commands para asignar a una clase su materia, sus franjas o sus profesores. Van en el body de `crear_clase`, que consulta la disponibilidad del profesor.
3. **`get_estado_actual_de_propuesta`:** se mantuvo, aunque el estado también viene anidado en la propuesta.
4. **Dependencias cíclicas:** PLANIFICACIÓN ⇄ ORIENTACIÓN ⇄ PROFESOR Y SUPLENCIAS se consumen entre sí. Conviene revisarlo en el diseño de los microservicios.
5. **Commands que son `GET`:** `bajar_recibo_sueldo` y `calcular_monto_a_liquidar` figuran como commands en el documento, pero en el swagger son `GET` porque no modifican nada. Conviene moverlos a queries en el documento.
6. **Relación Clase–Suplencia en el diagrama de clases:** hoy la flecha va de Clase a Suplencia. En el swagger la referencia la guarda Suplencia (`ids_clases`): una clase validada no se edita, una clase tiene muchas suplencias en el año y así Suplencias no escribe en Planificación. Hay que invertir la flecha en draw.io.
7. **`eliminar_suplencia`:** sin los `asignar_*`, una suplencia no se puede corregir después de creada. La sección "7. Suplencias" del documento tiene `DELETE /suplencias/{id}`, pero PROFESOR Y SUPLENCIAS no. Falta definir si se agrega.

## Mantenimiento

Los JSON se generan con `tools/generar_specs.py`, así que conviene editar el script y regenerar en lugar de tocar los JSON a mano:

```bash
python3 tools/generar_specs.py specs
docker run --rm -v "$PWD:/work:ro" -w /work redocly/cli:1.25.11 lint specs/*.json   # validación
```

El linter usa la configuración de `redocly.yaml`, que desactiva las reglas de seguridad, licencia y servidor por las decisiones de arriba.
