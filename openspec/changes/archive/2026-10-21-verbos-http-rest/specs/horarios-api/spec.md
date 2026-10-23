## MODIFIED Requirements

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
