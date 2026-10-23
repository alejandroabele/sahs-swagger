## ADDED Requirements

### Requirement: Filtros opcionales en los listados
Los listados (`get_*` sin `{id}`) MAY recibir filtros como parámetros de query opcionales (`required: false`), con el nombre del campo que filtran (`id_profesor`, `periodo`, `fecha_desde`…). Si se pasan varios, se combinan con AND. Si no se pasa ninguno, el listado devuelve todos los elementos. Un listado con filtros MUST documentar la respuesta `400` para filtros inválidos.

#### Scenario: Listado filtrado
- **WHEN** se llama `GET /planificacion/get_clases?id_profesor=12`
- **THEN** devuelve solo las clases en las que el profesor 12 figura en `ids_profesores`

#### Scenario: Listado sin filtros
- **WHEN** se llama `GET /planificacion/get_clases` sin parámetros
- **THEN** devuelve todas las clases

#### Scenario: Filtro opcional en el contrato
- **WHEN** se revisa el parámetro `id_profesor` de `get_clases` en `planificacion.json`
- **THEN** tiene `in: query` y `required: false`
