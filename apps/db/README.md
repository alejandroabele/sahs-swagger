# Base de datos (db-init)

Crea o actualiza la base de SAHS y carga los datos de ejemplo.

- `src/data-source.ts`: DataSource de TypeORM con todas las entidades (`@sahs/entidades`).
- `src/migraciones/`: migraciones versionadas. La primera (`Inicial`) crea todas las tablas.
- `src/seeds/datos.ts`: datos de ejemplo (Instituto Don Bosco, ciclos 2025 y 2026), tomados del prototipo y de `datos-de-ejemplo.md`.
- `src/seeds/seeds.ts`: los carga. Cada bloque se carga solo si su tabla está vacía, así que correrlo de nuevo no duplica nada.
- `src/db-init.ts`: aplica las migraciones pendientes y los seeds, y termina (código 0 si salió bien). Con `SIN_SEEDS=1` solo migra.

```bash
npm run build:libs && npm run build -w apps/db
DB_PATH=../../data/sahs.sqlite npm run db-init -w apps/db
```

La base es un solo archivo SQLite (`DB_PATH`), con WAL, `busy_timeout` y claves foráneas activas. En Docker vive en el volumen `sahs-data`. Los usuarios de ejemplo tienen la contraseña `sahs2026`.

Para una migración nueva, ver "Mantenimiento" en el README de la raíz.
