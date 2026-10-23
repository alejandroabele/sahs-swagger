import 'reflect-metadata';
import { ENTIDADES_USUARIO } from './usuario';
import { ENTIDADES_PAGO } from './pago';
import { ENTIDADES_HORARIOS } from './horarios';
import { ENTIDADES_PLANIFICACION } from './planificacion';
import { ENTIDADES_ORIENTACION } from './orientacion';
import { ENTIDADES_PROFESOR_SUPLENCIAS } from './profesor-suplencias';

export * from './usuario';
export * from './pago';
export * from './pago/liquidacion';
export * from './horarios';
export * from './planificacion';
export * from './orientacion';
export * from './profesor-suplencias';

/** Todas las entidades (las usa db-init para las migraciones). */
export const TODAS_LAS_ENTIDADES = [
  ...ENTIDADES_USUARIO,
  ...ENTIDADES_PAGO,
  ...ENTIDADES_HORARIOS,
  ...ENTIDADES_PLANIFICACION,
  ...ENTIDADES_ORIENTACION,
  ...ENTIDADES_PROFESOR_SUPLENCIAS,
];
