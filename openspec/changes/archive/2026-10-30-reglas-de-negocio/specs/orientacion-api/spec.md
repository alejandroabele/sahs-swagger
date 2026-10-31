## MODIFIED Requirements

### Requirement: Queries de ORIENTACIÓN
El servicio SHALL exponer con `GET` y prefijo `/orientacion`:
- `get_materia` (`/materias/{id}`), `get_materias` (`/materias`)
- `get_orientacion` (`/orientaciones/{id}`), `get_orientaciones` (`/orientaciones`)
- `get_area` (`/areas/{id}`), `get_areas` (`/areas`)
- `get_materias_orientacion` (`/orientaciones/{id}/materias`)
- `get_materias_area` (`/areas/{id}/materias`)
- `get_profesores_area` (`/areas/{id}/profesores`)
- `get_profesores_materia` (`/materias/{id}/profesores`)

`get_profesores_materia` y `get_profesores_area` MUST devolver solo profesores con `activo: true`: un profesor dado de baja no está disponible para ninguna materia.

`get_area_materia` y `get_orientacion_materia` MUST NOT existir.

#### Scenario: Profesores de una materia
- **WHEN** se llama `GET /orientacion/materias/{id}/profesores`
- **THEN** devuelve una lista de `ProfesorResumen`

#### Scenario: Profesor dado de baja
- **WHEN** el profesor 12 tiene habilitada la materia 3 y está inactivo
- **THEN** `GET /orientacion/materias/3/profesores` no lo incluye
