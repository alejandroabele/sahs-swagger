## MODIFIED Requirements

### Requirement: Modelos de PLANIFICACIÓN
`planificacion.json` SHALL definir estos schemas:
- `Propuesta { id_propuesta, nombre, descripcion_propuesta, fecha_creacion, fecha_modificacion, codigo, id_ciclo_lectivo, estado: EstadoPropuesta, ids_clases[] }`
- `EstadoPropuesta { id_estado, nombre, codigo }`. Es un catálogo gestionado cuya carga inicial MUST documentarse: Borrador (`BOR`), En revisión (`REV`), Validada (`VAL`) y Cerrada (`CER`). El estado es de toda la propuesta, no de cada curso.
- `CicloLectivo { id_ciclo_lectivo, anio_calendario }`
- `AnioAcademico { id_anio_academico, anio_curricular, codigo }`
- `MateriaCurso { id_materia, nombre_materia, horas_semanales }`, donde `horas_semanales` es la cantidad de horas de esa materia en el curso
- `Curso { id_curso, division, id_anio_academico, id_ciclo_lectivo, id_turno, turno, id_orientacion, orientacion, materias: MateriaCurso[], franjas_horarias[] }`. `id_orientacion` MUST ser obligatorio y no nullable: el ciclo básico usa su propia orientación del catálogo.
- `Clase { id_clase, descripcion, codigo, id_curso, id_materia, materia, ids_franjas_horarias[], franjas_horarias[], ids_profesores[], profesores[], suplencia }`. Los profesores de una clase valen para todas sus franjas.

Los objetos que vienen de otros servicios MUST definirse como schemas resumen locales.

#### Scenario: Clase con varios profesores
- **WHEN** se consulta `GET /planificacion/clases/{id}`
- **THEN** la respuesta incluye `profesores` (lista), `materia`, `franjas_horarias` y `suplencia` anidados

#### Scenario: Curso con horas propias
- **WHEN** se consulta `GET /planificacion/cursos/{id}`
- **THEN** cada elemento de `materias` trae las `horas_semanales` del curso

#### Scenario: Orientación obligatoria
- **WHEN** se revisa el schema `Curso`
- **THEN** `id_orientacion` está en `required` y no es `nullable`

### Requirement: Commands de PLANIFICACIÓN
El servicio SHALL exponer, con prefijo `/planificacion`:

| Verbo | Operaciones |
|---|---|
| `POST` | `crear_propuesta` (`/propuestas`), `crear_estado_propuesta` (`/estados-propuesta`), `crear_ciclo_lectivo` (`/ciclos-lectivos`), `crear_curso` (`/cursos`), `crear_anio_academico` (`/anios-academicos`) y `crear_clase` (`/clases`) (`201`); `asignar_clase_a_propuesta` (`/propuestas/{id}/clases`), `asignar_curso_a_anio_academico` (`/anios-academicos/{id}/cursos`), `asignar_materia_a_curso` (`/cursos/{id}/materias`) |
| `PUT` | `asignar_estado_a_propuesta` (`/propuestas/{id}/estado`), `asignar_curso_a_clase` (`/clases/{id}/curso`) |
| `PATCH` | `cambiar_horas_materia_curso` (`/cursos/{id}/materias/{id_materia}`) |
| `DELETE` | `quitar_materia_curso` (`/cursos/{id}/materias/{id_materia}`), que devuelve el `Curso` |

El body de `crear_clase` es `{ descripcion, codigo, id_curso, id_materia, ids_franjas_horarias[], ids_profesores[] }`. `crear_curso` MUST recibir `id_orientacion` como obligatorio. `crear_propuesta` MUST dejar la propuesta en el estado Borrador. `asignar_materia_a_curso` recibe `{ id_materia, horas_semanales }` (las horas son opcionales; si se omiten, se toman de la materia). `cambiar_horas_materia_curso` recibe la materia en la ruta (`{id_materia}`) y el body `{ horas_semanales }`. `asignar_estado_propuesta` y `asignar_suplencias_a_clase` MUST NOT existir.

#### Scenario: Duplicados eliminados
- **WHEN** se buscan las operaciones del contrato
- **THEN** solo existe `asignar_estado_a_propuesta` y no hay ninguna operación de suplencias

#### Scenario: Cambiar estado
- **WHEN** se llama `PUT /planificacion/propuestas/{id}/estado` con `{ "id_estado": 2 }`
- **THEN** devuelve la `Propuesta` con el estado nuevo anidado

#### Scenario: Agregar una materia al curso
- **WHEN** se llama `POST /planificacion/cursos/1/materias` con `{ "id_materia": 3, "horas_semanales": 4 }`
- **THEN** devuelve el `Curso` 1 con la materia 3 en `materias` y 4 horas

#### Scenario: Cambiar las horas en el curso
- **WHEN** se llama `PATCH /planificacion/cursos/1/materias/3` con `{ "horas_semanales": 5 }`
- **THEN** devuelve el `Curso` 1 con 5 horas para la materia 3, y las horas de la materia en ORIENTACIÓN no cambian

