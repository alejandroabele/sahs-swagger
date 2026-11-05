## RENAMED Requirements

- FROM: `### Requirement: Estados de la propuesta`
- TO: `### Requirement: Estados de la planificación`

- FROM: `### Requirement: Choques dentro de una propuesta`
- TO: `### Requirement: Choques dentro de una planificación`

## MODIFIED Requirements

### Requirement: Seis servicios NestJS que implementan los contratos
Cada servicio de `specs/*.json` SHALL tener su app NestJS que expone todas sus operaciones con el mismo prefijo, verbo, `operationId`, parámetros, body, códigos de respuesta y schemas, en rutas REST (recursos en plural y en kebab-case), salvo las diferencias de forma documentadas en "Cambios respecto del documento" del README. Cada operación MUST leer y escribir en la base. Los servicios son Usuario (`/usuario`), Pago (`/pago`), Horarios (`/horarios`), Planificación (`/planificacion`, y `/planificaciones` para el recurso planificación), Orientación (`/orientacion`) y Profesor y Suplencias (`/profesor_suplencias`). Siguen valiendo los requisitos de `usuario-api`, `pago-api`, `horarios-api`, `planificacion-api`, `orientacion-api` y `profesor-suplencias-api`.

#### Scenario: Crear y leer
- **WHEN** se llama `POST /horarios/turnos` con un body válido y después `GET /horarios/turnos/{id}` con el id devuelto
- **THEN** el primero responde `201` con el turno creado y el segundo responde `200` con los mismos datos

#### Scenario: Eliminar
- **WHEN** se llama `DELETE /usuario/usuarios/{id}` con un id existente
- **THEN** responde `204`, y un `GET /usuario/usuarios/{id}` posterior responde `404`

#### Scenario: Filtros combinados
- **WHEN** se llama `GET /planificacion/clases?id_profesor=12&id_planificacion=5`
- **THEN** devuelve solo las clases de esa planificación en las que está el profesor 12

### Requirement: Estados de la planificación
`crear_planificacion` SHALL crear la planificación en Borrador (BOR). `asignar_estado_a_planificacion` MUST aceptar solo las transiciones BOR→REV, REV→VIG y REV→BOR. Cualquier otra responde `409`. Una planificación VIG no cambia de estado por pedido: pasa a FVG cuando otra de su ciclo pasa a VIG.

#### Scenario: Transición inválida
- **WHEN** se intenta pasar una planificación en BOR directamente a VIG
- **THEN** responde `409` y la planificación sigue en BOR

### Requirement: Choques dentro de una planificación
`asignar_clase_a_planificacion` SHALL aceptar la clase solo si la planificación está en Borrador, si el curso no tiene otra clase en las mismas franjas y si ninguno de sus docentes tiene otra clase en esas franjas dentro de la planificación. Si no, MUST responder `409`.

#### Scenario: Docente en dos clases a la vez
- **WHEN** se agrega a una planificación en Borrador una clase cuyo docente ya tiene otra clase de la planificación en la misma franja
- **THEN** responde `409` y la clase no se agrega

### Requirement: Edición y eliminación de clases
`editar_clase` (`PUT`, reemplaza franjas y docentes) y `eliminar_clase` (`DELETE`) SHALL funcionar solo si todas las planificaciones que incluyen la clase están en Borrador; si no, MUST responder `409`. `editar_clase` MUST aplicar las mismas reglas que `crear_clase` y `asignar_clase_a_planificacion`.

#### Scenario: Clase de una planificación vigente
- **WHEN** se intenta eliminar una clase de una planificación Vigente
- **THEN** responde `409` y la clase no cambia
