## Context

Hoy el repo tiene:
- `specs/*.json`: 6 contratos OpenAPI 3.0.3 con 102 rutas, generados por `tools/generar_specs.py` a partir del documento del grupo y del diagrama de clases.
- `prototipo/index.html`: una sola aplicación HTML exportada del artifact de diseño, con Login (L1), A1 a A18 y P2 a P4. Usa datos de ejemplo que no se guardan.
- `docker-compose.yml`: Swagger UI en `:8080` y el prototipo con nginx en `:8090`.
- Las convenciones de la API en el README y en `openspec/specs/api-conventions`, y el detalle por servicio en `openspec/specs/*-api`.

El grupo decidió (en explore):
- un monorepo con npm workspaces;
- NestJS para los 6 servicios y React para la web;
- una sola SQLite compartida en un volumen, creada por código con TypeORM;
- que el swagger de Nest sea la nueva fuente de verdad;
- un `docker-compose.app.yml` de producción nuevo, sin tocar el actual.

## Goals / Non-Goals

**Goals:**
- Que las 102 rutas de los contratos funcionen contra la base con las mismas rutas, verbos, códigos, schemas, anidados y filtros.
- Que la web React haga lo mismo que el prototipo, pero con datos persistentes.
- Que `docker compose -f docker-compose.app.yml up -d --build` levante todo desde cero, con la base creada y cargada.
- Que cada servicio publique su OpenAPI y que se pueda verificar que no se apartó de `specs/*.json` al momento del corte.

**Non-Goals:**
- Seguridad real: no hay guards ni autorización por token en la API. El acceso por privilegio se controla en la web, igual que en el prototipo.
- Alta disponibilidad, escalado horizontal o una base por servicio.
- Cambiar el prototipo HTML o el `docker-compose.yml` existente.
- Resolver los puntos de "A revisar por el grupo" del README: se implementa lo que hoy dicen los contratos.
- Un entorno de desarrollo dockerizado con recarga en caliente. El compose es de producción; para desarrollar se usan los scripts de npm.

## Decisions

### 1. Estructura del monorepo (npm workspaces)

```
package.json            workspaces: ["apps/*", "libs/*"], scripts build/lint/test
tsconfig.base.json      paths @sahs/comun, @sahs/entidades, @sahs/contratos
apps/
  web/                  React 18 + Vite + TS + React Router
  usuario/  pago/  horarios/  planificacion/  orientacion/  profesor-suplencias/
  db/                   data-source TypeORM, migraciones, seeds, comando db-init
libs/
  comun/                filtro de errores, health, ValidationPipe, cliente HTTP, swagger
  entidades/            entidades TypeORM, una carpeta por servicio
  contratos/            interfaces TS de los schemas (las usan los DTOs y la web)
```

- Cada servicio Nest es un proyecto Nest estándar (`nest build`) con su `package.json`, y depende de `@sahs/comun` y `@sahs/entidades` por workspace.
- **Alternativa descartada:** el modo monorepo de nest-cli. Comparte un solo `package.json` y deja afuera a React. Nx y Turborepo son demasiado para 9 paquetes.
- Las librerías se compilan con `tsc` a `dist/` y se referencian por `main`, así el build de Docker no depende de paths de TS en runtime.

### 2. Una SQLite compartida con dueños por tabla

- Un archivo `/data/sahs.sqlite` en el volumen `sahs-data`, con el driver `better-sqlite3`. Al abrir la conexión: `PRAGMA journal_mode=WAL`, `busy_timeout=5000` y `foreign_keys=ON`.
- Cada tabla tiene **un servicio dueño**, que es el único que escribe en ella. Las entidades están en `libs/entidades/<servicio>/` y cada servicio registra en TypeORM solo las suyas.
- **Las FK solo existen dentro de un mismo servicio.** Cuando una tabla referencia datos de otro servicio (por ejemplo `clase_profesor.id_profesor` o `pago.id_profesor`), guarda el id como columna indexada, sin FK. Los datos de otro servicio se piden por HTTP, como indica "Invoca:".
  - **Alternativa descartada:** FK y JOINs entre servicios. Acoplaría las tablas, anularía las dependencias del contrato y no permitiría separar la base más adelante.
