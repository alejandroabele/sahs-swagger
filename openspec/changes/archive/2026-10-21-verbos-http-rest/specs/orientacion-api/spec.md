## MODIFIED Requirements

### Requirement: Commands de ORIENTACIÓN
El servicio SHALL exponer, con prefijo `/orientacion`:

| Verbo | Operaciones |
|---|---|
| `POST` | `crear_materia`, `crear_area` y `crear_orientacion` (`201`); `asignar_materia_area/{id}`, `asignar_materia_orientacion/{id}`, `asignar_curso_a_orientacion/{id}`, `asignar_clase_a_materia/{id}` |
| `PUT` | `asignar_anio_academico_a_materia/{id}` |
| `DELETE` | `eliminar_materia/{id}`, `eliminar_area/{id}` y `eliminar_orientacion/{id}` (`204`); `quitar_materia_area/{id}/{id_materia}` y `quitar_materia_orientacion/{id}/{id_materia}`, que devuelven la `Materia` |

#### Scenario: Eliminar materia
- **WHEN** se consulta el contrato
- **THEN** existe `DELETE /orientacion/eliminar_materia/{id}` con una respuesta `204`

#### Scenario: Quitar materia de la orientación
- **WHEN** se llama `DELETE /orientacion/quitar_materia_orientacion/2/3`
- **THEN** devuelve la `Materia` 3 sin la orientación 2
