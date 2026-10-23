## Why

El prototipo no se comporta como una aplicación. Tiene dos páginas fijas (`admin.html` y `profesor.html`) y una portada para elegir rol, sin login. Además, cada página suma un armazón propio (franja superior, pestañas con códigos de pantalla y pie "Ir a"), así que arriba se ven dos cabeceras. El usuario está escrito a mano ("Secretaría general", "Hola, Juan") y el menú del profesor no sale de los privilegios. El grupo ya había pedido que las secciones del menú fueran los privilegios del usuario que entra, para cualquier rol.

## What Changes

- **BREAKING** El prototipo pasa a ser una sola aplicación en `http://localhost:8090/`. Se borran `prototipo/admin.html` y `prototipo/profesor.html`, y `index.html` deja de ser la portada para elegir rol.
- Nueva pantalla de **Login** (`Login.dc.html`, en el diseño y en el prototipo): usuario y contraseña, contra los usuarios de ejemplo. Corresponde a `login` del servicio USUARIO.
- Un solo **menú de inicio** para todos los roles: una tarjeta por privilegio del rol del usuario que entró (`login` → `usuario.rol.id_rol` → `get_rol_privilegios`). Se borra el menú del profesor (P1, `MenuProfesor.dc.html`).
- **Cabecera única**, la del diseño, en todas las pantallas: muestra el usuario que entró (`nombre_user · nombre_rol`) y ofrece "Cambiar mi contraseña" y "Cerrar sesión". El logo SAHS lleva al inicio. Se saca todo el armazón de navegación: la franja superior, las pestañas con códigos, el pie "Ir a" y los enlaces "Ver como…".
- Para pasar de un rol a otro se cierra sesión y se entra con otro usuario. La URL es la misma.
- Nuevo privilegio **15 · "Disponibilidad de profesores"**, asignado al rol Administrativo, que lleva a A2 (Relevamiento de disponibilidad).
- Entran al prototipo A2, A3 y A4, que hasta ahora estaban solo en el diseño. La tarjeta "Cambio de clase" lleva a A4.
- Los privilegios sin pantalla ("Recibos de sueldo" y "Áreas") muestran la tarjeta como "Pendiente" y no navegan.
- "Cambiar mi contraseña" queda en una sola pantalla (A18) para todos los roles. Se borra P5 (`MiContrasenia.dc.html`), que la duplicaba.

## Capabilities

### New Capabilities
- `acceso-web`: login del prototipo, sesión del usuario, cabecera con el usuario que entró, cerrar sesión y navegación entre el login, el menú y las pantallas.

### Modified Capabilities
- `prototipo-web`: `prototipo/` pasa a tener un solo HTML de aplicación. Se van la portada de selección de rol, las dos vistas y el enlace "Ver como…". Cambia el procedimiento de exportación.
- `gestion-usuarios-web`: el menú armado con privilegios vale para todos los roles, no solo para el administrativo. Se suma el privilegio 15 y "Cambiar mi contraseña" queda en una sola pantalla.

## Impact

- Diseño (artifact "Planilla de Horarios SAHS" y `*.dc.html` de `sahs-prototipo/`):
  - nuevo `Login.dc.html`;
  - `Menu.dc.html` lee el usuario de la sesión;
  - la cabecera de las 21 pantallas deja de tener el usuario escrito a mano;
  - el bloque `Accesos`, repetido en cinco pantallas, suma el privilegio 15 y la sesión;
  - se borran `MenuProfesor.dc.html` y `MiContrasenia.dc.html`, y se actualiza `canvas.json`.
- `prototipo/`: se borran `admin.html` y `profesor.html`, e `index.html` pasa a ser la aplicación generada.
- `tools/exportar_prototipo.py`: una sola salida (`prototipo/index.html`).
- `README.md` (sección "Prototipo"), `docs/referencias.md` (columna "Qué se actualiza") y `AGENTS.md`, si los nombra.
- Swagger: no cambia ningún contrato. Los privilegios se cargan por configuración, así que el 15 es un dato de ejemplo y no una operación nueva.
