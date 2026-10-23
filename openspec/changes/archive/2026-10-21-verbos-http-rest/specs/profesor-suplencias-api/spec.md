## MODIFIED Requirements

### Requirement: Commands de PROFESOR Y SUPLENCIAS
El servicio SHALL exponer, con prefijo `/profesor_suplencias`:

| Verbo | Operaciones |
|---|---|
| `POST` | `crear_suplencia` y `crear_profesor` (`201`; `crear_profesor` también crea el usuario asociado); `asignar_suplencia_a_clase/{id}`, `asignar_materias_area/{id}` |
| `PUT` | `asignar_profesor_suplencia/{id}`, `asignar_rol_profesor/{id}`, `asignar_legajo/{id}`, `asignar_cargo/{id}`, `asignar_materias_habilitadas/{id}`, `asignar_disponibilidad/{id}` (body `{ ids_franjas_horarias[] }`) |
| `PATCH` | `cambiar_correo/{id}`, `cambiar_direccion/{id}`, `cambiar_cargo/{id}` |
| `DELETE` | `eliminar_cargo/{id}` |

#### Scenario: Eliminar cargo
- **WHEN** se llama `DELETE /profesor_suplencias/eliminar_cargo/{id}`
- **THEN** devuelve el `Profesor` con `cargo_asociado: null`

#### Scenario: Disponibilidad reemplaza la anterior
- **WHEN** se llama `PUT /profesor_suplencias/asignar_disponibilidad/{id}` con `{ "ids_franjas_horarias": [7, 8] }`
- **THEN** la disponibilidad del profesor queda formada solo por las franjas 7 y 8
