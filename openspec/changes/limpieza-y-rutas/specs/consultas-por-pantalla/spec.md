## ADDED Requirements

### Requirement: Cada pantalla consulta su servicio
Cada pantalla de la app web y del prototipo SHALL consultar el servicio dueño de lo que muestra. A otro servicio MUST consultarlo solo para:
- mostrar el nombre de un id (por ejemplo, el año académico de una materia);
- llenar un selector que una acción de la pantalla necesita, y en ese caso la consulta MUST hacerse recién cuando se abre esa acción si la acción empieza cerrada;
- cruzar datos cuando ese cruce es la función de la pantalla: suplencias, armado de la planificación y mi horario. La generación automática de la planilla corre en la API (`generar_planilla`): la pantalla no baja profesores ni clases de otros cursos para generar.

#### Scenario: Listado de materias
- **WHEN** se abre `/materias` sin abrir el alta
- **THEN** la única consulta de la pantalla es `get_plan_de_estudios`, además de las de la sesión

#### Scenario: Listado de planificaciones
- **WHEN** se abre `/planificaciones`
- **THEN** la pantalla no consulta `get_clases` ni `get_cursos`

#### Scenario: Alta de materia
- **WHEN** en `/materias` se abre "Nueva materia"
- **THEN** recién ahí se consultan `get_anios_academicos`, `get_orientaciones` y `get_areas`

### Requirement: Sin métricas calculadas en el front
Una pantalla MUST NOT mostrar totales, avances, conteos ni datos derivados que haya que calcular cruzando datos de otro servicio, como las horas ubicadas de una propuesta, las horas que dicta un profesor o los cursos donde se dicta una materia. Si un dato así hace falta, SHALL agregarse como query del servicio dueño y documentarse en su swagger.

#### Scenario: Avance de una planificación
- **WHEN** se abre `/planificaciones`
- **THEN** ninguna propuesta muestra un avance del tipo "103/130 h"

#### Scenario: Listado de profesores
- **WHEN** se abre `/profesores`
- **THEN** la tabla no tiene columnas de horas que dicta ni de área derivada

### Requirement: Sin datos que la API no guarda
Una pantalla MUST NOT deducir ni inventar datos que la API no modela, como los años asociados a una orientación (deducidos de sus materias y cursos) o el estado y el período de clases de un ciclo lectivo.

#### Scenario: Orientaciones en el alta de materia
- **WHEN** en el alta de materia se elige un año
- **THEN** el selector de orientación ofrece todas las orientaciones, sin filtrarlas por años deducidos

#### Scenario: Ciclos lectivos
- **WHEN** se abre `/ciclos-lectivos`
- **THEN** cada ciclo muestra solo los datos que devuelve `get_ciclos_lectivos`

### Requirement: Sin textos de demo ni de ayuda
Las pantallas MUST NOT tener textos de demostración ni de ayuda que expliquen la interfaz: listas de usuarios de ejemplo, contraseñas de ejemplo, pies del tipo "Hacé clic…" o "Tocá…", estados "Pendiente" para funciones sin pantalla, ni menciones a códigos de pantalla. Los mensajes de error y de confirmación de una acción sí se mantienen.

#### Scenario: Login
- **WHEN** se abre `/login`
- **THEN** solo se ve el formulario, sin lista de usuarios de ejemplo, y la pantalla no consulta `get_usuarios`

#### Scenario: Inicio
- **WHEN** se abre `/` con un rol que tiene privilegios sin pantalla
- **THEN** esos privilegios no aparecen y no hay ninguna tarjeta "Pendiente" ni texto explicativo

#### Scenario: Códigos de pantalla
- **WHEN** se busca en los textos visibles de la app y del prototipo una mención como "pantalla A6"
- **THEN** no hay ninguna
