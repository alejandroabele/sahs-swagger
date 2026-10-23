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

/** Cuerpo de toda respuesta de error: `Error { codigo, mensaje }`. */
@ApiSchema({ name: 'Error' })
export class ErrorApi implements C.ErrorApi {
  @ApiProperty({ type: 'string', example: 'NO_ENCONTRADO', required: true })
  codigo!: string;

  @ApiProperty({ type: 'string', example: 'No existe el usuario 99', required: true })
  mensaje!: string;
}

/** Códigos de error que usan los servicios. */
export const CODIGOS = {
  400: 'VALIDACION',
  404: 'NO_ENCONTRADO',
  409: 'CONFLICTO',
  500: 'ERROR_INTERNO',
  501: 'NO_IMPLEMENTADO',
  502: 'ERROR_DEPENDENCIA',
  503: 'SERVICIO_NO_DISPONIBLE',
} as Record<number, string>;

/** Error con código y mensaje propios. */
export class ErrorSahs extends HttpException {
  constructor(status: number, codigo: string, mensaje: string) {
    super({ codigo, mensaje }, status);
  }
}

export const noEncontrado = (mensaje: string) => new ErrorSahs(404, 'NO_ENCONTRADO', mensaje);
export const invalido = (mensaje: string) => new ErrorSahs(400, 'VALIDACION', mensaje);
export const referenciaInvalida = (mensaje: string) => new ErrorSahs(400, 'REFERENCIA_INEXISTENTE', mensaje);
export const conflicto = (mensaje: string) => new ErrorSahs(409, 'CONFLICTO', mensaje);
export const noDisponible = (mensaje: string) => new ErrorSahs(503, 'SERVICIO_NO_DISPONIBLE', mensaje);

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
function traducirLista(mensajes: string[]): string {
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
 * validación → 400, inexistente → 404, regla de negocio o restricción de la base → 409.
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
        cuerpo = { codigo: CODIGOS[status] ?? 'ERROR', mensaje };
      }
    } else if (error instanceof QueryFailedError) {
      const msj = String((error as any).driverError?.message ?? error.message);
      status = HttpStatus.CONFLICT;
      if (/UNIQUE/.test(msj)) cuerpo = { codigo: 'CONFLICTO', mensaje: 'Ya existe un registro con esos datos (' + msj.replace(/^.*: /, '') + ')' };
      else if (/FOREIGN KEY/.test(msj)) cuerpo = { codigo: 'CONFLICTO', mensaje: 'El registro está en uso o referencia a uno que no existe' };
      else if (/SQLITE_BUSY|database is locked/.test(msj)) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        cuerpo = { codigo: 'SERVICIO_NO_DISPONIBLE', mensaje: 'La base de datos está ocupada, reintentá en unos segundos' };
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        cuerpo = { codigo: 'ERROR_INTERNO', mensaje: 'Error de base de datos' };
        this.log.error(msj);
      }
    } else {
      this.log.error(error instanceof Error ? error.stack : String(error));
      cuerpo = { codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servicio' };
    }
    if (status >= 500 && status !== 503 && status !== 501) this.log.error(`${status} ${cuerpo.mensaje}`);
    res.status(status).json(cuerpo);
  }
}
