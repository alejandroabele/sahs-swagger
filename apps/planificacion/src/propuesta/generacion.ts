// Generación automática de la planilla (generar_planilla). Es un cálculo puro: recibe los
// cursos, las clases ya guardadas en la propuesta y los profesores, y devuelve qué franjas
// agregar a cada clase (curso + materia). El guardado lo hace PropuestaService con
// crear_clase / asignar_clase_a_propuesta / editar_clase, así corren las reglas de siempre.
//
// Reglas (las del generarTodo() del prototipo):
// - Respeta lo que ya está ubicado: solo completa las horas que le faltan a cada materia.
// - Una sola clase por franja del curso, y solo horas cátedra del turno (los recreos no).
// - Cada docente solo en franjas que declaró disponibles (por id de franja).
// - Un docente no puede estar en dos clases a la vez: se compara el horario real (día, inicio
//   y fin), aunque las franjas sean de turnos distintos, contra todas las clases de la propuesta.
// - Ninguna materia pasa sus horas semanales en el curso. No hay tope de horas diarias.
// - Si la clase ya tiene docentes, usa esos; si no, el habilitado activo con más franjas posibles.
//   Las materias EPA (nombre que empieza con "EPA") se dictan de a dos: van con todos sus
//   habilitados juntos.
// - Resuelve primero lo más apretado (menos franjas posibles por hora pendiente) y, dentro de
//   cada día, ocupa antes las franjas que menos docentes declararon. Reparte entre los días
//   empezando por los que tienen menos horas de la materia.
import type * as C from '@sahs/contratos';

export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

/** Una hora cátedra en el tiempo: día (0 = Lunes) e inicio/fin en minutos. */
export interface Bloque {
  id: number;
  d: number;
  ini: number;
  fn: number;
}

const aMin = (s: string | undefined) => {
  const p = String(s ?? '0:0').split(':');
  return Number(p[0]) * 60 + Number(p[1]);
};

/** Bloque de una franja (con el nombre del día), o null si no es de lunes a viernes. */
export function bloqueDeFranja(f: C.FranjaHorariaResumen): Bloque | null {
  const d = DIAS.indexOf(f.nombre_dia_lectivo ?? '');
  if (d < 0 || f.id_franja_horaria == null) return null;
  return { id: f.id_franja_horaria, d, ini: aMin(f.hora_inicio), fn: aMin(f.hora_fin) };
}

/** Horas cátedra del turno del curso (sin recreos), ordenadas por día y hora. */
export function horasDelTurno(franjas: C.FranjaHorariaResumen[] | undefined): Bloque[] {
  return (franjas ?? [])
    .filter((f) => !f.es_recreo)
    .map(bloqueDeFranja)
    .filter((b): b is Bloque => !!b)
    .sort((a, b) => a.d - b.d || a.ini - b.ini);
}

/** Dos franjas se superponen si son del mismo día y sus horarios se pisan (aunque sean de turnos distintos). */
export const solapan = (a: Bloque, b: Bloque) => a.d === b.d && a.ini < b.fn && b.ini < a.fn;

/** Las materias EPA (espacio de propuesta de área) se dictan de a dos. */
export const esDeADos = (nombreMateria: string) => /^EPA\b/i.test(nombreMateria.trim());

/** Ids de los profesores habilitados en la materia. */
export const habilitadosEn = (idMateria: number, profesores: C.Profesor[]) =>
  profesores.filter((p) => (p.lista_materias_habilitadas ?? []).some((m) => m.id_materia === idMateria)).map((p) => p.id_profesor);

/** Combinaciones de docentes posibles: una por habilitado, o una con todos si es de a dos (EPA). */
export function combosDe(idMateria: number, nombreMateria: string, profesores: C.Profesor[]): number[][] {
  const ids = habilitadosEn(idMateria, profesores);
  if (esDeADos(nombreMateria)) return ids.length ? [ids] : [];
  return ids.map((x) => [x]);
}

