## MODIFIED Requirements

### Requirement: Commands de PLANIFICACIÓN
El servicio SHALL exponer, con prefijo `/planificacion`:

| Verbo | Operaciones |
|---|---|
| `POST` | `crear_propuesta`, `crear_estado_propuesta`, `crear_ciclo_lectivo`, `crear_curso`, `crear_anio_academico` y `crear_clase` (`201`); `asignar_clase_a_propuesta/{id}`, `asignar_curso_a_anio_academico/{id}` |
| `PUT` | `asignar_estado_a_propuesta/{id}`, `asignar_curso_a_clase/{id}` |

El body de `crear_clase` es `{ descripcion, codigo, id_curso, id_materia, ids_franjas_horarias[], ids_profesores[] }`. `asignar_estado_propuesta` y `asignar_suplencias_a_clase` MUST NOT existir.

#### Scenario: Duplicados eliminados
- **WHEN** se buscan las operaciones del contrato
- **THEN** solo existe `asignar_estado_a_propuesta` y no hay ninguna operación de suplencias

#### Scenario: Cambiar estado
- **WHEN** se llama `PUT /planificacion/asignar_estado_a_propuesta/{id}` con `{ "id_estado": 2 }`
- **THEN** devuelve la `Propuesta` con el estado nuevo anidado
