// "Generar automáticamente" de A13: completa la planificación entera (todos los cursos del
// ciclo) a partir de lo que ya está ubicado. Es el generarTodo() del prototipo, sobre datos de
// la API: respeta lo ubicado a mano, la disponibilidad declarada (ids de franja), que el docente
// no esté en dos clases a la vez (por horario real, aunque sean turnos distintos) y el tope de
// 2 horas diarias por materia. Resuelve primero lo más apretado (menos franjas por hora
// pendiente). Si la clase ya tiene profesores, usa esa lista; si no, el habilitado con más margen.
import type { Clase } from '@sahs/contratos';
import { solapan, type Bloque, type Ocupacion } from './modelo';

export interface CursoGen {
  id: number;
  nombre: string;
  /** Horas cátedra del curso (sin recreos). */
  horas: Bloque[];
  plan: { mid: number; nombre: string; h: number; combos: number[][] }[];
}

export interface CambioGen {
  cid: number;
  mid: number;
  /** Franjas nuevas para la clase (además de las que ya tenía). */
  nuevas: number[];
  profes: number[];
}

export interface ResultadoGen {
  cambios: CambioGen[];
  ubicadas: number;
  sinUbicar: string[];
}

export function generarTodo(entrada: {
  cursos: CursoGen[];
  clases: Clase[];
  ocupaciones: Ocupacion[];
  disponible: (idProfesor: number, idFranja: number) => boolean;
  /** Cuántos docentes declararon la franja (las más escasas se ocupan antes). */
  escasez: (idFranja: number) => number;
}): ResultadoGen {
  const { cursos, clases, disponible, escasez } = entrada;
  const clave = (cid: number, mid: number) => cid + '|' + mid;

  // Grilla de cada curso (franja → materia) y profesores de cada clase.
  const g = new Map<number, Map<number, number>>();
  const cl = new Map<string, number[]>();
  for (const c of cursos) g.set(c.id, new Map());
  for (const c of clases) {
    const m = g.get(c.id_curso);
    if (!m) continue;
    for (const f of c.ids_franjas_horarias ?? []) m.set(f, c.id_materia);
    if ((c.ids_profesores ?? []).length) cl.set(clave(c.id_curso, c.id_materia), [...(c.ids_profesores ?? [])]);
  }
  // Horas ocupadas por cada docente en toda la propuesta.
  const ocupado = new Map<number, Bloque[]>();
  for (const o of entrada.ocupaciones) for (const p of o.profes) (ocupado.get(p) ?? ocupado.set(p, []).get(p)!).push(o.bloque);
  const estaOcupado = (p: number, b: Bloque) => (ocupado.get(p) ?? []).some((x) => solapan(x, b));

  const bloques = new Map<number, Bloque>();
  for (const c of cursos) for (const b of c.horas) bloques.set(b.id, b);

  // Horas de cada materia por curso y día, y en total (se actualizan al ubicar).
  const porDia = new Map<string, number>();
  const porMateria = new Map<string, number>();
  const sumar = (cid: number, mid: number, f: number) => {
    const d = bloques.get(f)?.d ?? -1;
    porDia.set(cid + '|' + mid + '|' + d, (porDia.get(cid + '|' + mid + '|' + d) ?? 0) + 1);
    porMateria.set(clave(cid, mid), (porMateria.get(clave(cid, mid)) ?? 0) + 1);
  };
  g.forEach((m, cid) => m.forEach((mid, f) => sumar(cid, mid, f)));
  const enDia = (cid: number, d: number, mid: number) => porDia.get(cid + '|' + mid + '|' + d) ?? 0;
  const puestasDe = (cid: number, mid: number) => porMateria.get(clave(cid, mid)) ?? 0;
  const puede = (cid: number, combo: number[], mid: number, b: Bloque) => {
    if (g.get(cid)!.has(b.id)) return false;
    if (enDia(cid, b.d, mid) >= 2) return false;
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
      if (faltan > 0) tareas.push({ curso: c, mid: m.mid, nombre: m.nombre, faltan, combos: m.combos, docs: cl.get(clave(c.id, m.mid)) ?? null });
    }
  }

  const cambios = new Map<string, CambioGen>();
  let ubicadas = 0;
  const sinUbicar: string[] = [];
  let vueltas = 0;
  while (tareas.length && vueltas < 3000) {
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
      sinUbicar.push(`${t.nombre} en ${t.curso.nombre} (${t.faltan} h)`);
      tareas.shift();
      continue;
    }
    const dias = [0, 1, 2, 3, 4].sort((a, b) => enDia(t.curso.id, a, t.mid) - enDia(t.curso.id, b, t.mid) || a - b);
    let puesto: Bloque | null = null;
    for (const d of dias) {
      const delDia = t.curso.horas
        .filter((b) => b.d === d)
        .sort((a, b) => escasez(a.id) - escasez(b.id) || a.ini - b.ini);
      puesto = delDia.find((b) => puede(t.curso.id, t.combo!, t.mid, b)) ?? null;
      if (puesto) break;
    }
    if (!puesto) {
      sinUbicar.push(`${t.nombre} en ${t.curso.nombre}`);
      tareas.shift();
      continue;
    }
    const k = clave(t.curso.id, t.mid);
    g.get(t.curso.id)!.set(puesto.id, t.mid);
    sumar(t.curso.id, t.mid, puesto.id);
    if (!cl.has(k)) cl.set(k, [...t.combo]);
    const profes = cl.get(k)!;
    for (const p of profes) (ocupado.get(p) ?? ocupado.set(p, []).get(p)!).push(puesto);
    const cambio = cambios.get(k) ?? cambios.set(k, { cid: t.curso.id, mid: t.mid, nuevas: [], profes }).get(k)!;
    cambio.nuevas.push(puesto.id);
    ubicadas++;
    t.faltan--;
    t.docs = profes;
    if (t.faltan === 0) tareas = tareas.filter((x) => x !== t);
  }
  return { cambios: [...cambios.values()], ubicadas, sinUbicar };
}
