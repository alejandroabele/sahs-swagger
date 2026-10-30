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
- **WHEN** se llama `GET /orientacion/materias/{id}`
- **THEN** la respuesta incluye `id_orientacion` y el objeto `orientacion` anidado, y no incluye `orientaciones`

### Requirement: Commands de ORIENTACIÓN
El servicio SHALL exponer, con prefijo `/orientacion`:

| Verbo | Operaciones |
|---|---|
| `POST` | `crear_materia` (`/materias`), `crear_area` (`/areas`) y `crear_orientacion` (`/orientaciones`) (`201`); `asignar_materia_area` (`/areas/{id}/materias`), `asignar_curso_a_orientacion` (`/orientaciones/{id}/cursos`), `asignar_clase_a_materia` (`/materias/{id}/clases`) |
| `PUT` | `asignar_anio_academico_a_materia` (`/materias/{id}/anio-academico`), `asignar_materia_orientacion` (`/materias/{id}/orientacion`) |
| `DELETE` | `eliminar_materia` (`/materias/{id}`), `eliminar_area` (`/areas/{id}`) y `eliminar_orientacion` (`/orientaciones/{id}`) (`204`); `quitar_materia_area` (`/areas/{id}/materias/{id_materia}`), que devuelve la `Materia` |

El body de `crear_materia` MUST incluir `id_orientacion` como obligatorio. En `asignar_materia_orientacion` (`PUT /orientacion/materias/{id}/orientacion`), `{id}` es la materia y el body es `{ id_orientacion }`: reemplaza la orientación de la materia. `quitar_materia_orientacion` MUST NOT existir.

#### Scenario: Eliminar materia
- **WHEN** se consulta el contrato
- **THEN** existe `DELETE /orientacion/materias/{id}` con una respuesta `204`

#### Scenario: Cambiar la orientación de una materia
- **WHEN** se llama `PUT /orientacion/materias/3/orientacion` con `{ "id_orientacion": 2 }`
- **THEN** devuelve la `Materia` 3 con `id_orientacion: 2`

#### Scenario: Sin quitar orientación
- **WHEN** se buscan las operaciones del contrato
- **THEN** no existe `quitar_materia_orientacion`

### Requirement: Queries de ORIENTACIÓN
El servicio SHALL exponer con `GET` y prefijo `/orientacion`:
- `get_materia` (`/materias/{id}`), `get_materias` (`/materias`)
- `get_orientacion` (`/orientaciones/{id}`), `get_orientaciones` (`/orientaciones`)
- `get_area` (`/areas/{id}`), `get_areas` (`/areas`)
- `get_materias_orientacion` (`/orientaciones/{id}/materias`)
- `get_materias_area` (`/areas/{id}/materias`)
- `get_profesores_area` (`/areas/{id}/profesores`)
- `get_profesores_materia` (`/materias/{id}/profesores`)

`get_area_materia` y `get_orientacion_materia` MUST NOT existir.

#### Scenario: Profesores de una materia
- **WHEN** se llama `GET /orientacion/materias/{id}/profesores`
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

### Requirement: Plan de estudios en tres niveles
ORIENTACIÓN SHALL publicar `get_plan_de_estudios` en `GET /orientacion/plan-de-estudios`, que devuelve el plan armado en tres niveles: año académico (`id_anio_academico`, `anio_curricular`) → orientaciones (`id_orientacion`, `nombre_orientacion`, `codigo`) → materias (`id_materia`, `nombre_materia`, `horas_semanales`, `id_area`, `nombre_area`), ordenado por año, orientación y nombre. El nombre del año MUST pedirlo el servicio a `planificacion.get_anios_academicos`. Acepta los filtros opcionales `id_orientacion` (esa orientación aparece en todos los años, aunque no tenga materias) e `id_anio_academico`. Sin filtros, solo trae los años y orientaciones que tienen materias. Las pantallas que agrupan materias por año y orientación MUST usar esta operación y MUST NOT cruzar `get_materias` con `get_anios_academicos` en el cliente.

#### Scenario: Plan completo
- **WHEN** se llama `GET /orientacion/plan-de-estudios`
- **THEN** cada elemento es un año con sus orientaciones y sus materias, y la suma de las materias es igual a `get_materias`

#### Scenario: Plan de una orientación
- **WHEN** se llama `GET /orientacion/plan-de-estudios?id_orientacion=1`
- **THEN** cada año trae solo la orientación 1

#### Scenario: Selector de materias habilitadas
- **WHEN** se abre la ficha de un profesor en la web
- **THEN** el selector de materias habilitadas se arma con una sola llamada a `get_plan_de_estudios`, sin `get_materias` ni `get_anios_academicos`

