// Generado por tools/generar_cliente_web.mjs a partir del /docs-json del servicio. No editar a mano.
import type { AsignarFranjaATurnoBody, CrearDiaLectivoBody, CrearFranjaHorariaBody, CrearTurnoBody, DiaLectivo, FranjaHoraria, Turno } from '@sahs/contratos';
import { pedir } from './http';

/** Servicio Horarios Service. */
export const horarios = {
  /** POST /horarios/crear_dia_lectivo — Crear día lectivo */
  crear_dia_lectivo: (body: CrearDiaLectivoBody) =>
    pedir<DiaLectivo>(`/horarios/crear_dia_lectivo`, { metodo: 'POST', body }),
  /** DELETE /horarios/eliminar_dia_lectivo/{id} — Eliminar día lectivo */
  eliminar_dia_lectivo: (id: number) =>
    pedir<void>(`/horarios/eliminar_dia_lectivo/${id}`, { metodo: 'DELETE' }),
  /** GET /horarios/get_dia_lectivo/{id} — Obtener día lectivo */
  get_dia_lectivo: (id: number) =>
    pedir<DiaLectivo>(`/horarios/get_dia_lectivo/${id}`, { metodo: 'GET' }),
  /** GET /horarios/get_dias_lectivos — Listar días lectivos */
  get_dias_lectivos: () =>
    pedir<DiaLectivo[]>(`/horarios/get_dias_lectivos`, { metodo: 'GET' }),
  /** GET /horarios/get_franja_horaria_dia_lectivo/{id} — Franjas horarias del día lectivo */
  get_franja_horaria_dia_lectivo: (id: number) =>
    pedir<FranjaHoraria[]>(`/horarios/get_franja_horaria_dia_lectivo/${id}`, { metodo: 'GET' }),
  /** POST /horarios/crear_franja_horaria — Crear franja horaria */
  crear_franja_horaria: (body: CrearFranjaHorariaBody) =>
    pedir<FranjaHoraria>(`/horarios/crear_franja_horaria`, { metodo: 'POST', body }),
  /** GET /horarios/get_franja_horaria/{id} — Obtener franja horaria */
  get_franja_horaria: (id: number) =>
    pedir<FranjaHoraria>(`/horarios/get_franja_horaria/${id}`, { metodo: 'GET' }),
  /** GET /horarios/get_franjas_horarias — Listar franjas horarias */
  get_franjas_horarias: () =>
    pedir<FranjaHoraria[]>(`/horarios/get_franjas_horarias`, { metodo: 'GET' }),
  /** POST /horarios/crear_turno — Crear turno */
  crear_turno: (body: CrearTurnoBody) =>
    pedir<Turno>(`/horarios/crear_turno`, { metodo: 'POST', body }),
  /** DELETE /horarios/eliminar_turno/{id} — Eliminar turno */
  eliminar_turno: (id: number) =>
    pedir<void>(`/horarios/eliminar_turno/${id}`, { metodo: 'DELETE' }),
  /** POST /horarios/asignar_franja_a_turno/{id} — Asignar franja horaria al turno */
  asignar_franja_a_turno: (id: number, body: AsignarFranjaATurnoBody) =>
    pedir<Turno>(`/horarios/asignar_franja_a_turno/${id}`, { metodo: 'POST', body }),
  /** DELETE /horarios/eliminar_franja_horaria_turno/{id}/{id_franja_horaria} — Quitar franja horaria del turno */
  eliminar_franja_horaria_turno: (id: number, idFranjaHoraria: number) =>
    pedir<Turno>(`/horarios/eliminar_franja_horaria_turno/${id}/${idFranjaHoraria}`, { metodo: 'DELETE' }),
  /** GET /horarios/get_turno/{id} — Obtener turno (con sus franjas) */
  get_turno: (id: number) =>
    pedir<Turno>(`/horarios/get_turno/${id}`, { metodo: 'GET' }),
  /** GET /horarios/get_turnos — Listar turnos */
  get_turnos: () =>
    pedir<Turno[]>(`/horarios/get_turnos`, { metodo: 'GET' }),
};