- Las tablas llevan el prefijo del servicio (`usuario_rol`, `planificacion_clase`...), para que se vea a quién pertenece cada una.

### 3. Migraciones y seeds en un contenedor `db-init`

- `apps/db` tiene el `DataSource` con **todas** las entidades, la migración inicial (generada con `typeorm migration:generate` y versionada) y los seeds. Se usa `synchronize: false` siempre.
- `db-init` ejecuta `migration:run` y después los seeds, y termina. Los servicios lo esperan con `depends_on: { db-init: { condition: service_completed_successfully } }`. Ningún servicio corre migraciones: si lo hicieran los 6 a la vez sobre el mismo archivo, se pisarían.
- Los seeds son idempotentes: cada bloque se carga solo si su tabla está vacía. Si el volumen ya tiene datos, no se duplican ni se pisan.
- Qué cargan los seeds:
  - los privilegios, que se cargan por configuración (los ids de `CONFIG.privilegios` del prototipo);
  - los roles Administrativo, Profesor y Coordinador de área, con sus privilegios;
  - los estados de propuesta BOR, REV, VAL y CER;
  - los datos de `datos-de-ejemplo.md` y del prototipo: turnos, franjas, días, áreas, orientaciones, materias, cursos, profesores, usuarios, la propuesta, las clases, la disponibilidad, las suplencias y los pagos.
- Las contraseñas se guardan con **bcryptjs**. Todos los usuarios de ejemplo tienen la contraseña `sahs2026`, documentada en el README.

### 4. Del contrato al código: scaffolding una vez y verificación del corte

- `tools/generar_scaffold.mjs` lee `specs/*.json` **una sola vez** y genera, por servicio, los controllers (ruta, verbo, `@HttpCode`, parámetros, decoradores de `@nestjs/swagger` con respuestas 400 y 404), los DTOs con `class-validator` y `@ApiProperty`, y los services vacíos. Después de esa corrida el código se edita a mano. El script queda en `tools/` como historial, junto con `generar_specs.py`.
- `npm run verificar-contratos` arranca cada servicio contra una base temporal, baja su `/docs-json` y lo compara con `specs/<servicio>.json`: rutas, verbos, `operationId`, códigos de respuesta, parámetros y propiedades de los schemas. Sirve para cerrar este cambio. Después se puede retirar o actualizar a medida que el swagger de Nest evolucione.
- Desde este cambio, **el OpenAPI que publica cada servicio es la fuente de verdad**. `specs/` y `generar_specs.py` se congelan, y AGENTS.md, `docs/referencias.md` y el README explican la nueva cadena: documento → código Nest → swagger.
- **Alternativa descartada:** escribir todo a mano sin generador. Con 102 rutas, es fácil equivocarse en un verbo o un código.

### 5. Convenciones transversales en `libs/comun`

- **Errores:** un `ExceptionFilter` global transforma cualquier error en `Error { codigo, mensaje }`. Los errores de validación de `class-validator` dan 400 (`codigo: "VALIDACION"`), una entidad inexistente da 404 (`NO_ENCONTRADO`) y una regla de negocio da 400 o 409.
- **Health:** `GET /actuator/health` responde `{ status: "UP" }` después de comprobar la conexión a la base (`SELECT 1`).
- **Validación:** `ValidationPipe` global con `whitelist` y `transform`. Los filtros de query se validan con DTOs de query.
- **Contraseñas:** las entidades marcan `contrasenia` con `select: false`, y los DTOs de salida no la tienen.
- **Prefijos:** cada servicio declara el suyo (`/usuario`...) en el controller, no con `setGlobalPrefix`, para que `/actuator/health` y `/docs` queden en la raíz.

### 6. Llamadas entre servicios

- `ClienteServicio` (en `libs/comun`) usa `fetch` con la URL base de una variable de entorno (`URL_USUARIO=http://usuario:3000`...) y un timeout de 5 segundos.
- Si el otro servicio responde 404, el servicio que llama responde **400** ("referencia inexistente": `id_profesor` inválido, por ejemplo). Si el otro servicio no responde, responde **503** con `Error`.
- Los anidados que vienen de otro servicio (`Clase.materia`, `Curso.turno`...) se arman con esas llamadas. Para no hacer N+1 en los listados, cada servicio pide los ids distintos una sola vez por request y guarda las respuestas en memoria durante esa request.
- No hay `depends_on` entre servicios, porque las dependencias son cíclicas. Cada servicio arranca solo y falla recién en la llamada si el otro todavía no está.

