// Generado por tools/generar_cliente_web.mjs a partir del /docs-json del servicio. No editar a mano.
import type { AsignarFranjaATurnoBody, CrearDiaLectivoBody, CrearFranjaHorariaBody, CrearTurnoBody, DiaLectivo, FranjaHoraria, Turno } from '@sahs/contratos';
import { pedir } from './http';

/** Servicio Horarios Service. */
export const horarios = {
  /** POST /horarios/dias-lectivos — Crear día lectivo */
  crear_dia_lectivo: (body: CrearDiaLectivoBody) =>
    pedir<DiaLectivo>(`/horarios/dias-lectivos`, { metodo: 'POST', body }),
  /** GET /horarios/dias-lectivos — Listar días lectivos */
  get_dias_lectivos: () =>
    pedir<DiaLectivo[]>(`/horarios/dias-lectivos`, { metodo: 'GET' }),
  /** DELETE /horarios/dias-lectivos/{id} — Eliminar día lectivo */
  eliminar_dia_lectivo: (id: number) =>
    pedir<void>(`/horarios/dias-lectivos/${id}`, { metodo: 'DELETE' }),
  /** GET /horarios/dias-lectivos/{id} — Obtener día lectivo */
  get_dia_lectivo: (id: number) =>
    pedir<DiaLectivo>(`/horarios/dias-lectivos/${id}`, { metodo: 'GET' }),
  /** GET /horarios/dias-lectivos/{id}/franjas-horarias — Franjas horarias del día lectivo */
  get_franja_horaria_dia_lectivo: (id: number) =>
    pedir<FranjaHoraria[]>(`/horarios/dias-lectivos/${id}/franjas-horarias`, { metodo: 'GET' }),
  /** POST /horarios/franjas-horarias — Crear franja horaria */
  crear_franja_horaria: (body: CrearFranjaHorariaBody) =>
    pedir<FranjaHoraria>(`/horarios/franjas-horarias`, { metodo: 'POST', body }),
  /** GET /horarios/franjas-horarias — Listar franjas horarias */
  get_franjas_horarias: () =>
    pedir<FranjaHoraria[]>(`/horarios/franjas-horarias`, { metodo: 'GET' }),
  /** GET /horarios/franjas-horarias/{id} — Obtener franja horaria */
  get_franja_horaria: (id: number) =>
    pedir<FranjaHoraria>(`/horarios/franjas-horarias/${id}`, { metodo: 'GET' }),
  /** POST /horarios/turnos — Crear turno */
  crear_turno: (body: CrearTurnoBody) =>
    pedir<Turno>(`/horarios/turnos`, { metodo: 'POST', body }),
  /** GET /horarios/turnos — Listar turnos */
  get_turnos: () =>
    pedir<Turno[]>(`/horarios/turnos`, { metodo: 'GET' }),
  /** DELETE /horarios/turnos/{id} — Eliminar turno */
  eliminar_turno: (id: number) =>
    pedir<void>(`/horarios/turnos/${id}`, { metodo: 'DELETE' }),
  /** GET /horarios/turnos/{id} — Obtener turno (con sus franjas) */
  get_turno: (id: number) =>
    pedir<Turno>(`/horarios/turnos/${id}`, { metodo: 'GET' }),
  /** POST /horarios/turnos/{id}/franjas-horarias — Asignar franja horaria al turno */
  asignar_franja_a_turno: (id: number, body: AsignarFranjaATurnoBody) =>
    pedir<Turno>(`/horarios/turnos/${id}/franjas-horarias`, { metodo: 'POST', body }),
  /** DELETE /horarios/turnos/{id}/franjas-horarias/{id_franja_horaria} — Quitar franja horaria del turno */
  eliminar_franja_horaria_turno: (id: number, idFranjaHoraria: number) =>
    pedir<Turno>(`/horarios/turnos/${id}/franjas-horarias/${idFranjaHoraria}`, { metodo: 'DELETE' }),
};