/** Código de la clase: PLAN-2026-02 + 1° B + Física → 2026-02-1B-FIS. */
export function codigoClase(codigoPropuesta: string, nombreDelCurso: string, nombreMateria: string): string {
  const letras = nombreMateria
    .normalize('NFD')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase();
  return `${codigoPropuesta.replace(/^PLAN-/i, '')}-${nombreDelCurso.replace(/\s+/g, '')}-${letras}`;
}

export interface CursoGen {
  id: number;
  nombre: string;
  /** Horas cátedra del turno del curso. */
  horas: Bloque[];
  plan: { mid: number; nombre: string; h: number }[];
}

/** Clase ya guardada en la propuesta (de cualquier curso: sirve para los choques de docentes). */
export interface ClaseGen {
  id_curso: number;
  id_materia: number;
  bloques: Bloque[];
  profes: number[];
}

export interface CambioGen {
  cid: number;
  mid: number;
  /** Franjas nuevas para la clase (además de las que ya tenía). */
  nuevas: number[];
  profes: number[];
}

export interface PendienteGen {
  cid: number;
  mid: number;
  curso: string;
  materia: string;
  horas: number;
}

export interface ResultadoGen {
  cambios: CambioGen[];
  ubicadas: number;
  sinUbicar: PendienteGen[];
}

