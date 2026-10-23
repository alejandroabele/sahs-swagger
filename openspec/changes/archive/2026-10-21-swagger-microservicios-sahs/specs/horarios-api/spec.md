## ADDED Requirements

### Requirement: Modelos de HORARIOS
`horarios.json` SHALL definir estos schemas:
- `DiaLectivo { id_dia_lectivo, nombre_dia_lectivo }`, donde el día lectivo es un día de la semana
- `FranjaHoraria { id_franja_horaria, hora_inicio, hora_fin, descripcion, es_recreo, id_dia_lectivo, dia_lectivo: DiaLectivo }`, con las horas en formato `HH:mm`
- `Turno { id_turno, nombre, cantidad_franjas_total, franjas_horarias: FranjaHoraria[] }`

#### Scenario: Recreo
- **WHEN** se crea una franja con `es_recreo: true`
- **THEN** el contrato acepta el campo y lo devuelve en la franja

### Requirement: Commands de HORARIOS
El servicio SHALL exponer con `POST` y prefijo `/horarios`:
- `crear_dia_lectivo`, `eliminar_dia_lectivo/{id}`
- `crear_franja_horaria`
- `crear_turno`, `eliminar_turno/{id}`
- `asignar_franja_a_turno/{id}`, con body `{ id_franja_horaria }`
- `eliminar_franja_horaria_turno/{id}`, con body `{ id_franja_horaria }`

#### Scenario: Asignar franja
- **WHEN** se llama `POST /horarios/asignar_franja_a_turno/{id}`
- **THEN** devuelve el `Turno` con la franja incluida

### Requirement: Queries de HORARIOS
El servicio SHALL exponer con `GET` y prefijo `/horarios`:
- `get_dia_lectivo/{id}`, `get_dias_lectivos`
- `get_franja_horaria_dia_lectivo/{id}`
- `get_turno/{id}`, `get_turnos`
- `get_franja_horaria/{id}`, `get_franjas_horarias`

`get_nombre_dia_lectivo` y `get_cantidad_franjas_total` MUST NOT existir. El servicio no tiene dependencias.

#### Scenario: Franjas de un día
- **WHEN** se llama `GET /horarios/get_franja_horaria_dia_lectivo/{id}`
- **THEN** devuelve una lista de `FranjaHoraria`
