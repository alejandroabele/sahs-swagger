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
- **WHEN** se consulta `GET /planificacion/get_clase/{id}`
- **THEN** la respuesta incluye `profesores` (lista), `materia`, `franjas_horarias` y `suplencia` anidados

#### Scenario: Curso con horas propias
- **WHEN** se consulta `GET /planificacion/get_curso/{id}`
- **THEN** cada elemento de `materias` trae las `horas_semanales` del curso

#### Scenario: Orientación obligatoria
- **WHEN** se revisa el schema `Curso`
- **THEN** `id_orientacion` está en `required` y no es `nullable`

### Requirement: Commands de PLANIFICACIÓN
El servicio SHALL exponer, con prefijo `/planificacion`:

| Verbo | Operaciones |
|---|---|
| `POST` | `crear_propuesta`, `crear_estado_propuesta`, `crear_ciclo_lectivo`, `crear_curso`, `crear_anio_academico` y `crear_clase` (`201`); `asignar_clase_a_propuesta/{id}`, `asignar_curso_a_anio_academico/{id}`, `asignar_materia_a_curso/{id}` |
| `PUT` | `asignar_estado_a_propuesta/{id}`, `asignar_curso_a_clase/{id}` |
| `PATCH` | `cambiar_horas_materia_curso/{id}` |
| `DELETE` | `quitar_materia_curso/{id}/{id_materia}`, que devuelve el `Curso` |

El body de `crear_clase` es `{ descripcion, codigo, id_curso, id_materia, ids_franjas_horarias[], ids_profesores[] }`. `crear_curso` MUST recibir `id_orientacion` como obligatorio. `crear_propuesta` MUST dejar la propuesta en el estado Borrador. `asignar_materia_a_curso/{id}` recibe `{ id_materia, horas_semanales }` (las horas son opcionales; si se omiten, se toman de la materia). `cambiar_horas_materia_curso/{id}` recibe `{ id_materia, horas_semanales }`. `asignar_estado_propuesta` y `asignar_suplencias_a_clase` MUST NOT existir.

#### Scenario: Duplicados eliminados
- **WHEN** se buscan las operaciones del contrato
- **THEN** solo existe `asignar_estado_a_propuesta` y no hay ninguna operación de suplencias

#### Scenario: Cambiar estado
- **WHEN** se llama `PUT /planificacion/asignar_estado_a_propuesta/{id}` con `{ "id_estado": 2 }`
- **THEN** devuelve la `Propuesta` con el estado nuevo anidado

#### Scenario: Agregar una materia al curso
- **WHEN** se llama `POST /planificacion/asignar_materia_a_curso/1` con `{ "id_materia": 3, "horas_semanales": 4 }`
- **THEN** devuelve el `Curso` 1 con la materia 3 en `materias` y 4 horas

#### Scenario: Cambiar las horas en el curso
- **WHEN** se llama `PATCH /planificacion/cambiar_horas_materia_curso/1` con `{ "id_materia": 3, "horas_semanales": 5 }`
- **THEN** devuelve el `Curso` 1 con 5 horas para la materia 3, y las horas de la materia en ORIENTACIÓN no cambian

#### Scenario: Quitar una materia del curso
- **WHEN** se llama `DELETE /planificacion/quitar_materia_curso/1/3`
- **THEN** devuelve el `Curso` 1 sin la materia 3

### Requirement: Queries de PLANIFICACIÓN
El servicio SHALL exponer con `GET` y prefijo `/planificacion`:
- `get_posibles_estados_de_propuestas`
- `get_estado_actual_de_propuesta/{id}`
- `get_propuestas`, `get_propuesta/{id}`
- `get_ciclo_lectivo/{id}`, `get_ciclos_lectivos`
- `get_curso_clases/{id}`
- `get_curso/{id}`, `get_cursos`
- `get_clase/{id}`, `get_clases`
- `get_anio_academico/{id}`, `get_anios_academicos`
- `get_cursos_anio_academico/{id}`

Filtros opcionales:
- `get_clases`: `id_profesor`, `id_curso`, `id_propuesta`
- `get_propuestas`: `id_ciclo_lectivo`, `id_estado`
- `get_cursos`: `id_ciclo_lectivo`

Estas queries MUST NOT existir: `get_clases_curso`, `get_materia_clase`, `get_franja_horaria_clase`, `get_profesores_clase`, `get_turno_curso`, `get_franja_horarios_curso`, `get_orientacion_curso`, `get_curso_materias`, `get_suplencia_clase`.

#### Scenario: Curso con datos anidados
- **WHEN** se llama `GET /planificacion/get_curso/{id}`
- **THEN** la respuesta incluye `turno`, `orientacion`, `materias` y `franjas_horarias`, pero no las clases

#### Scenario: Grilla del profesor
- **WHEN** se llama `GET /planificacion/get_clases?id_profesor=12&id_propuesta=5`
- **THEN** devuelve las clases de la propuesta 5 que dicta el profesor 12

#### Scenario: Propuestas de un ciclo
- **WHEN** se llama `GET /planificacion/get_propuestas?id_ciclo_lectivo=2026`
- **THEN** devuelve solo las propuestas del ciclo 2026

### Requirement: Dependencias de PLANIFICACIÓN
El contrato SHALL declarar estas dependencias:
- ORIENTACIÓN `get_materia`, que usan `get_clase`, `get_clases`, `get_curso`, `get_curso_clases` y `asignar_materia_a_curso`
- ORIENTACIÓN `get_orientacion`, que usa `get_curso`
- HORARIOS `get_franja_horaria`, que usan `get_clase` y `get_curso`
- HORARIOS `get_turno`, que usa `get_curso`
- PROFESOR Y SUPLENCIAS `get_profesor`, que usa `get_clase`
- PROFESOR Y SUPLENCIAS `get_suplencia`, que usa `get_clase`
- PROFESOR Y SUPLENCIAS `get_disponibilidad_profesor`, que usa `crear_clase`

#### Scenario: Disponibilidad al crear una clase
- **WHEN** se lee la descripción de `crear_clase`
- **THEN** menciona "Invoca: profesor_suplencias.get_disponibilidad_profesor"

#### Scenario: Materia al armar el plan del curso
- **WHEN** se lee la descripción de `asignar_materia_a_curso`
- **THEN** menciona "Invoca: orientacion.get_materia"
