// Generación automática de la grilla de UN curso (A3). Es generarPlan() del prototipo sobre datos
// de la API. Ubica cada materia respetando: una sola clase por franja del curso, docente sin doble
// asignación (tampoco con las clases que ya tiene en otros cursos de la propuesta), máximo 2 horas
// diarias de la misma materia y —si se pide— la disponibilidad declarada. Las materias con menos
// margen van primero y, dentro del día, se ocupan antes las franjas que pocos docentes declararon.
// Al final, un pase de reparación intenta permutar clases ya ubicadas para acomodar lo que quedó afuera.
import type { Bloque } from '../a13/modelo';

export interface MateriaGen {
  id: number;
  n: string;
  area: string;
  /** Docentes de la clase (todos juntos si se dicta de a dos). Vacío: no tiene docente habilitado. */
  t: number[];
}

export interface CeldaGen {
  id: number;
  n: string;
  area: string;
  t: number[];
  /** Ubicada fuera de la disponibilidad declarada (solo si no se respeta). */
  forzada: boolean;
  bloque: Bloque;
}

export interface ResultadoA3 {
  /** grid[d][sl]: día d, hora cátedra sl (sin recreos). */
  grid: (CeldaGen | null)[][];
  /** Un nombre de materia por cada hora que no se pudo ubicar. */
  faltantes: string[];
}

export function generarPlan(p: {
  materias: MateriaGen[];
  horas: Record<number, number>;
  respetar: boolean;
  /** Horas cátedra de cada día (lunes a viernes), indexadas por hora - 1. */
  horasPorDia: Bloque[][];
  disponible: (idProfesor: number, idFranja: number) => boolean;
  /** Si el docente ya da clase a esa hora en otro curso de la propuesta. */
  ocupadoFuera: (idProfesor: number, b: Bloque) => boolean;
  /** Cuántos docentes declararon la franja. */
  escasez: (idFranja: number) => number;
}): ResultadoA3 {
  const { materias, horas, respetar, horasPorDia, disponible, ocupadoFuera } = p;
  const H = Math.max(0, ...horasPorDia.map((x) => x.length));
  const horasDia = Array.from({ length: H }, (_, i) => i);
  const DIAS5 = [0, 1, 2, 3, 4];
  const grid: (CeldaGen | null)[][] = DIAS5.map(() => horasDia.map(() => null));
  const busy = new Map<number, Set<string>>();
  const bloque = (d: number, sl: number): Bloque | undefined => horasPorDia[d]?.[sl];

  const dispo = (s: MateriaGen, d: number, sl: number) => {
    const b = bloque(d, sl);
    return !!b && s.t.every((tid) => disponible(tid, b.id));
  };
  const admite = (s: MateriaGen, d: number, sl: number) => !!bloque(d, sl) && (!respetar || dispo(s, d, sl));
  const docenteLibre = (s: MateriaGen, d: number, sl: number) => {
    const b = bloque(d, sl)!;
    return s.t.every((tid) => !busy.get(tid)?.has(d + '-' + sl) && !ocupadoFuera(tid, b));
  };
  const enDia = (d: number, id: number) => grid[d].filter((c) => c && c.id === id).length;
  // Con más horas que materias, se reparte la carga entre los días de la semana.
  const cargaDia = (d: number) => grid[d].filter((c) => !!c).length;
  const poner = (s: MateriaGen, d: number, sl: number) => {
    grid[d][sl] = { id: s.id, n: s.n, area: s.area, t: s.t, forzada: !dispo(s, d, sl), bloque: bloque(d, sl)! };
    for (const tid of s.t) (busy.get(tid) ?? busy.set(tid, new Set()).get(tid)!).add(d + '-' + sl);
  };
  const sacar = (d: number, sl: number) => {
    const c = grid[d][sl];
    if (!c) return null;
    for (const tid of c.t) busy.get(tid)?.delete(d + '-' + sl);
    grid[d][sl] = null;
    return c;
  };

  const escasez = DIAS5.map((d) => horasDia.map((sl) => (bloque(d, sl) ? p.escasez(bloque(d, sl)!.id) : 0)));

  const faltantes: string[] = [];
  const lista = materias
    .map((s) => {
      const pedidas = horas[s.id] ?? 0;
      let factibles = 0;
      for (const d of DIAS5) for (const sl of horasDia) if (admite(s, d, sl)) factibles++;
      return { ...s, h: pedidas, holgura: pedidas > 0 && s.t.length ? factibles / (pedidas * s.t.length) : 999 };
    })
    .filter((s) => {
      // Sin docente habilitado no se puede ubicar ninguna hora.
      if (s.h > 0 && !s.t.length) for (let k = 0; k < s.h; k++) faltantes.push(s.n);
      return s.h > 0 && s.t.length > 0;
    });
  lista.sort((a, b) => a.holgura - b.holgura || b.h - a.h);

  const pendientes: MateriaGen[] = [];
  for (const s of lista) {
    for (let k = 0; k < s.h; k++) {
      const dias = [...DIAS5].sort((a, b) => enDia(a, s.id) - enDia(b, s.id) || cargaDia(a) - cargaDia(b) || a - b);
      let puesto = false;
      for (const d of dias) {
        if (puesto) break;
        if (enDia(d, s.id) >= 2) continue;
        const slots = [...horasDia].sort((a, b) => escasez[d][a] - escasez[d][b] || a - b);
        for (const sl of slots) {
          if (grid[d][sl]) continue;
          if (!admite(s, d, sl) || !docenteLibre(s, d, sl)) continue;
          poner(s, d, sl);
          puesto = true;
          break;
        }
      }
      if (!puesto) pendientes.push(s);
    }
  }

  // Pase de reparación: mover una clase ya ubicada a una franja libre para hacerle lugar a la pendiente.
  for (const f of pendientes) {
    let resuelto = false;
    for (let d1 = 0; d1 < 5 && !resuelto; d1++) {
      for (let s1 = 0; s1 < H && !resuelto; s1++) {
        const ocupa = grid[d1][s1];
        if (!ocupa || ocupa.id === f.id) continue;
        if (!admite(f, d1, s1) || enDia(d1, f.id) >= 2) continue;
        const otra = materias.find((x) => x.id === ocupa.id);
        if (!otra) continue;
        for (let d2 = 0; d2 < 5 && !resuelto; d2++) {
          for (let s2 = 0; s2 < H && !resuelto; s2++) {
            if (grid[d2][s2] || !bloque(d2, s2)) continue;
            if (!admite(otra, d2, s2)) continue;
            sacar(d1, s1);
            if (!docenteLibre(f, d1, s1)) {
              poner(otra, d1, s1);
              continue;
            }
            poner(f, d1, s1);
            if (!docenteLibre(otra, d2, s2) || enDia(d2, otra.id) >= 2) {
              sacar(d1, s1);
              poner(otra, d1, s1);
              continue;
            }
            poner(otra, d2, s2);
            resuelto = true;
          }
        }
      }
    }
    if (!resuelto) faltantes.push(f.n);
  }

  return { grid, faltantes };
}
