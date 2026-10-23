## Context

- `prototipo/` tiene tres HTML: `index.html` (portada para elegir rol, hecha a mano), `admin.html` (A1 y de A5 a A18) y `profesor.html` (de P1 a P5). Las dos vistas se generan con `tools/exportar_prototipo.py` a partir de los `*.dc.html`. Alrededor tienen un armazón hecho a mano: una franja superior con el rol escrito a mano, pestañas con el código de cada pantalla, un pie "Ir a" y el enlace "Ver como…".
- Cada `.dc.html` trae su propia cabecera oscura (logo SAHS, selector de ciclo y usuario). En 21 pantallas, el usuario está escrito a mano ("Secretaría general" o "Juan Ramírez · Profesor").
- Los datos de usuarios, roles y privilegios están en un bloque `Accesos`, repetido en `Menu`, `Usuarios`, `CambiarContrasenia`, `MiContrasenia` y `ProfesorDetalle`. Ese bloque comparte su estado entre pantallas a través de `window.top`. El ciclo lectivo usa el mismo mecanismo (`CicloGlobal`, presente en 18 pantallas).
- `Menu.dc.html` arma las tarjetas con los privilegios del usuario 1, fijo en el código (`ID_USUARIO = 1`). `MenuProfesor.dc.html` tiene tres tarjetas escritas a mano.
- A2, A3 y A4 existen en el diseño pero no en el prototipo.

## Goals / Non-Goals

**Goals:**
- Que el prototipo se use como la aplicación real: una URL, login, una cabecera y un menú que depende del rol.
- Que el menú de todos los roles salga de los privilegios del usuario que entró.
- Que el usuario de la cabecera sea el que entró, en todas las pantallas.
- Que todas las pantallas del diseño sean accesibles desde el menú.

**Non-Goals:**
- Autenticación real, tokens o contraseñas verificadas. No hay backend.
- Diseñar las pantallas que faltan (Recibos de sueldo del administrativo y Áreas).
- Cambiar los contratos del swagger.
- Rediseñar las pantallas existentes más allá de su cabecera.

## Decisions

1. **Una sola URL: `index.html` contiene el login y la aplicación.** Si no hay sesión, se muestra el Login. Si hay sesión, se muestra la pantalla del hash (`#A5`) o, si no hay hash, el inicio (A1). Así, para pasar de un rol a otro se cierra sesión y se entra con otro usuario, sin cambiar de URL.
   - Alternativa descartada: `index.html` con el login y una `app.html` aparte. Son dos URL, y la consigna es una aplicación.

2. **La sesión se guarda en `sessionStorage` (clave `sahs.sesion`, con `id_usuario`).** Si se recarga la página, se sigue en la misma sesión. Cada pestaña tiene la suya, lo que permite tener abiertos dos roles a la vez en dos pestañas para una demo. Si el almacenamiento no está disponible, la sesión vive en memoria: funciona igual, pero se pierde al recargar. "Cerrar sesión" borra la clave y vuelve al Login.
   - Alternativa descartada: `localStorage`. La sesión quedaría compartida entre pestañas y no se podrían mostrar dos roles a la vez.

3. **Login simulado.** Se acepta un usuario existente, por `nombre_user` o por `email` y sin distinguir mayúsculas, con cualquier contraseña no vacía. Un usuario inexistente o una contraseña vacía muestran "Usuario o contraseña incorrectos" dentro de la pantalla. Debajo del formulario hay una lista "Usuarios de ejemplo" con nombre y rol. Al tocar uno se completa el campo usuario, para entrar rápido en la demo. El Login corresponde a `POST /usuario/login` y a su respuesta `LoginRespuesta { token, usuario }`.
   - Alternativa descartada: contraseñas de ejemplo por usuario. No suman nada a la demo y obligan a documentar valores.

4. **Bloque `Sesion` común en las pantallas, como `CicloGlobal`.** Expone el usuario que entró (`nombre_user`, `nombre_rol` e iniciales) leyendo `window.top.__SAHS_SESION`, y `Sesion.conectar(Component)` agrega `vals.sesion` al render. La cabecera de cada pantalla usa `{{sesion.nombre}} · {{sesion.rol}}` y deja de tener el usuario escrito a mano. En el canvas del diseño, donde nadie inició sesión, `Sesion` muestra al usuario 1 (secretaria) para que las pantallas se vean completas.
   - Alternativa descartada: que el armazón tape la cabecera de cada pantalla con una propia. Volverían las dos cabeceras.

