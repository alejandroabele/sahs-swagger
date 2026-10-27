## Context

- La web (`apps/web`) tiene una sola ruta, `/:codigo`. Navega con `ir('A13', { id_propuesta, id_curso })`, que arma `/A13?id_propuesta=5&id_curso=2`, y lee los parámetros con `useParamNumero`. Quedan restos de demo, como `ir('A9', { id_profesor: 3 })` e `ir('A13', { id_propuesta: 4, id_curso: 2 })`.
- Las pantallas piden de 4 a 9 listados para armar métricas y textos que no hacen a su función (inventario abajo). El Login llama a `get_usuarios` sin sesión para mostrar los usuarios de ejemplo.
- La API publica 98 operaciones con rutas RPC (`/<prefijo>/<operacion>[/:id]`) y `operationId` = nombre de la función del documento. El cliente web (`tools/generar_cliente_web.mjs`) genera métodos con el nombre del `operationId`, así que las pantallas llaman `orientacion.get_materias()` sin conocer la ruta.
- Hay dos llamadas entre servicios que escriben la ruta a mano: `planificacion → orientacion` (`asignar_curso_a_orientacion`, `asignar_clase_a_materia`).
- El prototipo (`prototipo/index.html`) se genera desde los `.dc.html`. El armazón y `CONFIG` están escritos a mano y la navegación usa `#<id>` (`#materias`).
- El diseño publicado en claude.ai es la fuente de verdad de las pantallas. El documento del grupo lo es de las operaciones y sus nombres.

## Goals / Non-Goals

**Goals:**
- Que cada pantalla muestre los datos de su servicio y nada armado por cruce de servicios, salvo cuando cruzar datos es su función.
- URLs de la web legibles, estables y con parámetros de ruta.
- API REST con los nombres del documento en el `operationId`.
- App, prototipo, diseño publicado, swagger, specs y README alineados al final del cambio.

**Non-Goals:**
- Borrar operaciones de la API que la web no usa: se mantienen.
- Autenticación de los servicios. Hoy ningún endpoint exige token, y queda para otro cambio. Este cambio solo saca la llamada del Login sin sesión.
- Cambiar el modelo de datos o agregar queries nuevas de resumen.
- Rediseñar visualmente las pantallas: solo se quita contenido, y el estilo sigue siendo el del diseño.

## Decisions

### 1. Rutas de la web

Sustantivos en español, en plural, en minúsculas y con guiones. Los ids van como parámetro de ruta. Una query string solo se usa para estado de vista opcional, como filtros, y nunca para identificar un recurso. Los códigos de pantalla (A1…P4) quedan como identificadores internos del código y de la documentación, pero no aparecen en URLs ni en textos.

| Pantalla | Ruta |
|---|---|
| L1 Login | `/login` |
| A1 Inicio | `/` |
| A2 Disponibilidad | `/disponibilidad`, `/disponibilidad/:idProfesor` |
| A3 Generación | `/planificaciones/:id/generacion`, `/planificaciones/:id/generacion/:idCurso` |
| A4 Suplencias | `/suplencias` |
| A5 Materias | `/materias` |
| A6 Ficha de materia | `/materias/:id` |
| A7 Profesores | `/profesores` |
| A8 Alta de profesor | `/profesores/nuevo` |
| A9 Ficha de profesor | `/profesores/:id` |
| A10 Cursos | `/cursos` |
| A11 Curso (alta / edición) | `/cursos/nuevo`, `/cursos/:id` |
| A12 Planificaciones | `/planificaciones` |
| A13 Armado | `/planificaciones/:id`, `/planificaciones/:id/cursos/:idCurso` |
| A14 Orientaciones | `/orientaciones` |
| A15 Ciclos lectivos | `/ciclos-lectivos` |
| A16 Turnos | `/turnos` |
| A17 Usuarios y roles | `/usuarios`, `/roles` (misma pantalla, una pestaña cada una) |
| A18 Cambiar mi contraseña | `/mi-cuenta/contrasenia` |
| P2 Mi horario | `/mi-horario` |
| P3 Mi disponibilidad | `/mi-disponibilidad` |
| P4 Mis recibos | `/mis-recibos` |

