// Piezas compartidas por A5 (Materias) y A6 (Ficha de la materia).
import type { AnioAcademico } from '@sahs/contratos';

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

/** Número de un nombre de año ("1° año" → 1). Si no tiene número, 0. */
export function numeroCurricular(anio_curricular: string): number {
  const n = parseInt(anio_curricular, 10);
  return isNaN(n) ? 0 : n;
}

/** Número del año académico ("1° año" → 1). Si no se conoce, 0. */
export function numeroAnio(id: number | null | undefined, anios: AnioAcademico[] | undefined): number {
  const a = anios?.find((x) => x.id_anio_academico === id);
  if (!a) return 0;
  const n = parseInt(a.anio_curricular, 10);
  return isNaN(n) ? 0 : n;
}
