# api-conventions Specification

## Purpose
TBD - created by archiving change swagger-microservicios-sahs. Update Purpose after archive.
## Requirements
### Requirement: Un contrato OpenAPI por servicio
Cada uno de los 6 servicios SHALL publicar su propio contrato OpenAPI 3, generado por `@nestjs/swagger` a partir del código del servicio, en `GET /docs-json` (y la UI en `/docs`). Ese contrato es la fuente de verdad de la API. Los archivos `specs/<servicio>.json` y `tools/generar_specs.py` quedan congelados como historial del corte inicial, y MUST NOT usarse para definir cambios nuevos: un cambio en la API se hace en el código del servicio. `AGENTS.md`, `docs/referencias.md` y el README MUST describir la cadena documento → código Nest → swagger.

#### Scenario: Validación de los contratos
- **WHEN** se valida con un linter de OpenAPI el `/docs-json` de cada uno de los 6 servicios
- **THEN** los 6 documentos son válidos y no tienen errores

#### Scenario: Cambio en la API
- **WHEN** el grupo agrega una operación a un servicio
- **THEN** la agrega en el controller de NestJS, aparece en el `/docs-json` del servicio, y `specs/` no cambia

### Requirement: Una ruta por función
Cada función del documento SHALL publicarse como una operación REST sobre un recurso, con `operationId` igual al nombre de la función. El `<prefijo>` MUST ser el nombre del servicio en kebab-case (`/profesor-suplencias`). La ruta MUST ser `/<prefijo>/<recurso>[/{id}[/<subrecurso>[/{id_secundario}]]]`, con recursos en plural, en español y en kebab-case (`/planificacion/ciclos-lectivos`), sin el verbo de la función. El método HTTP MUST corresponder a lo que hace la operación:
- `GET` para las queries y para las operaciones sin efectos;
- `POST` para crear un recurso (responde `201`), para agregar un elemento a una colección (`asignar_*` que agregan) y para las acciones que no son CRUD, modeladas como sub-recurso (`/pagos/{id}/validacion`);
- `PUT` para los `editar_*`, que reemplazan todos los datos editables, y para los `asignar_*` que reemplazan un valor único o una lista completa (`/materias/{id}/orientacion`);
- `PATCH` para `cambiar_*` y `modificar_*`;
- `DELETE` para `eliminar_*` y `quitar_*`.

La única excepción es `POST /usuario/login`. Los nombres de las funciones (`operationId`) MUST ir en snake_case y los segmentos de ruta en kebab-case, sin tildes ni `ñ` (`ñ` → `ni`). La tabla completa de rutas está en el README ("Cambios respecto del documento").

#### Scenario: Cambio parcial
- **WHEN** el documento lista el command `cambiar_contrasenia()` en USUARIO
- **THEN** el contrato tiene `PATCH /usuario/usuarios/{id}/contrasenia` con `operationId: cambiar_contrasenia`

#### Scenario: Creación
- **WHEN** el documento lista `crear_usuario()`
- **THEN** el contrato tiene `POST /usuario/usuarios` con una respuesta `201`

#### Scenario: Eliminación
- **WHEN** el documento lista `eliminar_usuario()`
- **THEN** el contrato tiene `DELETE /usuario/usuarios/{id}` con una respuesta `204`

#### Scenario: Nombre con tilde
- **WHEN** el documento lista `get_día_lectivo()`
- **THEN** la ruta es `GET /horarios/dias-lectivos/{id}` con `operationId: get_dia_lectivo`

#### Scenario: Edición completa
- **WHEN** el documento lista `editar_profesor()` en PROFESOR Y SUPLENCIAS
- **THEN** el contrato tiene `PUT /profesor-suplencias/profesores/{id}` con una respuesta `200`

#### Scenario: Listado y creación sobre el mismo recurso
- **WHEN** se revisan `get_materias` y `crear_materia` en ORIENTACIÓN
- **THEN** son `GET /orientacion/materias` y `POST /orientacion/materias`

