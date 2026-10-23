import type { DiaLectivoEntidad, FranjaHorariaEntidad, TurnoEntidad } from '@sahs/entidades';
import type { DiaLectivo, FranjaHoraria, Turno } from './dto/modelos';

export const aDiaLectivo = (d: DiaLectivoEntidad): DiaLectivo => ({
  id_dia_lectivo: d.id_dia_lectivo,
  nombre_dia_lectivo: d.nombre_dia_lectivo,
});

export const aFranja = (f: FranjaHorariaEntidad): FranjaHoraria => ({
  id_franja_horaria: f.id_franja_horaria,
  hora_inicio: f.hora_inicio,
  hora_fin: f.hora_fin,
  descripcion: f.descripcion ?? undefined,
  es_recreo: !!f.es_recreo,
  id_dia_lectivo: f.id_dia_lectivo,
  dia_lectivo: f.dia_lectivo ? aDiaLectivo(f.dia_lectivo) : undefined,
});

/** Orden de las franjas: por día (lunes primero) y por hora de inicio. */
export const ordenFranjas = (a: FranjaHorariaEntidad, b: FranjaHorariaEntidad) =>
  (a.dia_lectivo?.orden ?? a.id_dia_lectivo) - (b.dia_lectivo?.orden ?? b.id_dia_lectivo) || a.hora_inicio.localeCompare(b.hora_inicio);

export const aTurno = (t: TurnoEntidad): Turno => ({
  id_turno: t.id_turno,
  nombre: t.nombre,
  cantidad_franjas_total: t.cantidad_franjas_total,
  franjas_horarias: [...(t.franjas_horarias ?? [])].sort(ordenFranjas).map(aFranja),
});

/** Relaciones para cargar una franja con su día. */
export const REL_FRANJA = { dia_lectivo: true } as const;
/** Relaciones para cargar un turno con sus franjas y sus días. */
export const REL_TURNO = { franjas_horarias: { dia_lectivo: true } } as const;
