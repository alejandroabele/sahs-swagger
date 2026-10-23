## Why

La gestión de usuarios, roles y privilegios no tiene pantallas en el prototipo: la tarjeta "Usuarios" del menú figura como "Todavía sin prototipar". El servicio USUARIO del swagger expone funciones que el grupo decidió no usar, como el ABM de privilegios, porque los privilegios se cargan por configuración. Además, el menú del administrativo agrupa las tarjetas con títulos fijos ("Procesos del ciclo" y "Parametrización"), pero cada tarjeta es un privilegio del rol y el menú se arma con esos privilegios, así que esa clasificación no existe en el modelo.

## What Changes

- **BREAKING** Se sacan de `usuario.json`: `cambiar_email`, `cambiar_nombre`, `get_usuario_privilegios`, `get_rol`, `get_privilegio`, `crear_privilegio`, `modificar_privilegio` y `eliminar_privilegio`.
- Se agrega `quitar_privilegio`: `DELETE /usuario/quitar_privilegio/{id}/{id_privilegio}`, donde `{id}` es el id del rol. Devuelve `200` con el `Rol` y es el espejo de `asignar_privilegio`. Sigue la convención de los `quitar_*`: el segundo id va en la ruta porque `DELETE` no lleva body.
- Se mantienen `login`, `crear_usuario`, `asignar_rol` (un solo rol por usuario), `cambiar_contrasenia`, `eliminar_usuario`, `crear_rol`, `asignar_privilegio`, `eliminar_rol`, `cambiar_nombre_rol`, `get_usuario`, `get_usuarios`, `get_roles`, `get_privilegios` y `get_rol_privilegios`.
- El README anota estas diferencias en "Cambios respecto del documento". El Google Doc no se modifica.
- Menú del administrativo: se sacan los títulos de grupo y queda una lista plana con una tarjeta por privilegio del rol. Las tarjetas se obtienen con `login` → `usuario.rol.id_rol` → `get_rol_privilegios`, y el título de cada una es `descripcion_privilegio`. El menú del profesor no cambia.
- Nueva pantalla **Usuarios** en el diseño y en `admin.html`, con dos pestañas:
  - **Usuarios:** listar, dar de alta, cambiar el rol, resetear la contraseña y eliminar.
  - **Roles:** listar, dar de alta, renombrar y eliminar. Los privilegios del rol se muestran como checkboxes: al tildar se llama a `asignar_privilegio` y al destildar, a `quitar_privilegio`.
- Opción **"Cambiar mi contraseña"** en la vista del administrativo y en la del profesor, con el mismo `cambiar_contrasenia`.
- Primero se cambia el diseño (artifact y `*.dc.html`) y después se exporta a `prototipo/`.

## Capabilities

### New Capabilities
- `gestion-usuarios-web`: pantalla Usuarios (pestañas Usuarios y Roles), menú del administrativo armado con los privilegios del rol, y cambio de la propia contraseña en ambas vistas.

### Modified Capabilities
- `usuario-api`: cambian los commands y queries expuestos. Se sacan 8 funciones y se agrega `quitar_privilegio`.
- `prototipo-web`: la vista del administrativo pasa a incluir la pantalla Usuarios. El rango de pantallas A1 a A16 se amplía.

## Impact

- `tools/generar_specs.py` (función `usuario()` y el mapa `VERBOS`) → regenerar `specs/usuario.json` y validar con redocly.
- `README.md`: "Cambios respecto del documento" y la lista de pantallas.
- Diseño: artifact "Planilla de Horarios SAHS", `Menu.dc.html` y los nuevos `*.dc.html` de `sahs-prototipo/`.
- `prototipo/admin.html` y `prototipo/profesor.html`: se regeneran con `tools/exportar_prototipo.py`, y en el armazón hecho a mano se agregan las pantallas a `CONFIG`.
- Si alguien consumía las funciones eliminadas, deja de tenerlas. Hoy no hay consumidores reales, porque es un contrato de prototipo.
