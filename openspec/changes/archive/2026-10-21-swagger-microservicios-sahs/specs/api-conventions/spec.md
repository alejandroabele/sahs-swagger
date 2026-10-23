## ADDED Requirements

### Requirement: Un contrato OpenAPI por servicio
Cada uno de los 6 servicios SHALL tener su propio archivo OpenAPI 3.0.3 en JSON, autocontenido y válido, en `specs/<servicio>.json`.

#### Scenario: Validación de los contratos
- **WHEN** se valida cada archivo de `specs/` con un linter de OpenAPI
- **THEN** los 6 archivos son válidos y no tienen errores

### Requirement: Una ruta por función
Cada función del documento SHALL publicarse en `/<prefijo>/<nombre_funcion>`, con `operationId` igual al nombre de la función. Los commands MUST usar `POST` (incluidos los `eliminar_*`) y las queries MUST usar `GET`. Los nombres MUST ir en snake_case, sin tildes ni `ñ` (`ñ` → `ni`).

#### Scenario: Command
- **WHEN** el documento lista el command `cambiar_email()` en USUARIO
- **THEN** el contrato tiene `POST /usuario/cambiar_email/{id}` con `operationId: cambiar_email`

#### Scenario: Nombre con tilde
- **WHEN** el documento lista `get_día_lectivo()`
- **THEN** la ruta es `GET /horarios/get_dia_lectivo/{id}`

### Requirement: Identificadores en la ruta
El id de la entidad principal de la operación SHALL ir como parámetro de ruta `{id}`. Los ids secundarios y los demás datos MUST ir en el body JSON.

#### Scenario: Asignación entre entidades
- **WHEN** se asigna un privilegio a un rol
- **THEN** la operación es `POST /usuario/asignar_privilegio/{id}`, con `{id}` = id del rol y el body `{ "id_privilegio": <n> }`

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
