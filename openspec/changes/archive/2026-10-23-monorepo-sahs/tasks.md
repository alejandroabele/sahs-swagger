## 1. Etapa 1 · Monorepo y librerías base

- [x] 1.1 Reemplazar el `package.json` raíz por uno con `workspaces: ["apps/*", "libs/*"]` y los scripts `build`, `lint`, `test`, `verificar-contratos` y `dev:<app>`. Agregar `tsconfig.base.json`, `.editorconfig`, `.dockerignore` y completar `.gitignore` (`node_modules`, `dist`, `*.sqlite*`)
- [x] 1.2 Crear `libs/contratos` con las interfaces TS de todos los schemas de `specs/*.json`, una por servicio, y compilarla con `tsc`
- [x] 1.3 Crear `libs/comun`:
  - `ExceptionFilter` → `Error { codigo, mensaje }`;
  - `ValidationPipe` global;
  - `HealthController` (`/actuator/health` con `SELECT 1`);
  - `configurarSwagger(app, info)` (`/docs`, `/docs-json`, `servers: [{url:"/"}]`, `x-dependencias`);
  - `ClienteServicio` (fetch, `URL_<SERVICIO>`, timeout de 5 s, 404→400, caída→503, caché por request);
  - `crearOpcionesTypeOrm(entidades)` (better-sqlite3, `DB_PATH`, WAL, `busy_timeout`, `foreign_keys`, `synchronize: false`).
- [x] 1.4 Verificar que `npm ci && npm run build` compila las tres librerías

## 2. Etapa 1 · Base de datos

- [x] 2.1 Crear las entidades TypeORM en `libs/entidades/<servicio>/`, a partir de los schemas de `specs/*.json` y del diagrama de clases. Las tablas llevan el prefijo del servicio, las FK son solo dentro del servicio y las referencias a otros servicios son columnas de id indexadas
- [x] 2.2 Crear `apps/db` con el `DataSource` de todas las entidades y los scripts `migration:generate`, `migration:run` y `db-init`
- [x] 2.3 Generar y versionar la migración inicial. Verificar que sobre una base vacía crea todas las tablas
- [x] 2.4 Escribir los seeds idempotentes:
  - privilegios (los ids de `CONFIG.privilegios` del prototipo);
  - roles con sus privilegios;
  - estados de propuesta BOR, REV, VAL y CER;
  - usuarios con bcrypt y la contraseña `sahs2026`.
- [x] 2.5 Escribir los seeds de los datos de ejemplo (`../datos-de-ejemplo.md` y los datos del prototipo): días, turnos y franjas con recreos; áreas, orientaciones y materias; ciclos, años, cursos y materias por curso; profesores y disponibilidad; la propuesta y sus clases; suplencias; pagos y recibos
- [x] 2.6 Verificar que `db-init` corre dos veces seguidas sin duplicar datos y que se puede entrar con `secretaria`, `jramirez` y `sferreyra`

## 3. Etapa 2 · Scaffolding de los servicios

- [x] 3.1 Escribir `tools/generar_scaffold.mjs`, que lee `specs/*.json` y genera por servicio el `main.ts`, el módulo, los controllers (ruta, verbo, `@HttpCode`, params, query, body y decoradores de swagger), los DTOs (`class-validator` + `@ApiProperty`, que implementan `@sahs/contratos`) y los services vacíos
- [x] 3.2 Correr el generador una vez para crear `apps/usuario`, `apps/pago`, `apps/horarios`, `apps/planificacion`, `apps/orientacion` y `apps/profesor-suplencias`, cada uno con su `package.json`, `nest-cli.json` y `tsconfig`
- [x] 3.3 Escribir `tools/verificar_contratos.mjs` (`npm run verificar-contratos`): levanta cada servicio con una base temporal, compara su `/docs-json` con `specs/<servicio>.json` y lista las diferencias
- [x] 3.4 Ajustar el scaffolding hasta que `verificar-contratos` informe 0 diferencias, con los services todavía vacíos

## 4. Etapa 2 · Implementación de los servicios

- [x] 4.1 Horarios: días lectivos, turnos y franjas, con `es_recreo`, `asignar_franja_a_turno` y `eliminar_franja_horaria_turno`. No tiene dependencias
- [x] 4.2 Usuario:
  - `login` (email o `nombre_user`, bcrypt, JWT);
  - usuarios, roles y privilegios (`asignar_privilegio`, `quitar_privilegio`, `asignar_rol`);
  - `editar_usuario` y `cambiar_contrasenia`.
- [x] 4.3 Orientación: orientaciones, áreas y materias (`asignar_materia_orientacion`, `quitar_materia_area`, coordinador), con las llamadas a `profesor_suplencias` y `planificacion` según `x-dependencias`
- [x] 4.4 Profesor y Suplencias:
  - profesores (`editar_profesor`, `asignar_usuario_profesor` → `usuario.get_usuario`);
  - disponibilidad (`asignar_disponibilidad` → `horarios.get_franja_horaria`; los recreos se rechazan);
  - suplencias (`crear_suplencia` con `ids_clases[]` → `planificacion.get_clase`; filtros por superposición e `id_clase`).
- [x] 4.5 Planificación (parte 1):
  - ciclos lectivos y años académicos;
  - propuestas: nacen en BOR y las transiciones válidas dan 409 si no corresponden; `get_estado_actual_de_propuesta`;
  - cursos con orientación y turno (anidados por HTTP);
  - materias por curso (`asignar_materia_a_curso` con horas por defecto, `cambiar_horas_materia_curso`, `quitar_materia_curso`).
