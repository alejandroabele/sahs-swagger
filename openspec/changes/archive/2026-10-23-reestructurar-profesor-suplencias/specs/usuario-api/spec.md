## MODIFIED Requirements

### Requirement: Commands de USUARIO
El servicio SHALL exponer, con prefijo `/usuario`:

| Verbo | Operaciones |
|---|---|
| `POST` | `login` (body `{ email, contrasenia }`, devuelve `{ token, usuario }`); `crear_usuario` y `crear_rol` (`201`); `asignar_privilegio/{id}` |
| `PUT` | `asignar_rol/{id}`, `editar_usuario/{id}` (body `{ nombre_user, email }`) |
| `PATCH` | `cambiar_contrasenia/{id}`, `cambiar_nombre_rol/{id}` |
| `DELETE` | `eliminar_usuario/{id}` y `eliminar_rol/{id}` (`204`); `quitar_privilegio/{id}/{id_privilegio}` (`200`, devuelve el `Rol`) |

`editar_usuario` MUST NOT cambiar la contraseña ni el rol. `eliminar_rol` MUST aparecer una sola vez y `asignar_roles` MUST NOT existir. `cambiar_email`, `cambiar_nombre`, `crear_privilegio`, `modificar_privilegio` y `eliminar_privilegio` MUST NOT existir, porque los privilegios se cargan por configuración y el nombre y el email se cambian con `editar_usuario`.

#### Scenario: Login sin seguridad
- **WHEN** se consulta el contrato
- **THEN** existe `POST /usuario/login` y el contrato no define `securitySchemes`

#### Scenario: Asignar rol reemplaza el anterior
- **WHEN** se llama `PUT /usuario/asignar_rol/{id}` con `{ "id_rol": 2 }`
- **THEN** devuelve el `Usuario` con `id_rol: 2`

#### Scenario: Editar usuario
- **WHEN** se llama `PUT /usuario/editar_usuario/10` con `{ "nombre_user": "jramirez", "email": "juan.ramirez@donbosco.edu.ar" }`
- **THEN** devuelve el `Usuario` 10 con esos datos, el mismo `id_rol` y sin `contrasenia`

#### Scenario: Quitar un privilegio de un rol
- **WHEN** se llama `DELETE /usuario/quitar_privilegio/2/5`
- **THEN** responde `200` con el `Rol` 2, la operación no tiene body y define `404` para ids inexistentes

#### Scenario: Sin ABM de privilegios
- **WHEN** se buscan en el contrato `crear_privilegio`, `modificar_privilegio`, `eliminar_privilegio`, `cambiar_email` o `cambiar_nombre`
- **THEN** ninguna de esas operaciones existe
