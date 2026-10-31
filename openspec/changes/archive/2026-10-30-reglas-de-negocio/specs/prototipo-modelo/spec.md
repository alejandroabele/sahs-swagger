## MODIFIED Requirements

### Requirement: Validación de la planificación completa
El estado (Borrador, En revisión, Vigente, Fue vigente) SHALL ser de toda la planificación. En cada ciclo lectivo hay una sola planificación Vigente, y no hay acción para pasarla a mano a Fue vigente. A3 y A10 MUST NOT mostrar estados por curso: pueden mostrar el avance de cada curso, pero no un estado de validación propio.

#### Scenario: Listado de cursos
- **WHEN** se abre A10
- **THEN** cada curso muestra su avance y no un estado de validación

#### Scenario: Enviar a validación
- **WHEN** se envía a validación desde A13
- **THEN** cambia el estado de toda la planificación

#### Scenario: Planificación incompleta
- **WHEN** desde A13 se pide pasar a Vigente una planificación a la que le faltan horas
- **THEN** se muestra el error con el curso, la materia y las horas que faltan, y la planificación no cambia de estado
