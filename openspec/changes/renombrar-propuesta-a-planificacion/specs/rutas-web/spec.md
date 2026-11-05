## MODIFIED Requirements

### Requirement: Rutas semánticas en la app web
Cada pantalla de `apps/web` SHALL tener una ruta formada por sustantivos en español, en plural, en minúsculas y con guiones, según esta tabla: `/login`, `/`, `/disponibilidad`, `/disponibilidad/:idProfesor`, `/planificaciones/:id/generacion`, `/planificaciones/:id/generacion/:idCurso`, `/suplencias`, `/materias`, `/materias/:id`, `/profesores`, `/profesores/nuevo`, `/profesores/:id`, `/cursos`, `/cursos/nuevo`, `/cursos/:id`, `/planificaciones`, `/planificaciones/:id`, `/planificaciones/:id/cursos/:idCurso`, `/orientaciones`, `/ciclos-lectivos`, `/turnos`, `/usuarios`, `/roles`, `/mi-cuenta/contrasenia`, `/mi-horario`, `/mi-disponibilidad` y `/mis-recibos`. Las URLs MUST NOT contener códigos de pantalla (`A1`…`A18`, `P2`…`P4`, `L1`).

#### Scenario: Ficha de una materia
- **WHEN** en el listado de materias se abre la materia 5
- **THEN** la URL es `/materias/5`

#### Scenario: Armado de un curso en una planificación
- **WHEN** en la planificación 5 se abre el curso 2
- **THEN** la URL es `/planificaciones/5/cursos/2`

#### Scenario: Sin códigos de pantalla
- **WHEN** se recorre cualquier pantalla de la app
- **THEN** ninguna URL contiene un código de pantalla como `/A12`

### Requirement: Recursos identificados por la ruta
El id de un recurso SHALL ir como parámetro de ruta. Las query strings MUST NOT usarse para identificar el recurso que muestra una pantalla, y solo MAY usarse para estado de vista opcional, como un filtro. Una pantalla MUST NOT elegir un recurso "por defecto" cuando la ruta no lo trae: la ruta sin id lleva al listado.

#### Scenario: Sin query string de id
- **WHEN** se abre el armado de la planificación 5
- **THEN** la URL es `/planificaciones/5` y no `/planificaciones?id_planificacion=5`

#### Scenario: Recarga de una ficha
- **WHEN** con sesión se recarga `/profesores/3`
- **THEN** se ve la ficha del profesor 3

#### Scenario: Ruta desconocida
- **WHEN** con sesión se abre `/A5` o cualquier ruta que no está en la tabla
- **THEN** se muestra el inicio
