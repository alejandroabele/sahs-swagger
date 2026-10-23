## ADDED Requirements

### Requirement: Menú del administrativo armado con privilegios
El menú del administrativo (A1) SHALL mostrar una tarjeta por cada privilegio del rol del usuario, en una lista plana y sin títulos de grupo ("Procesos del ciclo" y "Parametrización" MUST NOT aparecer). El título de cada tarjeta MUST ser la `descripcion_privilegio`. Las tarjetas se obtienen con `login` → `usuario.rol.id_rol` → `get_rol_privilegios`. El menú del profesor no cambia.

#### Scenario: Menú sin clasificación
- **WHEN** se abre `admin.html`
- **THEN** el menú muestra las 11 tarjetas sin títulos de grupo

#### Scenario: Tarjeta lleva a su pantalla
- **WHEN** se hace clic en la tarjeta "Usuarios"
- **THEN** se abre la pantalla Usuarios (A17)

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
La vista del administrativo (A18) y la del profesor (P5) SHALL ofrecer una pantalla "Cambiar mi contraseña", que se abre desde la cabecera. Pide la contraseña nueva y su repetición, y corresponde a `cambiar_contrasenia` con el id del usuario logueado.

#### Scenario: Cambio desde la vista del profesor
- **WHEN** en `profesor.html` se abre "Cambiar mi contraseña" y se confirma con dos contraseñas iguales
- **THEN** se muestra un mensaje de éxito

#### Scenario: Contraseñas distintas
- **WHEN** las dos contraseñas no coinciden
- **THEN** la pantalla muestra un error y no confirma el cambio
