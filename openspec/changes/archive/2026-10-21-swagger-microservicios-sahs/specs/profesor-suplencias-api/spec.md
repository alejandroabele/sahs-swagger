## ADDED Requirements

### Requirement: Modelos de PROFESOR Y SUPLENCIAS
`profesor_suplencias.json` SHALL definir estos schemas:
- `Profesor { id_profesor, nombre, apellido, documento, legajo, cargo_asociado (nullable), correo_electronico, telefono, direccion, id_usuario, lista_materias_habilitadas: MateriaResumen[], disponibilidad: FranjaHorariaResumen[] }`
- `Suplencia { id_suplencia, fecha_inicio, fecha_fin, motivo, id_profesor, profesor: ProfesorResumen, ids_clases[], clases: ClaseResumen[] }`

#### Scenario: Suplencia con datos anidados
- **WHEN** se llama `GET /profesor_suplencias/get_suplencia/{id}`
- **THEN** la respuesta incluye el `profesor` suplente y las `clases` anidadas

### Requirement: Commands de PROFESOR Y SUPLENCIAS
El servicio SHALL exponer con `POST` y prefijo `/profesor_suplencias`:
- `crear_suplencia`
- `asignar_profesor_suplencia/{id}`
- `asignar_suplencia_a_clase/{id}`
- `crear_profesor`, que también crea el usuario asociado
- `asignar_rol_profesor/{id}`
- `cambiar_correo/{id}`
- `cambiar_direccion/{id}`
- `asignar_legajo/{id}`
- `asignar_cargo/{id}`, `cambiar_cargo/{id}`, `eliminar_cargo/{id}`
- `asignar_materias_habilitadas/{id}`
- `asignar_materias_area/{id}`
- `asignar_disponibilidad/{id}`, con body `{ ids_franjas_horarias[] }`

#### Scenario: Eliminar cargo
- **WHEN** se llama `POST /profesor_suplencias/eliminar_cargo/{id}`
- **THEN** devuelve el `Profesor` con `cargo_asociado: null`

### Requirement: Queries de PROFESOR Y SUPLENCIAS
El servicio SHALL exponer con `GET` y prefijo `/profesor_suplencias`:
- `get_profesor/{id}`, `get_profesores`
- `get_suplencia/{id}`, `get_suplencias`
- `get_disponibilidad_profesor/{id}`

`get_profesor_suplencia` y `get_clase_suplencia` MUST NOT existir.

#### Scenario: Disponibilidad
- **WHEN** se llama `GET /profesor_suplencias/get_disponibilidad_profesor/{id}`
- **THEN** devuelve una lista de `FranjaHorariaResumen`

### Requirement: Dependencias de PROFESOR Y SUPLENCIAS
El contrato SHALL declarar estas dependencias:
- USUARIO `crear_usuario`, que usa `crear_profesor`
- USUARIO `asignar_rol`, que usa `asignar_rol_profesor`
- ORIENTACIÓN `get_materia`, que usan `asignar_materias_habilitadas` y `get_profesor`
- ORIENTACIÓN `get_materias_area`, que usa `asignar_materias_area`
- PLANIFICACIÓN `get_clase`, que usan `asignar_suplencia_a_clase` y `get_suplencia`
- HORARIOS `get_franja_horaria`, que usan `asignar_disponibilidad` y `get_disponibilidad_profesor`

#### Scenario: Dependencia con USUARIO
- **WHEN** se lee la descripción de `crear_profesor`
- **THEN** menciona "Invoca: usuario.crear_usuario"