- [x] 4.6 Planificación (parte 2): clases. `crear_clase` controla disponibilidad, recreos y choques del profesor (409). `get_clase` anida la materia, las franjas, los profesores y la suplencia vigente. `get_clases` y `get_curso_clases` se filtran sin N+1
- [x] 4.7 Pago:
  - `calcular_monto_a_liquidar` (fórmula parametrizada, tomada del recibo de ejemplo de P4);
  - `crear_pago` con su recibo y conceptos;
  - `validar_pago`;
  - `firmar_recibo_de_sueldo` (409 si ya estaba firmado);
  - `bajar_recibo_sueldo` (PDF con pdfkit);
  - filtros `id_profesor` y `periodo`.
- [x] 4.8 Escribir tests e2e (`node:test`, `tests/e2e`) que levantan los 6 servicios reales sobre una SQLite temporal con los seeds y cubren los escenarios de `specs/microservicios-nest` (en lugar de Jest con dependencias simuladas: prueban también las llamadas entre servicios)
- [x] 4.9 Volver a correr `npm run verificar-contratos` con todo implementado: 0 diferencias

## 5. Etapa 3 · App web React

- [x] 5.1 Crear `apps/web` con Vite + React + TS, React Router y TanStack Query. Pasar los estilos base del prototipo (tokens, tipografía, cabecera, tarjetas, tablas y grillas)
- [x] 5.2 Escribir los clientes de la API por servicio (`src/api/*.ts`), con rutas relativas, tipos de `@sahs/contratos` y manejo de `Error`
- [x] 5.3 Armar la sesión y el acceso:
  - `SesionProvider` en `sessionStorage`;
  - Login (L1) con la lista de usuarios de ejemplo;
  - la cabecera;
  - Cerrar sesión;
  - A18 (Cambiar mi contraseña);
  - las rutas protegidas por privilegio (con el mapa `id_privilegio → pantalla`).
- [x] 5.4 Inicio (A1) con las tarjetas de los privilegios del rol, con "Pendiente" para las pantallas sin implementar y actualización sin recargar después de A17
- [x] 5.5 Pantallas de estructura: turnos y franjas, ciclos lectivos, orientaciones, áreas y materias, y el detalle de materia
- [x] 5.6 Pantallas de profesores: listado, alta sin usuario (A8), ficha con el bloque Usuario y Editar datos (A9), y disponibilidad (A2)
- [x] 5.7 Pantallas de cursos y planificación: listado de cursos con avance (A10), alta y edición de curso, planificaciones (A3) y planificación manual (A13, con grilla por turno, recreos, docentes únicos por clase y errores 409 en pantalla)
- [x] 5.8 Suplencias (A4): crear una suplencia con el ausente, el período, el motivo, las clases que cubre y el suplente, y listarlas por período
- [x] 5.9 Usuarios (A17): pestañas Usuarios y Roles, alta, edición, asignación de rol y privilegios
- [x] 5.10 Pantallas del profesor: Mi horario (P2), Mi disponibilidad (P3, sin recreos) y Mis recibos (P4, con la firma definitiva y la descarga del PDF)
- [x] 5.11 Revisar la paridad visual de cada pantalla contra `prototipo/index.html` con los datos de los seeds, y anotar las diferencias que no se puedan resolver

## 6. Etapa 4 · Docker de producción

- [x] 6.1 Escribir `apps/Dockerfile.servicio`: varias etapas sobre `node:22-slim`, `ARG APP`, `npm ci`, build de las libs y de la app, `npm prune --omit=dev`, e imagen final solo con `dist` y `node_modules`
- [x] 6.2 Imagen de `db-init`: el mismo `apps/Dockerfile.servicio` con `APP=db` y `ENTRADA=db-init.js`
- [x] 6.3 Escribir `apps/web/Dockerfile` (build de Vite y `nginx:1.27.5-alpine`) y `apps/web/nginx.conf`:
  - el SPA con `try_files`;
  - el proxy de los 6 prefijos;
  - `/docs/<servicio>/` y `/docs/<servicio>-json`.
- [x] 6.4 Escribir `docker-compose.app.yml`:
  - el volumen `sahs-data` y la red interna;
  - `db-init`, y los 6 servicios con `depends_on: db-init` (`service_completed_successfully`), un `healthcheck` y sus variables `DB_PATH`, `URL_*`, `JWT_SECRET` y `CORS_ORIGEN`;
  - `web:8100`, que depende de que los servicios estén sanos;
  - `swagger:8180`, con `URLS` a través del proxy;
  - nombres de contenedor `sahs-app-*`.
- [x] 6.5 Prueba de humo desde cero: `down -v`, `up -d --build`, entrar con los 3 usuarios, crear un curso, recargar, y probar "Try it out" en `:8180`
- [x] 6.6 Verificar que funciona con los dos compose levantados a la vez (`:8080`, `:8090`, `:8100` y `:8180`)

## 7. Etapa 4 · Documentación

- [x] 7.1 README:
  - sección "Aplicación": comandos, URLs, usuarios y contraseña, desarrollo local con npm;
  - sección "Estructura del monorepo";
  - "Mantenimiento" actualizado: los cambios en la API se hacen en el código Nest;
  - en "Cambios respecto del documento": el login con `nombre_user`, las transiciones de la propuesta y la fórmula de liquidación;
  - en "A revisar por el grupo": la fórmula de liquidación.
- [x] 7.2 `AGENTS.md`: la fuente de verdad de la API es el swagger de cada servicio Nest; `specs/` y `generar_specs.py` están congelados; reglas para tocar entidades y migraciones
- [x] 7.3 `docs/referencias.md`: actualizar el diagrama de flujo (documento y diagrama → código Nest → swagger → `:8180`; diseño → `prototipo/` como referencia → `apps/web`)
- [x] 7.4 Escribir `apps/*/README.md` breves, con qué tablas tiene cada servicio, de qué depende y cómo correrlo solo
