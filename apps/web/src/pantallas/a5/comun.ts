// Piezas compartidas por A5 (Materias) y A6 (Ficha de la materia).
import type { AnioAcademico, Curso, Materia, Orientacion, Profesor } from '@sahs/contratos';

/** Colores de cada área en el diseño (por nombre). Las áreas nuevas usan el gris de "Sin área". */
export const COLORES_AREA: Record<string, { fondo: string; texto: string }> = {
  Exactas: { fondo: '#eaf0fb', texto: '#1e3f80' },
  'Lengua y Literatura': { fondo: '#e8f5f2', texto: '#155e50' },
  Sociales: { fondo: '#f3edfa', texto: '#4a2f80' },
  Pastoral: { fondo: '#fdf4e7', texto: '#7a5310' },
  Artes: { fondo: '#fbedf2', texto: '#8a2e52' },
};
export const SIN_AREA = { fondo: '#f2f4f7', texto: '#5b6471' };

export const colorArea = (nombre: string | null | undefined) => (nombre && COLORES_AREA[nombre]) || SIN_AREA;

/** Número del año académico ("1° año" → 1). Si no se conoce, 0. */
export function numeroAnio(id: number | null | undefined, anios: AnioAcademico[] | undefined): number {
  const a = anios?.find((x) => x.id_anio_academico === id);
  if (!a) return 0;
  const n = parseInt(a.anio_curricular, 10);
  return isNaN(n) ? 0 : n;
}

/** Nombre de un curso: "<n>° <división>". */
export function nombreCurso(c: Curso, anios: AnioAcademico[] | undefined): string {
  const n = numeroAnio(c.id_anio_academico, anios);
  return (n ? n + '° ' : '') + c.division;
}

/** Profesores habilitados para dictar una materia (según su lista de materias habilitadas). */
export function habilitadosEn(idMateria: number, profesores: Profesor[] | undefined): Profesor[] {
  return (profesores ?? []).filter((p) => (p.lista_materias_habilitadas ?? []).some((m) => m.id_materia === idMateria));
}

/**
 * Orientaciones que se pueden elegir para un año académico. La API no guarda qué años
 * tiene cada orientación, así que se deduce de los datos: los años de sus materias y de
 * sus cursos. Una orientación que todavía no tiene ni materias ni cursos se ofrece en todos los años.
 */
export function orientacionesParaAnio(
  idAnio: number,
  orientaciones: Orientacion[] | undefined,
  materias: Materia[] | undefined,
  cursos: Curso[] | undefined,
): Orientacion[] {
  const anios = new Map<number, Set<number>>();
  const anotar = (idOr: number, idA: number | null | undefined) => {
    if (idA == null) return;
    if (!anios.has(idOr)) anios.set(idOr, new Set());
    anios.get(idOr)!.add(idA);
  };
  (materias ?? []).forEach((m) => anotar(m.id_orientacion, m.id_anio_academico));
  (cursos ?? []).forEach((c) => anotar(c.id_orientacion, c.id_anio_academico));
  return (orientaciones ?? []).filter((o) => {
    const s = anios.get(o.id_orientacion);
    return !s || s.has(idAnio);
  });
}
