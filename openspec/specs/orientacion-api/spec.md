# orientacion-api Specification

## Purpose
TBD - created by archiving change swagger-microservicios-sahs. Update Purpose after archive.
## Requirements
### Requirement: Modelos de ORIENTACIÓN
`orientacion.json` SHALL definir estos schemas:
- `Orientacion { id_orientacion, nombre_orientacion, descripcion_orientacion, codigo }`
- `Area { id_area, nombre_area, descripcion_area, id_profesor_coordinador, coordinador: ProfesorResumen }`
- `Materia { id_materia, nombre_materia, descripcion_materia, horas_semanales, id_area (nullable), area (nullable), id_orientacion, orientacion: Orientacion, id_anio_academico }`

Una materia MAY no tener área. Toda materia MUST tener exactamente una orientación: dos materias con el mismo nombre en distintas orientaciones son materias distintas. `Materia` MUST NOT tener `orientaciones[]`.

#### Scenario: Materia sin área
- **WHEN** se consulta una materia sin área
- **THEN** `id_area` y `area` son `null`

#### Scenario: Materia con su orientación
- **WHEN** se llama `GET /orientacion/get_materia/{id}`
- **THEN** la respuesta incluye `id_orientacion` y el objeto `orientacion` anidado, y no incluye `orientaciones`

### Requirement: Commands de ORIENTACIÓN
El servicio SHALL exponer, con prefijo `/orientacion`:

| Verbo | Operaciones |
|---|---|
| `POST` | `crear_materia`, `crear_area` y `crear_orientacion` (`201`); `asignar_materia_area/{id}`, `asignar_curso_a_orientacion/{id}`, `asignar_clase_a_materia/{id}` |
| `PUT` | `asignar_anio_academico_a_materia/{id}`, `asignar_materia_orientacion/{id}` |
| `DELETE` | `eliminar_materia/{id}`, `eliminar_area/{id}` y `eliminar_orientacion/{id}` (`204`); `quitar_materia_area/{id}/{id_materia}`, que devuelve la `Materia` |

El body de `crear_materia` MUST incluir `id_orientacion` como obligatorio. En `asignar_materia_orientacion/{id}`, `{id}` es la materia y el body es `{ id_orientacion }`: reemplaza la orientación de la materia. `quitar_materia_orientacion` MUST NOT existir.

#### Scenario: Eliminar materia
- **WHEN** se consulta el contrato
- **THEN** existe `DELETE /orientacion/eliminar_materia/{id}` con una respuesta `204`

#### Scenario: Cambiar la orientación de una materia
- **WHEN** se llama `PUT /orientacion/asignar_materia_orientacion/3` con `{ "id_orientacion": 2 }`
- **THEN** devuelve la `Materia` 3 con `id_orientacion: 2`

#### Scenario: Sin quitar orientación
- **WHEN** se buscan las operaciones del contrato
- **THEN** no existe `quitar_materia_orientacion`

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

