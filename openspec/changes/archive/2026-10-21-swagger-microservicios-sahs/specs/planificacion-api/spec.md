## ADDED Requirements

### Requirement: Modelos de PLANIFICACIÓN
`planificacion.json` SHALL definir estos schemas:
- `Propuesta { id_propuesta, nombre, descripcion_propuesta, fecha_creacion, fecha_modificacion, codigo, id_ciclo_lectivo, estado: EstadoPropuesta, ids_clases[] }`
- `EstadoPropuesta { id_estado, nombre, codigo }`, con los estados `borrador` y `validada`
- `CicloLectivo { id_ciclo_lectivo, anio_calendario }`
- `AnioAcademico { id_anio_academico, anio_curricular, codigo }`
- `Curso { id_curso, division, id_anio_academico, id_ciclo_lectivo, id_turno, turno, id_orientacion, orientacion, materias[], franjas_horarias[] }`
- `Clase { id_clase, descripcion, codigo, id_curso, id_materia, materia, ids_franjas_horarias[], franjas_horarias[], ids_profesores[], profesores[], suplencia }`

Los objetos que vienen de otros servicios MUST definirse como schemas resumen locales.

#### Scenario: Clase con varios profesores
- **WHEN** se consulta `GET /planificacion/get_clase/{id}`
- **THEN** la respuesta incluye `profesores` (lista), `materia`, `franjas_horarias` y `suplencia` anidados

### Requirement: Commands de PLANIFICACIÓN
El servicio SHALL exponer con `POST` y prefijo `/planificacion`:
- `crear_propuesta`
- `crear_estado_propuesta`
- `asignar_estado_a_propuesta/{id}`
- `crear_ciclo_lectivo`
- `crear_curso`
- `crear_clase`, con body `{ descripcion, codigo, id_curso, id_materia, ids_franjas_horarias[], ids_profesores[] }`
- `asignar_curso_a_clase/{id}`
- `crear_anio_academico`
- `asignar_clase_a_propuesta/{id}`
- `asignar_curso_a_anio_academico/{id}`

`asignar_estado_propuesta` y `asignar_suplencias_a_clase` MUST NOT existir.

#### Scenario: Duplicados eliminados
- **WHEN** se buscan las operaciones del contrato
- **THEN** solo existe `asignar_estado_a_propuesta` y no hay ninguna operación de suplencias

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

Estas queries MUST NOT existir: `get_clases_curso`, `get_materia_clase`, `get_franja_horaria_clase`, `get_profesores_clase`, `get_turno_curso`, `get_franja_horarios_curso`, `get_orientacion_curso`, `get_curso_materias`, `get_suplencia_clase`.

#### Scenario: Curso con datos anidados
- **WHEN** se llama `GET /planificacion/get_curso/{id}`
- **THEN** la respuesta incluye `turno`, `orientacion`, `materias` y `franjas_horarias`, pero no las clases

### Requirement: Dependencias de PLANIFICACIÓN
El contrato SHALL declarar estas dependencias:
- ORIENTACIÓN `get_materia`, que usan `get_clase`, `get_clases`, `get_curso` y `get_curso_clases`
- ORIENTACIÓN `get_orientacion`, que usa `get_curso`
- HORARIOS `get_franja_horaria`, que usan `get_clase` y `get_curso`
- HORARIOS `get_turno`, que usa `get_curso`
- PROFESOR Y SUPLENCIAS `get_profesor`, que usa `get_clase`
- PROFESOR Y SUPLENCIAS `get_suplencia`, que usa `get_clase`
- PROFESOR Y SUPLENCIAS `get_disponibilidad_profesor`, que usa `crear_clase`

#### Scenario: Disponibilidad al crear una clase
- **WHEN** se lee la descripción de `crear_clase`
- **THEN** menciona "Invoca: profesor_suplencias.get_disponibilidad_profesor"
