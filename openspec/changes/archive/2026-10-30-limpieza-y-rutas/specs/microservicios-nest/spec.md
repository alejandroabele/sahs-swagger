## MODIFIED Requirements

### Requirement: Seis servicios NestJS que implementan los contratos
Cada servicio de `specs/*.json` SHALL tener su app NestJS que expone todas sus operaciones con el mismo prefijo, verbo, `operationId`, parámetros, body, códigos de respuesta y schemas, en rutas REST (recursos en plural y en kebab-case), salvo las diferencias de forma documentadas en "Cambios respecto del documento" del README. Cada operación MUST leer y escribir en la base. Los servicios son Usuario (`/usuario`), Pago (`/pago`), Horarios (`/horarios`), Planificación (`/planificacion`), Orientación (`/orientacion`) y Profesor y Suplencias (`/profesor_suplencias`). Siguen valiendo los requisitos de `usuario-api`, `pago-api`, `horarios-api`, `planificacion-api`, `orientacion-api` y `profesor-suplencias-api`.

#### Scenario: Crear y leer
- **WHEN** se llama `POST /horarios/turnos` con un body válido y después `GET /horarios/turnos/{id}` con el id devuelto
- **THEN** el primero responde `201` con el turno creado y el segundo responde `200` con los mismos datos

#### Scenario: Eliminar
- **WHEN** se llama `DELETE /usuario/usuarios/{id}` con un id existente
- **THEN** responde `204`, y un `GET /usuario/usuarios/{id}` posterior responde `404`

#### Scenario: Filtros combinados
- **WHEN** se llama `GET /planificacion/clases?id_profesor=12&id_propuesta=5`
- **THEN** devuelve solo las clases de esa propuesta en las que está el profesor 12

### Requirement: Corte verificado contra los contratos congelados
`npm run verificar-contratos` SHALL comparar el `/docs-json` de cada servicio con `specs/<servicio>.json` indexando las dos especificaciones por `operationId`, no por ruta: para cada operación compara verbo, códigos de respuesta, parámetros (incluidos los nombres de los parámetros de ruta) y propiedades de los schemas y los bodies. La ruta MUST NOT compararse, porque los servicios publican rutas REST y los contratos congelados conservan las rutas RPC del documento. Las diferencias de forma aceptadas MUST estar en la lista de excepciones del verificador y documentadas en "Cambios respecto del documento" del README: las rutas REST en general, `cambiar_horas_materia_curso` (que pasa `id_materia` del body a la ruta, `PATCH /planificacion/cursos/{id}/materias/{id_materia}`) `asignar_curso_a_anio_academico` (que pasa a `POST /planificacion/anios-academicos/{id}/cursos`) y `crear_suplencia` (que pasa `id_profesor` del body a la ruta, `POST /profesor-suplencias/profesores/{id}/suplencias`). Termina con código distinto de 0 si encuentra diferencias no aceptadas y las lista.

#### Scenario: Sin diferencias
- **WHEN** se ejecuta `npm run verificar-contratos` al cerrar este cambio
- **THEN** informa 0 diferencias en los 6 servicios

#### Scenario: Comparación por operationId
- **WHEN** una operación del servicio tiene una ruta REST distinta de la ruta RPC de `specs/<servicio>.json` pero el mismo `operationId`, verbo, parámetros, body y respuestas
- **THEN** el verificador la empareja por `operationId` y no informa diferencias

#### Scenario: Diferencias de forma documentadas
- **WHEN** se revisan `cambiar_horas_materia_curso` (con `id_materia` en la ruta) y `asignar_curso_a_anio_academico` (en `/anios-academicos/{id}/cursos`)
- **THEN** las dos figuran en la lista de excepciones del verificador y en "Cambios respecto del documento" del README, junto con el paso a rutas REST

### Requirement: Swagger publicado por cada servicio
Cada servicio SHALL publicar su documentación con `@nestjs/swagger` en `GET /docs` (UI) y `GET /docs-json` (OpenAPI 3). `info` incluye la descripción con las dependencias y `x-dependencias`. `servers` es `[{ "url": "/" }]`.