export function generar(entrada: { cursos: CursoGen[]; clases: ClaseGen[]; profesores: C.Profesor[] }): ResultadoGen {
  const { cursos, clases, profesores } = entrada;
  const clave = (cid: number, mid: number) => cid + '|' + mid;

  const libres = new Map(profesores.map((p) => [p.id_profesor, new Set((p.disponibilidad ?? []).map((f) => f.id_franja_horaria))]));
  const disponible = (idp: number, idf: number) => !!libres.get(idp)?.has(idf);
  const escasezPorFranja = new Map<number, number>();
  const escasez = (idf: number) => {
    let n = escasezPorFranja.get(idf);
    if (n === undefined) {
      n = profesores.filter((p) => disponible(p.id_profesor, idf)).length;
      escasezPorFranja.set(idf, n);
    }
    return n;
  };

  // Grilla de cada curso (franja → materia) y profesores de cada clase.
  const g = new Map<number, Map<number, number>>();
  const cl = new Map<string, number[]>();
  for (const c of cursos) g.set(c.id, new Map());
  for (const c of clases) {
    const m = g.get(c.id_curso);
    if (!m) continue;
    for (const b of c.bloques) m.set(b.id, c.id_materia);
    // Si hay más de una clase de la misma materia en el curso, manda la primera.
    const k = clave(c.id_curso, c.id_materia);
    if (c.profes.length && !cl.has(k)) cl.set(k, [...c.profes]);
  }
  // Horas ocupadas por cada docente en toda la propuesta.
  const ocupado = new Map<number, Bloque[]>();
  const ocupar = (p: number, b: Bloque) => (ocupado.get(p) ?? ocupado.set(p, []).get(p)!).push(b);
  for (const c of clases) for (const b of c.bloques) for (const p of c.profes) ocupar(p, b);
  const estaOcupado = (p: number, b: Bloque) => (ocupado.get(p) ?? []).some((x) => solapan(x, b));

  const bloques = new Map<number, Bloque>();
  for (const c of cursos) for (const b of c.horas) bloques.set(b.id, b);
  for (const c of clases) for (const b of c.bloques) if (!bloques.has(b.id)) bloques.set(b.id, b);

  // Horas de cada materia por curso y día, y en total (se actualizan al ubicar). Por día solo
  // sirve para repartir: se prueba primero el día con menos horas de la materia, sin tope.
  const porDia = new Map<string, number>();
  const porMateria = new Map<string, number>();
  const sumar = (cid: number, mid: number, f: number) => {
    const k = cid + '|' + mid + '|' + (bloques.get(f)?.d ?? -1);
    porDia.set(k, (porDia.get(k) ?? 0) + 1);
    porMateria.set(clave(cid, mid), (porMateria.get(clave(cid, mid)) ?? 0) + 1);
  };
  g.forEach((m, cid) => m.forEach((mid, f) => sumar(cid, mid, f)));
  const enDia = (cid: number, d: number, mid: number) => porDia.get(cid + '|' + mid + '|' + d) ?? 0;
  const puestasDe = (cid: number, mid: number) => porMateria.get(clave(cid, mid)) ?? 0;
  const puede = (cid: number, combo: number[], mid: number, b: Bloque) => {
    if (g.get(cid)!.has(b.id)) return false;
    if (combo.some((t) => !disponible(t, b.id))) return false;
    if (combo.some((t) => estaOcupado(t, b))) return false;
    return true;
  };
  const cuenta = (c: CursoGen, combo: number[], mid: number) => c.horas.filter((b) => puede(c.id, combo, mid, b)).length;

  interface Tarea {
    curso: CursoGen;
    mid: number;
    nombre: string;
    faltan: number;
    combos: number[][];
    docs: number[] | null;
    combo?: number[] | null;
    opciones?: number;
    holgura?: number;
  }
  let tareas: Tarea[] = [];
  for (const c of cursos) {
    for (const m of c.plan) {
      const faltan = m.h - puestasDe(c.id, m.mid);
      if (faltan > 0) {
        tareas.push({ curso: c, mid: m.mid, nombre: m.nombre, faltan, combos: combosDe(m.mid, m.nombre, profesores), docs: cl.get(clave(c.id, m.mid)) ?? null });
      }
    }
  }

  const cambios = new Map<string, CambioGen>();
  let ubicadas = 0;
  const sinUbicar: PendienteGen[] = [];
  const descartar = (t: Tarea) => {
    sinUbicar.push({ cid: t.curso.id, mid: t.mid, curso: t.curso.nombre, materia: t.nombre, horas: t.faltan });
    tareas = tareas.filter((x) => x !== t);
  };
  let vueltas = 0;
  while (tareas.length && vueltas < 5000) {
    vueltas++;
    for (const t of tareas) {
      const combos = t.docs ? [t.docs] : t.combos;
      let mejor: number[] | null = null;
      let mejorN = -1;
      for (const c of combos) {
        const n = cuenta(t.curso, c, t.mid);
        if (n > mejorN) {
          mejorN = n;
          mejor = c;
        }
      }
      t.combo = mejor;
      t.opciones = mejorN < 0 ? 0 : mejorN;
      t.holgura = t.opciones / t.faltan;
    }
    tareas.sort((a, b) => a.holgura! - b.holgura! || b.faltan - a.faltan);

    const t = tareas[0];
    if (!t.combo || t.opciones === 0) {
      descartar(t);
      continue;
    }
    const dias = [0, 1, 2, 3, 4].sort((a, b) => enDia(t.curso.id, a, t.mid) - enDia(t.curso.id, b, t.mid) || a - b);
    let puesto: Bloque | null = null;
    for (const d of dias) {
      const delDia = t.curso.horas.filter((b) => b.d === d).sort((a, b) => escasez(a.id) - escasez(b.id) || a.ini - b.ini);
      puesto = delDia.find((b) => puede(t.curso.id, t.combo!, t.mid, b)) ?? null;
      if (puesto) break;
    }
    if (!puesto) {
      descartar(t);
      continue;
    }
    const k = clave(t.curso.id, t.mid);
    g.get(t.curso.id)!.set(puesto.id, t.mid);
    sumar(t.curso.id, t.mid, puesto.id);
    if (!cl.has(k)) cl.set(k, [...t.combo]);
    const profes = cl.get(k)!;
    for (const p of profes) ocupar(p, puesto);
    const cambio = cambios.get(k) ?? cambios.set(k, { cid: t.curso.id, mid: t.mid, nuevas: [], profes }).get(k)!;
    cambio.nuevas.push(puesto.id);
    ubicadas++;
    t.faltan--;
    t.docs = profes;
    if (t.faltan === 0) tareas = tareas.filter((x) => x !== t);
  }
  for (const t of tareas) sinUbicar.push({ cid: t.curso.id, mid: t.mid, curso: t.curso.nombre, materia: t.nombre, horas: t.faltan });
  return { cambios: [...cambios.values()], ubicadas, sinUbicar };
}
