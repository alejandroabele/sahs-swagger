## MODIFIED Requirements

### Requirement: Modelos de PROFESOR Y SUPLENCIAS
`profesor_suplencias.json` SHALL definir estos schemas:
- `Profesor { id_profesor, nombre, apellido, documento, legajo (nullable), cargo_asociado (nullable), correo_electronico, telefono, direccion, id_usuario (nullable, opcional), lista_materias_habilitadas: MateriaResumen[], disponibilidad: FranjaHorariaResumen[] }`
- `Suplencia { id_suplencia, fecha_inicio, fecha_fin, motivo, id_profesor, profesor: ProfesorResumen, ids_clases[], clases: ClaseResumen[] }`

La referencia entre suplencia y clase MUST guardarla `Suplencia` (`ids_clases`).

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
| `PUT` | `editar_profesor` (`/profesores/{id}`), `asignar_usuario_profesor` (`/profesores/{id}/usuario`, body `{ id_usuario }`), `asignar_materias_habilitadas` (`/profesores/{id}/materias-habilitadas`), `asignar_disponibilidad` (`/profesores/{id}/disponibilidad`, body `{ ids_franjas_horarias[] }`) |

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

### Requirement: Queries de PROFESOR Y SUPLENCIAS
El servicio SHALL exponer con `GET` y prefijo `/profesor_suplencias`:
- `get_profesor` (`/profesores/{id}`), `get_profesores` (`/profesores`)
- `get_suplencias` (`/suplencias`)
- `get_disponibilidad_profesor` (`/profesores/{id}/disponibilidad`)

`get_profesores` MUST aceptar el filtro opcional `id_usuario`. `get_suplencias` MUST aceptar los filtros opcionales `fecha_desde`, `fecha_hasta` (formato `date`; devuelve las suplencias cuyo período se superpone con el rango), `id_profesor` (suplente), `id_curso` (de alguna de sus clases) e `id_clase` (incluida en sus clases).

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
