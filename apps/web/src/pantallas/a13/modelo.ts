// Modelo compartido por A13 (armado de la planificación) y A3 (generación de la planilla):
// grilla de un curso a partir de las franjas de su turno, ocupación de los docentes,
// colores de las áreas y nombres que muestra el diseño.
import type { AnioAcademico, Clase, Curso, FranjaHorariaResumen, Profesor, Propuesta } from '@sahs/contratos';
import { planificacion } from '../../api';
import { DIAS } from '../../lib/formato';

export const ACCENT = '#2f5fd0';

/** Una franja del turno ubicada en la grilla: hora cátedra (hora = 1, 2, …) o recreo (hora = null). */
export interface Bloque {
  id: number;
  dia: string;
  /** Índice del día (0 = Lunes). */
  d: number;
  inicio: string;
  fin: string;
  ini: number;
  fn: number;
  es_recreo: boolean;
  hora: number | null;
}

export interface Grilla {
  /** Bloques de cada día (lunes a viernes), ordenados por hora. */
  dias: Bloque[][];
  /** Las columnas de la grilla: los bloques del día más largo (todos los días comparten el turno). */
  columnas: Bloque[];
  /** Solo las horas cátedra de cada día (sin recreos), indexadas por hora - 1. */
  horasPorDia: Bloque[][];
  /** Todas las horas cátedra de la semana. */
  horas: Bloque[];
  porId: Map<number, Bloque>;
}

export const aMin = (s: string | undefined) => {
  const p = String(s ?? '0:0').split(':');
  return Number(p[0]) * 60 + Number(p[1]);
};

/** Arma la grilla del curso con las franjas de su turno: agrupa por día y ordena por hora. */
export function armarGrilla(franjas: FranjaHorariaResumen[] | undefined): Grilla {
  const porId = new Map<number, Bloque>();
  const dias = DIAS.map((dia, d) => {
    let n = 0;
    return (franjas ?? [])
      .filter((f) => f.nombre_dia_lectivo === dia && f.id_franja_horaria != null)
      .sort((a, b) => aMin(a.hora_inicio) - aMin(b.hora_inicio))
      .map((f) => {
        const b: Bloque = {
          id: f.id_franja_horaria!,
          dia,
          d,
          inicio: f.hora_inicio ?? '',
          fin: f.hora_fin ?? '',
          ini: aMin(f.hora_inicio),
          fn: aMin(f.hora_fin),
          es_recreo: !!f.es_recreo,
          hora: f.es_recreo ? null : ++n,
        };
        porId.set(b.id, b);
        return b;
      });
  });
  const columnas = dias.reduce((m, x) => (x.length > m.length ? x : m), [] as Bloque[]);
  const horasPorDia = dias.map((x) => x.filter((b) => !b.es_recreo));
  return { dias, columnas, horasPorDia, horas: horasPorDia.flat(), porId };
}

/** Bloque de una franja de una clase (viene como FranjaHorariaResumen con el nombre del día). */
export function bloqueDeFranja(f: FranjaHorariaResumen): Bloque | null {
  const d = DIAS.indexOf(f.nombre_dia_lectivo ?? '');
  if (d < 0 || f.id_franja_horaria == null) return null;
  return {
    id: f.id_franja_horaria,
    dia: DIAS[d],
    d,
    inicio: f.hora_inicio ?? '',
    fin: f.hora_fin ?? '',
    ini: aMin(f.hora_inicio),
    fn: aMin(f.hora_fin),
    es_recreo: !!f.es_recreo,
    hora: null,
  };
}

/** Dos franjas se superponen si son del mismo día y sus horarios se pisan (aunque sean de turnos distintos). */
export const solapan = (a: { d: number; ini: number; fn: number }, b: { d: number; ini: number; fn: number }) =>
  a.d === b.d && a.ini < b.fn && b.ini < a.fn;

/** Una hora ocupada por una clase de la propuesta, con sus docentes. */
export interface Ocupacion {
  id_clase: number;
  id_curso: number;
  id_materia: number;
  bloque: Bloque;
  profes: number[];
}

export function ocupaciones(clases: Clase[]): Ocupacion[] {
  const out: Ocupacion[] = [];
  for (const c of clases) {
    for (const f of c.franjas_horarias ?? []) {
      const b = bloqueDeFranja(f);
      if (b) out.push({ id_clase: c.id_clase, id_curso: c.id_curso, id_materia: c.id_materia, bloque: b, profes: c.ids_profesores ?? [] });
    }
  }
  return out;
}

/** Dónde da clase el docente a esa hora (otra clase de la propuesta), o null si está libre. */
export function dondeOcupa(ocs: Ocupacion[], idProfesor: number, b: Bloque, excluirClase?: number): Ocupacion | null {
  for (const o of ocs) {
    if (o.id_clase === excluirClase) continue;
    if (o.profes.includes(idProfesor) && solapan(o.bloque, b)) return o;
  }
  return null;
}

