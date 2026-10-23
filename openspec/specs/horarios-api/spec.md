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
| `POST` | `crear_dia_lectivo`, `crear_franja_horaria` y `crear_turno` (`201`); `asignar_franja_a_turno/{id}`, con body `{ id_franja_horaria }` |
| `DELETE` | `eliminar_dia_lectivo/{id}` y `eliminar_turno/{id}` (`204`); `eliminar_franja_horaria_turno/{id}/{id_franja_horaria}`, que devuelve el `Turno` |

#### Scenario: Asignar franja
- **WHEN** se llama `POST /horarios/asignar_franja_a_turno/{id}`
- **THEN** devuelve el `Turno` con la franja incluida

#### Scenario: Quitar franja del turno
- **WHEN** se llama `DELETE /horarios/eliminar_franja_horaria_turno/1/7`
- **THEN** devuelve el `Turno` sin la franja 7, y la operación no declara `requestBody`

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

