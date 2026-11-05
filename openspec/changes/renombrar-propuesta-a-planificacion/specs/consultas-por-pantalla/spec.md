## MODIFIED Requirements

### Requirement: Sin métricas calculadas en el front
Una pantalla MUST NOT mostrar totales, avances, conteos ni datos derivados que haya que calcular cruzando datos de otro servicio, como las horas ubicadas de una planificación, las horas que dicta un profesor o los cursos donde se dicta una materia. Si un dato así hace falta, SHALL agregarse como query del servicio dueño y documentarse en su swagger.

#### Scenario: Avance de una planificación
- **WHEN** se abre `/planificaciones`
- **THEN** ninguna planificación muestra un avance del tipo "103/130 h"

#### Scenario: Listado de profesores
- **WHEN** se abre `/profesores`
- **THEN** la tabla no tiene columnas de horas que dicta ni de área derivada
