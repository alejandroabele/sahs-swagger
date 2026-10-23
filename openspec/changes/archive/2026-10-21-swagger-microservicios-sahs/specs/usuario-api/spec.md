## ADDED Requirements

### Requirement: Modelos de USUARIO
`usuario.json` SHALL definir estos schemas:
- `Usuario { id_usuario, nombre_user, email, contrasenia (writeOnly), id_rol, rol: Rol }`
- `Rol { id_rol, nombre_rol }`
- `Privilegio { id_privilegio, descripcion_privilegio }`

Cada usuario MUST tener un solo rol.

#### Scenario: Consulta de usuario
- **WHEN** se llama `GET /usuario/get_usuario/{id}`
- **THEN** la respuesta incluye el `rol` anidado y no incluye `contrasenia`

### Requirement: Commands de USUARIO
El servicio SHALL exponer con `POST` y prefijo `/usuario`:
- `login`, con body `{ email, contrasenia }`, que devuelve `{ token, usuario }`
- `crear_usuario`
- `asignar_rol/{id}`
- `cambiar_contrasenia/{id}`
- `cambiar_email/{id}`
- `cambiar_nombre/{id}`
- `eliminar_usuario/{id}`
- `crear_rol`
- `asignar_privilegio/{id}`
- `eliminar_rol/{id}`
- `cambiar_nombre_rol/{id}`
- `crear_privilegio`
- `modificar_privilegio/{id}`
- `eliminar_privilegio/{id}`

`eliminar_rol` MUST aparecer una sola vez y `asignar_roles` MUST NOT existir.

#### Scenario: Login sin seguridad
- **WHEN** se consulta el contrato
- **THEN** `login` existe y el contrato no define `securitySchemes`

### Requirement: Queries de USUARIO
El servicio SHALL exponer con `GET` y prefijo `/usuario`:
- `get_usuario/{id}`, `get_usuarios`
- `get_rol/{id}`, `get_roles`
- `get_privilegio/{id}`, `get_privilegios`
- `get_usuario_privilegios/{id}`
- `get_rol_privilegios/{id}`

`get_usuario_roles` MUST NOT existir. El servicio no tiene dependencias.

#### Scenario: Privilegios de un rol
- **WHEN** se llama `GET /usuario/get_rol_privilegios/{id}`
- **THEN** devuelve una lista de `Privilegio`
