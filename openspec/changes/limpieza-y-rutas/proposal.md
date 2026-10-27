## Why

La aplicación muestra mucho dato de adorno que la obliga a cruzar servicios para nada: por ejemplo, el avance "103/130 h" de cada planificación en A12 pide clases, cursos y materias de cada propuesta. A eso se suman los textos de demo y de ayuda ("Usuarios de ejemplo", "figuran como Pendiente", "Hacé clic…"). El resultado es que no se ve cuál es la especificación de cada servicio, porque la web arma datos que la API no ofrece. Además, las direcciones no siguen buenas prácticas: la web usa códigos de pantalla con query strings (`/A13?id_propuesta=5`) y la API usa rutas RPC (`GET /orientacion/get_materias`).

## What Changes

- **Limpieza de pantallas.** Se quita todo el adorno de la app web, del prototipo (`.dc.html` → `prototipo/index.html`) y del diseño publicado:
  - textos de demo y de ayuda: la tarjeta "Usuarios de ejemplo" del Login, la explicación de las tarjetas y el estado "Pendiente" del inicio, los pies "Hacé clic / Tocá…" y toda mención a códigos de pantalla;
  - métricas que la web calcula cruzando servicios: avance de A12, horas ubicadas de A10, horas y área de A7, clases asignadas de A9, cursos donde se dicta de A6, cursos y vigente por ciclo de A15, horas asignadas de A2, uso de turnos de A16;
  - datos que la API no guarda y la web deduce o inventa: años de una orientación (A5, A14) y estado y fechas del ciclo lectivo (A15);
  - selectores para saltar a otra ficha y validaciones del front que repiten las de la API (A6, A8, A9, A11).
- **Regla de consultas por pantalla.** Una pantalla consulta el servicio dueño de lo que muestra. A otro servicio lo consulta solo para (a) mostrar el nombre de un id, (b) llenar un selector que la acción necesita, o (c) cuando cruzar datos es la función de la pantalla (A3 generación, A4 suplencias, A13 armado y P2 mi horario).
- **BREAKING. Rutas de la web semánticas.** Se usan sustantivos en español y parámetros de ruta (`/materias/5`, `/planificaciones/5/cursos/2`) en lugar de `/A6?id_materia=5`. Las URLs dejan de tener códigos de pantalla. El prototipo usa las mismas rutas con hash (`#/materias/5`).
- **BREAKING. API REST.** Cada servicio publica recursos en plural y en kebab-case, y cada verbo HTTP hace lo que corresponde (`GET /orientacion/materias`, `POST /orientacion/materias`, `DELETE /planificacion/cursos/{id}/materias/{id_materia}`). El `operationId` sigue siendo el nombre de la función del documento (`get_materias`), así que el cliente web generado y la trazabilidad con el documento no cambian de nombre. El cambio se anota en "Cambios respecto del documento" del README.
- Las operaciones de la API que la web no usa **se mantienen**, porque son parte de la especificación del documento.
- `tools/verificar_contratos.mjs` pasa a comparar el corte congelado **por `operationId`**, no por ruta.

## Capabilities

### New Capabilities
- `rutas-web`: rutas semánticas de la app web y del prototipo, con parámetros de ruta y sin códigos de pantalla ni query strings para identificar recursos.
- `consultas-por-pantalla`: regla de qué servicios puede consultar una pantalla, y prohibición de adorno (textos de demo o ayuda y métricas cruzadas).

### Modified Capabilities
- `api-conventions`: "Una ruta por función" e "Identificadores en la ruta" pasan a recursos REST. Los ejemplos de filtros y de datos anidados usan las rutas nuevas.
- `app-web`: rutas por código → rutas semánticas. El Login no lista usuarios de ejemplo. El inicio no muestra "Pendiente". Se quita "Paridad visual" con los ejemplos de códigos.
- `gestion-usuarios-web`: el inicio deja de mostrar como "Pendiente" los privilegios sin pantalla y no los muestra.
- `acceso-web`: el Login del prototipo no lista usuarios de ejemplo, y la sesión y el acceso usan las rutas con hash nuevas.
- `microservicios-nest`: el corte se verifica por `operationId`, y las rutas de los escenarios (login, clases, pagos, suplencias, llamadas entre servicios) pasan a REST.
- `usuario-api`, `orientacion-api`, `planificacion-api`, `horarios-api`, `pago-api`, `profesor-suplencias-api`: los escenarios que nombran rutas pasan a las rutas REST. Las operaciones y los modelos no cambian.
- `despliegue-docker`: el ejemplo de proxy usa una ruta REST.
- `swagger-ui-docker`: se publica un solo Swagger UI, el de la API que corre (`:8180`); el de los contratos congelados (`:8080`) se saca.
- `prototipo-web`: el `docker-compose.yml` original solo levanta el prototipo.

## Impact

- **Servicios** (`apps/<servicio>`): rutas de todos los controllers (98 operaciones), las llamadas entre servicios con `ClienteServicio` (`enviar('POST', 'asignar_curso_a_orientacion/…')`) y los tests e2e (`tests/e2e/servicios.test.mjs`).
- **Contratos:** `libs/contratos`, si alguna interfaz nombra rutas. `tools/verificar_contratos.mjs` (comparación por `operationId` y excepciones de forma, como `cambiar_horas_materia_curso`, que pasa `id_materia` a la ruta).
- **Web** (`apps/web`): `app/App.tsx` y `app/navegar.ts` (router), `app/pantallas.ts`, todas las pantallas (limpieza y navegación), `estado/` y el cliente regenerado (`api/`).
- **Prototipo:** los `.dc.html` de `sahs-prototipo/`, el armazón y el CONFIG de `prototipo/index.html` (rutas con hash) y el artifact publicado "Planilla de Horarios SAHS".
- **Documentación:** README ("Convenciones", "Cambios respecto del documento", rutas de la web, sección Prototipo), `apps/web/README.md` y `openspec/specs/*`.
- No cambian el modelo de datos ni las migraciones. El nginx sigue enrutando por prefijo de servicio.
