## MODIFIED Requirements

### Requirement: Dependencias de PROFESOR Y SUPLENCIAS
El contrato SHALL declarar estas dependencias:
- USUARIO `get_usuario`, que usa `asignar_usuario_profesor`
- ORIENTACIÓN `get_materia`, que usan `asignar_materias_habilitadas` y `get_profesor`
- PLANIFICACIÓN `get_clase`, que usan `crear_suplencia` y `get_suplencias`
- PLANIFICACIÓN `get_posibles_estados_de_planificaciones`, `get_planificaciones` y `get_clases`, que usa `asignar_activo_profesor`
- HORARIOS `get_franja_horaria`, que usan `asignar_disponibilidad` y `get_disponibilidad_profesor`

MUST NOT declarar dependencias con `usuario.crear_usuario`, `usuario.asignar_rol` ni `orientacion.get_materias_area`.

#### Scenario: Dependencia con USUARIO
- **WHEN** se lee la descripción de `asignar_usuario_profesor`
- **THEN** menciona "Invoca: usuario.get_usuario"

#### Scenario: Alta sin usuario
- **WHEN** se lee la descripción de `crear_profesor`
- **THEN** no menciona ninguna invocación al servicio USUARIO

#### Scenario: Dependencia de la baja
- **WHEN** se lee la descripción de `asignar_activo_profesor`
- **THEN** menciona "Invoca: planificacion.get_posibles_estados_de_planificaciones, planificacion.get_planificaciones, planificacion.get_clases"

### Requirement: Baja lógica del profesor
`asignar_activo_profesor` con `{ activo: false }` SHALL dar de baja al profesor sin borrar sus datos, sus suplencias ni sus recibos. MUST responder `409` si el profesor es docente de alguna clase de una planificación Vigente, con un mensaje que nombre al profesor, la clase y la planificación. Con `{ activo: true }` MUST reactivarlo sin otras condiciones.

#### Scenario: Profesor en la planificación vigente
- **WHEN** el profesor 12 dicta la clase `2026-1A-MAT` de la planificación Vigente `PLAN-2026-01` y se pide darlo de baja
- **THEN** responde `409`, el mensaje nombra al profesor, la clase y la planificación, y el profesor sigue activo

#### Scenario: Profesor solo en borradores
- **WHEN** el profesor solo dicta clases de planificaciones en Borrador, En revisión o Fue vigente
- **THEN** queda con `activo: false`