### 7. Lógica de negocio (lo que no es alta, baja o modificación)

| Operación | Regla |
|---|---|
| `usuario.login` | Busca por `email` o por `nombre_user`, sin distinguir mayúsculas, y compara con bcrypt. Devuelve `{ token, usuario }`: el token es un JWT firmado (con `JWT_SECRET`), con `id_usuario`, y no se valida en la API. Si los datos no coinciden, responde 400 con "Usuario o contraseña incorrectos". |
| `planificacion.crear_propuesta` | Nace en BOR. |
| `asignar_estado_a_propuesta` | Solo admite las transiciones BOR→REV, REV→VAL, REV→BOR y VAL→CER. Cualquier otra responde 409. |
| `crear_clase` | Por cada profesor y franja, consulta `get_disponibilidad_profesor`. Si alguna franja no está disponible, si es un recreo o si choca con otra clase del mismo profesor en la misma propuesta, responde 409 e indica cuál. |
| `asignar_materia_a_curso` | Si no se indican horas, toma las de la materia (`orientacion.get_materia`). |
| `get_suplencias` | `fecha_desde`/`fecha_hasta` devuelven las suplencias cuyo período se superpone con el rango. `id_clase` filtra por `ids_clases`. |
| `get_clase` | Anida la suplencia vigente a la fecha del día, si existe. |
| `pago.calcular_monto_a_liquidar` | `horas semanales del profesor en la propuesta vigente × valor hora del cargo × 4`, más los conceptos fijos. Los parámetros (valor hora, aportes) son configuración del servicio. La fórmula exacta se toma del recibo de ejemplo del prototipo (P4). |
| `crear_pago` | Crea el pago y su único recibo, con los conceptos y el neto del cálculo. |
| `validar_pago` | `validado = true` y completa `firma_emisor`. |
| `firmar_recibo_de_sueldo` | Completa `firma_receptor` una sola vez. Si ya está firmado, responde 409. |
| `bajar_recibo_sueldo` | Genera el PDF del recibo con `pdfkit` (`application/pdf`). |

### 8. Swagger

- Cada servicio usa `SwaggerModule` y publica `/docs` (UI) y `/docs-json`. `info` incluye el título, la descripción con las dependencias y `x-dependencias`, como en los contratos. `servers` es `[{ url: "/" }]`, así "Try it out" va al mismo origen.
- nginx de `web` expone `/docs/<servicio>/` y `/docs/<servicio>-json`, que redirigen al `/docs` de cada servicio.
- El Swagger UI agregado (`swaggerapi/swagger-ui` en `:8180`) tiene `URLS` apuntando a `http://localhost:8100/docs/<servicio>-json`. Los servicios habilitan CORS para el origen `http://localhost:8180`, para que funcione "Try it out" desde ahí.

### 9. App web React

- Vite + React 18 + TS + React Router. Las rutas usan el código de pantalla (`/A1` ... `/A18`, `/P2` ... `/P4`, `/login`), así se mantiene la correspondencia con el diseño.
- **Estilos:** se toman los CSS del prototipo (tokens, cabecera, tarjetas, grillas) y se pasan a módulos o archivos por pantalla. El prototipo es la referencia visual de cada pantalla.
- **Sesión:** se guarda en `sessionStorage` (`token`, `id_usuario`), una por pestaña, como en el prototipo. Un `SesionProvider` carga el usuario con `get_usuario` y los privilegios del rol con `get_rol_privilegios`. El menú (A1) y la protección de rutas salen de esos privilegios, con un mapa `id_privilegio → pantalla` equivalente a `CONFIG.privilegios`.
- **Datos:** hay un cliente por servicio (`api/usuario.ts`...) tipado con `@sahs/contratos`. Las llamadas van a rutas relativas (`/usuario/...`), que nginx redirige a cada servicio. Se usa TanStack Query para la caché y para invalidar después de los commands.
- Los errores de la API (`Error.mensaje`) se muestran dentro de la pantalla, sin diálogos del navegador.