// ---- nombres

/** Número del año del curso ("1° año" → 1). */
export function numeroAnio(c: Curso, anios: AnioAcademico[]): number {
  const a = anios.find((x) => x.id_anio_academico === c.id_anio_academico);
  return a ? parseInt(a.anio_curricular, 10) || 0 : 0;
}

/** "1° B" */
export const nombreCurso = (c: Curso, anios: AnioAcademico[]) => `${numeroAnio(c, anios)}° ${c.division}`;

/** Cursos ordenados por año y división. */
export const ordenarCursos = (cursos: Curso[], anios: AnioAcademico[]) =>
  [...cursos].sort((a, b) => numeroAnio(a, anios) - numeroAnio(b, anios) || a.division.localeCompare(b.division));

export const nombreProfesor = (p: { nombre?: string; apellido?: string } | undefined) => (p ? `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim() : '');

/** Las materias EPA (espacio de propuesta de área) se dictan de a dos: la clase lleva a todos sus docentes juntos. */
export const esDeADos = (nombreMateria: string) => /^EPA\b/i.test(nombreMateria.trim());

/** Profesores habilitados en la materia. */
export const habilitadosEn = (idMateria: number, profesores: Profesor[]) =>
  profesores.filter((p) => (p.lista_materias_habilitadas ?? []).some((m) => m.id_materia === idMateria));

/**
 * Combinaciones de docentes que pueden dictar la materia: una por cada habilitado, o una sola
 * con todos si la materia se dicta de a dos (EPA).
 */
export function combosDe(idMateria: number, nombreMateria: string, profesores: Profesor[]): number[][] {
  const ids = habilitadosEn(idMateria, profesores).map((p) => p.id_profesor);
  if (esDeADos(nombreMateria)) return ids.length ? [ids] : [];
  return ids.map((x) => [x]);
}

/** Código sugerido de la clase: PLAN-2026-02 + 1° B + Física → 2026-02-1B-FIS. */
export function codigoClase(codigoPropuesta: string, nombreDelCurso: string, nombreMateria: string): string {
  const letras = nombreMateria
    .normalize('NFD')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase();
  return `${codigoPropuesta.replace(/^PLAN-/i, '')}-${nombreDelCurso.replace(/\s+/g, '')}-${letras}`;
}

/** Siguiente código libre PLAN-<año>-NN entre todas las propuestas. */
export function siguienteCodigo(anio: number, propuestas: Propuesta[]): string {
  const re = new RegExp('^PLAN-' + anio + '-(\\d+)$');
  const max = propuestas.reduce((m, p) => {
    const r = re.exec(p.codigo);
    return r ? Math.max(m, Number(r[1])) : m;
  }, 0);
  return 'PLAN-' + anio + '-' + String(max + 1).padStart(2, '0');
}

/** Código de la clase copiada: "2026-01-1B-MAT" → "2026-03-1B-MAT" para PLAN-2026-03. */
export function codigoClaseCopia(viejo: string, nuevoPlan: string): string {
  const base = nuevoPlan.replace(/^PLAN-/, '');
  const p = viejo.split('-');
  return p.length > 2 && /^\d{4}$/.test(p[0]) ? base + '-' + p.slice(2).join('-') : base + '-' + viejo;
}

/**
 * Crea la clase y la agrega a la propuesta. Si la propuesta la rechaza (choque, 409),
 * borra la clase recién creada para no dejarla suelta y vuelve a lanzar el error.
 */
export async function crearClaseEnPropuesta(
  idPropuesta: number,
  datos: { codigo: string; descripcion: string; id_curso: number; id_materia: number; ids_franjas_horarias: number[]; ids_profesores: number[] },
): Promise<Clase> {
  const c = await planificacion.crear_clase(datos);
  try {
    await planificacion.asignar_clase_a_propuesta(idPropuesta, { id_clase: c.id_clase });
  } catch (e) {
    await planificacion.eliminar_clase(c.id_clase).catch(() => undefined);
    throw e;
  }
  return c;
}

// ---- áreas y colores (los del diseño)

export const AREAS: Record<string, { solido: string; punto: string }> = {
  Exactas: { solido: '#2a55ad', punto: '#3a6fd8' },
  'Lengua y Literatura': { solido: '#146b5a', punto: '#1f8f7a' },
  Sociales: { solido: '#5f3da0', punto: '#7a54c4' },
  Pastoral: { solido: '#8f5e1a', punto: '#c08430' },
  Artes: { solido: '#96375a', punto: '#c04f7a' },
  'Sin área': { solido: '#5b6471', punto: '#8b95a5' },
};

/** Nombre del área de la materia, o "Sin área". */
/** Área de una materia para los colores: la que viene anidada en el curso o en la clase. */
export function areaDe(nombreArea: string | null | undefined): string {
  return nombreArea && AREAS[nombreArea] ? nombreArea : 'Sin área';
}
