## MODIFIED Requirements

### Requirement: App React que reproduce el prototipo
`apps/web` SHALL ser una aplicación React + Vite + TypeScript con todas las pantallas de `prototipo/index.html`: Login (L1), inicio (A1), A2 a A18 y P2 a P4, con el mismo contenido, la misma disposición y el mismo estilo visual. Cada pantalla MUST tener la ruta semántica definida en la capacidad `rutas-web`. Los datos MUST venir de la API real, y MUST NOT haber datos de ejemplo escritos en el código.

#### Scenario: Paridad visual
- **WHEN** se abre `/materias` en la app y `#/materias` en el prototipo, con los datos de los seeds
- **THEN** las dos muestran los mismos bloques, columnas, acciones y textos

#### Scenario: Los cambios se guardan
- **WHEN** en `/cursos/nuevo` se crea un curso y se recarga la página
- **THEN** el curso sigue apareciendo en `/cursos`

### Requirement: Login contra la API
La pantalla Login SHALL pedir usuario (email o `nombre_user`) y contraseña y llamar a `POST /usuario/login`. Si falla, MUST mostrar "Usuario o contraseña incorrectos" dentro de la pantalla, sin diálogos del navegador. El Login MUST NOT listar usuarios ni contraseñas de ejemplo, y MUST NOT consultar la API antes de que el usuario envíe el formulario.

#### Scenario: Entrar como profesor
- **WHEN** se ingresa `jramirez` con la contraseña `sahs2026`
- **THEN** se abre el inicio con el menú del rol Profesor

#### Scenario: Contraseña incorrecta
- **WHEN** se ingresa `jramirez` con otra contraseña
- **THEN** el Login muestra "Usuario o contraseña incorrectos" y no inicia sesión

#### Scenario: Sin consultas antes de entrar
- **WHEN** se abre `/login`
- **THEN** la pantalla no hace ninguna llamada a la API

### Requirement: Sesión por pestaña
La sesión SHALL guardar el token y el `id_usuario` en `sessionStorage` y mantenerse si se recarga la página en la misma pestaña. Sin sesión, cualquier ruta MUST redirigir a `/login`.

#### Scenario: Ruta sin sesión
- **WHEN** sin sesión se abre `http://localhost:8100/profesores`
- **THEN** se muestra el Login

#### Scenario: Dos roles en dos pestañas
- **WHEN** se entra como `secretaria` en una pestaña y como `jramirez` en otra
- **THEN** cada pestaña mantiene su propio usuario y su menú

### Requirement: Menú y acceso por privilegios
El inicio (`/`) SHALL mostrar una tarjeta por cada privilegio del rol del usuario que tenga pantalla (`get_usuario` → `rol.id_rol` → `get_rol_privilegios`), con `descripcion_privilegio` como título. Los privilegios sin pantalla MUST NOT mostrarse, y el inicio MUST NOT tener textos que expliquen las tarjetas. Si se pide por URL una pantalla cuyo privilegio el rol no tiene, MUST volver al inicio. Si se asigna o se quita un privilegio en `/roles`, el menú se actualiza sin recargar.

#### Scenario: Pantalla sin privilegio
- **WHEN** entra `jramirez` (Profesor) y abre `/usuarios`
- **THEN** vuelve al inicio

#### Scenario: Quitar un privilegio
- **WHEN** en `/roles` se le quita un privilegio al rol del usuario que entró
- **THEN** la tarjeta desaparece del inicio sin recargar la página

#### Scenario: Privilegio sin pantalla
- **WHEN** el rol tiene un privilegio que no tiene pantalla
- **THEN** el inicio no muestra una tarjeta para ese privilegio

### Requirement: Cabecera
Todas las pantallas, salvo el Login, SHALL tener la cabecera del diseño con el `nombre_user` y el `nombre_rol` del usuario que entró, "Cambiar mi contraseña" (`/mi-cuenta/contrasenia`, con `cambiar_contrasenia`) y "Cerrar sesión". El logo SAHS lleva al inicio.

#### Scenario: Cerrar sesión
- **WHEN** se toca "Cerrar sesión"
- **THEN** se borra la sesión de la pestaña y se muestra el Login

### Requirement: Errores de la API en pantalla
Cuando una llamada responde con error, la pantalla SHALL mostrar el `mensaje` del `Error` dentro de la pantalla, sin `alert` ni `confirm`.

#### Scenario: Conflicto de disponibilidad
- **WHEN** en `/planificaciones/:id` se ubica una clase en una franja no disponible para el profesor
- **THEN** la pantalla muestra el mensaje del `409` y la grilla no cambia

### Requirement: Llamadas por el mismo origen
La web SHALL llamar a la API con rutas relativas por prefijo (`/usuario/...`, `/pago/...`, etc.), que el nginx de producción redirige a cada servicio. Los tipos de los datos MUST salir de `@sahs/contratos`, y las llamadas MUST hacerse con el cliente generado desde el `/docs-json` de cada servicio, cuyos métodos se llaman como el `operationId`.

#### Scenario: Proxy por prefijo
- **WHEN** la web pide `GET /horarios/turnos`
- **THEN** la petición llega al servicio Horarios y la respuesta vuelve a la web por el mismo origen `:8100`
