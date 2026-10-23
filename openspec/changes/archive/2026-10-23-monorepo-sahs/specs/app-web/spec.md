## ADDED Requirements

### Requirement: App React que reproduce el prototipo
`apps/web` SHALL ser una aplicación React + Vite + TypeScript con todas las pantallas de `prototipo/index.html`: Login (L1), inicio (A1), A2 a A18 y P2 a P4, con el mismo contenido, la misma disposición y el mismo estilo visual. Cada pantalla MUST tener una ruta con su código (`/login`, `/A1` ... `/A18`, `/P2` ... `/P4`). Los datos MUST venir de la API real y MUST NOT haber datos de ejemplo escritos en el código.

#### Scenario: Paridad visual
- **WHEN** se abre `/A5` en la app y la pantalla A5 en el prototipo, con los datos de los seeds
- **THEN** las dos muestran los mismos bloques, columnas, acciones y textos

#### Scenario: Los cambios se guardan
- **WHEN** en A7 se crea un curso y se recarga la página
- **THEN** el curso sigue apareciendo en el listado

### Requirement: Login contra la API
La pantalla Login SHALL pedir usuario (email o `nombre_user`) y contraseña y llamar a `POST /usuario/login`. Si falla, MUST mostrar "Usuario o contraseña incorrectos" dentro de la pantalla, sin diálogos del navegador. Debajo del formulario SHALL listar los usuarios de ejemplo con su rol (de `get_usuarios`). Al tocar uno se completa el campo usuario.

#### Scenario: Entrar como profesor
- **WHEN** se ingresa `jramirez` con la contraseña `sahs2026`
- **THEN** se abre el inicio con el menú del rol Profesor

#### Scenario: Contraseña incorrecta
- **WHEN** se ingresa `jramirez` con otra contraseña
- **THEN** el Login muestra "Usuario o contraseña incorrectos" y no inicia sesión

### Requirement: Sesión por pestaña
La sesión SHALL guardar el token y el `id_usuario` en `sessionStorage` y mantenerse si se recarga la página en la misma pestaña. Sin sesión, cualquier ruta MUST redirigir a `/login`.

#### Scenario: Ruta sin sesión
- **WHEN** sin sesión se abre `http://localhost:8100/A7`
- **THEN** se muestra el Login

#### Scenario: Dos roles en dos pestañas
- **WHEN** se entra como `secretaria` en una pestaña y como `jramirez` en otra
- **THEN** cada pestaña mantiene su propio usuario y su menú

### Requirement: Menú y acceso por privilegios
El inicio (A1) SHALL mostrar una tarjeta por cada privilegio del rol del usuario (`get_usuario` → `rol.id_rol` → `get_rol_privilegios`), con `descripcion_privilegio` como título. Las pantallas sin implementar MUST mostrarse como "Pendiente". Si se pide por URL una pantalla cuyo privilegio el rol no tiene, MUST volver al inicio. Si se asigna o se quita un privilegio en Usuarios → Roles (A17), el menú se actualiza sin recargar.

#### Scenario: Pantalla sin privilegio
- **WHEN** entra `jramirez` (Profesor) y abre `/A17`
- **THEN** vuelve al inicio

#### Scenario: Quitar un privilegio
- **WHEN** en A17 se le quita un privilegio al rol del usuario que entró
- **THEN** la tarjeta desaparece del inicio sin recargar la página

### Requirement: Cabecera
Todas las pantallas, salvo el Login, SHALL tener la cabecera del diseño con el `nombre_user` y el `nombre_rol` del usuario que entró, "Cambiar mi contraseña" (A18, con `cambiar_contrasenia`) y "Cerrar sesión". El logo SAHS lleva al inicio.

#### Scenario: Cerrar sesión
- **WHEN** se toca "Cerrar sesión"
- **THEN** se borra la sesión de la pestaña y se muestra el Login

### Requirement: Errores de la API en pantalla
Cuando una llamada responde con error, la pantalla SHALL mostrar el `mensaje` del `Error` dentro de la pantalla, sin `alert` ni `confirm`.

#### Scenario: Conflicto de disponibilidad
- **WHEN** en A13 se ubica una clase en una franja no disponible para el profesor
- **THEN** la pantalla muestra el mensaje del `409` y la grilla no cambia

### Requirement: Llamadas por el mismo origen
La web SHALL llamar a la API con rutas relativas por prefijo (`/usuario/...`, `/pago/...`, etc.), que el nginx de producción redirige a cada servicio. Los tipos de los datos MUST salir de `@sahs/contratos`.

#### Scenario: Proxy por prefijo
- **WHEN** la web pide `/horarios/get_turnos`
- **THEN** la petición llega al servicio Horarios y la respuesta vuelve a la web por el mismo origen `:8100`
