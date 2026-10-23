import type { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { noEncontrado } from './errores';

/** Busca por id o responde 404 con el mensaje indicado. */
export async function buscarOFallar<T extends ObjectLiteral>(
  repo: Repository<T>,
  where: FindOptionsWhere<T>,
  mensaje: string,
  relations?: string[],
): Promise<T> {
  const e = await repo.findOne({ where, relations });
  if (!e) throw noEncontrado(mensaje);
  return e;
}

/** Ids distintos de una lista, sin null ni undefined. */
export function distintos(ids: (number | null | undefined)[]): number[] {
  return [...new Set(ids.filter((x): x is number => typeof x === 'number'))];
}

/** Fecha de hoy en formato YYYY-MM-DD (hora local). */
export function hoy(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Ejecuta las promesas de a una (para no saturar a otro servicio). */
export async function enSerie<T, R>(items: T[], fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (const x of items) out.push(await fn(x));
  return out;
}
