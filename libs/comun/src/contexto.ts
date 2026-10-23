import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';

/**
 * Contexto de cada request: si hay que armar los anidados de otros servicios y
 * una caché de las respuestas de otros servicios (cada id se pide una sola vez).
 */
export interface ContextoRequest {
  anidados: boolean;
  cache: Map<string, Promise<unknown>>;
}

/** Header que manda un servicio cuando llama a otro: la respuesta no arma anidados de terceros. */
export const HEADER_ANIDADOS = 'x-sahs-anidados';

const als = new AsyncLocalStorage<ContextoRequest>();

export function middlewareContexto(req: Request, _res: Response, next: NextFunction) {
  const anidados = String(req.headers[HEADER_ANIDADOS] ?? 'si').toLowerCase() !== 'no';
  als.run({ anidados, cache: new Map() }, () => next());
}

export function contexto(): ContextoRequest {
  return als.getStore() ?? { anidados: true, cache: new Map() };
}

/**
 * true si la respuesta tiene que incluir los datos anidados que vienen de otros servicios.
 * Es false cuando quien llama es otro servicio (llamada "plana"): así las llamadas entre
 * servicios nunca pasan de dos niveles y no hay ciclos (por ejemplo clase → suplencia → clase).
 */
export function conAnidados(): boolean {
  return contexto().anidados;
}

/** Para pruebas o tareas fuera de un request. */
export function ejecutarConContexto<T>(ctx: Partial<ContextoRequest>, fn: () => T): T {
  return als.run({ anidados: ctx.anidados ?? true, cache: ctx.cache ?? new Map() }, fn);
}