- **Menú sin id:** las tarjetas de A3 y A13 del inicio llevan a `/planificaciones`, donde se elige la propuesta. Desaparece el "por defecto, la propuesta en Borrador" escondido en la pantalla.
- **Router:** rutas declaradas una por una en `App.tsx` (React Router, `path` con parámetros), cada una con su privilegio. `useNavegar` deja de recibir códigos. Se navega con funciones tipadas de `app/rutas.ts` (`rutas.materia(5)` → `/materias/5`) y se lee con `useParams`. Alternativa descartada: mantener `ir(codigo, params)` y traducir por detrás, porque seguiría escondiendo la ruta real.
- **Rutas viejas:** no se mantienen redirecciones de `/A5` ni de `?id_…`. Es un prototipo académico sin enlaces externos. Una ruta desconocida lleva al inicio.
- **Prototipo:** usa las mismas rutas con hash (`#/materias/5`). El armazón del `index.html` parsea el hash con la misma tabla de rutas que se declara en `CONFIG`.

### 2. API REST

Recursos en plural y en kebab-case bajo el prefijo del servicio. Las sub-colecciones se escriben como `/{recurso}/{id}/{subrecurso}`. Verbos: `GET` para leer, `POST` para crear o agregar a una colección, `PUT` para reemplazar, `PATCH` para cambio parcial y `DELETE` para borrar o quitar. El `operationId` no cambia. Las acciones que no son CRUD (login, validar o firmar) se modelan como sub-recurso (`/pagos/{id}/validacion`). Como excepción se deja `POST /usuario/login`, que es la convención habitual.

Alternativa descartada: conservar las rutas RPC del documento. Se descarta porque el usuario pidió buenas prácticas, y la trazabilidad con el documento se mantiene por `operationId`.

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

- El prefijo de cada servicio es su nombre en kebab-case (`/usuario`, `/profesor-suplencias`, …), como el resto de los segmentos. El nombre del servicio (`profesor_suplencias`, en `x-dependencias` y en "Invoca:") sigue en snake_case, como los `operationId`. El nginx, Vite y Swagger UI enrutan por ese prefijo.
- Las únicas operaciones que cambian de forma son `cambiar_horas_materia_curso`, que pasa `id_materia` del body a la ruta, `asignar_curso_a_anio_academico`, que pasa de `POST …/{id}` a `POST …/{id}/cursos`, y `crear_suplencia`, que pasa el suplente del body a la ruta (`POST /profesor-suplencias/profesores/{id}/suplencias`). Las tres van en la lista de excepciones del verificador y en "Cambios respecto del documento".
- **Verificador:** `verificar_contratos.mjs` indexa las dos especificaciones por `operationId` y compara verbo, parámetros, bodies y respuestas. La ruta deja de compararse, salvo los nombres de los parámetros de ruta.

### 3. Qué consulta cada pantalla después del cambio

Criterio: servicio propio, más **nombres** (resolver un id), **selectores** (lo que la acción necesita) y **función** (la pantalla existe para cruzar datos).

