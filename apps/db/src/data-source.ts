import 'reflect-metadata';
import path from 'node:path';
import { DataSource } from 'typeorm';
import { opcionesBase } from '@sahs/comun';
import { TODAS_LAS_ENTIDADES } from '@sahs/entidades';

/**
 * DataSource con TODAS las entidades. Lo usan db-init (migraciones y seeds) y el CLI
 * de TypeORM para generar migraciones nuevas. Los servicios usan cada uno el suyo.
 */
const dataSource = new DataSource({
  ...opcionesBase(TODAS_LAS_ENTIDADES),
  migrations: [path.join(__dirname, 'migraciones', '*.js')],
  migrationsTableName: 'migrations',
});

export default dataSource;
