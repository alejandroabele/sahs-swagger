## ADDED Requirements

### Requirement: Clase con docentes únicos
En el prototipo, cada combinación curso–materia SHALL representarse como una clase con una sola lista de docentes, que vale para todas sus franjas. El armado de la planificación (A13) MUST NOT permitir docentes distintos por celda.

#### Scenario: Cambiar el docente de una hora
- **WHEN** en A13 se cambia el docente desde el panel de una celda de Matemática de 1° A
- **THEN** el cambio se aplica a todas las horas de Matemática de 1° A, y el panel lo avisa

#### Scenario: Pareja pedagógica
- **WHEN** se ubica una hora de EPA Sociales
- **THEN** la clase tiene dos docentes en todas sus franjas

### Requirement: Suplencia por clase
En suplencias (A4), una suplencia SHALL tener docente ausente, fecha de inicio, fecha de fin, motivo, un suplente y las clases que cubre. Cada clase se cubre entera, con todas sus franjas dentro del período, y MUST NOT poder cubrirse una hora suelta.

#### Scenario: Registrar una suplencia
- **WHEN** se elige el ausente, el período y el motivo, se marca una clase afectada y se elige el suplente
- **THEN** todas las horas de esa clase dentro del período quedan cubiertas por ese suplente

### Requirement: Franjas por día y recreos como franjas
Las grillas del prototipo (A2, A3, A13, P2, P3) SHALL dibujarse con las franjas del turno que corresponde. Cada franja pertenece a un día y los recreos son franjas marcadas como recreo, que no se pueden ocupar ni declarar como disponibles. MUST NOT quedar grillas con horarios fijos que no salgan de un turno.

#### Scenario: Grilla de un curso del turno tarde
- **WHEN** se abre A13 o A3 para un curso del turno Tarde
- **THEN** la grilla muestra las franjas de la tarde y los recreos como franjas propias (filas o columnas, según cómo esté orientada la grilla) que no se pueden seleccionar

#### Scenario: Disponibilidad del profesor
- **WHEN** el profesor marca su disponibilidad en P3
- **THEN** marca franjas de los turnos en los que puede dar clase, y no puede marcar recreos

### Requirement: Validación de la planificación completa
El estado (Borrador, En revisión, Validada, Cerrada) SHALL ser de toda la planificación. A3 y A10 MUST NOT mostrar estados por curso: pueden mostrar el avance de cada curso, pero no un estado de validación propio.

#### Scenario: Listado de cursos
- **WHEN** se abre A10
- **THEN** cada curso muestra su avance y no un estado de validación

#### Scenario: Enviar a validación
- **WHEN** se envía a validación desde A13
- **THEN** cambia el estado de toda la planificación

### Requirement: Firma de recibo definitiva
En "Mis recibos" (P4), firmar un recibo SHALL ser definitivo. MUST NOT existir la acción "Deshacer".

#### Scenario: Recibo firmado
- **WHEN** el profesor firma un recibo
- **THEN** el recibo muestra la firma con su fecha y no ofrece deshacerla