#### Scenario: Documento del servicio
- **WHEN** se pide `GET /docs-json` al servicio Pago
- **THEN** devuelve un OpenAPI 3 con las 8 operaciones de Pago (incluido el health check) y `x-dependencias` con `profesor_suplencias.get_profesor`

### Requirement: Errores uniformes
Toda respuesta de error SHALL tener el cuerpo `Error { codigo, mensaje }`:
- validación de body o query: `400`, `codigo: "VALIDACION"`;
- entidad inexistente: `404`, `codigo: "NO_ENCONTRADO"`;
- referencia a una entidad inexistente de otro servicio: `400`;
- conflicto con una regla de negocio: `409`;
- otro servicio que no responde: `503`.

Las contraseñas MUST NOT aparecer en ninguna respuesta.

#### Scenario: Body inválido
- **WHEN** se llama `POST /usuario/usuarios` sin `email`
- **THEN** responde `400` con `{ "codigo": "VALIDACION", "mensaje": ... }`

#### Scenario: Referencia inexistente en otro servicio
- **WHEN** se llama `POST /pago/pagos` con un `id_profesor` que Profesor y Suplencias no tiene
- **THEN** responde `400` y no crea el pago

### Requirement: Llamadas entre servicios por HTTP
Un servicio SHALL obtener los datos de otro servicio solo por HTTP, a los endpoints que declara en `x-dependencias`, con la URL base de la variable `URL_<SERVICIO>` y un timeout de 5 segundos. Las rutas de esas llamadas (`ClienteServicio`) MUST ser las mismas rutas REST que publica el servicio llamado, por ejemplo `POST /orientacion/orientaciones/{id}/cursos` (`asignar_curso_a_orientacion`) y `POST /orientacion/materias/{id}/clases` (`asignar_clase_a_materia`). MUST NOT leer las tablas de otro servicio. Los anidados que vienen de otro servicio se completan con esas llamadas, y en los listados cada id distinto se pide una sola vez por request.

#### Scenario: Anidado de otro servicio
- **WHEN** se llama `GET /planificacion/clases/{id}`
- **THEN** la respuesta incluye `materia` (de Orientación), las franjas (de Horarios) y los profesores (de Profesor y Suplencias), obtenidos por HTTP

#### Scenario: Dependencia caída
- **WHEN** Orientación está detenido y se llama `GET /planificacion/clases/{id}`
- **THEN** responde `503` con `Error`, en menos de 6 segundos

#### Scenario: Rutas internas REST
- **WHEN** Planificación crea un curso con `id_orientacion: 2`
- **THEN** llama a `POST /orientacion/orientaciones/2/cursos` con `{ id_curso }` y no a una ruta RPC como `asignar_curso_a_orientacion/2`

### Requirement: Pagos y recibos
- `crear_pago` SHALL crear el pago con su único recibo, con los conceptos y el neto de `calcular_monto_a_liquidar`.
- `validar_pago` SHALL poner `validado = true` y completar `firma_emisor`.
- `firmar_recibo_de_sueldo` SHALL completar `firma_receptor` con el usuario y la fecha, una sola vez. Si el recibo ya estaba firmado, responde `409`.
- `bajar_recibo_sueldo` SHALL devolver el recibo en PDF (`application/pdf`).

#### Scenario: Firma definitiva
- **WHEN** se firma un recibo que ya estaba firmado
- **THEN** responde `409` y la firma original no cambia

#### Scenario: Descargar recibo
- **WHEN** se llama `GET /pago/recibos-de-sueldo/{id}/pdf`
- **THEN** responde `200` con `Content-Type: application/pdf`

### Requirement: Suplencias por período y por clase
`get_suplencias` SHALL devolver, con `fecha_desde` y `fecha_hasta`, las suplencias cuyo período se superpone con ese rango, y con `id_clase`, las que incluyen esa clase en `ids_clases`. `get_clase` SHALL anidar la suplencia vigente en la fecha del día, si existe.

#### Scenario: Superposición de períodos
- **WHEN** existe una suplencia del 10/03 al 20/03 y se pide `GET /profesor-suplencias/suplencias?fecha_desde=2026-03-15&fecha_hasta=2026-03-31`
- **THEN** la suplencia aparece en el resultado
