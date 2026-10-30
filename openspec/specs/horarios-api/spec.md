# horarios-api Specification

## Purpose
TBD - created by archiving change swagger-microservicios-sahs. Update Purpose after archive.
## Requirements
### Requirement: Modelos de HORARIOS
`horarios.json` SHALL definir estos schemas:
- `DiaLectivo { id_dia_lectivo, nombre_dia_lectivo }`, donde el día lectivo es un día de la semana
- `FranjaHoraria { id_franja_horaria, hora_inicio, hora_fin, descripcion, es_recreo, id_dia_lectivo, dia_lectivo: DiaLectivo }`, con las horas en formato `HH:mm`
- `Turno { id_turno, nombre, cantidad_franjas_total, franjas_horarias: FranjaHoraria[] }`

#### Scenario: Recreo
- **WHEN** se crea una franja con `es_recreo: true`
- **THEN** el contrato acepta el campo y lo devuelve en la franja

### Requirement: Commands de HORARIOS
El servicio SHALL exponer, con prefijo `/horarios`:

| Verbo | Operaciones |
|---|---|
| `POST` | `crear_dia_lectivo` (`/dias-lectivos`), `crear_franja_horaria` (`/franjas-horarias`) y `crear_turno` (`/turnos`) (`201`); `asignar_franja_a_turno` (`/turnos/{id}/franjas-horarias`), con body `{ id_franja_horaria }` |
| `DELETE` | `eliminar_dia_lectivo` (`/dias-lectivos/{id}`) y `eliminar_turno` (`/turnos/{id}`) (`204`); `eliminar_franja_horaria_turno` (`/turnos/{id}/franjas-horarias/{id_franja_horaria}`), que devuelve el `Turno` |

#### Scenario: Asignar franja
- **WHEN** se llama `POST /horarios/turnos/{id}/franjas-horarias`
- **THEN** devuelve el `Turno` con la franja incluida

#### Scenario: Quitar franja del turno
- **WHEN** se llama `DELETE /horarios/turnos/1/franjas-horarias/7`
- **THEN** devuelve el `Turno` sin la franja 7, y la operación no declara `requestBody`

### Requirement: Queries de HORARIOS
El servicio SHALL exponer con `GET` y prefijo `/horarios`:
- `get_dia_lectivo` (`/dias-lectivos/{id}`), `get_dias_lectivos` (`/dias-lectivos`)
- `get_franja_horaria_dia_lectivo` (`/dias-lectivos/{id}/franjas-horarias`)
- `get_turno` (`/turnos/{id}`), `get_turnos` (`/turnos`)
- `get_franja_horaria` (`/franjas-horarias/{id}`), `get_franjas_horarias` (`/franjas-horarias`)

`get_nombre_dia_lectivo` y `get_cantidad_franjas_total` MUST NOT existir. El servicio no tiene dependencias.

#### Scenario: Franjas de un día
- **WHEN** se llama `GET /horarios/dias-lectivos/{id}/franjas-horarias`
- **THEN** devuelve una lista de `FranjaHoraria`

