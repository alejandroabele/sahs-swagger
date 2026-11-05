import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import type * as C from '@sahs/contratos';
import type { CodigoRegla } from './reglas';

/**
 * Cuerpo de toda respuesta de error: `Error { codigo, mensaje }`. El código es el id de la
 * regla de negocio violada (`RN-11`); RN-20 a RN-22 son los errores que no vienen de una regla.
 */
@ApiSchema({ name: 'Error' })
export class ErrorApi implements C.ErrorApi {
  @ApiProperty({
    type: 'string',
    description: 'Id de la regla de negocio violada (RN-01 a RN-19); RN-20 a RN-22 son otro servicio caído, error interno y error de otro servicio',
    example: 'RN-12',
    required: true,
  })
  codigo!: string;

  @ApiProperty({ type: 'string', description: 'Qué pasó, en español', example: 'Ya existe un registro con esos datos', required: true })
  mensaje!: string;
}

/** Código de cada status cuando el error no trae uno propio. */
export const CODIGOS = {
  400: 'RN-14',
  404: 'RN-13',
  409: 'RN-12',
  500: 'RN-21',
  502: 'RN-22',
  503: 'RN-20',
} as Record<number, string>;

/** Código de un status sin código propio: la genérica del status, o RN-21 / RN-14 según sea 5xx o 4xx. */
export const codigoDe = (status: number) => CODIGOS[status] ?? (status >= 500 ? 'RN-21' : 'RN-14');

/** Error con código y mensaje propios. */
export class ErrorSahs extends HttpException {
  constructor(status: number, codigo: string, mensaje: string) {
    super({ codigo, mensaje }, status);
  }
}

/** 404 (RN-13): la entidad de la ruta no existe. */
export const noEncontrado = (mensaje: string) => new ErrorSahs(404, 'RN-13', mensaje);
/** 400: datos inválidos (RN-14) o la regla indicada. */
export const invalido = (mensaje: string, regla: CodigoRegla = 'RN-14') => new ErrorSahs(400, regla, mensaje);
/** 400 (RN-14): un id de otra entidad que no existe. */
export const referenciaInvalida = (mensaje: string) => new ErrorSahs(400, 'RN-14', mensaje);
/** 409: conflicto con una regla de negocio (RN-12) o la regla indicada. */
export const conflicto = (mensaje: string, regla: CodigoRegla = 'RN-12') => new ErrorSahs(409, regla, mensaje);
export const noDisponible = (mensaje: string) => new ErrorSahs(503, 'RN-20', mensaje);
/** 502 (RN-22): otro servicio respondió con un error. */
export const errorDependencia = (mensaje: string) => new ErrorSahs(502, 'RN-22', mensaje);

const TRADUCCIONES: [RegExp, string][] = [
  [/^(\S+) should not be empty$/, '$1 es obligatorio'],
  [/^(\S+) must be an email$/, '$1 tiene que ser un email válido'],
  [/^(\S+) must be a string$/, '$1 tiene que ser un texto'],
  [/^(\S+) must be an integer number$/, '$1 tiene que ser un número entero'],
  [/^(\S+) must be a number.*$/, '$1 tiene que ser un número'],
  [/^(\S+) must be a boolean value$/, '$1 tiene que ser verdadero o falso'],
  [/^(\S+) must be an array$/, '$1 tiene que ser una lista'],
  [/^each value in (\S+) must be an integer number$/, '$1 tiene que ser una lista de números enteros'],
  [/^(\S+) must be a valid ISO 8601 date string$/, '$1 tiene que ser una fecha (AAAA-MM-DD)'],
  [/^(\S+) must match .* regular expression$/, '$1 no tiene el formato correcto'],
  [/^(\S+) must be one of the following values: (.*)$/, '$1 tiene que ser uno de estos valores: $2'],
  [/^property (\S+) should not exist$/, 'el campo $1 no está permitido'],
  [/numeric string is expected/, 'El id debe ser un número entero'],
];

function traducir(mensaje: string): string {
  for (const [re, txt] of TRADUCCIONES) if (re.test(mensaje)) return mensaje.replace(re, txt);
  return mensaje;
}

/** Un mensaje por campo (el primero), traducido. */
export function traducirLista(mensajes: string[]): string {
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const m of mensajes) {
    const campo = m.split(' ')[0];
    if (vistos.has(campo)) continue;
    vistos.add(campo);
    out.push(traducir(m));
  }
  return out.join('; ');
}

/**
 * Transforma cualquier error en `Error { codigo, mensaje }`:
 * validación → 400 (RN-14), inexistente → 404 (RN-13), regla de negocio o restricción de la base → 409 (RN-12),
 * salvo que el error traiga su propia regla.
 */
@Catch()
export class FiltroErrores implements ExceptionFilter {
  private readonly log = new Logger('Errores');

  catch(error: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let cuerpo: { codigo: string; mensaje: string };

    if (error instanceof HttpException) {
      status = error.getStatus();
      const r = error.getResponse() as any;
      if (r && typeof r === 'object' && r.codigo && r.mensaje) {
        cuerpo = { codigo: r.codigo, mensaje: r.mensaje };
      } else {
        const msj = r && typeof r === 'object' ? r.message : r;
        const mensaje = Array.isArray(msj) ? traducirLista(msj) : traducir(String(msj ?? error.message));
        // La validación de un DTO puede traer la regla del campo (ver PipeValidacion).
        const codigo = r && typeof r === 'object' && r.codigo ? r.codigo : codigoDe(status);
        cuerpo = { codigo, mensaje };
      }
    } else if (error instanceof QueryFailedError) {
      const msj = String((error as any).driverError?.message ?? error.message);
      status = HttpStatus.CONFLICT;
      if (/UNIQUE/.test(msj)) cuerpo = { codigo: 'RN-12', mensaje: 'Ya existe un registro con esos datos (' + msj.replace(/^.*: /, '') + ')' };
      else if (/FOREIGN KEY/.test(msj)) cuerpo = { codigo: 'RN-12', mensaje: 'El registro está en uso o referencia a uno que no existe' };
      else if (/SQLITE_BUSY|database is locked/.test(msj)) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        cuerpo = { codigo: 'RN-20', mensaje: 'La base de datos está ocupada, reintentá en unos segundos' };
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        cuerpo = { codigo: 'RN-21', mensaje: 'Error de base de datos' };
        this.log.error(msj);
      }
    } else {
      this.log.error(error instanceof Error ? error.stack : String(error));
      cuerpo = { codigo: 'RN-21', mensaje: 'Error interno del servicio' };
    }
    if (status >= 500 && status !== 503 && status !== 501) this.log.error(`${status} ${cuerpo.mensaje}`);
    res.status(status).json(cuerpo);
  }
}
