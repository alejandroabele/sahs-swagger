import { ApiResponse } from '@nestjs/swagger';
import { ErrorApi } from './errores';

/**
 * Reglas de negocio del documento del grupo (pestaña "Reglas de negocio"). El id de la regla
 * es el `codigo` del error que responde la API cuando se viola. RN-12, RN-13 y RN-14 son las
 * genéricas: conflicto, no encontrado y datos inválidos. RN-20 a RN-22 no están en el documento:
 * son los errores que no vienen de una regla (otro servicio caído, error interno).
 */
export const REGLAS = {
  'RN-01': {
    status: 409,
    regla: 'Una materia no puede tener asignado un horario por fuera del escolar.',
    ejemplo: 'La franja Lunes 18:00–18:40 no es del turno Mañana del curso',
  },
  'RN-02': {
    status: 409,
    regla: 'Un profesor no puede estar asignado a dos clases en el mismo día y bloque horario.',
    ejemplo: 'Juan Ramírez ya tiene la clase MAT-1A el Lunes 08:00–08:40',
  },
  'RN-03': {
    status: 409,
    regla: 'No se puede marcar como abonado el sueldo de un profesor sin antes calcular el monto.',
    ejemplo: 'El recibo del pago no tiene el monto calculado: no se puede validar',
  },
  'RN-04': {
    status: 409,
    regla: 'Cada profesor tiene que tener cargado un recibo de sueldo para poder ser marcado como pagado.',
    ejemplo: 'El pago no tiene recibo de sueldo: no se puede validar',
  },
  'RN-05': {
    status: 400,
    regla: 'No se pueden dejar sin completar el nombre, el apellido y el documento del profesor.',
    ejemplo: 'nombre es obligatorio',
  },
  'RN-10': {
    status: 400,
    regla: 'No se pueden crear franjas horarias mayores a 23:59.',
    ejemplo: 'Las horas van en formato HH:MM, de 00:00 a 23:59',
  },
  'RN-11': {
    status: 409,
    regla: 'No se puede crear un profesor con número de DNI igual al de otro ya creado.',
    ejemplo: 'Ya hay un profesor con el documento 30123456',
  },
  'RN-12': {
    status: 409,
    regla: 'Conflicto con una regla de negocio.',
    ejemplo: 'Ya existe un registro con esos datos',
  },
  'RN-13': {
    status: 404,
    regla: 'No encontrado.',
    ejemplo: 'No existe el recurso 99',
  },
  'RN-14': {
    status: 400,
    regla: 'Datos inválidos.',
    ejemplo: 'nombre es obligatorio',
  },
  'RN-15': {
    status: 409,
    regla: 'No se puede crear una suplencia si el intervalo de fechas no incluye al menos un dictado de la clase a suplantar.',
    ejemplo: 'Del 2026-05-04 al 2026-05-06 no hay ningún dictado de la clase MAT-1A (Jueves)',
  },
  'RN-16': {
    status: 400,
    regla: 'La franja horaria tiene que tener una hora de fin posterior a la hora de inicio.',
    ejemplo: 'La hora de inicio tiene que ser anterior a la de fin',
  },
  'RN-17': {
    status: 400,
    regla: 'Una materia puede tener como máximo 12 horas semanales.',
    ejemplo: 'Las horas semanales van de 1 a 12',
  },
  'RN-18': {
    status: 400,
    regla: 'La descripción de la materia tiene que tener como mínimo 15 caracteres.',
    ejemplo: 'La descripción de la materia tiene que tener al menos 15 caracteres',
  },
  'RN-19': {
    status: 400,
    regla: 'La duración mínima de una franja horaria es de 10 minutos.',
    ejemplo: 'La franja tiene que durar al menos 10 minutos',
  },
  // No están en el documento: errores que no son de una regla de negocio.
  'RN-20': {
    status: 503,
    regla: 'Otro servicio (o la base de datos) no responde.',
    ejemplo: 'El servicio horarios no responde',
  },
  'RN-21': {
    status: 500,
    regla: 'Error interno del servicio.',
    ejemplo: 'Error interno del servicio',
  },
  'RN-22': {
    status: 502,
    regla: 'Otro servicio respondió con un error.',
    ejemplo: 'El servicio horarios respondió con un error',
  },
} as const satisfies Record<string, { status: 400 | 404 | 409 | 500 | 502 | 503; regla: string; ejemplo: string }>;

export type CodigoRegla = keyof typeof REGLAS;

/** Regla genérica de cada status. */
export const REGLA_GENERICA = { 400: 'RN-14', 404: 'RN-13', 409: 'RN-12', 500: 'RN-21', 502: 'RN-22', 503: 'RN-20' } as const satisfies Record<number, CodigoRegla>;

const DESCRIPCION = {
  400: 'Datos inválidos',
  404: 'No existe el recurso',
  409: 'Conflicto con una regla de negocio',
  503: 'Otro servicio no responde',
} as const;

/**
 * Respuesta de error en el swagger, con un ejemplo por regla que la operación puede violar
 * (más la genérica del status). La descripción lista las reglas específicas.
 *
 *   @RespuestaError(409, 'RN-11')   →  ejemplos RN-11 y RN-12
 */
export function RespuestaError(status: keyof typeof DESCRIPCION, ...reglas: CodigoRegla[]) {
  for (const r of reglas) {
    if (REGLAS[r].status !== status) throw new Error(`La regla ${r} responde ${REGLAS[r].status}, no ${status}`);
  }
  const codigos = [...new Set<CodigoRegla>([...reglas, REGLA_GENERICA[status]])];
  const lista = reglas.map((r) => `- **${r}**: ${REGLAS[r].regla}`).join('\n');
  return ApiResponse({
    status,
    description: DESCRIPCION[status] + (lista ? '\n\n' + lista : ''),
    type: ErrorApi,
    examples: Object.fromEntries(
      codigos.map((c) => [c, { summary: `${c}: ${REGLAS[c].regla}`, value: { codigo: c, mensaje: REGLAS[c].ejemplo } }]),
    ),
  });
}
