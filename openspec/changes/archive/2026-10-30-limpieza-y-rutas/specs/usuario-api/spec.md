## MODIFIED Requirements

### Requirement: Modelos de USUARIO
`usuario.json` SHALL definir estos schemas:
- `Usuario { id_usuario, nombre_user, email, contrasenia (writeOnly), id_rol, rol: Rol }`
- `Rol { id_rol, nombre_rol }`
- `Privilegio { id_privilegio, descripcion_privilegio }`

Cada usuario MUST tener un solo rol.

#### Scenario: Consulta de usuario
- **WHEN** se llama `GET /usuario/usuarios/{id}`
- **THEN** la respuesta incluye el `rol` anidado y no incluye `contrasenia`

### Requirement: Commands de USUARIO
El servicio SHALL exponer, con prefijo `/usuario`:

| Verbo | Operaciones |
|---|---|
| `POST` | `login` (`/login`, body `{ email, contrasenia }`, devuelve `{ token, usuario }`); `crear_usuario` (`/usuarios`) y `crear_rol` (`/roles`) (`201`); `asignar_privilegio` (`/roles/{id}/privilegios`) |
| `PUT` | `asignar_rol` (`/usuarios/{id}/rol`), `editar_usuario` (`/usuarios/{id}`, body `{ nombre_user, email }`) |
| `PATCH` | `cambiar_contrasenia` (`/usuarios/{id}/contrasenia`), `cambiar_nombre_rol` (`/roles/{id}`) |
| `DELETE` | `eliminar_usuario` (`/usuarios/{id}`) y `eliminar_rol` (`/roles/{id}`) (`204`); `quitar_privilegio` (`/roles/{id}/privilegios/{id_privilegio}`, `200`, devuelve el `Rol`) |

`editar_usuario` MUST NOT cambiar la contraseña ni el rol. `eliminar_rol` MUST aparecer una sola vez y `asignar_roles` MUST NOT existir. `cambiar_email`, `cambiar_nombre`, `crear_privilegio`, `modificar_privilegio` y `eliminar_privilegio` MUST NOT existir, porque los privilegios se cargan por configuración y el nombre y el email se cambian con `editar_usuario`.

#### Scenario: Login sin seguridad
- **WHEN** se consulta el contrato
- **THEN** existe `POST /usuario/login` y el contrato no define `securitySchemes`

#### Scenario: Asignar rol reemplaza el anterior
- **WHEN** se llama `PUT /usuario/usuarios/{id}/rol` con `{ "id_rol": 2 }`
- **THEN** devuelve el `Usuario` con `id_rol: 2`

#### Scenario: Editar usuario
- **WHEN** se llama `PUT /usuario/usuarios/10` con `{ "nombre_user": "jramirez", "email": "juan.ramirez@donbosco.edu.ar" }`
- **THEN** devuelve el `Usuario` 10 con esos datos, el mismo `id_rol` y sin `contrasenia`

#### Scenario: Quitar un privilegio de un rol
- **WHEN** se llama `DELETE /usuario/roles/2/privilegios/5`
- **THEN** responde `200` con el `Rol` 2, la operación no tiene body y define `404` para ids inexistentes

#### Scenario: Sin ABM de privilegios
- **WHEN** se buscan en el contrato `crear_privilegio`, `modificar_privilegio`, `eliminar_privilegio`, `cambiar_email` o `cambiar_nombre`
- **THEN** ninguna de esas operaciones existe

### Requirement: Queries de USUARIO
El servicio SHALL exponer con `GET` y prefijo `/usuario`:
- `get_usuario` (`/usuarios/{id}`), `get_usuarios` (`/usuarios`)
- `get_roles` (`/roles`)
- `get_privilegios` (`/privilegios`)
- `get_rol_privilegios` (`/roles/{id}/privilegios`)

`get_usuario_roles`, `get_usuario_privilegios`, `get_rol` y `get_privilegio` MUST NOT existir. Los privilegios de un usuario se obtienen con su rol anidado y `get_rol_privilegios`. El servicio no tiene dependencias.

#### Scenario: Privilegios de un rol
- **WHEN** se llama `GET /usuario/roles/{id}/privilegios`
- **THEN** devuelve una lista de `Privilegio`

#### Scenario: Queries eliminadas
- **WHEN** se buscan en el contrato `get_usuario_privilegios`, `get_rol` o `get_privilegio`
- **THEN** ninguna de esas operaciones existe