5. **La cabecera de cada pantalla es la única de la aplicación.** El logo SAHS lleva al inicio (A1). A la derecha está el usuario (`nombre_user · nombre_rol`) y dos botones de ícono: un candado, "Cambiar mi contraseña" (A18), y otro para "Cerrar sesión", con el texto como tooltip. Se eligieron íconos porque con texto la cabecera no entraba en las pantallas que tienen selector de ciclo. También se sacaron las pestañas fijas que algunas cabeceras traían ("Planificación anual · Suplencias · Materias · Profesores"): no navegaban y no salían de los privilegios, así que eran un segundo menú. En el prototipo exportado, el armazón no tiene franja, pestañas, pie ni "Ver como…": solo el contenedor que escala la pantalla al ancho de la ventana.
   - Las migas que ya existían navegan con `data-ir`: "Inicio" → A1, y "Volver al listado" → A5, A7 o A10.

6. **Cada tarjeta del menú lleva a su pantalla según el `id_privilegio`.** El mapa vive en `CONFIG.privilegios`, dentro del armazón (es decisión del front, como hoy). La tarjeta lleva `data-privilegio="{{t.id}}"`, y el armazón navega por ese atributo y no por el texto del botón. Las tarjetas sin pantalla quedan como "Pendiente" y no navegan.

   | id | Privilegio | Pantalla |
   |---|---|---|
   | 1 | Planificación anual | A12 (de ahí, A13) |
   | 2 | Recibos de sueldo | Pendiente |
   | 3 | Materias | A5 |
   | 4 | Profesores | A7 |
   | 5 | Cursos | A10 |
   | 6 | Áreas | Pendiente |
   | 7 | Turnos y franjas | A16 |
   | 8 | Cambio de clase | A4 |
   | 9 | Usuarios | A17 |
   | 10 | Orientaciones | A14 |
   | 11 | Ciclos lectivos | A15 |
   | 12 | Mi grilla horaria | P2 |
   | 13 | Mi disponibilidad | P3 |
   | 14 | Mis recibos | P4 |
   | 15 | Disponibilidad de profesores (nuevo) | A2 |

7. **Cada pantalla pertenece a un privilegio, y el armazón lo controla.** `CONFIG.pantallas[cod].privilegio` indica a qué privilegio pertenece cada pantalla (A6 pertenece a 3, A8 y A9 a 4, etc.). A1 (Inicio) y A18 (Cambiar mi contraseña) son de todos. Si el hash pide una pantalla cuyo privilegio el rol no tiene, se vuelve al inicio. Así, "cerrar sesión y entrar con otro usuario" muestra lo mismo que vería ese rol.

8. **Una sola pantalla para cambiar la contraseña.** A18 (`CambiarContrasenia.dc.html`) sirve para todos los roles. Se borra P5 (`MiContrasenia.dc.html`). P2, P3 y P4 conservan sus códigos.

9. **El exportador genera un solo archivo.** `tools/exportar_prototipo.py` pasa a tener una sola salida, `prototipo/index.html`, que incluye el Login y todas las pantallas de `CONFIG.pantallas`. El mecanismo no cambia: estilos, `<template>` y lógica generados, y armazón y `CONFIG` hechos a mano.

10. **En el canvas, el Login es "L1 · Login".** Va en la página del administrativo, antes de A1. La página del profesor pierde P1 y P5.

## Risks / Trade-offs

- [Hay que tocar la cabecera de 21 pantallas y es fácil que quede alguna con el usuario escrito a mano] → Una tarea verifica con `grep` que no queden "Secretaría general" ni "Juan Ramírez · Profesor" en las cabeceras.
- [`Accesos` sigue repetido en varias pantallas y el privilegio 15 se tiene que agregar en todas] → Se agrega en las cinco copias y una tarea verifica que todas tengan la misma lista.
- [Algunos botones internos navegan por su texto (`directo`) y pueden chocar con los nombres de las tarjetas] → Las tarjetas navegan por `data-privilegio`. El `directo` queda solo para los botones propios de cada pantalla.
- [Quien tenga guardado `admin.html` o `profesor.html` recibe un 404] → Es un prototipo sin usuarios externos. El README explica que hay una sola URL.
- [El artifact publicado puede tener cambios hechos desde la web] → Antes de editar se vuelve a leer el artifact y se comparan sus archivos con los `.dc.html` locales.

## Migration Plan

1. Diseño: se edita el artifact y los `.dc.html` (Login, Sesion, cabeceras, Menu, privilegio 15, borrado de P1 y P5, `canvas.json`) y se republica el artifact.
2. Prototipo: se arma el armazón de `index.html` (login, sesión, `CONFIG` con A1 a A18, P2 a P4 y `privilegios`), se adapta el exportador y se exporta.
3. Se borran `admin.html` y `profesor.html`, y se actualizan los documentos.
4. Rollback: los HTML anteriores se recuperan desde el artifact versionado y volviendo a exportar con el script anterior.

## Open Questions

- A3 (Generación de la planilla anual) pertenece al privilegio 1, pero ninguna pantalla lleva a ella: "Nueva planificación" de A12 tiene su propia función y A13 genera la grilla con "Generar automáticamente". Hay que decidir si A3 tiene un acceso desde A12 o si queda reemplazada por A13.
