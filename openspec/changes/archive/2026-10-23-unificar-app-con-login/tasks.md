## 1. Preparación

- [x] 1.1 Leer el artifact de diseño (`Artifact` con `action: "read"`) y confirmar que sus `.dc.html` coinciden con los de `sahs-prototipo/`. Si no coinciden, avisar antes de seguir.

## 2. Diseño: datos y sesión

- [x] 2.1 Agregar el privilegio 15 "Disponibilidad de profesores" y sumarlo al rol Administrativo en las copias de `Accesos` que quedan (`Menu`, `Usuarios`, `CambiarContrasenia` y `ProfesorDetalle`; `MiContrasenia` se borra en 3.3). Verificar que todas tengan la misma lista.
- [x] 2.2 Crear el bloque común `Sesion` (lee `window.top.__SAHS_SESION`; usa el usuario 1 si no hay sesión; `Sesion.conectar(Component)` agrega `vals.sesion` con nombre, rol e iniciales) y agregarlo a las pantallas que tienen cabecera.
- [x] 2.3 Cambiar la cabecera de las 21 pantallas para que use `{{sesion.nombre}} · {{sesion.rol}}` y sus iniciales, y que el logo SAHS lleve al inicio y el usuario ofrezca "Cambiar mi contraseña" y "Cerrar sesión".
- [x] 2.4 Verificar con `grep` que ninguna cabecera tenga "Secretaría general" ni "Juan Ramírez · Profesor" escrito a mano.

## 3. Diseño: Login y menú

- [x] 3.1 Crear `Login.dc.html` (L1) con la estética del prototipo: usuario, contraseña, error "Usuario o contraseña incorrectos" dentro de la pantalla y la lista "Usuarios de ejemplo" con su rol, que completa el campo usuario al tocar uno.
- [x] 3.2 En `Menu.dc.html`, sacar `ID_USUARIO = 1` y leer el usuario de `Sesion`, poner `data-privilegio` en cada tarjeta, agregar el privilegio 15 a `VISTA` (→ A2), apuntar el 8 a A4, y que el texto y el saludo no dependan del rol.
- [x] 3.3 Borrar `MenuProfesor.dc.html` (P1) y `MiContrasenia.dc.html` (P5).
- [x] 3.4 Actualizar `canvas.json`: agregar "L1 · Login" antes de A1, renombrar A1 a "Inicio" y sacar P1 y P5.
- [x] 3.5 Republicar el artifact con los `.dc.html` y el `canvas.json` actualizados, y comprobar que coincidan con los locales.

## 4. Prototipo

- [x] 4.1 Armar el armazón de `prototipo/index.html`: Login si no hay sesión, sesión en `sessionStorage` (`sahs.sesion`, con respaldo en memoria), navegación por hash, "Cerrar sesión", contenedor que escala la pantalla al ancho y nada más (sin franja, pestañas, pie ni "Ver como…").
- [x] 4.2 Definir `CONFIG`: pantallas L1, A1 a A18 (con A2, A3 y A4) y P2 a P4, cada una con su `privilegio`, el mapa `privilegios` (id → pantalla, según el diseño) y los `directo` de los botones internos que ya existen.
- [x] 4.3 Hacer que el armazón navegue por `data-privilegio` en las tarjetas del menú y que, si el rol no tiene el privilegio de una pantalla, vuelva al inicio.
- [x] 4.4 Cambiar `tools/exportar_prototipo.py` para que tenga una sola salida (`prototipo/index.html`) y actualizar su docstring.
- [x] 4.5 Exportar con `python3 tools/exportar_prototipo.py ..` y comprobar que `--check` no informe cambios.
- [x] 4.6 Borrar `prototipo/admin.html` y `prototipo/profesor.html`.

## 5. Documentación

- [x] 5.1 Actualizar la sección "Prototipo" del `README.md`: una sola URL, cómo entrar, cómo cambiar de rol, el exportador con una salida, y la lista de pantallas.
- [x] 5.2 Actualizar `docs/referencias.md` (columna "Qué se actualiza" del diseño) y cualquier otra mención a `admin.html` o `profesor.html` fuera de `openspec/changes/archive`.

## 6. Verificación en el navegador

- [x] 6.1 Sin sesión, `http://localhost:8090/` y `http://localhost:8090/#A7` muestran el Login. Un usuario inexistente muestra el error.
- [x] 6.2 Como `secretaria`, se ven 12 tarjetas. "Cambio de clase" abre A4, "Disponibilidad de profesores" abre A2 y "Áreas" queda "Pendiente". La cabecera dice `secretaria · Administrativo`.
- [x] 6.3 Cerrar sesión y entrar como `jramirez`: se ven 3 tarjetas, la cabecera dice `jramirez · Profesor` y `#A17` vuelve al inicio.
- [x] 6.4 Como `sferreyra`, se ve el menú del rol Coordinador de área. Al recargar se mantiene la sesión.
- [x] 6.5 Quitar "Cursos" al rol Administrativo en Usuarios → Roles: la tarjeta desaparece del inicio.
- [x] 6.6 "Cambiar mi contraseña" funciona desde la cabecera con la sesión de un profesor.
