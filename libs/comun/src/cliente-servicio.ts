import { Logger } from '@nestjs/common';
import { contexto, HEADER_ANIDADOS } from './contexto';
import { ErrorSahs, noDisponible, referenciaInvalida } from './errores';

export type NombreServicio = 'usuario' | 'pago' | 'horarios' | 'planificacion' | 'orientacion' | 'profesor_suplencias';

/** Puertos de desarrollo (los mismos que los `servers` de los contratos originales). */
export const PUERTOS_DESARROLLO: Record<NombreServicio, number> = {
  usuario: 8081,
  pago: 8082,
  horarios: 8083,
  planificacion: 8084,
  orientacion: 8085,
  profesor_suplencias: 8086,
};

/** Prefijo de las rutas del servicio: su nombre en kebab-case (profesor_suplencias → profesor-suplencias). */
export function prefijoServicio(servicio: NombreServicio): string {
  return servicio.replace(/_/g, '-');
}

export function urlServicio(servicio: NombreServicio): string {
  const variable = 'URL_' + servicio.toUpperCase();
  return (process.env[variable] || `http://localhost:${PUERTOS_DESARROLLO[servicio]}`).replace(/\/$/, '');
}

const TIMEOUT_MS = Number(process.env.TIMEOUT_SERVICIOS_MS || 5000);

export interface OpcionesLlamada {
  /** Pide la respuesta con sus anidados (un nivel más). Por defecto la llamada es plana. */
  completo?: boolean;
  /** Query string. Los valores undefined se omiten. */
  query?: Record<string, string | number | boolean | undefined | null>;
}

/** Error de otro servicio que respondió con 4xx/5xx. */
export class ErrorRemoto extends Error {
  constructor(
    readonly servicio: NombreServicio,
    readonly status: number,
    readonly cuerpo: any,
  ) {
    super(`${servicio} respondió ${status}: ${cuerpo?.mensaje ?? ''}`);
  }
}

/**
 * Cliente HTTP para llamar a otro servicio SAHS (las dependencias "Invoca:").
 * - URL base de `URL_<SERVICIO>`, timeout de 5 s.
 * - Las llamadas son planas por defecto (header x-sahs-anidados: no).
 * - Los GET se cachean durante el request: cada recurso se pide una sola vez.
 * - Si el otro servicio no responde → 503.
 */
export class ClienteServicio {
  private readonly log = new Logger('ClienteServicio');
  private readonly base: string;

  constructor(readonly servicio: NombreServicio) {
    this.base = urlServicio(servicio);
  }

  private url(ruta: string, query?: OpcionesLlamada['query']): string {
    const qs = Object.entries(query ?? {})
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    return `${this.base}/${prefijoServicio(this.servicio)}/${ruta}${qs ? '?' + qs : ''}`;
  }

  private async pedir<T>(metodo: string, url: string, body: unknown, completo: boolean): Promise<T> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        method: metodo,
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          ...(completo ? {} : { [HEADER_ANIDADOS]: 'no' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctrl.signal,
      });
    } catch (e) {
      this.log.warn(`${metodo} ${url}: ${(e as Error).message}`);
      throw noDisponible(`El servicio ${this.servicio} no responde`);
    } finally {
      clearTimeout(t);
    }
    const texto = await res.text();
    const datos = texto ? JSON.parse(texto) : undefined;
    if (!res.ok) throw new ErrorRemoto(this.servicio, res.status, datos);
    return datos as T;
  }

  /** GET con caché por request. Lanza ErrorRemoto si responde con error. */
  get<T>(ruta: string, opciones: OpcionesLlamada = {}): Promise<T> {
    const url = this.url(ruta, opciones.query);
    const clave = `${opciones.completo ? 'C' : 'P'} ${url}`;
    const cache = contexto().cache;
    if (!cache.has(clave)) {
      const p = this.pedir<T>('GET', url, undefined, !!opciones.completo);
      p.catch(() => cache.delete(clave));
      cache.set(clave, p);
    }
    return cache.get(clave) as Promise<T>;
  }

  /** GET que devuelve null si el recurso no existe (404). */
  async buscar<T>(ruta: string, opciones: OpcionesLlamada = {}): Promise<T | null> {
    try {
      return await this.get<T>(ruta, opciones);
    } catch (e) {
      if (e instanceof ErrorRemoto && e.status === 404) return null;
      throw this.traducir(e);
    }
  }

  /**
   * GET de una entidad referenciada por el usuario: si no existe responde 400
   * ("referencia inexistente") con el mensaje indicado.
   */
  async exigir<T>(ruta: string, mensajeSiNoExiste: string, opciones: OpcionesLlamada = {}): Promise<T> {
    const r = await this.buscar<T>(ruta, opciones);
    if (r === null) throw referenciaInvalida(mensajeSiNoExiste);
    return r;
  }

  /** GET de un listado. Los errores del otro servicio se traducen. */
  async listar<T>(ruta: string, opciones: OpcionesLlamada = {}): Promise<T[]> {
    try {
      return await this.get<T[]>(ruta, opciones);
    } catch (e) {
      throw this.traducir(e);
    }
  }

  /** Commands (POST/PUT/PATCH/DELETE) hacia otro servicio. No se cachean. */
  async enviar<T>(metodo: 'POST' | 'PUT' | 'PATCH' | 'DELETE', ruta: string, body?: unknown): Promise<T> {
    try {
      return await this.pedir<T>(metodo, this.url(ruta), body, false);
    } catch (e) {
      throw this.traducir(e);
    }
  }

  private traducir(e: unknown): unknown {
    if (e instanceof ErrorRemoto) {
      if (e.status === 503) return noDisponible(e.cuerpo?.mensaje ?? `El servicio ${this.servicio} no está disponible`);
      if (e.status >= 500) return new ErrorSahs(502, 'ERROR_DEPENDENCIA', `El servicio ${this.servicio} respondió con un error`);
      return new ErrorSahs(e.status === 404 ? 400 : e.status, e.cuerpo?.codigo ?? 'ERROR_DEPENDENCIA', e.cuerpo?.mensaje ?? `Error en ${this.servicio}`);
    }
    return e;
  }
}
