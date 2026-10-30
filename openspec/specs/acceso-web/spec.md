# acceso-web Specification

## Purpose
Acceso al prototipo como una sola aplicación: Login, sesión del usuario, cabecera con el usuario que entró, cerrar sesión para cambiar de rol y acceso a cada pantalla según los privilegios del rol.
## Requirements
### Requirement: Login
El prototipo SHALL mostrar la pantalla Login (L1) cuando se abre `http://localhost:8100/prototipo/` sin una sesión iniciada. Pide usuario y contraseña. Acepta un usuario existente de los datos del prototipo, por `nombre_user` o por `email` y sin distinguir mayúsculas, con cualquier contraseña no vacía, y corresponde a `POST /usuario/login`. Si los datos no son válidos, MUST mostrar "Usuario o contraseña incorrectos" dentro de la pantalla, sin diálogos del navegador. El Login MUST NOT listar usuarios ni contraseñas de ejemplo.

#### Scenario: Entrar como profesor
- **WHEN** en el Login se ingresa `jramirez` con una contraseña cualquiera y se confirma
- **THEN** se abre el inicio con el menú del rol Profesor

#### Scenario: Usuario inexistente
- **WHEN** se ingresa un usuario que no está en los datos del prototipo
- **THEN** el Login muestra "Usuario o contraseña incorrectos" y no inicia sesión

#### Scenario: Solo el formulario
- **WHEN** se abre el Login
- **THEN** se ve solo el formulario de ingreso, sin lista de usuarios

### Requirement: Sesión
La sesión SHALL guardar el id del usuario que entró y mantenerse si se recarga la página en la misma pestaña. Sin sesión, cualquier dirección del prototipo (incluso con una ruta en el hash) MUST mostrar el Login.

#### Scenario: Recargar con sesión
- **WHEN** con una sesión iniciada se recarga `http://localhost:8100/prototipo/#/materias`
- **THEN** se sigue viendo el listado de materias con el mismo usuario

#### Scenario: Dirección de pantalla sin sesión
- **WHEN** sin sesión se abre `http://localhost:8100/prototipo/#/profesores`
- **THEN** se muestra el Login

### Requirement: Cabecera con el usuario que entró
Todas las pantallas, salvo el Login, SHALL tener una única cabecera, la del diseño. La cabecera muestra el `nombre_user` y el `nombre_rol` del usuario que entró, y ofrece "Cambiar mi contraseña" (`#/mi-cuenta/contrasenia`) y "Cerrar sesión". El logo SAHS MUST llevar al inicio. Ninguna pantalla MUST tener el usuario escrito a mano.

#### Scenario: Usuario en la cabecera
- **WHEN** se entra como `sferreyra`
- **THEN** la cabecera de todas las pantallas muestra `sferreyra · Coordinador de área`

#### Scenario: Volver al inicio
- **WHEN** en cualquier pantalla se toca el logo SAHS
- **THEN** se abre el inicio

### Requirement: Cerrar sesión y cambiar de rol
"Cerrar sesión" SHALL terminar la sesión y volver al Login en la misma URL. Para ver el prototipo con otro rol MUST alcanzar con cerrar sesión y entrar con otro usuario.

#### Scenario: Pasar de administrativo a profesor
- **WHEN** se entra como `secretaria`, se cierra sesión y se entra como `jramirez`
- **THEN** el menú cambia del rol Administrativo al rol Profesor sin cambiar de URL

### Requirement: Acceso a pantallas según privilegios
Cada pantalla SHALL pertenecer a un privilegio, salvo el inicio y "Cambiar mi contraseña", que son de todos. Si se pide una ruta cuyo privilegio el rol no tiene, MUST mostrarse el inicio.

#### Scenario: Profesor pide una pantalla de secretaría
- **WHEN** con la sesión de `jramirez` se abre `http://localhost:8100/prototipo/#/usuarios`
- **THEN** se muestra el inicio y no la pantalla Usuarios

