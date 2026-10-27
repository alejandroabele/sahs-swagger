## 1. Preparación

- [x] 1.1 Respaldar los `.dc.html` de `sahs-prototipo/` (están fuera de git) en el scratchpad
- [x] 1.2 Leer el artifact publicado "Planilla de Horarios SAHS" (`Artifact read`) y compararlo con los `.dc.html` locales. Si difieren, preguntar cuál manda antes de seguir

## 2. API REST en los servicios

- [x] 2.1 usuario: pasar las rutas de los controllers a las de la tabla del design, con el mismo `operationId`
- [x] 2.2 horarios: ídem
- [x] 2.3 orientacion: ídem
- [x] 2.4 planificacion: ídem, incluido `cambiar_horas_materia_curso` con `{id_materia}` en la ruta y `asignar_curso_a_anio_academico` en `/anios-academicos/{id}/cursos`
- [x] 2.5 pago: ídem
- [x] 2.6 profesor_suplencias: ídem
- [x] 2.7 Actualizar las llamadas entre servicios (`ClienteServicio.enviar/…`) a las rutas nuevas (planificacion → orientacion y las demás que aparezcan)
- [x] 2.8 Revisar `libs/contratos` y `libs/comun` por rutas o DTOs afectados (el body de `cambiar_horas_materia_curso` pierde `id_materia`)
- [x] 2.9 Pasar `tests/e2e/servicios.test.mjs` a las rutas nuevas
- [x] 2.10 `tools/verificar_contratos.mjs`: comparar por `operationId` (verbo, parámetros, bodies y respuestas) y registrar las dos diferencias de forma como excepciones documentadas
- [x] 2.11 `npm run build`, `npm test` y `npm run verificar-contratos` en verde; validar el `/docs-json` de los 6 servicios con el linter de OpenAPI

## 3. Cliente y router de la web

- [x] 3.1 Regenerar el cliente (`node tools/generar_cliente_web.mjs`) y confirmar que los nombres de los métodos no cambiaron
- [x] 3.2 Crear `app/rutas.ts` con la tabla de rutas del design: patrón, pantalla, privilegio y una función tipada por ruta (`rutas.materia(id)`)
- [x] 3.3 Reescribir `App.tsx`: una `<Route>` por ruta con parámetros, control de privilegio por ruta, `/login`, y redirección al inicio para rutas desconocidas
- [x] 3.4 Reemplazar `useNavegar(codigo, params)`, `useParamNumero` y `useParam` por `rutas.*` + `useParams`, y cambiar todas las llamadas `ir(...)` de pantallas y componentes
- [x] 3.5 Quitar las navegaciones con ids fijos (`id_profesor: 3`, `id_propuesta: 4, id_curso: 2`) y las "propuestas por defecto" de A3 y A13: el menú lleva a `/planificaciones`
- [x] 3.6 Actualizar `PANTALLA_DE_PRIVILEGIO`, cabecera, logo y "Cambiar mi contraseña" a las rutas nuevas

## 4. Limpieza de pantallas (diseño → prototipo → web)

Para cada pantalla: editar su `.dc.html`, exportar (`python3 tools/exportar_prototipo.py ..`) y llevar el cambio a la pantalla React, según la tabla "3. Qué consulta cada pantalla" del design.

- [x] 4.1 Login: quitar la tarjeta de usuarios de ejemplo y la consulta `get_usuarios` (y su CSS responsive en `l1/`)
- [x] 4.2 Inicio: quitar el pie explicativo, las descripciones que nombran pantallas y las tarjetas "Pendiente" (los privilegios sin pantalla no se muestran)
- [x] 4.3 A2 Disponibilidad: quitar las horas asignadas
- [x] 4.4 A3 Generación y A4 Suplencias: quitar los textos de ayuda; A3 recibe propuesta y curso por ruta
- [x] 4.5 A5 Materias: quitar el filtro de orientaciones por año (`orientacionesParaAnio`, `get_cursos`) y el pie "Hacé clic…"
- [x] 4.6 A6 Ficha de materia: docentes con `get_profesores_materia`; quitar cursos donde se dicta, el selector de otra materia y `get_profesores` completo
- [x] 4.7 A7 Profesores: quitar horas que dicta, área derivada y franjas contadas, con sus consultas
- [x] 4.8 A8 Alta de profesor: quitar `get_profesores` y la validación duplicada del front
- [x] 4.9 A9 Ficha de profesor: quitar clases asignadas y el selector de otro profesor, con sus consultas
- [x] 4.10 A10 Cursos: quitar horas ubicadas y estado de la planificación (`get_propuestas`, `get_clases`)
- [x] 4.11 A11 Curso: quitar `get_cursos` y la validación duplicada del front
- [x] 4.12 A12 Planificaciones: quitar el avance "x/y h" (`get_clases`, `get_cursos`)
- [x] 4.13 A13 Armado: quitar los pies "Tocá…"; propuesta y curso por ruta
- [x] 4.14 A14 Orientaciones: quitar el cuadro año × orientación deducido de cursos y los conteos de profesores
- [x] 4.15 A15 Ciclos lectivos: quitar cursos y vigente por ciclo, y el estado y período inventados
- [x] 4.16 A16 Turnos: quitar los cursos que usan cada turno (`get_cursos`, `get_anios_academicos`)
- [x] 4.17 A17, A18, P2, P3 y P4: quitar los textos de ayuda que haya
- [x] 4.18 Borrar el código que quede sin uso (helpers de `a5/comun.ts`, `a12/`, CSS de bloques quitados) y correr `tsc --noEmit`
- [x] 4.19 Buscar restos: `grep` de "pantalla A", "Hacé clic", "Tocá", "Pendiente", "ejemplo", `?id_` en `apps/web/src` y en los `.dc.html`, y dejarlo en cero (salvo comentarios de código)

## 5. Prototipo con rutas con hash

- [x] 5.1 En el armazón y el `CONFIG` de `prototipo/index.html`: rutas `#/…` con la misma tabla que la web, parámetros de ruta para las fichas y redirección al inicio para hashes viejos
- [x] 5.2 Navegación del diseño: los `.dc.html` siguen usando `data-ir` con el código interno y el armazón lo traduce a la ruta (`armarRuta`), así que no hace falta cambiar los `.dc.html` por las rutas
- [x] 5.3 `python3 tools/exportar_prototipo.py .. --check` sin cambios pendientes

## 6. Documentación y specs

- [x] 6.1 README: "Convenciones" (REST), "Cambios respecto del documento" (tabla operationId → ruta REST y las dos diferencias de forma), rutas de la web y sección Prototipo
- [x] 6.2 `apps/web/README.md`: rutas y navegación con `rutas.ts`
- [x] 6.3 Revisar `AGENTS.md` y `docs/referencias.md` por ejemplos con rutas viejas

## 7. Verificación y publicación

- [x] 7.1 Reconstruir (`docker compose -f docker-compose.app.yml up -d --build`) y recorrer en el navegador cada ruta con `secretaria` y con `jramirez`, revisando las llamadas de red de cada pantalla contra la tabla del design
- [x] 7.2 Recorrer el prototipo (`http://localhost:8090`) con las rutas con hash
- [x] 7.3 Republicar el artifact "Planilla de Horarios SAHS" con los `.dc.html` nuevos y comprobar que coincide con `prototipo/index.html`
- [x] 7.4 `openspec validate limpieza-y-rutas --strict`
