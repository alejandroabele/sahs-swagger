import type { ErrorApi } from '@sahs/contratos';

/** Error de la API con el cuerpo `Error { codigo, mensaje }`. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
  }

  /** Mensaje del servicio, para mostrar en pantalla. */
  get mensaje(): string {
    return this.message;
  }
}

export interface OpcionesPedido {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: object;
  tipo?: 'json' | 'blob';
}

/**
 * Llama a la API por el mismo origen (/usuario/..., /pago/..., etc.). En producción
 * nginx redirige cada prefijo a su servicio; en desarrollo lo hace el proxy de Vite.
 * Si la respuesta es un error, lanza ApiError con el mensaje del servicio.
 */
export async function pedir<T>(ruta: string, op: OpcionesPedido = {}): Promise<T> {
  const qs = Object.entries((op.query ?? {}) as Record<string, unknown>)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  let r: Response;
  try {
    r = await fetch(ruta + (qs ? '?' + qs : ''), {
      method: op.metodo ?? 'GET',
      headers: op.body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: op.body !== undefined ? JSON.stringify(op.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'SIN_CONEXION', 'No hay conexión con el servidor');
  }
  if (!r.ok) {
    let e: Partial<ErrorApi> = {};
    try {
      e = await r.json();
    } catch {
      /* sin cuerpo */
    }
    throw new ApiError(r.status, e.codigo ?? 'ERROR', e.mensaje ?? `Error ${r.status}`);
  }
  if (op.tipo === 'blob') return (await r.blob()) as T;
  if (r.status === 204) return undefined as T;
  const texto = await r.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}

/** Mensaje para mostrar en pantalla a partir de cualquier error. */
export function mensajeDeError(e: unknown): string {
  if (e instanceof ApiError) return e.mensaje;
  if (e instanceof Error) return e.message;
  return 'Ocurrió un error inesperado';
}
