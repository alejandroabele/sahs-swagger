## ADDED Requirements

### Requirement: Baja lógica del profesor
`asignar_activo_profesor` con `{ activo: false }` SHALL dar de baja al profesor sin borrar sus datos, sus suplencias ni sus recibos. MUST responder `409` si el profesor es docente de alguna clase de una propuesta Vigente, con un mensaje que nombre al profesor, la clase y la propuesta. Con `{ activo: true }` MUST reactivarlo sin otras condiciones.

#### Scenario: Profesor en la planificación vigente
- **WHEN** el profesor 12 dicta la clase `2026-1A-MAT` de la propuesta Vigente `PLAN-2026-01` y se pide darlo de baja
- **THEN** responde `409`, el mensaje nombra al profesor, la clase y la propuesta, y el profesor sigue activo

#### Scenario: Profesor solo en borradores
- **WHEN** el profesor solo dicta clases de propuestas en Borrador, En revisión o Fue vigente
- **THEN** queda con `activo: false`

### Requirement: Suplente habilitado y disponible
`crear_suplencia` SHALL exigir que el suplente esté activo, que tenga habilitada la materia de cada clase y que haya declarado como disponibles todas las franjas de cada clase. Si no se cumple, MUST responder `409` con un mensaje que nombre al suplente, la clase y lo que falta. Las reglas que ya existían siguen igual: la fecha de inicio no es posterior a la de fin, el suplente no es docente de la clase y una clase no tiene dos suplencias con fechas superpuestas.

#### Scenario: Suplente no habilitado
- **WHEN** el suplente no tiene habilitada la materia de la clase 40
- **THEN** responde `409` y no se crea la suplencia

#### Scenario: Suplente no disponible
- **WHEN** la clase 40 ocupa el lunes 08:00 y el suplente no declaró esa franja
- **THEN** responde `409` y el mensaje nombra la franja

#### Scenario: Suplente dado de baja
- **WHEN** el suplente tiene `activo: false`
- **THEN** responde `409`

## MODIFIED Requirements

### Requirement: Modelos de PROFESOR Y SUPLENCIAS
`profesor_suplencias.json` SHALL definir estos schemas:
- `Profesor { id_profesor, nombre, apellido, documento, legajo (nullable), cargo_asociado (nullable), correo_electronico, telefono, direccion, activo, id_usuario (nullable, opcional), lista_materias_habilitadas: MateriaResumen[], disponibilidad: FranjaHorariaResumen[] }`
- `Suplencia { id_suplencia, fecha_inicio, fecha_fin, motivo, id_profesor, profesor: ProfesorResumen, ids_clases[], clases: ClaseResumen[] }`

La referencia entre suplencia y clase MUST guardarla `Suplencia` (`ids_clases`). `activo` es booleano y obligatorio: `false` significa que el profesor está dado de baja en la institución. Un profesor nuevo se crea con `activo: true`.

#### Scenario: Profesor sin usuario
- **WHEN** se crea un profesor y todavía no se le asignó un usuario
- **THEN** `GET /profesor-suplencias/profesores/{id}` lo devuelve con `id_usuario: null`

#### Scenario: Suplencia con datos anidados
- **WHEN** se llama `GET /profesor-suplencias/suplencias`
- **THEN** cada suplencia incluye el `profesor` suplente y las `clases` anidadas

### Requirement: Commands de PROFESOR Y SUPLENCIAS
El servicio SHALL exponer, con prefijo `/profesor_suplencias`:

| Verbo | Operaciones |
|---|---|
| `POST` | `crear_suplencia` (`/profesores/{id}/suplencias`, `{id}` = suplente) y `crear_profesor` (`/profesores`) (`201`) |
| `PUT` | `editar_profesor` (`/profesores/{id}`), `asignar_usuario_profesor` (`/profesores/{id}/usuario`, body `{ id_usuario }`), `asignar_materias_habilitadas` (`/profesores/{id}/materias-habilitadas`), `asignar_disponibilidad` (`/profesores/{id}/disponibilidad`, body `{ ids_franjas_horarias[] }`), `asignar_activo_profesor` (`/profesores/{id}/activo`, body `{ activo }`) |

El body de `crear_suplencia` MUST ser `{ fecha_inicio, fecha_fin, motivo, id_profesor, ids_clases[] }`, todos obligatorios. El body de `crear_profesor` es `{ nombre, apellido, documento, correo_electronico, telefono, direccion }` y MUST NOT crear un usuario. El body de `editar_profesor` es `{ nombre, apellido, documento, correo_electronico, telefono, direccion, legajo, cargo_asociado }` y reemplaza todos esos datos.

