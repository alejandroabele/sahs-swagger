## MODIFIED Requirements

### Requirement: Una ruta por función
Cada función del documento SHALL publicarse en `/<prefijo>/<nombre_funcion>`, con `operationId` igual al nombre de la función. El método HTTP MUST corresponder a lo que hace la operación:
- `POST` para `crear_*` (responde `201`), para los `asignar_*` que agregan un elemento a una colección y para las acciones que no son CRUD;
- `PUT` para los `asignar_*` que reemplazan un valor único o una lista completa;
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

### Requirement: Identificadores en la ruta
El id de la entidad principal de la operación SHALL ir como parámetro de ruta `{id}`. Los ids secundarios y los demás datos MUST ir en el body JSON, salvo en las operaciones `DELETE` que quitan un elemento de una colección: ahí el id secundario MUST ir como segundo parámetro de ruta, con el nombre del campo (`{id_materia}`, `{id_franja_horaria}`). Las operaciones `GET` MUST NOT llevar body; sus datos adicionales van como parámetros de query.

#### Scenario: Asignación entre entidades
- **WHEN** se asigna un privilegio a un rol
- **THEN** la operación es `POST /usuario/asignar_privilegio/{id}`, con `{id}` = id del rol y el body `{ "id_privilegio": <n> }`

#### Scenario: Quitar de una colección
- **WHEN** se quita una materia de un área
- **THEN** la operación es `DELETE /orientacion/quitar_materia_area/{id}/{id_materia}`, sin body
