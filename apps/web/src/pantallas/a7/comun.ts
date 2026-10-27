// Piezas compartidas por A7 (Profesores), A8 (Alta de profesor) y A9 (Ficha del profesor).
import type { FranjaHoraria, PlanDeEstudiosAnio, PlanDeEstudiosMateria, Profesor, Turno } from '@sahs/contratos';

export const ACCENT = '#2f5fd0';

/** Colores de cada área en el diseño (por nombre). Las áreas nuevas usan el gris de "Sin área". */
export const COLORES_AREA: Record<string, { fondo: string; texto: string }> = {
  Exactas: { fondo: '#eaf0fb', texto: '#1e3f80' },
  'Lengua y Literatura': { fondo: '#e8f5f2', texto: '#155e50' },
  Sociales: { fondo: '#f3edfa', texto: '#4a2f80' },
  Pastoral: { fondo: '#fdf4e7', texto: '#7a5310' },
  Artes: { fondo: '#fbedf2', texto: '#8a2e52' },
};
export const SIN_AREA = { fondo: '#f2f4f7', texto: '#4a5462' };
export const colorArea = (nombre: string | null | undefined) => (nombre && COLORES_AREA[nombre]) || SIN_AREA;

/**
 * Turno que muestra la disponibilidad de un profesor: el que tiene más franjas declaradas,
 * o Mañana (el primero, si no hay Mañana) cuando no declaró ninguna.
 */
export function turnoPrincipal(p: Profesor, turnos: Turno[] | undefined): Turno | null {
  if (!turnos?.length) return null;
  const marcadas = new Set((p.disponibilidad ?? []).map((f) => f.id_franja_horaria));
  let elegido: Turno | null = null;
  let max = 0;
  for (const t of turnos) {
    const n = (t.franjas_horarias ?? []).filter((f) => !f.es_recreo && marcadas.has(f.id_franja_horaria)).length;
    if (n > max) { max = n; elegido = t; }
  }
  return elegido ?? turnos.find((t) => t.nombre === 'Mañana') ?? turnos[0];
}

/** Filas de la grilla de un turno: una por horario de inicio (recreos incluidos), ordenadas. */
export function filasDelTurno(t: Turno | null): { hora_inicio: string; es_recreo: boolean; porDia: Map<string, FranjaHoraria> }[] {
  const filas = new Map<string, { hora_inicio: string; es_recreo: boolean; porDia: Map<string, FranjaHoraria> }>();
  for (const f of t?.franjas_horarias ?? []) {
    let fila = filas.get(f.hora_inicio);
    if (!fila) { fila = { hora_inicio: f.hora_inicio, es_recreo: f.es_recreo, porDia: new Map() }; filas.set(f.hora_inicio, fila); }
    fila.porDia.set(f.dia_lectivo?.nombre_dia_lectivo ?? '', f);
  }
  return [...filas.values()].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
}

/** Grupos del selector de materias habilitadas ("1° año · Básica"), en el orden en que los devuelve el plan de estudios. */
export function gruposDelPlan(plan: PlanDeEstudiosAnio[] | undefined) {
  return (plan ?? []).flatMap((pa) =>
    pa.orientaciones.map((po) => ({ nombre: pa.anio_curricular + ' · ' + po.nombre_orientacion, materias: po.materias })),
  );
}

/** Materias del plan de estudios por id, con el año y la orientación en que se dictan. */
export function materiasDelPlan(plan: PlanDeEstudiosAnio[] | undefined) {
  const porId = new Map<number, PlanDeEstudiosMateria & { anio_curricular: string; nombre_orientacion: string }>();
  for (const pa of plan ?? [])
    for (const po of pa.orientaciones)
      for (const m of po.materias) porId.set(m.id_materia, { ...m, anio_curricular: pa.anio_curricular, nombre_orientacion: po.nombre_orientacion });
  return porId;
}

/** Correo con formato válido (como en el prototipo). */
export const correoValido = (c: string) => c.indexOf('@') > 0 && c.lastIndexOf('.') > c.indexOf('@') + 1;
