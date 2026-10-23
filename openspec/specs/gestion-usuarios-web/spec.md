# gestion-usuarios-web Specification

## Purpose
Gestión de usuarios, roles y privilegios en el prototipo: el inicio armado con los privilegios del rol de cualquier usuario, la pantalla Usuarios y roles (A17) y el cambio de la propia contraseña (A18).
## Requirements
### Requirement: Pestaña Usuarios
La pantalla Usuarios (A17) SHALL tener una pestaña "Usuarios" con la tabla de usuarios (`get_usuarios`: nombre de usuario, email y rol). Desde ahí se puede dar de alta un usuario (`crear_usuario`), cambiar su rol con un selector de un solo valor (`asignar_rol`), resetear su contraseña (`cambiar_contrasenia`) y eliminarlo (`eliminar_usuario`, con confirmación dentro de la pantalla y sin diálogos del navegador).

#### Scenario: Alta de usuario
- **WHEN** se completa el formulario de alta con nombre, email, contraseña y rol, y se confirma
- **THEN** el usuario aparece en la tabla con el rol elegido

#### Scenario: Cambio de rol
- **WHEN** se elige otro rol en el selector de un usuario
- **THEN** el usuario queda con ese único rol

#### Scenario: Eliminar con confirmación
- **WHEN** se pulsa eliminar en un usuario
- **THEN** se pide confirmación dentro de la pantalla antes de sacarlo de la tabla

### Requirement: Pestaña Roles
La pantalla Usuarios (A17) SHALL tener una pestaña "Roles" con la lista de roles (`get_roles`) y acciones para crear (`crear_rol`), renombrar (`cambiar_nombre_rol`) y eliminar (`eliminar_rol`). Al elegir un rol se muestran todos los privilegios (`get_privilegios`) como checkboxes, en lista plana y sin clasificación, con tildados los del rol (`get_rol_privilegios`). Tildar MUST corresponder a `asignar_privilegio` y destildar, a `quitar_privilegio`. MUST NOT haber acciones para crear, editar o borrar privilegios.

#### Scenario: Ver privilegios de un rol
- **WHEN** se elige el rol "Profesor"
- **THEN** se ven todos los privilegios y aparecen tildados los del rol

#### Scenario: Quitar un privilegio
- **WHEN** se destilda un privilegio del rol elegido
- **THEN** el privilegio deja de estar asignado al rol

### Requirement: Cambiar mi contraseña
La aplicación SHALL ofrecer una sola pantalla "Cambiar mi contraseña" (A18) para todos los roles, que se abre desde la cabecera. Pide la contraseña nueva y su repetición, y corresponde a `cambiar_contrasenia` con el id del usuario que entró.

#### Scenario: Cambio con la sesión de un profesor
- **WHEN** con la sesión de `jramirez` se abre "Cambiar mi contraseña" y se confirma con dos contraseñas iguales
- **THEN** se muestra un mensaje de éxito

#### Scenario: Contraseñas distintas
- **WHEN** las dos contraseñas no coinciden
- **THEN** la pantalla muestra un error y no confirma el cambio

### Requirement: Menú armado con privilegios para todos los roles
El inicio (A1) SHALL ser el mismo para todos los roles y mostrar una tarjeta por cada privilegio del rol del usuario que entró, en una lista plana y sin títulos de grupo. El título de cada tarjeta MUST ser la `descripcion_privilegio`. Las tarjetas se obtienen con `login` → `usuario.rol.id_rol` → `get_rol_privilegios`. Cada tarjeta MUST llevar a su pantalla según el `id_privilegio`. Las que no tienen pantalla MUST mostrarse como "Pendiente" y no navegar. MUST NOT existir un menú aparte para el profesor.

#### Scenario: Menú del administrativo
- **WHEN** se entra como `secretaria`
- **THEN** el inicio muestra las 12 tarjetas del rol Administrativo, incluida "Disponibilidad de profesores"

#### Scenario: Menú del profesor
- **WHEN** se entra como `jramirez`
- **THEN** el inicio muestra "Mi grilla horaria", "Mi disponibilidad" y "Mis recibos"

#### Scenario: Tarjeta lleva a su pantalla
- **WHEN** se toca la tarjeta "Cambio de clase"
- **THEN** se abre la pantalla Suplencias del período (A4)

#### Scenario: Tarjeta sin pantalla
- **WHEN** se toca la tarjeta "Áreas"
- **THEN** la tarjeta figura como "Pendiente" y no cambia de pantalla

#### Scenario: Quitar un privilegio cambia el menú
- **WHEN** en Usuarios → Roles se le quita al rol Administrativo el privilegio "Cursos" y se vuelve al inicio
- **THEN** la tarjeta "Cursos" ya no aparece

### Requirement: Privilegio Disponibilidad de profesores
Los privilegios de ejemplo SHALL incluir `{ id_privilegio: 15, descripcion_privilegio: 'Disponibilidad de profesores' }`, asignado al rol Administrativo, y su tarjeta MUST llevar a A2 (Relevamiento de disponibilidad). Todas las copias de los datos de ejemplo de usuarios y roles MUST tener la misma lista de privilegios.

#### Scenario: Privilegio en Roles
- **WHEN** en Usuarios → Roles se elige el rol "Administrativo"
- **THEN** "Disponibilidad de profesores" aparece tildado

#### Scenario: Ir al relevamiento
- **WHEN** se toca la tarjeta "Disponibilidad de profesores"
- **THEN** se abre A2 · Relevamiento de disponibilidad