#### Scenario: Quitar una materia del curso
- **WHEN** se llama `DELETE /planificacion/cursos/1/materias/3`
- **THEN** devuelve el `Curso` 1 sin la materia 3

### Requirement: Queries de PLANIFICACIÓN
El servicio SHALL exponer con `GET` y prefijo `/planificacion`:
- `get_posibles_estados_de_propuestas` (`/estados-propuesta`)
- `get_estado_actual_de_propuesta` (`/propuestas/{id}/estado`)
- `get_propuestas` (`/propuestas`), `get_propuesta` (`/propuestas/{id}`)
- `get_ciclo_lectivo` (`/ciclos-lectivos/{id}`), `get_ciclos_lectivos` (`/ciclos-lectivos`)
- `get_curso_clases` (`/cursos/{id}/clases`)
- `get_curso` (`/cursos/{id}`), `get_cursos` (`/cursos`)
- `get_clase` (`/clases/{id}`), `get_clases` (`/clases`)
- `get_anio_academico` (`/anios-academicos/{id}`), `get_anios_academicos` (`/anios-academicos`)
- `get_cursos_anio_academico` (`/anios-academicos/{id}/cursos`)

Filtros opcionales:
- `get_clases`: `id_profesor`, `id_curso`, `id_propuesta`
- `get_propuestas`: `id_ciclo_lectivo`, `id_estado`
- `get_cursos`: `id_ciclo_lectivo`

Estas queries MUST NOT existir: `get_clases_curso`, `get_materia_clase`, `get_franja_horaria_clase`, `get_profesores_clase`, `get_turno_curso`, `get_franja_horarios_curso`, `get_orientacion_curso`, `get_curso_materias`, `get_suplencia_clase`.

#### Scenario: Curso con datos anidados
- **WHEN** se llama `GET /planificacion/cursos/{id}`
- **THEN** la respuesta incluye `turno`, `orientacion`, `materias` y `franjas_horarias`, pero no las clases

#### Scenario: Grilla del profesor
- **WHEN** se llama `GET /planificacion/clases?id_profesor=12&id_propuesta=5`
- **THEN** devuelve las clases de la propuesta 5 que dicta el profesor 12

#### Scenario: Propuestas de un ciclo
- **WHEN** se llama `GET /planificacion/propuestas?id_ciclo_lectivo=2026`
- **THEN** devuelve solo las propuestas del ciclo 2026

## ADDED Requirements

### Requirement: Generación automática de la planilla
El servicio SHALL exponer `generar_planilla` como `POST /planificacion/propuestas/{id}/generacion`, con body opcional `{ id_curso }`. Sin `id_curso` MUST completar todos los cursos del ciclo lectivo de la propuesta; con `id_curso`, solo ese curso, que MUST ser del ciclo de la propuesta (si no, `400`). La generación MUST correr en el servidor y guardar el resultado: las clases nuevas con `crear_clase` + `asignar_clase_a_propuesta` (código `<propuesta sin PLAN->-<curso>-<3 letras de la materia>` y descripción `Materia · Curso`) y las existentes con `editar_clase`, sumando franjas, de modo que corran las mismas reglas que en la carga manual. Si una regla rechaza un cambio, MUST seguir con el resto e informar el mensaje en `errores`.

El algoritmo MUST respetar lo ya ubicado, la disponibilidad declarada de cada docente (por franja), que un docente no esté en dos clases de la propuesta a la vez (por horario real, aunque sean turnos distintos) y el tope de 2 horas diarias por materia en el curso. Si la clase ya tiene docentes MUST usar esos; si no, el habilitado con más franjas posibles, y las materias EPA van con todos sus habilitados juntos. Resuelve primero las materias con menos margen y ocupa antes las franjas que menos docentes declararon.

La respuesta `200` es `ResultadoGeneracion { horas_ubicadas, sin_ubicar[{ id_curso, id_materia, curso, materia, horas }], cambios[{ id_clase, creada, ids_franjas_horarias_previas[], ids_profesores_previos[] }], errores[] }`. `cambios` MUST alcanzar para deshacer la generación (eliminar las clases creadas y restaurar con `editar_clase` las franjas y los docentes de las editadas). La operación MUST responder `409` si la propuesta no está en Borrador y `404` si no existe.

#### Scenario: Generar toda la propuesta
- **WHEN** se llama `POST /planificacion/propuestas/{id}/generacion` con `{}` sobre una propuesta en Borrador
- **THEN** cada materia de cada curso del ciclo tiene al menos las horas que tenía antes, y las que no llegan a sus horas semanales figuran en `sin_ubicar` con las horas que faltan

#### Scenario: Generar un curso
- **WHEN** se llama con `{ "id_curso": 1 }`
- **THEN** solo se agregan franjas a clases del curso 1, sin superponer a sus docentes con las clases que ya tienen en otros cursos

#### Scenario: Propuesta que no está en Borrador
- **WHEN** se llama sobre una propuesta En revisión, Validada o Cerrada
- **THEN** responde `409` y no cambia ninguna clase

#### Scenario: Curso de otro ciclo
- **WHEN** `id_curso` no es un curso del ciclo de la propuesta
- **THEN** responde `400`

