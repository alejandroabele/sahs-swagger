## MODIFIED Requirements

### Requirement: Una SQLite compartida en un volumen
El sistema SHALL guardar todos sus datos en un único archivo SQLite, cuya ruta sale de la variable `DB_PATH` (en Docker, `/data/sahs.sqlite`, dentro del volumen `sahs-data`). Cada conexión MUST activar `journal_mode=WAL`, `busy_timeout=5000` y `foreign_keys=ON`.

#### Scenario: Los datos sobreviven a un reinicio
- **WHEN** se crea un usuario, se ejecuta `docker compose down` y después `up -d`
- **THEN** el usuario sigue existiendo

#### Scenario: Borrar la base
- **WHEN** se ejecuta `docker compose down -v` y después `up -d --build`
- **THEN** la base se crea de nuevo, solo con los datos de los seeds

### Requirement: Contenedor db-init
`db-init` SHALL ejecutar las migraciones y los seeds y terminar con código 0. Si falla, MUST terminar con un código distinto de 0, y los servicios MUST NOT arrancar.

#### Scenario: Orden de arranque
- **WHEN** se ejecuta `docker compose up -d`
- **THEN** los 6 servicios arrancan recién después de que `db-init` terminó bien
