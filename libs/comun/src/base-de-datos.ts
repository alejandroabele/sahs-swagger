import type { DataSourceOptions } from 'typeorm';
import path from 'node:path';

/** Ruta del archivo SQLite compartido. En Docker es /data/sahs.sqlite (volumen sahs-data). */
export function rutaBase(): string {
  return process.env.DB_PATH || path.resolve(process.cwd(), '../../data/sahs.sqlite');
}

/**
 * Pragmas de cada conexión: WAL para que varios procesos lean mientras uno escribe,
 * busy_timeout para esperar en vez de fallar con SQLITE_BUSY, y FK activas.
 */
export function prepararConexion(db: { pragma: (s: string) => unknown }) {
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
}

/**
 * Opciones de TypeORM para un servicio: registra solo las entidades del servicio.
 * Nunca sincroniza ni migra: el esquema lo crea db-init con las migraciones.
 */
export function opcionesBase(entidades: Function[], extra: Partial<DataSourceOptions> = {}): DataSourceOptions {
  return {
    type: 'better-sqlite3',
    database: rutaBase(),
    entities: entidades,
    synchronize: false,
    migrationsRun: false,
    prepareDatabase: prepararConexion,
    logging: process.env.DB_LOG === '1' ? ['query', 'error'] : ['error'],
    ...extra,
  } as DataSourceOptions;
}
