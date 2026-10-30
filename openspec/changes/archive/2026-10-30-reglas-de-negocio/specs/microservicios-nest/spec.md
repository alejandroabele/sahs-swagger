## MODIFIED Requirements

### Requirement: Estados de la propuesta
`crear_propuesta` SHALL crear la propuesta en Borrador (BOR). `asignar_estado_a_propuesta` MUST aceptar solo las transiciones BOR→REV, REV→VIG y REV→BOR. Cualquier otra responde `409`. Una propuesta VIG no cambia de estado por pedido: pasa a FVG cuando otra de su ciclo pasa a VIG.

#### Scenario: Transición inválida
- **WHEN** se intenta pasar una propuesta en BOR directamente a VIG
- **THEN** responde `409` y la propuesta sigue en BOR

### Requirement: Edición y eliminación de clases
`editar_clase` (`PUT`, reemplaza franjas y docentes) y `eliminar_clase` (`DELETE`) SHALL funcionar solo si todas las propuestas que incluyen la clase están en Borrador; si no, MUST responder `409`. `editar_clase` MUST aplicar las mismas reglas que `crear_clase` y `asignar_clase_a_propuesta`.

#### Scenario: Clase de una propuesta vigente
- **WHEN** se intenta eliminar una clase de una propuesta Vigente
- **THEN** responde `409` y la clase no cambia
