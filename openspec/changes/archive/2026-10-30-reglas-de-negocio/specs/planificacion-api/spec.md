## ADDED Requirements

### Requirement: Estados y transiciones de la propuesta
`asignar_estado_a_propuesta` SHALL aceptar solo estas transiciones: Borrador → En revisión; En revisión → Vigente; En revisión → Borrador. Cualquier otra MUST responder `409` con un mensaje que nombre el estado actual, el pedido y los posibles. Una propuesta Vigente MUST NOT cambiar de estado por pedido: pasa a Fue vigente sola, en la misma transacción en que otra propuesta de su ciclo lectivo pasa a Vigente. En cada ciclo lectivo MUST haber como máximo una propuesta Vigente, y las que fueron vigentes MUST quedar en Fue vigente como historial del ciclo.

#### Scenario: Pasar a Vigente
- **WHEN** la propuesta 7 del ciclo 2026 está En revisión y completa, la 5 del mismo ciclo está Vigente, y se pide pasar la 7 a Vigente
- **THEN** la 7 queda Vigente, la 5 queda Fue vigente y la 7 es la única Vigente del ciclo 2026

#### Scenario: Vigente a mano
- **WHEN** se pide pasar a Fue vigente (o a cualquier otro estado) una propuesta Vigente
- **THEN** responde `409` y la propuesta sigue Vigente

#### Scenario: Historial del ciclo
- **WHEN** se llama `GET /planificacion/propuestas?id_ciclo_lectivo=<ciclo>&id_estado=<id de FVG>`
- **THEN** devuelve las propuestas que fueron vigentes en ese ciclo

#### Scenario: Otro ciclo no se toca
- **WHEN** una propuesta del ciclo 2027 pasa a Vigente
- **THEN** la propuesta Vigente del ciclo 2026 sigue Vigente

### Requirement: Planificación completa para revisión y vigencia
Para pasar una propuesta a En revisión o a Vigente, cada materia de cada curso del ciclo lectivo de la propuesta SHALL tener en las clases de la propuesta exactamente sus `horas_semanales` del curso, contando una hora por franja. Si alguna materia tiene menos o más horas, MUST responder `409` con un mensaje que liste cada diferencia como `<curso>: <materia> <horas puestas> de <horas semanales> h`. Para pasar a En revisión, además, la propuesta MUST tener al menos una clase.

#### Scenario: Faltan horas
- **WHEN** en 1A Matemática tiene 3 de sus 5 horas y se pide pasar la propuesta a Vigente
- **THEN** responde `409`, el mensaje incluye "1A: Matemática 3 de 5 h" y la propuesta no cambia de estado

#### Scenario: Sobran horas
- **WHEN** en 2B Historia tiene 4 horas y el curso le asigna 3, y se pide pasar a En revisión
- **THEN** responde `409` y el mensaje incluye "2B: Historia 4 de 3 h"

#### Scenario: Plan completo
- **WHEN** todas las materias de todos los cursos del ciclo tienen exactamente sus horas
- **THEN** la transición se hace

### Requirement: Horas de una materia en el curso
Una clase SHALL NOT hacer que, dentro de una propuesta, la suma de franjas de las clases de una misma materia y curso supere las `horas_semanales` de esa materia en el curso. `asignar_clase_a_propuesta`, `editar_clase` y `asignar_curso_a_clase` MUST responder `409` si se supera, con un mensaje que nombre la materia, el curso y las horas.

#### Scenario: Clase que se pasa
- **WHEN** Matemática tiene 5 horas en 1A, la propuesta ya tiene 4 franjas de Matemática en 1A, y se agrega una clase de Matemática de 1A con 2 franjas
- **THEN** responde `409` y la clase no se agrega a la propuesta

#### Scenario: Clase que completa
- **WHEN** la clase agregada lleva la materia a exactamente 5 horas
- **THEN** se agrega

### Requirement: Profesores activos en las clases
`crear_clase`, `editar_clase` y `asignar_curso_a_clase` SHALL rechazar con `409` a un docente con `activo: false`, con un mensaje que diga que está dado de baja.

#### Scenario: Docente dado de baja
- **WHEN** se crea una clase con un profesor inactivo
- **THEN** responde `409` y el mensaje nombra al profesor y dice que está dado de baja

## MODIFIED Requirements

