## MODIFIED Requirements

### Requirement: Commands de USUARIO
El servicio SHALL exponer, con prefijo `/usuario`:

| Verbo | Operaciones |
|---|---|
| `POST` | `login` (body `{ email, contrasenia }`, devuelve `{ token, usuario }`); `crear_usuario`, `crear_rol` y `crear_privilegio` (`201`); `asignar_privilegio/{id}` |
| `PUT` | `asignar_rol/{id}` |
| `PATCH` | `cambiar_contrasenia/{id}`, `cambiar_email/{id}`, `cambiar_nombre/{id}`, `cambiar_nombre_rol/{id}`, `modificar_privilegio/{id}` |
| `DELETE` | `eliminar_usuario/{id}`, `eliminar_rol/{id}` y `eliminar_privilegio/{id}` (`204`) |

`eliminar_rol` MUST aparecer una sola vez y `asignar_roles` MUST NOT existir.

#### Scenario: Login sin seguridad
- **WHEN** se consulta el contrato
- **THEN** existe `POST /usuario/login` y el contrato no define `securitySchemes`

#### Scenario: Asignar rol reemplaza el anterior
- **WHEN** se llama `PUT /usuario/asignar_rol/{id}` con `{ "id_rol": 2 }`
- **THEN** devuelve el `Usuario` con `id_rol: 2`