### Requirement: Identificadores en la ruta
El id de la entidad principal de la operación SHALL ir como parámetro de ruta `{id}`. Cuando la operación actúa sobre un elemento de una sub-colección (quitarlo o cambiar sus datos en esa relación), el id del elemento MUST ir como segundo parámetro de ruta, con el nombre del campo (`{id_materia}`, `{id_franja_horaria}`). Los demás datos MUST ir en el body JSON. Las operaciones `GET` MUST NOT llevar body, y sus datos adicionales van como parámetros de query.

#### Scenario: Asignación entre entidades
- **WHEN** se asigna un privilegio a un rol
- **THEN** la operación es `POST /usuario/roles/{id}/privilegios`, con `{id}` = id del rol y el body `{ "id_privilegio": <n> }`

#### Scenario: Quitar de una colección
- **WHEN** se quita una materia de un área
- **THEN** la operación es `DELETE /orientacion/areas/{id}/materias/{id_materia}`, sin body

#### Scenario: Cambiar un dato de la relación
- **WHEN** se cambian las horas de la materia 7 en el curso 3
- **THEN** la operación es `PATCH /planificacion/cursos/3/materias/7` con el body `{ "horas_semanales": <n> }`

### Requirement: Datos relacionados anidados
Una relación con un solo elemento SHALL devolverse anidada en la respuesta de la entidad, y no MUST existir una query separada para obtenerla. Las relaciones con varios elementos MAY tener su propia query de listado, publicada como sub-recurso.

#### Scenario: Materia de una clase
- **WHEN** se consulta `GET /planificacion/clases/{id}`
- **THEN** la respuesta incluye el objeto `materia`, y no existe `get_materia_clase`

#### Scenario: Sub-recurso de listado
- **WHEN** se piden las materias de una orientación
- **THEN** la operación es `GET /orientacion/orientaciones/{id}/materias`

### Requirement: Errores, health check y datos sensibles
Cada contrato SHALL incluir:
- `GET /actuator/health`, que responde `{ "status": "UP" }`;
- un schema `Error { codigo, mensaje }`, usado en las respuestas `400` (operaciones con body) y `404` (operaciones con `{id}`).

Las contraseñas MUST ser `writeOnly`.

#### Scenario: Recurso inexistente
- **WHEN** se pide `GET /usuario/usuarios/{id}` con un id que no existe
- **THEN** el contrato documenta una respuesta `404` con el schema `Error`

### Requirement: Dependencias documentadas
Cada contrato SHALL declarar en `info.x-dependencias` los endpoints de otros servicios que consume y qué operaciones los usan. La `description` de cada una de esas operaciones MUST mencionar "Invoca: <servicio>.<endpoint>".

#### Scenario: Servicio sin dependencias
- **WHEN** el servicio no consume a ningún otro (USUARIO, HORARIOS)
- **THEN** `x-dependencias` es una lista vacía

### Requirement: Filtros opcionales en los listados
Los listados (`GET` sobre una colección, sin `{id}` final) MAY recibir filtros como parámetros de query opcionales (`required: false`), con el nombre del campo que filtran (`id_profesor`, `periodo`, `fecha_desde`…). Si se pasan varios, se combinan con AND. Si no se pasa ninguno, el listado devuelve todos los elementos. Un listado con filtros MUST documentar la respuesta `400` para filtros inválidos.

#### Scenario: Listado filtrado
- **WHEN** se llama `GET /planificacion/clases?id_profesor=12`
- **THEN** devuelve solo las clases en las que el profesor 12 figura en `ids_profesores`

#### Scenario: Listado sin filtros
- **WHEN** se llama `GET /planificacion/clases` sin parámetros
- **THEN** devuelve todas las clases

#### Scenario: Filtro opcional en el contrato
- **WHEN** se revisa el parámetro `id_profesor` de `get_clases` en el `/docs-json` de planificación
- **THEN** tiene `in: query` y `required: false`

