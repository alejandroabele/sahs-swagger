## ADDED Requirements

### Requirement: Migración de las reglas de negocio
La migración `ReglasDeNegocio` SHALL agregar `profesor_profesor.activo` (booleano, `true` por defecto) y renombrar en `planificacion_estado_propuesta` Validada (`VAL`) a Vigente (`VIG`) y Cerrada (`CER`) a Fue vigente (`FVG`), sin cambiar los `id_estado`. Su `down` MUST revertir los dos cambios.

#### Scenario: Base con datos anteriores
- **WHEN** `db-init` corre sobre una base con propuestas en `VAL` y `CER`
- **THEN** esas propuestas quedan en `VIG` y `FVG` con el mismo `id_estado`, y todos los profesores quedan con `activo: true`

#### Scenario: Entidades y migraciones alineadas
- **WHEN** después de `db-init` se corre `migration:generate`
- **THEN** no encuentra cambios de esquema

## MODIFIED Requirements

### Requirement: Seeds iniciales
`db-init` SHALL cargar, después de las migraciones, solo en las tablas que estén vacías:
- los privilegios del sistema;
- los roles Administrativo, Profesor y Coordinador de área, con sus privilegios;
- los estados de propuesta Borrador (BOR), En revisión (REV), Vigente (VIG) y Fue vigente (FVG);
- los datos de ejemplo de `datos-de-ejemplo.md` y del prototipo.

Las contraseñas MUST guardarse con bcrypt. La contraseña de los usuarios de ejemplo es `sahs2026`.

#### Scenario: Usuarios de ejemplo
- **WHEN** termina `db-init` sobre una base vacía
- **THEN** existen los usuarios `secretaria` (Administrativo), `jramirez` (Profesor) y `sferreyra` (Coordinador de área), y se puede entrar con la contraseña `sahs2026`

#### Scenario: Seeds idempotentes
- **WHEN** `db-init` corre por segunda vez sobre una base con datos
- **THEN** no duplica ni modifica ningún registro
