## MODIFIED Requirements

### Requirement: Commands de USUARIO
El servicio SHALL exponer, con prefijo `/usuario`:

| Verbo | Operaciones |
|---|---|
| `POST` | `login` (body `{ email, contrasenia }`, devuelve `{ token, usuario }`); `crear_usuario` y `crear_rol` (`201`); `asignar_privilegio/{id}` |
| `PUT` | `asignar_rol/{id}` |
| `PATCH` | `cambiar_contrasenia/{id}`, `cambiar_nombre_rol/{id}` |
| `DELETE` | `eliminar_usuario/{id}` y `eliminar_rol/{id}` (`204`); `quitar_privilegio/{id}/{id_privilegio}` (`200`, devuelve el `Rol`) |

`eliminar_rol` MUST aparecer una sola vez y `asignar_roles` MUST NOT existir. `cambiar_email`, `cambiar_nombre`, `crear_privilegio`, `modificar_privilegio` y `eliminar_privilegio` MUST NOT existir, porque los privilegios se cargan por configuración.

#### Scenario: Login sin seguridad
- **WHEN** se consulta el contrato
- **THEN** existe `POST /usuario/login` y el contrato no define `securitySchemes`

#### Scenario: Asignar rol reemplaza el anterior
- **WHEN** se llama `PUT /usuario/asignar_rol/{id}` con `{ "id_rol": 2 }`
- **THEN** devuelve el `Usuario` con `id_rol: 2`

#### Scenario: Quitar un privilegio de un rol
- **WHEN** se llama `DELETE /usuario/quitar_privilegio/2/5`
- **THEN** responde `200` con el `Rol` 2, la operación no tiene body y define `404` para ids inexistentes

#### Scenario: Sin ABM de privilegios
- **WHEN** se buscan en el contrato `crear_privilegio`, `modificar_privilegio`, `eliminar_privilegio`, `cambiar_email` o `cambiar_nombre`
- **THEN** ninguna de esas operaciones existe

### Requirement: Queries de USUARIO
El servicio SHALL exponer con `GET` y prefijo `/usuario`:
- `get_usuario/{id}`, `get_usuarios`
- `get_roles`
- `get_privilegios`
- `get_rol_privilegios/{id}`

`get_usuario_roles`, `get_usuario_privilegios`, `get_rol` y `get_privilegio` MUST NOT existir. Los privilegios de un usuario se obtienen con su rol anidado y `get_rol_privilegios`. El servicio no tiene dependencias.

#### Scenario: Privilegios de un rol
- **WHEN** se llama `GET /usuario/get_rol_privilegios/{id}`
- **THEN** devuelve una lista de `Privilegio`

#### Scenario: Queries eliminadas
- **WHEN** se buscan en el contrato `get_usuario_privilegios`, `get_rol` o `get_privilegio`
- **THEN** ninguna de esas operaciones existe
