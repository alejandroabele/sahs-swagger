## ADDED Requirements

### Requirement: Una SQLite compartida en un volumen
El sistema SHALL guardar todos sus datos en un único archivo SQLite, cuya ruta sale de la variable `DB_PATH` (en Docker, `/data/sahs.sqlite`, dentro del volumen `sahs-data`). Cada conexión MUST activar `journal_mode=WAL`, `busy_timeout=5000` y `foreign_keys=ON`.

#### Scenario: Los datos sobreviven a un reinicio
- **WHEN** se crea un usuario, se ejecuta `docker compose -f docker-compose.app.yml down` y después `up -d`
- **THEN** el usuario sigue existiendo

#### Scenario: Borrar la base
- **WHEN** se ejecuta `docker compose -f docker-compose.app.yml down -v` y después `up -d --build`
- **THEN** la base se crea de nuevo, solo con los datos de los seeds

### Requirement: Esquema creado por código con migraciones
El esquema SHALL definirse con entidades TypeORM en `@sahs/entidades` y crearse con migraciones versionadas en `apps/db`. Ningún servicio MUST usar `synchronize: true` ni correr migraciones al arrancar.

#### Scenario: Base vacía
- **WHEN** `db-init` corre sobre un volumen vacío
- **THEN** crea todas las tablas de los 6 servicios y registra las migraciones aplicadas en la tabla `migrations`

#### Scenario: Migración nueva
- **WHEN** se agrega una migración en `apps/db` y se vuelve a levantar el compose
- **THEN** `db-init` aplica solo esa migración y los datos existentes se conservan

### Requirement: Un servicio dueño por tabla
Cada tabla SHALL pertenecer a un solo servicio, llevar su prefijo (`usuario_`, `pago_`, `horarios_`, `planificacion_`, `orientacion_`, `profesor_`) y escribirla solo ese servicio. Las claves foráneas MUST existir solo entre tablas del mismo servicio. Una referencia a una entidad de otro servicio MUST guardarse como una columna de id indexada, sin FK.

#### Scenario: Referencia a otro servicio
- **WHEN** se inspecciona la tabla de profesores de una clase de Planificación
- **THEN** tiene la columna `id_profesor` indexada y sin FK a la tabla de profesores

#### Scenario: Entidades registradas por servicio
- **WHEN** arranca el servicio Pago
- **THEN** su conexión de TypeORM registra solo las entidades de `libs/entidades/pago`

### Requirement: Seeds iniciales
`db-init` SHALL cargar, después de las migraciones, solo en las tablas que estén vacías:
- los privilegios del sistema;
- los roles Administrativo, Profesor y Coordinador de área, con sus privilegios;
- los estados de propuesta Borrador (BOR), En revisión (REV), Validada (VAL) y Cerrada (CER);
- los datos de ejemplo de `datos-de-ejemplo.md` y del prototipo.

Las contraseñas MUST guardarse con bcrypt. La contraseña de los usuarios de ejemplo es `sahs2026`.

#### Scenario: Usuarios de ejemplo
- **WHEN** termina `db-init` sobre una base vacía
- **THEN** existen los usuarios `secretaria` (Administrativo), `jramirez` (Profesor) y `sferreyra` (Coordinador de área), y se puede entrar con la contraseña `sahs2026`

#### Scenario: Seeds idempotentes
- **WHEN** `db-init` corre por segunda vez sobre una base con datos
- **THEN** no duplica ni modifica ningún registro

### Requirement: Contenedor db-init
`db-init` SHALL ejecutar las migraciones y los seeds y terminar con código 0. Si falla, MUST terminar con un código distinto de 0, y los servicios MUST NOT arrancar.

#### Scenario: Orden de arranque
- **WHEN** se ejecuta `docker compose -f docker-compose.app.yml up -d`
- **THEN** los 6 servicios arrancan recién después de que `db-init` terminó bien
