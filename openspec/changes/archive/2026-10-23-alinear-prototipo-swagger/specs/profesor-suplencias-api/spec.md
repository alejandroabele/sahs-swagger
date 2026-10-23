## MODIFIED Requirements

### Requirement: Queries de PROFESOR Y SUPLENCIAS
El servicio SHALL exponer con `GET` y prefijo `/profesor_suplencias`:
- `get_profesor/{id}`, `get_profesores`
- `get_suplencia/{id}`, `get_suplencias`
- `get_disponibilidad_profesor/{id}`

`get_profesores` MUST aceptar el filtro opcional `id_usuario`. `get_suplencias` MUST aceptar los filtros opcionales `fecha_desde`, `fecha_hasta` (formato `date`; devuelve las suplencias cuyo período se superpone con el rango), `id_profesor` (suplente) e `id_curso` (de alguna de sus clases).

`get_profesor_suplencia` y `get_clase_suplencia` MUST NOT existir.

#### Scenario: Disponibilidad
- **WHEN** se llama `GET /profesor_suplencias/get_disponibilidad_profesor/{id}`
- **THEN** devuelve una lista de `FranjaHorariaResumen`

#### Scenario: Profesor del usuario logueado
- **WHEN** se llama `GET /profesor_suplencias/get_profesores?id_usuario=10`
- **THEN** devuelve una lista con el profesor cuyo `id_usuario` es 10, o una lista vacía

#### Scenario: Suplencias de una semana
- **WHEN** se llama `GET /profesor_suplencias/get_suplencias?fecha_desde=2026-05-11&fecha_hasta=2026-05-15`
- **THEN** devuelve las suplencias con algún día dentro de esa semana