### 10. Docker de producción

- Hay un Dockerfile único para los servicios (`apps/Dockerfile.servicio`, con `ARG APP`), en dos etapas:
  1. `node:22-slim`: `npm ci`, build de las libs y de la app, y `npm prune --omit=dev`.
  2. `node:22-slim`, que solo tiene `dist` y `node_modules`.

  `better-sqlite3` se compila en la primera etapa, sobre la misma base glibc.
- `apps/db/Dockerfile` arma la imagen de `db-init`. `apps/web/Dockerfile` hace el build de Vite y arma un `nginx:1.27.5-alpine` con `nginx.conf`, que sirve el SPA (con `try_files ... /index.html`) y el proxy por prefijo.
- En `docker-compose.app.yml`:
  - volumen `sahs-data` montado en `/data` en `db-init` y en los 6 servicios;
  - red interna; los servicios escuchan en `:3000` y no publican puertos;
  - se publican solo `web:8100` y `swagger:8180`;
  - `healthcheck` de cada servicio contra `/actuator/health`; `web` depende de que estén sanos;
  - `restart: unless-stopped`;
  - variables: `DB_PATH=/data/sahs.sqlite`, `URL_<SERVICIO>`, `JWT_SECRET` y `CORS_ORIGEN`.

## Risks / Trade-offs

- [Seis procesos escriben en la misma SQLite → `SQLITE_BUSY`] → WAL, `busy_timeout=5000` y transacciones cortas. Alcanza para el uso del grupo. Si no alcanzara, se cambia el driver de TypeORM sin tocar las entidades.
- [Dependencias cíclicas entre Planificación, Orientación y Profesor y Suplencias] → No hay `depends_on` entre servicios. Las llamadas tienen timeout y devuelven 503 en lugar de quedar colgadas.
- [Mientras se implementa, el swagger de Nest se aparta del contrato congelado] → `verificar-contratos` es el criterio para cerrar el cambio.
- [N+1 en los listados con anidados de otros servicios] → Se piden los ids distintos una vez por request, con caché en memoria durante esa request.
- [La fórmula de `calcular_monto_a_liquidar` no está en el documento] → Se toma la del recibo de ejemplo del prototipo, parametrizada, y se anota en "A revisar por el grupo".
- [El login acepta `nombre_user` en el campo `email`] → Mantiene el contrato (`{ email, contrasenia }`) y lo que hace el prototipo. Se documenta en "Cambios respecto del documento".
- [No hay seguridad en la API] → Es la decisión vigente del contrato. El JWT ya existe para agregar guards más adelante.
- [Pantallas del prototipo que dependen de datos que la API no tiene, como "Recibos de sueldo" y "Áreas", marcadas como "Pendiente"] → Se implementan si el contrato las soporta (`get_areas` y `get_recibos_de_sueldo` existen). Si falta algo, se anota.

## Migration Plan

1. Merge con la estructura nueva. Nada existente se mueve: `prototipo/`, `specs/`, `tools/` y `docker-compose.yml` quedan donde están.
2. `docker compose -f docker-compose.app.yml up -d --build` crea el volumen, migra y carga los seeds, y levanta todo.
3. Para empezar de cero: `docker compose -f docker-compose.app.yml down -v` borra el volumen.
4. Las migraciones futuras se generan en `apps/db` y `db-init` las aplica en el siguiente `up`.
5. Rollback: bajar el compose nuevo. El entorno anterior (`docker-compose.yml`) sigue funcionando igual.

## Open Questions

- La fórmula exacta y los parámetros de `calcular_monto_a_liquidar` (valor hora por cargo y descuentos) y si el emisor del recibo es un dato fijo de la institución (punto 1 de "A revisar").
- Si `get_estado_actual_de_propuesta` sigue siendo necesario, cuando el estado ya viene anidado en la propuesta (punto 3 de "A revisar").
- Las transiciones de estado de la propuesta: se asume BOR→REV→VAL→CER, con vuelta REV→BOR. Hay que confirmarlo con el grupo.