| Pantalla | Queda | Se va |
|---|---|---|
| L1 | `login` | `get_usuarios` y la tarjeta de usuarios de ejemplo |
| A1 | privilegios de la sesión | descripciones de cada tarjeta que nombran pantallas, "Pendiente" y el pie explicativo. Los privilegios sin pantalla no se muestran. |
| A2 | profesores, turnos (grilla) | horas asignadas (clases de la vigente) |
| A3 | al entrar: propuesta, cursos del ciclo, años y las clases del curso visible en la propuesta (`get_clases({ id_propuesta, id_curso })`, con materia y profesores anidados). Al generar: `generar_planilla(id, { id_curso })`, que genera y guarda en la API, y se recargan las clases | textos de ayuda; la propuesta por defecto (llega por ruta); `get_profesores` y las clases de toda la propuesta; el algoritmo en el navegador, la vista previa, el toggle "Respetar disponibilidad declarada" (la API siempre la respeta), "Guardar en la planificación" y los +/− de horas (solo cambiaban la vista previa) |
| A4 | todo (función) | textos de ayuda |
| A5 | `get_plan_de_estudios` (listado y filtro por año); años, orientaciones y áreas solo al abrir el alta | columnas Horas y Docentes, `get_materias` + `get_anios_academicos` cruzados en el cliente, filtro de orientaciones por año, pie "Hacé clic…" |
| A6 | materia, docentes habilitados (`get_profesores_materia`, query del propio servicio), años, orientaciones y áreas (selectores de edición) | cursos donde se dicta (`get_cursos`, `get_clases`), selector de otra materia (`get_materias`), `get_profesores` completo |
| A7 | profesores (con sus materias habilitadas anidadas) | horas que dicta, área derivada, franjas declaradas contadas (`get_turnos`, `get_clases`, `get_propuestas`, `get_materias`, `get_areas`) |
| A8 | `get_plan_de_estudios` (selector de habilitadas) | `get_profesores`, `get_materias` + `get_anios_academicos` cruzados en el cliente |
| A9 | profesor, usuarios (selector para asignar), `get_plan_de_estudios` (selector de habilitadas), turnos (grilla de disponibilidad) | clases asignadas, selector de otro profesor, resumen "N de M franjas declaradas", cruce materias × años en el cliente |
| A10 | cursos, años (nombre) | horas ubicadas y estado de la planificación (`get_propuestas`, `get_clases`) |
| A11 | turnos, orientaciones, materias y años (selectores) | `get_cursos` (la API valida) |
| A12 | propuestas, estados | avance "x/y h" (`get_clases` por propuesta, `get_cursos`); las acciones sobre la propuesta (estado, duplicar, generar) pasan al armado: en la fila solo queda "Abrir" |
| A13 | al entrar: propuesta, cursos del ciclo, clases del curso visible, años y estados; al editar (tocar materia o celda): profesores y clases de toda la propuesta. "Generar automáticamente" llama a `generar_planilla(id, {})` (todos los cursos; la API genera y guarda) y no necesita esos datos; con sus `cambios` se deshace. El área de cada materia viene anidada en el curso (`nombre_area`) | pies "Tocá…"; panel "Otros cursos" y marcas de avance por curso; la tarjeta de la materia elegida (franjas verdes, horas por ubicar, disponibilidad declarada, horas en otros cursos): el panel derecho solo aparece con una clase tocada y si no la planilla ocupa todo el ancho; el algoritmo de generación en el navegador; la regla de propuesta completa pasa a la API (409). Sin curso en la ruta se abre el primero |
| A14 | orientaciones, materias de la orientación, años (nombre), áreas (nombre) | cuadro año × orientación deducido de cursos (`get_cursos`), conteos de profesores (`get_profesores`) |
| A15 | ciclos lectivos | cursos y vigente por ciclo (`get_cursos`, `get_propuestas`), estado y período de clases inventados |
| A16 | turnos, días lectivos | cursos que usan cada turno (`get_cursos`, `get_anios_academicos`) |
| A17, A18, P3, P4 | propio | textos de ayuda |
| P2 | todo (función) | textos de ayuda |
| Cabecera / sesión | `get_usuario`, `get_rol_privilegios`, `get_ciclos_lectivos` | `get_profesores?id_usuario` (lo piden solo P2, P3 y P4 con `useMiProfesor`) |

Cada fila de la columna "Se va" sale de la lectura del código. Al implementar se confirma pantalla por pantalla y, si aparece otro adorno, se quita con el mismo criterio.

### 4. Orden de alineación

Los cambios de pantallas se hacen primero en los `.dc.html` (diseño) y después se exportan a `prototipo/index.html` y se llevan a la pantalla React, como pide `docs/referencias.md`. Al final se republica el artifact con los `.dc.html` nuevos, leyéndolo antes (`Artifact read`) para partir de la versión publicada.

## Risks / Trade-offs

- [La página publicada en claude.ai puede tener cambios que no están en los `.dc.html` locales] → Antes de editar, leer el artifact y comparar con los `.dc.html`. Si difieren, preguntar antes de seguir.
- [Romper la navegación entre pantallas al cambiar ~40 llamadas `ir(...)`] → `rutas.ts` tipado: el compilador marca cada llamada vieja. Además, una verificación en el navegador recorre cada ruta.
- [Rutas REST mal elegidas que choquen dentro de un controller, como `materias/:id` contra `materias/profesores`] → Ninguna sub-ruta usa un literal en la posición de `{id}`. El linter de OpenAPI y los e2e lo validan.
- [El verificador por `operationId` deja de detectar una ruta mal escrita] → Los tests e2e llaman las rutas reales, y el verificador sigue comparando los nombres de los parámetros de ruta.
- [Se pierde información que alguien usaba, como el avance de una planificación] → Decisión explícita del usuario. Si vuelve a hacer falta, se agrega como query del servicio dueño, no como cálculo del front.

## Migration Plan

1. Servicios: rutas REST, llamadas entre servicios, e2e y verificador. `npm test` y `npm run verificar-contratos` en verde.
2. Cliente web regenerado (`node tools/generar_cliente_web.mjs`). Los nombres de los métodos no cambian.
3. Diseño → prototipo → web, pantalla por pantalla.
4. Reconstruir los contenedores (`docker compose -f docker-compose.app.yml up -d --build`) y recorrer cada ruta en el navegador.
5. Republicar el artifact, y después actualizar el README y `apps/web/README.md`.

Rollback: el cambio está en una rama. Se revierte con git, y los `.dc.html` (fuera de git) se respaldan antes de editarlos.

## Open Questions

- Ninguna bloqueante. Si al leer el artifact publicado aparecen pantallas distintas de los `.dc.html` locales, se decide con el usuario cuál manda.