Estos commands MUST NOT existir: `asignar_profesor_suplencia`, `asignar_suplencia_a_clase`, `cambiar_correo`, `cambiar_direccion`, `asignar_legajo`, `asignar_cargo`, `cambiar_cargo`, `eliminar_cargo`, `asignar_materias_area`, `asignar_rol_profesor`.

#### Scenario: Crear una suplencia completa
- **WHEN** se llama `POST /profesor-suplencias/suplencias` con `{ "fecha_inicio": "2026-05-04", "fecha_fin": "2026-05-08", "motivo": "Licencia médica", "id_profesor": 12, "ids_clases": [40, 41] }`
- **THEN** responde `201` con la `Suplencia`, el `profesor` 12 y las clases 40 y 41 anidadas

#### Scenario: Asignar usuario al profesor
- **WHEN** se llama `PUT /profesor-suplencias/profesores/12/usuario` con `{ "id_usuario": 10 }`
- **THEN** devuelve el `Profesor` 12 con `id_usuario: 10`

#### Scenario: Editar el profesor
- **WHEN** se llama `PUT /profesor-suplencias/profesores/12` con todos los datos y `"cargo_asociado": null`
- **THEN** devuelve el `Profesor` con los datos nuevos y sin cargo

#### Scenario: Disponibilidad reemplaza la anterior
- **WHEN** se llama `PUT /profesor-suplencias/profesores/{id}/disponibilidad` con `{ "ids_franjas_horarias": [7, 8] }`
- **THEN** la disponibilidad del profesor queda formada solo por las franjas 7 y 8

#### Scenario: Commands eliminados
- **WHEN** se buscan en el contrato `cambiar_correo`, `asignar_cargo`, `eliminar_cargo`, `asignar_suplencia_a_clase` o `asignar_rol_profesor`
- **THEN** ninguna de esas operaciones existe

#### Scenario: Dar de baja y reactivar
- **WHEN** se llama `PUT /profesor-suplencias/profesores/12/activo` con `{ "activo": false }` y después con `{ "activo": true }`
- **THEN** la primera respuesta es el `Profesor` 12 con `activo: false` y la segunda con `activo: true`

### Requirement: Queries de PROFESOR Y SUPLENCIAS
El servicio SHALL exponer con `GET` y prefijo `/profesor_suplencias`:
- `get_profesor` (`/profesores/{id}`), `get_profesores` (`/profesores`)
- `get_suplencias` (`/suplencias`)
- `get_disponibilidad_profesor` (`/profesores/{id}/disponibilidad`)

`get_profesores` MUST aceptar los filtros opcionales `id_usuario` y `activo`; sin `activo` devuelve también los profesores inactivos. `get_suplencias` MUST aceptar los filtros opcionales `fecha_desde`, `fecha_hasta` (formato `date`; devuelve las suplencias cuyo período se superpone con el rango), `id_profesor` (suplente), `id_curso` (de alguna de sus clases) e `id_clase` (incluida en sus clases).

`get_suplencia`, `get_profesor_suplencia` y `get_clase_suplencia` MUST NOT existir.

#### Scenario: Disponibilidad
- **WHEN** se llama `GET /profesor-suplencias/profesores/{id}/disponibilidad`
- **THEN** devuelve una lista de `FranjaHorariaResumen`

#### Scenario: Profesor del usuario logueado
- **WHEN** se llama `GET /profesor-suplencias/profesores?id_usuario=10`
- **THEN** devuelve una lista con el profesor cuyo `id_usuario` es 10, o una lista vacía

#### Scenario: Suplencias de una semana
- **WHEN** se llama `GET /profesor-suplencias/suplencias?fecha_desde=2026-05-11&fecha_hasta=2026-05-15`
- **THEN** devuelve las suplencias con algún día dentro de esa semana

#### Scenario: Suplencias de una clase
- **WHEN** se llama `GET /profesor-suplencias/suplencias?id_clase=40`
- **THEN** devuelve solo las suplencias que tienen la clase 40 en `ids_clases`

#### Scenario: Solo activos
- **WHEN** se llama `GET /profesor-suplencias/profesores?activo=true`
- **THEN** no devuelve ningún profesor con `activo: false`

### Requirement: Dependencias de PROFESOR Y SUPLENCIAS
El contrato SHALL declarar estas dependencias:
- USUARIO `get_usuario`, que usa `asignar_usuario_profesor`
- ORIENTACIÓN `get_materia`, que usan `asignar_materias_habilitadas` y `get_profesor`
- PLANIFICACIÓN `get_clase`, que usan `crear_suplencia` y `get_suplencias`
- PLANIFICACIÓN `get_posibles_estados_de_propuestas`, `get_propuestas` y `get_clases`, que usa `asignar_activo_profesor`
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
- **THEN** menciona "Invoca: planificacion.get_posibles_estados_de_propuestas, planificacion.get_propuestas, planificacion.get_clases"
