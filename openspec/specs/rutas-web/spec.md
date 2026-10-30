# rutas-web Specification

## Purpose
TBD - created by archiving change limpieza-y-rutas. Update Purpose after archive.
## Requirements
### Requirement: Rutas semánticas en la app web
Cada pantalla de `apps/web` SHALL tener una ruta formada por sustantivos en español, en plural, en minúsculas y con guiones, según esta tabla: `/login`, `/`, `/disponibilidad`, `/disponibilidad/:idProfesor`, `/planificaciones/:id/generacion`, `/planificaciones/:id/generacion/:idCurso`, `/suplencias`, `/materias`, `/materias/:id`, `/profesores`, `/profesores/nuevo`, `/profesores/:id`, `/cursos`, `/cursos/nuevo`, `/cursos/:id`, `/planificaciones`, `/planificaciones/:id`, `/planificaciones/:id/cursos/:idCurso`, `/orientaciones`, `/ciclos-lectivos`, `/turnos`, `/usuarios`, `/roles`, `/mi-cuenta/contrasenia`, `/mi-horario`, `/mi-disponibilidad` y `/mis-recibos`. Las URLs MUST NOT contener códigos de pantalla (`A1`…`A18`, `P2`…`P4`, `L1`).

#### Scenario: Ficha de una materia
- **WHEN** en el listado de materias se abre la materia 5
- **THEN** la URL es `/materias/5`

#### Scenario: Armado de un curso en una propuesta
- **WHEN** en la planificación 5 se abre el curso 2
- **THEN** la URL es `/planificaciones/5/cursos/2`

#### Scenario: Sin códigos de pantalla
- **WHEN** se recorre cualquier pantalla de la app
- **THEN** ninguna URL contiene un código de pantalla como `/A12`

### Requirement: Recursos identificados por la ruta
El id de un recurso SHALL ir como parámetro de ruta. Las query strings MUST NOT usarse para identificar el recurso que muestra una pantalla, y solo MAY usarse para estado de vista opcional, como un filtro. Una pantalla MUST NOT elegir un recurso "por defecto" cuando la ruta no lo trae: la ruta sin id lleva al listado.

#### Scenario: Sin query string de id
- **WHEN** se abre el armado de la propuesta 5
- **THEN** la URL es `/planificaciones/5` y no `/planificaciones?id_propuesta=5`

#### Scenario: Recarga de una ficha
- **WHEN** con sesión se recarga `/profesores/3`
- **THEN** se ve la ficha del profesor 3

#### Scenario: Ruta desconocida
- **WHEN** con sesión se abre `/A5` o cualquier ruta que no está en la tabla
- **THEN** se muestra el inicio

### Requirement: Navegación tipada
La navegación entre pantallas SHALL hacerse con funciones que arman la ruta a partir de sus parámetros (`rutas.materia(id)`), declaradas en un único módulo. Las pantallas MUST NOT escribir rutas como texto suelto ni navegar con ids fijos de ejemplo.

#### Scenario: Ids de ejemplo
- **WHEN** se busca en `apps/web/src` una navegación con un id literal, como `id_profesor: 3`
- **THEN** no hay ninguna

### Requirement: Mismas rutas en el prototipo
El prototipo (`prototipo/index.html`) SHALL usar las mismas rutas que la app, en el hash (`#/materias/5`). Las direcciones `#<id-de-pantalla>` (`#materias`) MUST NOT existir.

#### Scenario: Ficha en el prototipo
- **WHEN** en el prototipo, con sesión, se abre `http://localhost:8100/prototipo/#/materias/5`
- **THEN** se ve la ficha de la materia 5

#### Scenario: Hash viejo
- **WHEN** en el prototipo, con sesión, se abre `http://localhost:8100/prototipo/#materias`
- **THEN** se muestra el inicio

