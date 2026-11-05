## ADDED Requirements

### Requirement: APIs publicadas bajo /api
Detrás del nginx de `web`, todas las APIs SHALL publicarse bajo `/api` (`/api/<prefijo>/<recurso>` y `/api/planificaciones/...`), para que no compartan rutas con las pantallas de la web. nginx MUST quitar `/api` antes de pasar el pedido al servicio, así las rutas que publica cada servicio en su swagger no llevan `/api`. El swagger de cada servicio MUST declarar los servers `/api` (por nginx) y `/` (servicio directo). Las llamadas entre servicios MUST ir directo a cada servicio, sin `/api`.

#### Scenario: Misma ruta en la web y en la API
- **WHEN** se recarga `http://localhost:8100/planificaciones/5` en el navegador
- **THEN** se ve la pantalla de armado, y `GET http://localhost:8100/api/planificaciones/5` devuelve la `Planificacion` 5 en JSON

#### Scenario: Ruta en el swagger
- **WHEN** se lee `/docs/pago-json`
- **THEN** la ruta es `GET /pago/pagos` y el primer server es `/api`

#### Scenario: Sin /api en el servicio
- **WHEN** se llama directo al servicio Pago en su puerto con `GET /pago/pagos`
- **THEN** responde `200`

## MODIFIED Requirements

### Requirement: Una ruta por función
Cada función del documento SHALL publicarse como una operación REST sobre un recurso, con `operationId` igual al nombre de la función. El `<prefijo>` MUST ser el nombre del servicio en kebab-case (`/profesor-suplencias`). La ruta MUST ser `/<prefijo>/<recurso>[/{id}[/<subrecurso>[/{id_secundario}]]]`, con recursos en plural, en español y en kebab-case (`/planificacion/ciclos-lectivos`), sin el verbo de la función. El método HTTP MUST corresponder a lo que hace la operación:
- `GET` para las queries y para las operaciones sin efectos;
- `POST` para crear un recurso (responde `201`), para agregar un elemento a una colección (`asignar_*` que agregan) y para las acciones que no son CRUD, modeladas como sub-recurso (`/pagos/{id}/validacion`);
- `PUT` para los `editar_*`, que reemplazan todos los datos editables, y para los `asignar_*` que reemplazan un valor único o una lista completa (`/materias/{id}/orientacion`);
- `PATCH` para `cambiar_*` y `modificar_*`;
- `DELETE` para `eliminar_*` y `quitar_*`.

Hay dos excepciones: `POST /usuario/login` y el recurso planificación del servicio Planificación, que se publica sin prefijo como `/planificaciones` (`/planificaciones/{id}`, `/planificaciones/{id}/estado`, `/planificaciones/estados`) para no repetir `/planificacion/planificaciones`. Los nombres de las funciones (`operationId`) MUST ir en snake_case y los segmentos de ruta en kebab-case, sin tildes ni `ñ` (`ñ` → `ni`). La tabla completa de rutas está en el README ("Cambios respecto del documento").

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

#### Scenario: Recurso planificación sin prefijo
- **WHEN** se revisan `get_planificaciones` y `crear_planificacion` en PLANIFICACIÓN
- **THEN** son `GET /planificaciones` y `POST /planificaciones`, mientras `get_clases` sigue en `GET /planificacion/clases`
