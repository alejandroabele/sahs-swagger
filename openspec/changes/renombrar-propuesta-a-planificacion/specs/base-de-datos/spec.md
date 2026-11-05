## ADDED Requirements

### Requirement: Migración del renombre de propuesta a planificación
La migración `RenombrarPropuestaAPlanificacion` SHALL renombrar las tablas `planificacion_propuesta` a `planificacion_planificacion`, `planificacion_estado_propuesta` a `planificacion_estado_planificacion` y `planificacion_propuesta_clase` a `planificacion_planificacion_clase`, y las columnas `id_propuesta` a `id_planificacion` y `descripcion_propuesta` a `descripcion_planificacion`. MUST conservar todas las filas, los ids y las claves foráneas. Su `down` MUST revertir los renombres. La migración `ReglasDeNegocio` no se modifica.

#### Scenario: Base con datos anteriores
- **WHEN** `db-init` corre sobre una base con planificaciones, estados y clases asignadas guardadas con los nombres viejos
- **THEN** las tablas nuevas tienen las mismas filas con los mismos ids, y cada clase sigue asignada a la misma planificación

#### Scenario: Revertir
- **WHEN** se revierte la migración
- **THEN** las tablas y columnas vuelven a llamarse `planificacion_propuesta`, `planificacion_estado_propuesta`, `planificacion_propuesta_clase`, `id_propuesta` y `descripcion_propuesta`, con los mismos datos

#### Scenario: Entidades y migraciones alineadas
- **WHEN** después de `db-init` se corre `migration:generate`
- **THEN** no encuentra cambios de esquema

## MODIFIED Requirements

### Requirement: Seeds iniciales
`db-init` SHALL cargar, después de las migraciones, solo en las tablas que estén vacías:
- los privilegios del sistema;
- los roles Administrativo, Profesor y Coordinador de área, con sus privilegios;
- los estados de planificación Borrador (BOR), En revisión (REV), Vigente (VIG) y Fue vigente (FVG);
- los datos de ejemplo de `datos-de-ejemplo.md` y del prototipo.

Las contraseñas MUST guardarse con bcrypt. La contraseña de los usuarios de ejemplo es `sahs2026`.

#### Scenario: Usuarios de ejemplo
- **WHEN** termina `db-init` sobre una base vacía
- **THEN** existen los usuarios `secretaria` (Administrativo), `jramirez` (Profesor) y `sferreyra` (Coordinador de área), y se puede entrar con la contraseña `sahs2026`

#### Scenario: Seeds idempotentes
- **WHEN** `db-init` corre por segunda vez sobre una base con datos
- **THEN** no duplica ni modifica ningún registro
