// Piezas compartidas por A7 (Profesores), A8 (Alta de profesor) y A9 (Ficha del profesor).
import type { AnioAcademico, Curso, FranjaHoraria, Materia, Profesor, Propuesta, Turno } from '@sahs/contratos';

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
 * Área de un profesor: la que más se repite entre sus materias habilitadas
 * (cada materia del catálogo tiene su área). null si no tiene materias con área.
 */
export function areaDeProfesor(p: Profesor, materias: Map<number, Materia>): string | null {
  const cuenta = new Map<string, number>();
  for (const m of p.lista_materias_habilitadas ?? []) {
    const nombre = materias.get(m.id_materia ?? -1)?.area?.nombre_area;
    if (nombre) cuenta.set(nombre, (cuenta.get(nombre) ?? 0) + 1);
  }
  let mejor: string | null = null;
  let max = 0;
  for (const [nombre, n] of cuenta) if (n > max) { max = n; mejor = nombre; }
  return mejor;
}

/** Franjas declaradas que no son recreo. */
export const franjasDeclaradas = (p: Profesor) => (p.disponibilidad ?? []).filter((f) => !f.es_recreo).length;

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

/** Horas cátedra (no recreos) de un turno. */
export const horasDelTurno = (t: Turno | null) => (t ? (t.franjas_horarias ?? []).filter((f) => !f.es_recreo).length : 0);

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

/** Propuesta vigente de un ciclo: la Validada. */
export const propuestaVigente = (ps: Propuesta[] | undefined) => ps?.find((p) => p.estado?.codigo === 'VAL') ?? null;

/** Número del año académico ("1° año" → 1). Si no se conoce, 0. */
export function numeroAnio(id: number | null | undefined, anios: AnioAcademico[] | undefined): number {
  const a = anios?.find((x) => x.id_anio_academico === id);
  const n = a ? parseInt(a.anio_curricular, 10) : NaN;
  return isNaN(n) ? 0 : n;
}

/** Nombre de un curso: "<n>° <división>". */
export function nombreCurso(c: Curso | undefined, anios: AnioAcademico[] | undefined): string {
  if (!c) return '—';
  const n = numeroAnio(c.id_anio_academico, anios);
  return (n ? n + '° ' : '') + c.division;
}

/** Materias del catálogo agrupadas por año y orientación ("1° año · Básica"), en orden. */
export function gruposDeMaterias(materias: Materia[] | undefined, anios: AnioAcademico[] | undefined) {
  const grupos = new Map<string, { nombre: string; anio: number; orientacion: string; materias: Materia[] }>();
  for (const m of materias ?? []) {
    const anio = numeroAnio(m.id_anio_academico, anios);
    const orientacion = m.orientacion?.nombre_orientacion ?? '';
    const clave = anio + '|' + orientacion;
    let g = grupos.get(clave);
    if (!g) { g = { nombre: (anio ? anio + '° año' : 'Sin año') + (orientacion ? ' · ' + orientacion : ''), anio, orientacion, materias: [] }; grupos.set(clave, g); }
    g.materias.push(m);
  }
  const lista = [...grupos.values()].sort((a, b) => a.anio - b.anio || a.orientacion.localeCompare(b.orientacion));
  for (const g of lista) g.materias.sort((a, b) => a.nombre_materia.localeCompare(b.nombre_materia));
  return lista;
}

/** Correo con formato válido (como en el prototipo). */
export const correoValido = (c: string) => c.indexOf('@') > 0 && c.lastIndexOf('.') > c.indexOf('@') + 1;
