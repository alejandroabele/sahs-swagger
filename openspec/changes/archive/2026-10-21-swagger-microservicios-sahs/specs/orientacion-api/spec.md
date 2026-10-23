## ADDED Requirements

### Requirement: Modelos de ORIENTACIÓN
`orientacion.json` SHALL definir estos schemas:
- `Orientacion { id_orientacion, nombre_orientacion, descripcion_orientacion, codigo }`
- `Area { id_area, nombre_area, descripcion_area, id_profesor_coordinador, coordinador: ProfesorResumen }`
- `Materia { id_materia, nombre_materia, descripcion_materia, horas_semanales, id_area (nullable), area (nullable), orientaciones[], id_anio_academico }`

Una materia MAY no tener área.

#### Scenario: Materia sin área
- **WHEN** se consulta una materia sin área
- **THEN** `id_area` y `area` son `null`

### Requirement: Commands de ORIENTACIÓN
El servicio SHALL exponer con `POST` y prefijo `/orientacion`:
- `crear_materia`, `eliminar_materia/{id}`
- `crear_area`, `eliminar_area/{id}`
- `crear_orientacion`, `eliminar_orientacion/{id}`
- `asignar_materia_area/{id}`, `quitar_materia_area/{id}`
- `asignar_materia_orientacion/{id}`, `quitar_materia_orientacion/{id}`
- `asignar_curso_a_orientacion/{id}`
- `asignar_clase_a_materia/{id}`
- `asignar_anio_academico_a_materia/{id}`

#### Scenario: Eliminar materia
- **WHEN** se consulta el contrato
- **THEN** existe `POST /orientacion/eliminar_materia/{id}`

### Requirement: Queries de ORIENTACIÓN
El servicio SHALL exponer con `GET` y prefijo `/orientacion`:
- `get_materia/{id}`, `get_materias`
- `get_orientacion/{id}`, `get_orientaciones`
- `get_area/{id}`, `get_areas`
- `get_materias_orientacion/{id}`
- `get_materias_area/{id}`
- `get_profesores_area/{id}`
- `get_profesores_materia/{id}`

`get_area_materia` y `get_orientacion_materia` MUST NOT existir.

#### Scenario: Profesores de una materia
- **WHEN** se llama `GET /orientacion/get_profesores_materia/{id}`
- **THEN** devuelve una lista de `ProfesorResumen`

### Requirement: Dependencias de ORIENTACIÓN
El contrato SHALL declarar estas dependencias:
- PROFESOR Y SUPLENCIAS `get_profesor`, que usan `get_profesores_materia`, `get_profesores_area` y `get_area`
- PLANIFICACIÓN `get_clase`, que usa `asignar_clase_a_materia`
- PLANIFICACIÓN `get_curso`, que usa `asignar_curso_a_orientacion`
- PLANIFICACIÓN `get_anio_academico`, que usa `asignar_anio_academico_a_materia`

#### Scenario: Dependencias declaradas
- **WHEN** se revisa `info.x-dependencias`
- **THEN** figuran las cuatro dependencias