### Requirement: Modelos de PLANIFICACIÓN
`planificacion.json` SHALL definir estos schemas:
- `Propuesta { id_propuesta, nombre, descripcion_propuesta, fecha_creacion, fecha_modificacion, codigo, id_ciclo_lectivo, estado: EstadoPropuesta, ids_clases[] }`
- `EstadoPropuesta { id_estado, nombre, codigo }`. Es un catálogo gestionado cuya carga inicial MUST documentarse: Borrador (`BOR`), En revisión (`REV`), Vigente (`VIG`) y Fue vigente (`FVG`). El estado es de toda la propuesta, no de cada curso.
- `CicloLectivo { id_ciclo_lectivo, anio_calendario }`
- `AnioAcademico { id_anio_academico, anio_curricular, codigo }`
- `MateriaCurso { id_materia, nombre_materia, horas_semanales }`, donde `horas_semanales` es la cantidad de horas de esa materia en el curso
- `Curso { id_curso, division, id_anio_academico, id_ciclo_lectivo, id_turno, turno, id_orientacion, orientacion, materias: MateriaCurso[], franjas_horarias[] }`. `id_orientacion` MUST ser obligatorio y no nullable: el ciclo básico usa su propia orientación del catálogo.
- `Clase { id_clase, descripcion, codigo, id_curso, id_materia, materia, ids_franjas_horarias[], franjas_horarias[], ids_profesores[], profesores[], suplencia }`. Los profesores de una clase valen para todas sus franjas.

Los objetos que vienen de otros servicios MUST definirse como schemas resumen locales.

#### Scenario: Clase con varios profesores
- **WHEN** se consulta `GET /planificacion/clases/{id}`
- **THEN** la respuesta incluye `profesores` (lista), `materia`, `franjas_horarias` y `suplencia` anidados

#### Scenario: Curso con horas propias
- **WHEN** se consulta `GET /planificacion/cursos/{id}`
- **THEN** cada elemento de `materias` trae las `horas_semanales` del curso

#### Scenario: Orientación obligatoria
- **WHEN** se revisa el schema `Curso`
- **THEN** `id_orientacion` está en `required` y no es `nullable`

#### Scenario: Catálogo de estados
- **WHEN** se llama `GET /planificacion/estados-propuesta`
- **THEN** devuelve Borrador (`BOR`), En revisión (`REV`), Vigente (`VIG`) y Fue vigente (`FVG`), y ningún estado `VAL` ni `CER`

### Requirement: Generación automática de la planilla
El servicio SHALL exponer `generar_planilla` como `POST /planificacion/propuestas/{id}/generacion`, con body opcional `{ id_curso }`. Sin `id_curso` MUST completar todos los cursos del ciclo lectivo de la propuesta; con `id_curso`, solo ese curso, que MUST ser del ciclo de la propuesta (si no, `400`). La generación MUST correr en el servidor y guardar el resultado: las clases nuevas con `crear_clase` + `asignar_clase_a_propuesta` (código `<propuesta sin PLAN->-<curso>-<3 letras de la materia>` y descripción `Materia · Curso`) y las existentes con `editar_clase`, sumando franjas, de modo que corran las mismas reglas que en la carga manual. Si una regla rechaza un cambio, MUST seguir con el resto e informar el mensaje en `errores`.

El algoritmo MUST respetar lo ya ubicado, la disponibilidad declarada de cada docente (por franja), que un docente no esté en dos clases de la propuesta a la vez (por horario real, aunque sean turnos distintos) y que ninguna materia supere sus horas semanales en el curso. MUST usar solo profesores activos y MUST NOT limitar las horas diarias de una materia. Si la clase ya tiene docentes MUST usar esos; si no, el habilitado con más franjas posibles, y las materias EPA van con todos sus habilitados juntos. Resuelve primero las materias con menos margen y ocupa antes las franjas que menos docentes declararon.

La respuesta `200` es `ResultadoGeneracion { horas_ubicadas, sin_ubicar[{ id_curso, id_materia, curso, materia, horas }], cambios[{ id_clase, creada, ids_franjas_horarias_previas[], ids_profesores_previos[] }], errores[] }`. `cambios` MUST alcanzar para deshacer la generación (eliminar las clases creadas y restaurar con `editar_clase` las franjas y los docentes de las editadas). La operación MUST responder `409` si la propuesta no está en Borrador y `404` si no existe.

#### Scenario: Generar toda la propuesta
- **WHEN** se llama `POST /planificacion/propuestas/{id}/generacion` con `{}` sobre una propuesta en Borrador
- **THEN** cada materia de cada curso del ciclo tiene al menos las horas que tenía antes, y las que no llegan a sus horas semanales figuran en `sin_ubicar` con las horas que faltan

#### Scenario: Generar un curso
- **WHEN** se llama con `{ "id_curso": 1 }`
- **THEN** solo se agregan franjas a clases del curso 1, sin superponer a sus docentes con las clases que ya tienen en otros cursos

#### Scenario: Propuesta que no está en Borrador
- **WHEN** se llama sobre una propuesta En revisión, Vigente o Fue vigente
- **THEN** responde `409` y no cambia ninguna clase

#### Scenario: Curso de otro ciclo
- **WHEN** `id_curso` no es un curso del ciclo de la propuesta
- **THEN** responde `400`

#### Scenario: Sin tope diario por materia
- **WHEN** una materia de 4 horas solo puede ubicarse en franjas de un mismo día
- **THEN** el generador ubica las 4 horas ese día

#### Scenario: Profesor dado de baja
- **WHEN** el único habilitado de una materia está inactivo
- **THEN** el generador no lo usa y la materia figura en `sin_ubicar`
