/**
 * db-init: crea o actualiza la base de SAHS y carga los datos iniciales.
 *   1. Aplica las migraciones pendientes.
 *   2. Carga los seeds en las tablas vacías.
 * Termina con código 0 si todo salió bien; si no, con 1 (y los servicios no arrancan).
 */
import 'reflect-metadata';
import fs from 'node:fs';
import path from 'node:path';
import { rutaBase } from '@sahs/comun';
import dataSource from './data-source';
import { cargarSeeds } from './seeds/seeds';

async function main() {
  const archivo = rutaBase();
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  console.log(`db-init: base ${archivo}`);
  await dataSource.initialize();
  const aplicadas = await dataSource.runMigrations({ transaction: 'each' });
  console.log(aplicadas.length ? `db-init: migraciones aplicadas: ${aplicadas.map((m) => m.name).join(', ')}` : 'db-init: el esquema está al día');
  if (process.env.SIN_SEEDS !== '1') {
    console.log('db-init: seeds');
    await cargarSeeds(dataSource);
  }
  await dataSource.destroy();
  console.log('db-init: listo');
}

main().catch(async (e) => {
  console.error('db-init: falló', e);
  try {
    if (dataSource.isInitialized) await dataSource.destroy();
  } catch {
    /* nada */
  }
  process.exit(1);
});
