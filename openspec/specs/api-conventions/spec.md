# api-conventions Specification

## Purpose
TBD - created by archiving change swagger-microservicios-sahs. Update Purpose after archive.
## Requirements
### Requirement: Un contrato OpenAPI por servicio
Cada uno de los 6 servicios SHALL tener su propio archivo OpenAPI 3.0.3 en JSON, autocontenido y válido, en `specs/<servicio>.json`.

#### Scenario: Validación de los contratos
- **WHEN** se valida cada archivo de `specs/` con un linter de OpenAPI
- **THEN** los 6 archivos son válidos y no tienen errores

### Requirement: Una ruta por función
Cada función del documento SHALL publicarse en `/<prefijo>/<nombre_funcion>`, con `operationId` igual al nombre de la función. El método HTTP MUST corresponder a lo que hace la operación:
- `POST` para `crear_*` (responde `201`), para los `asignar_*` que agregan un elemento a una colección y para las acciones que no son CRUD;
- `PUT` para los `asignar_*` que reemplazan un valor único o una lista completa, y para los `editar_*`, que reemplazan todos los datos editables de la entidad;
- `PATCH` para `cambiar_*` y `modificar_*`;
- `DELETE` para `eliminar_*` y `quitar_*`;
- `GET` para las queries y para las operaciones sin efectos.

Los nombres MUST ir en snake_case, sin tildes ni `ñ` (`ñ` → `ni`).

#### Scenario: Cambio parcial
- **WHEN** el documento lista el command `cambiar_email()` en USUARIO
- **THEN** el contrato tiene `PATCH /usuario/cambiar_email/{id}` con `operationId: cambiar_email`

#### Scenario: Creación
- **WHEN** el documento lista `crear_usuario()`
- **THEN** el contrato tiene `POST /usuario/crear_usuario` con una respuesta `201`

#### Scenario: Eliminación
- **WHEN** el documento lista `eliminar_usuario()`
- **THEN** el contrato tiene `DELETE /usuario/eliminar_usuario/{id}` con una respuesta `204`

#### Scenario: Nombre con tilde
- **WHEN** el documento lista `get_día_lectivo()`
- **THEN** la ruta es `GET /horarios/get_dia_lectivo/{id}`

#### Scenario: Edición completa
- **WHEN** el documento lista `editar_profesor()` en PROFESOR Y SUPLENCIAS
- **THEN** el contrato tiene `PUT /profesor_suplencias/editar_profesor/{id}` con una respuesta `200`

### Requirement: Identificadores en la ruta
El id de la entidad principal de la operación SHALL ir como parámetro de ruta `{id}`. Los ids secundarios y los demás datos MUST ir en el body JSON, salvo en las operaciones `DELETE` que quitan un elemento de una colección: ahí el id secundario MUST ir como segundo parámetro de ruta, con el nombre del campo (`{id_materia}`, `{id_franja_horaria}`). Las operaciones `GET` MUST NOT llevar body; sus datos adicionales van como parámetros de query.

#### Scenario: Asignación entre entidades
- **WHEN** se asigna un privilegio a un rol
- **THEN** la operación es `POST /usuario/asignar_privilegio/{id}`, con `{id}` = id del rol y el body `{ "id_privilegio": <n> }`

#### Scenario: Quitar de una colección
- **WHEN** se quita una materia de un área
- **THEN** la operación es `DELETE /orientacion/quitar_materia_area/{id}/{id_materia}`, sin body

### Requirement: Datos relacionados anidados
Una relación con un solo elemento SHALL devolverse anidada en la respuesta de la entidad, y no MUST existir una query separada para obtenerla. Las relaciones con varios elementos MAY tener su propia query de listado.

#### Scenario: Materia de una clase
- **WHEN** se consulta `GET /planificacion/get_clase/{id}`
- **THEN** la respuesta incluye el objeto `materia`, y no existe `get_materia_clase`

### Requirement: Errores, health check y datos sensibles
Cada contrato SHALL incluir:
- `GET /actuator/health`, que responde `{ "status": "UP" }`;
- un schema `Error { codigo, mensaje }`, usado en las respuestas `400` (operaciones con body) y `404` (operaciones con `{id}`).

Las contraseñas MUST ser `writeOnly`.

#### Scenario: Recurso inexistente
- **WHEN** se pide `get_usuario/{id}` con un id que no existe
- **THEN** el contrato documenta una respuesta `404` con el schema `Error`

### Requirement: Dependencias documentadas
Cada contrato SHALL declarar en `info.x-dependencias` los endpoints de otros servicios que consume y qué operaciones los usan. La `description` de cada una de esas operaciones MUST mencionar "Invoca: <servicio>.<endpoint>".

#### Scenario: Servicio sin dependencias
- **WHEN** el servicio no consume a ningún otro (USUARIO, HORARIOS)
- **THEN** `x-dependencias` es una lista vacía

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

