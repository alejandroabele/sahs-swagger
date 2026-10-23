// A13 · Armado de la planificación. Prototipo: <template id="tpl-planificacionmanual"> y
// DC.registrar("planificacionmanual") en prototipo/index.html.
// URL: ?id_propuesta= (por defecto, la propuesta en Borrador del ciclo activo) y opcional &id_curso=.
// Cada clase (curso + materia) tiene los mismos docentes en todas sus franjas. Cada cambio en la
// grilla se guarda en el momento en la API (crear_clase + asignar_clase_a_propuesta, editar_clase,
// eliminar_clase); si la API lo rechaza (409), se muestra el mensaje y la grilla no cambia.
import { useEffect, useMemo, useState } from 'react';
import type { Clase, Curso, Profesor } from '@sahs/contratos';
import { orientacion, planificacion, profesorSuplencias } from '../api';
import { mensajeDeError } from '../api/http';
import { useNavegar, useParamNumero } from '../app/navegar';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useAccion, useConsulta } from '../estado/consultas';
import { css } from '../lib/css';
import { DIAS } from '../lib/formato';
import { generarTodo, type CursoGen } from './a13/generar';
import { Grilla, type CeldaVista } from './a13/Grilla';
import {
  ACCENT,
  AREAS,
  areaDe,
  armarGrilla,
  codigoClase,
  combosDe,
  crearClaseEnPropuesta,
  dondeOcupa,
  esDeADos,
  habilitadosEn,
  nombreCurso,
  nombreProfesor,
  numeroAnio,
  ocupaciones,
  ordenarCursos,
  type Bloque,
} from './a13/modelo';
import { PanelDerecho, type CeldaInfo, type OtroCurso, type SelInfo } from './a13/PanelDerecho';
import { PanelMaterias, type OpcionMateria } from './a13/PanelMaterias';

const ALTO = 62;

const COLOR_ESTADO: Record<string, { punto: string; chip: string; texto: string; label: string }> = {
  BOR: { punto: '#c08430', chip: '#fdf6ec', texto: '#a56a10', label: 'Borrador' },
  REV: { punto: '#3a6fd8', chip: '#eef3fc', texto: '#1e4099', label: 'En revisión' },
  VAL: { punto: '#2f6b45', chip: '#e9f2ec', texto: '#2f6b45', label: 'Validada' },
  CER: { punto: '#8b95a5', chip: '#f2f4f7', texto: '#5b6471', label: 'Cerrada' },
};

/** Transiciones que acepta la API (asignar_estado_a_propuesta). */
const TRANSICIONES: Record<string, string[]> = { BOR: ['REV'], REV: ['VAL', 'BOR'], VAL: [], CER: [] };

interface Sel {
  mid: number;
  docs: number[];
}
interface Aviso {
  texto: string;
  tipo: 'auto' | 'info';
}
/** Lo necesario para deshacer una generación automática. */
interface Previas {
  creadas: number[];
  editadas: { id: number; franjas: number[]; profes: number[] }[];
}

export default function A13PlanificacionManual() {
  const ir = useNavegar();
  const ciclo = useCiclo();
  const idPropParam = useParamNumero('id_propuesta');
  const idCursoParam = useParamNumero('id_curso');

  // ---- datos
  const qPropuestas = useConsulta(
    ['planificacion', 'get_propuestas', ciclo.activo?.id_ciclo_lectivo],
    () => planificacion.get_propuestas({ id_ciclo_lectivo: ciclo.activo!.id_ciclo_lectivo }),
    { enabled: !idPropParam && !!ciclo.activo },
  );
  const qPropuesta = useConsulta(['planificacion', 'get_propuesta', idPropParam], () => planificacion.get_propuesta(idPropParam!), {
    enabled: !!idPropParam,
  });
  const propuesta = idPropParam
    ? qPropuesta.data
    : (qPropuestas.data ?? []).find((p) => p.estado?.codigo === 'BOR') ?? (qPropuestas.data ?? [])[0];
  const idCiclo = propuesta?.id_ciclo_lectivo;
  const idProp = propuesta?.id_propuesta;

  const qCursos = useConsulta(['planificacion', 'get_cursos', idCiclo], () => planificacion.get_cursos({ id_ciclo_lectivo: idCiclo! }), {
    enabled: !!idCiclo,
  });
  const qClases = useConsulta(['planificacion', 'get_clases', { id_propuesta: idProp }], () => planificacion.get_clases({ id_propuesta: idProp! }), {
    enabled: !!idProp,
  });
  const qAnios = useConsulta(['planificacion', 'get_anios_academicos'], () => planificacion.get_anios_academicos());
  const qEstados = useConsulta(['planificacion', 'get_posibles_estados_de_propuestas'], () => planificacion.get_posibles_estados_de_propuestas());
  const qProfes = useConsulta(['profesor_suplencias', 'get_profesores'], () => profesorSuplencias.get_profesores());
  const qMaterias = useConsulta(['orientacion', 'get_materias'], () => orientacion.get_materias());

  const acc = useAccion((fn: () => Promise<unknown>) => fn(), ['planificacion']);

  // ---- estado de la pantalla
  const [sel, setSel] = useState<Sel | null>(null);
  const [celda, setCelda] = useState<number | null>(null); // id de franja tocada
  const [vaciando, setVaciando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [previas, setPrevias] = useState<Previas | null>(null);

  const anios = qAnios.data ?? [];
  const cursos = useMemo(() => ordenarCursos(qCursos.data ?? [], anios), [qCursos.data, anios]);
  const clases = qClases.data ?? [];
  const profesores = qProfes.data ?? [];
  const materias = qMaterias.data ?? [];

  const idCursoDefecto = (() => {
    if (idCursoParam && cursos.some((c) => c.id_curso === idCursoParam)) return idCursoParam;
    const conClases = cursos.find((c) => clases.some((x) => x.id_curso === c.id_curso));
    return (conClases ?? cursos[0])?.id_curso ?? null;
  })();
  const curso = cursos.find((c) => c.id_curso === idCursoDefecto) ?? null;

  useEffect(() => {
    setSel(null);
    setCelda(null);
    setVaciando(false);
    setAviso(null);
  }, [idCursoDefecto, idProp]);

  const ocs = useMemo(() => ocupaciones(clases), [clases]);
  const profPorId = useMemo(() => new Map(profesores.map((p) => [p.id_profesor, p])), [profesores]);
  const dispPorProf = useMemo(
    () => new Map(profesores.map((p) => [p.id_profesor, new Set((p.disponibilidad ?? []).map((f) => f.id_franja_horaria))])),
    [profesores],
  );
  const disponible = (pid: number, fid: number) => !!dispPorProf.get(pid)?.has(fid);
  const grillas = useMemo(() => new Map(cursos.map((c) => [c.id_curso, armarGrilla(c.franjas_horarias)])), [cursos]);

  const cargando =
    (idPropParam ? qPropuesta.isLoading : qPropuestas.isLoading || !ciclo.activo) ||
    qCursos.isLoading ||
    qClases.isLoading ||
    qAnios.isLoading ||
    qProfes.isLoading ||
    qMaterias.isLoading;

  const errorCarga = qPropuesta.error ?? qPropuestas.error ?? qCursos.error ?? qClases.error ?? qProfes.error ?? qMaterias.error;

  if (!propuesta || !curso) {
    return (
      <div style={css('width: 1560px; min-height: 1000px; display: flex; flex-direction: column; background: #f4f6f8;')}>
        <Cabecera />
        {cargando ? (
          <Cargando />
        ) : (
          <div style={css('padding: 26px 28px;')}>
            <MensajeError
              mensaje={
                errorCarga
                  ? mensajeDeError(errorCarga)
                  : !propuesta
                    ? 'No hay ninguna planificación en el ciclo lectivo elegido. Creala desde Planificaciones.'
                    : 'El ciclo lectivo de esta planificación no tiene cursos.'
              }
            />
          </div>
        )}
      </div>
    );
  }

  // ======== cálculo de la vista (como renderVals() del prototipo) ========
  const codigoEstado = propuesta.estado?.codigo ?? 'BOR';
  const editable = codigoEstado === 'BOR';
  const ocupado = acc.enCurso;
  const grilla = grillas.get(curso.id_curso)!;
  const nombreDe = (c: Curso) => nombreCurso(c, anios);
  const nombreCursoActual = nombreDe(curso);
  const anioCurso = numeroAnio(curso, anios);
  const plan = curso.materias ?? [];
  const nombreMateria = (mid: number) =>
    plan.find((m) => m.id_materia === mid)?.nombre_materia ?? materias.find((m) => m.id_materia === mid)?.nombre_materia ?? 'Materia';
  const horasMateria = (mid: number) => plan.find((m) => m.id_materia === mid)?.horas_semanales ?? 0;
  const color = (mid: number) => AREAS[areaDe(mid, materias)];
  const nombresDocs = (ids: number[]) => ids.map((id) => nombreProfesor(profPorId.get(id)) || 'Profesor ' + id).join(' + ');
  const cursoPorId = new Map(cursos.map((c) => [c.id_curso, c]));

  const clasesCurso = clases.filter((c) => c.id_curso === curso.id_curso);
  const clasePorMateria = new Map<number, Clase>();
  const clasePorFranja = new Map<number, Clase>();
  for (const c of clasesCurso) {
    if (!clasePorMateria.has(c.id_materia)) clasePorMateria.set(c.id_materia, c);
    for (const f of c.ids_franjas_horarias ?? []) clasePorFranja.set(f, c);
  }
  const horasPuestas = (mid: number) => (clasePorMateria.get(mid)?.ids_franjas_horarias ?? []).length;

  // Totales por curso (la planificación se valida entera, con todos los cursos).
  const avance = (c: Curso) => {
    const puestas = clases.filter((x) => x.id_curso === c.id_curso).reduce((n, x) => n + (x.ids_franjas_horarias ?? []).length, 0);
    const total = (c.materias ?? []).reduce((n, m) => n + m.horas_semanales, 0);
    return { puestas, total, listo: puestas >= total };
  };
  let globalPuestas = 0;
  let globalTotal = 0;
  const faltantes: string[] = [];
  for (const c of cursos) {
    const a = avance(c);
    globalPuestas += Math.min(a.puestas, a.total);
    globalTotal += a.total;
    if (!a.listo) faltantes.push(`${nombreDe(c)} (${a.total - a.puestas} h)`);
  }
  const planCompleta = globalPuestas >= globalTotal;
  const { puestas: ubicadas, total: totalPlan } = avance(curso);
  const completo = ubicadas >= totalPlan && totalPlan > 0;

  // ---- persistencia
  const ejecutar = async (fn: () => Promise<unknown>) => {
    setAviso(null);
    setVaciando(false);
    return acc.ejecutar(fn);
  };
  const descripcion = (mid: number) => `${nombreMateria(mid)} · ${nombreCursoActual}`;

  /** Ubica una hora de la materia elegida en la franja. */
  const ubicar = async (b: Bloque) => {
    if (!sel) return;
    const existente = clasePorMateria.get(sel.mid);
    const ok = await ejecutar(() =>
      existente
        ? planificacion.editar_clase(existente.id_clase, {
            ids_franjas_horarias: [...(existente.ids_franjas_horarias ?? []), b.id],
            ids_profesores: existente.ids_profesores ?? [],
          })
        : crearClaseEnPropuesta(propuesta.id_propuesta, {
            codigo: codigoClase(propuesta.codigo, nombreCursoActual, nombreMateria(sel.mid)),
            descripcion: descripcion(sel.mid),
            id_curso: curso.id_curso,
            id_materia: sel.mid,
            ids_franjas_horarias: [b.id],
            ids_profesores: sel.docs,
          }),
    );
    if (ok !== undefined && horasPuestas(sel.mid) + 1 >= horasMateria(sel.mid)) setSel(null);
  };

  /** Cambia los profesores de toda la clase (vale para todas sus horas). */
  const cambiarDocentes = (c: Clase, docs: number[]) =>
    ejecutar(() => planificacion.editar_clase(c.id_clase, { ids_franjas_horarias: c.ids_franjas_horarias ?? [], ids_profesores: docs }));

  /** Saca una hora: si era la última de la clase, se elimina la clase. */
  const sacarHora = async (c: Clase, fid: number) => {
    const resto = (c.ids_franjas_horarias ?? []).filter((x) => x !== fid);
    const ok = await ejecutar(() =>
      resto.length
        ? planificacion.editar_clase(c.id_clase, { ids_franjas_horarias: resto, ids_profesores: c.ids_profesores ?? [] })
        : planificacion.eliminar_clase(c.id_clase).then(() => true),
    );
    if (ok !== undefined) setCelda(null);
  };

  const vaciarCurso = async () => {
    const ok = await ejecutar(async () => {
      for (const c of clasesCurso) await planificacion.eliminar_clase(c.id_clase);
      return true;
    });
    if (ok !== undefined) {
      setSel(null);
      setCelda(null);
    }
  };

  const cambiarEstado = async (codigo: string, mensaje?: string) => {
    const e = (qEstados.data ?? []).find((x) => x.codigo === codigo);
    if (!e) return;
    const ok = await ejecutar(() => planificacion.asignar_estado_a_propuesta(propuesta.id_propuesta, { id_estado: e.id_estado }));
    if (ok !== undefined) {
      setSel(null);
      setCelda(null);
      if (mensaje) setAviso({ texto: mensaje, tipo: 'info' });
    }
  };

  const generarAutomatico = async () => {
    const escasezPorFranja = new Map<number, number>();
    const escasez = (fid: number) => {
      let n = escasezPorFranja.get(fid);
      if (n === undefined) {
        n = profesores.filter((p) => disponible(p.id_profesor, fid)).length;
        escasezPorFranja.set(fid, n);
      }
      return n;
    };
    const cursosGen: CursoGen[] = cursos.map((c) => ({
      id: c.id_curso,
      nombre: nombreDe(c),
      horas: grillas.get(c.id_curso)!.horas,
      plan: (c.materias ?? []).map((m) => ({ mid: m.id_materia, nombre: m.nombre_materia, h: m.horas_semanales, combos: combosDe(m.id_materia, m.nombre_materia, profesores) })),
    }));
    const r = generarTodo({ cursos: cursosGen, clases, ocupaciones: ocs, disponible, escasez });
    const hechas: Previas = { creadas: [], editadas: [] };
    const errores: string[] = [];
    let guardadas = 0;
    const res = await acc.ejecutar(async () => {
      for (const ch of r.cambios) {
        const c = cursoPorId.get(ch.cid)!;
        const existente = clases.find((x) => x.id_curso === ch.cid && x.id_materia === ch.mid);
        const nom = c.materias?.find((m) => m.id_materia === ch.mid)?.nombre_materia ?? 'Materia';
        try {
          if (existente) {
            await planificacion.editar_clase(existente.id_clase, {
              ids_franjas_horarias: [...(existente.ids_franjas_horarias ?? []), ...ch.nuevas],
              ids_profesores: existente.ids_profesores ?? [],
            });
            hechas.editadas.push({ id: existente.id_clase, franjas: existente.ids_franjas_horarias ?? [], profes: existente.ids_profesores ?? [] });
          } else {
            const nueva = await crearClaseEnPropuesta(propuesta.id_propuesta, {
              codigo: codigoClase(propuesta.codigo, nombreDe(c), nom),
              descripcion: `${nom} · ${nombreDe(c)}`,
              id_curso: ch.cid,
              id_materia: ch.mid,
              ids_franjas_horarias: ch.nuevas,
              ids_profesores: ch.profes,
            });
            hechas.creadas.push(nueva.id_clase);
          }
          guardadas += ch.nuevas.length;
        } catch (e) {
          errores.push(`${nom} en ${nombreDe(c)}: ${mensajeDeError(e)}`);
        }
      }
      return true;
    });
    if (res === undefined) return;
    let msg =
      guardadas === 0 && r.ubicadas === 0
        ? 'No quedó ninguna hora por ubicar.'
        : `Se ubicaron ${guardadas} horas en los ${cursos.length} cursos, respetando la disponibilidad de cada docente y sin superponerlos entre cursos.`;
    if (r.sinUbicar.length) msg += ' No se pudo ubicar: ' + r.sinUbicar.join(', ') + '.';
    if (errores.length) msg += ' La API rechazó: ' + errores.join('; ') + '.';
    setPrevias(hechas.creadas.length || hechas.editadas.length ? hechas : null);
    setSel(null);
    setCelda(null);
    setVaciando(false);
    setAviso({ texto: msg, tipo: 'auto' });
  };

  const deshacer = async () => {
    if (!previas) return;
    const ok = await ejecutar(async () => {
      for (const id of previas.creadas) await planificacion.eliminar_clase(id);
      for (const e of previas.editadas) await planificacion.editar_clase(e.id, { ids_franjas_horarias: e.franjas, ids_profesores: e.profes });
      return true;
    });
    if (ok !== undefined) setPrevias(null);
  };

  // ---- evaluación de una franja para la materia elegida
  const docsDeSel = (s: Sel) => clasePorMateria.get(s.mid)?.ids_profesores ?? s.docs;
  type Eval = { ok: true } | { ok: false; tipo: 'sinDocente' | 'tope' | 'noDeclaro' | 'otroCurso' | 'completa'; donde?: string };
  const evaluar = (s: Sel, b: Bloque): Eval => {
    const docs = docsDeSel(s);
    if (!docs.length) return { ok: false, tipo: 'sinDocente' };
    if (horasPuestas(s.mid) >= horasMateria(s.mid)) return { ok: false, tipo: 'completa' };
    const enDia = (clasePorMateria.get(s.mid)?.franjas_horarias ?? []).filter((f) => f.nombre_dia_lectivo === b.dia).length;
    if (enDia >= 2) return { ok: false, tipo: 'tope' };
    if (docs.some((t) => !disponible(t, b.id))) return { ok: false, tipo: 'noDeclaro' };
    for (const t of docs) {
      const o = dondeOcupa(ocs, t, b);
      if (o) return { ok: false, tipo: 'otroCurso', donde: cursoPorId.get(o.id_curso) ? nombreDe(cursoPorId.get(o.id_curso)!) : 'otro curso' };
    }
    return { ok: true };
  };

  // ---- cursos (pestañas)
  const botonesCursos = cursos.map((c, i) => {
    const activo = c.id_curso === curso.id_curso;
    const a = avance(c);
    return {
      id: c.id_curso,
      label: nombreDe(c),
      badge: a.listo ? '✓' : a.puestas + '/' + a.total,
      badgeEstilo:
        'font-size: 10.5px; font-weight: 600; padding: 2px 7px; border-radius: 9px; margin-left: 8px;' +
        (activo ? ' background: rgba(255,255,255,0.18); color: #fff;' : ' background: #f2f4f7; color: #7a8393;'),
      estilo:
        'display: flex; align-items: center; height: 34px; padding: 0 13px; font-size: 12.5px; font-weight: 500;' +
        ' border: 1px solid ' + (activo ? '#14181f' : '#e2e6ec') + ';' +
        ' background: ' + (activo ? '#14181f' : '#fff') + '; color: ' + (activo ? '#fff' : '#4a5462') + ';' +
        ' border-radius: ' + (i === 0 ? '7px 0 0 7px' : i === cursos.length - 1 ? '0 7px 7px 0' : '0') + ';' +
        (i > 0 ? ' margin-left: -1px;' : ''),
      click: () => ir('A13', { id_propuesta: propuesta.id_propuesta, id_curso: c.id_curso }),
    };
  });

  // ---- una fila por materia × docente habilitado
  const opcionesLista: OpcionMateria[] = [];
  plan.forEach((m, mi) => {
    const mid = m.id_materia;
    const col = color(mid);
    const combos = combosDe(mid, m.nombre_materia, profesores);
    const clase = clasePorMateria.get(mid);
    const docsClase = clase?.ids_profesores ?? [];
    let elegida: string | null = null;
    if (clase && docsClase.length) {
      const c = combos.find((x) => x[0] === docsClase[0] && x.every((t) => docsClase.includes(t)));
      elegida = mid + '|' + (c ?? docsClase).join('+');
    }
    const puestas = horasPuestas(mid);
    const completa = puestas >= m.horas_semanales;

    if (combos.length === 0) {
      opcionesLista.push({
        key: mid + '|',
        clase: 'fila-off',
        nombre: m.nombre_materia,
        docente: clase ? 'La dicta ' + nombresDocs(docsClase) : 'Sin docente habilitado',
        marcaEstilo: 'width: 4px; height: 30px; border-radius: 3px; flex-shrink: 0; background: #dfe4ea;',
        nombreEstilo: 'font-size: 13px; font-weight: 500; color: #a8b0bb;',
        docenteEstilo: 'font-size: 11px; color: #b03a2e;',
        progreso: puestas + '/' + m.horas_semanales + ' h',
        progresoEstilo: 'font-size: 11.5px; font-weight: 600; padding: 3px 9px; border-radius: 11px; flex-shrink: 0; background: #fbeceb; color: #b03a2e;',
        filaEstilo: 'display: flex; align-items: center; gap: 11px; width: 100%; padding: 10px 16px; border: none; text-align: left; background: #fff;' + (mi === 0 ? '' : ' border-top: 2px solid #eef1f5;'),
        click: () => undefined,
      });
      return;
    }

    combos.forEach((docs, ci) => {
      const clave = mid + '|' + docs.join('+');
      const esElegida = elegida === clave;
      // Si otra combinación de esta materia ya está en la planilla, esta queda deshabilitada.
      const bloqueada = !!elegida && !esElegida;
      const activa = !!sel && sel.mid === mid && sel.docs.join('+') === docs.join('+');
      const puedeTocar = editable && !bloqueada && !(completa && !esElegida);
      opcionesLista.push({
        key: clave,
        clase: puedeTocar ? '' : 'fila-off',
        nombre: m.nombre_materia,
        docente: bloqueada ? 'La dicta ' + nombresDocs(docsClase) : nombresDocs(docs),
        marcaEstilo:
          'width: 4px; height: 30px; border-radius: 3px; flex-shrink: 0; background: ' +
          (bloqueada ? '#e8ecf1' : completa && esElegida ? '#cdd4dd' : col.punto) + ';',
        nombreEstilo:
          'font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ' +
          (bloqueada ? '#b9c1cc' : completa && esElegida ? '#8b95a5' : '#14181f') + ';',
        docenteEstilo:
          'font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ' +
          (bloqueada ? '#c3cad4' : '#8b95a5') + ';' + (bloqueada ? ' font-style: italic;' : ''),
        progreso: bloqueada ? '—' : completa && esElegida ? '✓ ' + m.horas_semanales + ' h' : (esElegida ? puestas : 0) + '/' + m.horas_semanales + ' h',
        progresoEstilo:
          'font-size: 11.5px; font-weight: 600; padding: 3px 9px; border-radius: 11px; flex-shrink: 0;' +
          (bloqueada
            ? ' background: #f7f8fa; color: #c3cad4;'
            : completa && esElegida
              ? ' background: #e9f2ec; color: #2f6b45;'
              : activa
                ? ' background: #14181f; color: #fff;'
                : ' background: #f2f4f7; color: #7a8393;'),
        filaEstilo:
          'display: flex; align-items: center; gap: 11px; width: 100%; padding: 10px 16px; border: none; text-align: left;' +
          (mi === 0 && ci === 0 ? '' : ci === 0 ? ' border-top: 2px solid #eef1f5;' : ' border-top: 1px solid #f4f6f8;') +
          ' background: ' + (activa ? '#f3f6fc' : bloqueada ? '#fcfdfe' : '#fff') + ';' +
          (activa ? ' box-shadow: inset 3px 0 0 ' + ACCENT + ';' : '') +
          (editable ? '' : ' opacity: 0.55;'),
        click: () => {
          if (!puedeTocar) return;
          setSel(activa ? null : { mid, docs });
          setCelda(null);
        },
      });
    });
  });

  // ---- grilla
  let opciones = 0;
  const base =
    'height: ' + ALTO + 'px; width: 100%; border-radius: 8px; display: flex; flex-direction: column; justify-content: center;' +
    ' align-items: flex-start; gap: 2px; padding: 0 10px; overflow: hidden; text-align: left;';
  const celdaRecreo = (b: Bloque, key: string): CeldaVista => ({
    key,
    clase: 'slot slot-bloq',
    titulo: 'Recreo',
    sub: b.inicio + ' a ' + b.fin,
    estilo:
      'height: ' + ALTO + 'px; width: 100%; border-radius: 6px; border: none; padding: 0; display: flex; align-items: center; justify-content: center;' +
      ' overflow: hidden; background: repeating-linear-gradient(135deg, #e8ecf1 0 3px, #f5f7fa 3px 6px); cursor: default;',
    tituloEstilo: 'writing-mode: vertical-rl; transform: rotate(180deg); font-size: 10px; font-weight: 600; letter-spacing: 0.04em; color: #8b95a5;',
    subEstilo: 'display: none;',
    click: () => undefined,
  });
  const vacia = (key: string): CeldaVista => ({
    key,
    clase: 'slot slot-bloq',
    titulo: '',
    sub: '',
    estilo: base + ' background: #fbfcfd; border: 1px solid #f0f2f5;',
    tituloEstilo: 'font-size: 12px;',
    subEstilo: 'font-size: 10px;',
    click: () => undefined,
  });
  const motivo: Record<string, string> = { noDeclaro: 'no declaró', tope: '2 h ese día', sinDocente: 'sin docente', completa: 'completa' };

  const filas = DIAS.map((dia, d) => ({
    dia,
    celdas: grilla.columnas.map((_, k): CeldaVista => {
      const b = grilla.dias[d][k];
      const key = d + '-' + k;
      if (!b) return vacia(key);
      if (b.es_recreo) return celdaRecreo(b, key);
      const puesta = clasePorFranja.get(b.id);
      if (puesta) {
        const esSel = celda === b.id;
        return {
          key,
          clase: editable ? 'slot slot-puesta' : 'slot',
          titulo: nombreMateria(puesta.id_materia),
          sub: nombresDocs(puesta.ids_profesores ?? []),
          estilo:
            base + ' background: ' + color(puesta.id_materia).solido + '; border: none;' +
            (esSel ? ' box-shadow: 0 0 0 2.5px #14181f;' : ' box-shadow: 0 1px 2px rgba(20,24,31,0.12);') +
            (editable ? '' : ' opacity: 0.8;'),
          tituloEstilo: 'font-size: 12.5px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;',
          subEstilo: 'font-size: 10.5px; color: rgba(255,255,255,0.88); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;',
          click: () => {
            if (!editable) return;
            setCelda(esSel ? null : b.id);
            setSel(null);
            setAviso(null);
          },
        };
      }
      if (!sel || !editable) return vacia(key);
      const ev = evaluar(sel, b);
      if (ev.ok) {
        opciones++;
        return {
          key,
          clase: 'slot slot-libre',
          titulo: '+',
          sub: '',
          estilo: base + ' background: #eaf6ee; border: 1.5px dashed #6aab84; align-items: center; justify-content: center;' + (ocupado ? ' opacity: 0.6;' : ''),
          tituloEstilo: 'font-size: 19px; font-weight: 400; color: #3f8f63; line-height: 1;',
          subEstilo: 'display: none;',
          click: () => {
            if (!ocupado) void ubicar(b);
          },
        };
      }
      return {
        key,
        clase: 'slot slot-bloq',
        titulo: ev.tipo === 'otroCurso' ? ev.donde ?? '' : motivo[ev.tipo] ?? '',
        sub: '',
        estilo: base + ' background: #f7f8fa; border: 1px solid #edf0f3; align-items: center; justify-content: center;',
        tituloEstilo:
          'font-size: 10.5px; color: #a8b0bb; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;' +
          (ev.tipo === 'otroCurso' ? ' font-weight: 600;' : ''),
        subEstilo: 'display: none;',
        click: () => undefined,
      };
    }),
  }));

  // ---- panel de la materia elegida
  let selInfo: SelInfo | null = null;
  if (sel) {
    const docs = docsDeSel(sel);
    const restantes = horasMateria(sel.mid) - horasPuestas(sel.mid);
    let declaradas = 0;
    let otros = 0;
    for (const t of docs) {
      const dec = grilla.horas.filter((b) => disponible(t, b.id)).length;
      if (dec > declaradas || declaradas === 0) declaradas = dec;
      otros += grilla.horas.filter((b) => {
        const o = dondeOcupa(ocs, t, b);
        return !!o && o.id_curso !== curso.id_curso;
      }).length;
    }
    let texto = 'Las franjas con + son las que este docente declaró disponibles y tiene libres en todos los cursos.';
    let colorAviso = '#6b7482';
    let fondo = '#fafbfc';
    if (opciones === 0) {
      texto = 'No queda ninguna franja libre con este docente. Probá con el otro habilitado para esta materia, o liberá horas del curso.';
      colorAviso = '#8a4b12';
      fondo = '#fdf1e3';
    } else if (opciones < restantes) {
      texto = `Quedan ${opciones} franjas para ${restantes} horas: no alcanzan. Conviene ubicar esta materia antes que las demás.`;
      colorAviso = '#8a4b12';
      fondo = '#fdf1e3';
    }
    selInfo = {
      nombre: nombreMateria(sel.mid),
      docente: nombresDocs(docs),
      color: color(sel.mid).solido,
      opciones,
      restantes,
      declaradas: declaradas + ' / ' + grilla.horas.length,
      otros: otros + ' h',
      aviso: texto,
      avisoEstilo: 'font-size: 11.5px; line-height: 1.55; padding: 11px 12px; border-radius: 8px; color: ' + colorAviso + '; background: ' + fondo + ';',
    };
  }

  // ---- panel de la clase tocada en la grilla: sus profesores son los de la CLASE (curso + materia)
  let celdaInfo: CeldaInfo | null = null;
  const claseCelda = celda != null && editable ? clasePorFranja.get(celda) : undefined;
  const bloqueCelda = celda != null ? grilla.porId.get(celda) : undefined;
  if (claseCelda && bloqueCelda) {
    const mid = claseCelda.id_materia;
    const cDocs = claseCelda.ids_profesores ?? [];
    const cHoras = (claseCelda.ids_franjas_horarias ?? []).map((f) => grilla.porId.get(f)).filter((b): b is Bloque => !!b);
    const nHoras = cHoras.length + (cHoras.length === 1 ? ' hora' : ' horas');
    const cuandoEs = (b: Bloque) => b.dia + ' ' + b.inicio;
    const nom = nombreMateria(mid);
    const deADos = esDeADos(nom);
    celdaInfo = {
      materia: nom + ' · ' + nombreCursoActual,
      franja: bloqueCelda.dia + ' ' + bloqueCelda.inicio + ' a ' + bloqueCelda.fin + ' · ' + nHoras + ' en la semana',
      alcance:
        'Los profesores son de la clase ' + nom + ' de ' + nombreCursoActual +
        ': si sumás o quitás uno, el cambio vale para las ' + nHoras + ' de esta materia en el curso, no solo para esta.',
      color: color(mid).solido,
      enCurso: ocupado,
      // Una materia que se dicta de a dos (EPA) no puede quedar con un solo profesor.
      docentes: cDocs.map((tid) => {
        const puede = cDocs.length > (deADos ? 2 : 1);
        return {
          id: tid,
          nombre: nombreProfesor(profPorId.get(tid)) || 'Profesor ' + tid,
          quitarEstilo:
            'height: 26px; padding: 0 10px; border-radius: 6px; font-size: 11px; font-weight: 500;' +
            (puede ? ' border: 1px solid #edc9c4; background: #fff; color: #b03a2e;' : ' border: 1px solid #e2e6ec; background: #f7f8fa; color: #c3cad4; cursor: default;'),
          quitar: () => {
            if (puede) void cambiarDocentes(claseCelda, cDocs.filter((x) => x !== tid));
          },
        };
      }),
      // Para sumarse a la clase, el profesor tiene que estar libre en TODAS sus horas.
      candidatos: habilitadosEn(mid, profesores)
        .filter((p: Profesor) => !cDocs.includes(p.id_profesor))
        .map((p) => {
          let problema: string | null = null;
          for (const h of cHoras) {
            const o = dondeOcupa(ocs, p.id_profesor, h, claseCelda.id_clase);
            if (o) {
              const c = cursoPorId.get(o.id_curso);
              problema = 'Da clase en ' + (c ? nombreDe(c) : 'otro curso') + ' el ' + cuandoEs(h);
            } else if (!disponible(p.id_profesor, h.id)) problema = 'No declaró disponible el ' + cuandoEs(h);
            if (problema) break;
          }
          const libre = !problema;
          return {
            id: p.id_profesor,
            nombre: nombreProfesor(p),
            detalle: libre ? 'Habilitado y libre en las ' + nHoras + ' de la clase' : problema!,
            detalleEstilo: 'font-size: 11px; color: ' + (libre ? '#2f6b45' : '#8a4b12') + ';',
            accion: libre ? 'Sumar' : '—',
            accionEstilo: 'font-size: 11.5px; font-weight: 600; flex-shrink: 0; color: ' + (libre ? ACCENT : '#c3cad4') + ';',
            estilo:
              'display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 11px; border-radius: 8px; border: 1px solid #e2e6ec; background: ' +
              (libre ? '#fff' : '#fafbfc') + ';' + (libre ? '' : ' cursor: default;'),
            sumar: () => {
              if (libre) void cambiarDocentes(claseCelda, [...cDocs, p.id_profesor]);
            },
          };
        }),
      sacar: () => void sacarHora(claseCelda, bloqueCelda.id),
    };
  }

  const otrosCursos: OtroCurso[] = cursos
    .filter((c) => c.id_curso !== curso.id_curso)
    .map((c) => {
      const a = avance(c);
      const nom = nombreDe(c);
      return {
        id: c.id_curso,
        nombre: nom,
        chapa: nom.replace(' ', ''),
        detalle: a.listo ? 'Completo' : 'Faltan ' + (a.total - a.puestas) + ' h por ubicar',
        estado: a.puestas + '/' + a.total,
        estadoEstilo: 'font-size: 11px; font-weight: 500; flex-shrink: 0; color: ' + (a.listo ? '#4a5462' : '#8b95a5') + ';',
        click: () => ir('A13', { id_propuesta: propuesta.id_propuesta, id_curso: c.id_curso }),
      };
    });

  // ---- encabezado, estados y banners
  const estadoVista = COLOR_ESTADO[codigoEstado] ?? COLOR_ESTADO.BOR;
  const banners: Record<string, { titulo: string; color: string; fondo: string; borde: string; icono: string; texto: string }> = {
    REV: {
      titulo: 'Enviada a revisión',
      color: '#1e4099',
      fondo: '#eef3fc',
      borde: '#cfdcf5',
      icono: 'M12 8v5M12 16.5v.5M12 21a9 9 0 100-18 9 9 0 000 18z',
      texto: 'Todos los cursos quedan bloqueados hasta que Dirección apruebe o rechace la planificación.',
    },
    VAL: {
      titulo: 'Planificación validada',
      color: '#2f6b45',
      fondo: '#ecf5ef',
      borde: '#c2e0cd',
      icono: 'M20 6L9 17l-5-5',
      texto: propuesta.codigo + ' pasó a ser la vigente del ciclo. Los cambios se hacen desde Suplencias.',
    },
    CER: {
      titulo: 'Planificación cerrada',
      color: '#5b6471',
      fondo: '#f5f6f8',
      borde: '#e2e6ec',
      icono: 'M5 11h14v10H5zM8 11V8a4 4 0 018 0v3',
      texto: 'Fue reemplazada por otra planificación validada del ciclo. Solo se puede consultar.',
    },
  };
  const banner = banners[codigoEstado];

  const estadosBotones = ['BOR', 'REV', 'VAL'].map((id, i) => {
    const e = COLOR_ESTADO[id];
    const activo = codigoEstado === id;
    // Solo se puede enviar a revisión o validar una planilla completa.
    const permitido = id === 'BOR' || planCompleta;
    return {
      id,
      label: e.label,
      puntoEstilo:
        'width: 6px; height: 6px; border-radius: 50%; margin-right: 7px; flex-shrink: 0; background: ' +
        (activo ? '#fff' : permitido ? e.punto : '#cdd4dd') + ';',
      estilo:
        'display: flex; align-items: center; height: 32px; padding: 0 12px; font-size: 12px; font-weight: 500;' +
        ' border: 1px solid ' + (activo ? '#14181f' : '#e2e6ec') + ';' +
        ' background: ' + (activo ? '#14181f' : '#fff') + ';' +
        ' color: ' + (activo ? '#fff' : permitido ? '#4a5462' : '#b9c1cc') + ';' +
        ' border-radius: ' + (i === 0 ? '7px 0 0 7px' : i === 2 ? '0 7px 7px 0' : '0') + ';' +
        (i > 0 ? ' margin-left: -1px;' : '') +
        (permitido ? '' : ' cursor: default;'),
      click: () => {
        if (activo || ocupado) return;
        if (!permitido) {
          setVaciando(false);
          setAviso({ texto: 'La planificación se envía entera: falta completar ' + faltantes.join(' y ') + '.', tipo: 'info' });
          return;
        }
        if (!(TRANSICIONES[codigoEstado] ?? []).includes(id)) {
          const desde = estadoVista.label;
          setAviso({
            texto:
              codigoEstado === 'BOR' && id === 'VAL'
                ? 'Primero hay que enviarla a revisión: Dirección la valida desde ahí.'
                : `Una planificación ${desde.toLowerCase()} no puede pasar a ${e.label.toLowerCase()}.`,
            tipo: 'info',
          });
          return;
        }
        void cambiarEstado(id);
      },
    };
  });

  const generarHabilitado = editable && !planCompleta && !ocupado;
  const vaciarHabilitado = editable && ubicadas > 0 && !ocupado;
  const hayDeshacer = !!previas && aviso?.tipo === 'auto';
  const hayAccion = vaciando || !!aviso;
  const accionColor = vaciando ? '#b03a2e' : aviso?.tipo === 'auto' ? '#2f6b45' : '#a56a10';
  const accionTexto = vaciando
    ? 'Se van a quitar las ' + ubicadas + ' horas ya ubicadas en ' + nombreCursoActual + '. Los otros cursos no se tocan.'
    : aviso?.texto ?? '';

  const columnasHoras = grilla.columnas.filter((b) => !b.es_recreo);
  const tituloGrilla =
    'Planilla de ' + nombreCursoActual +
    (anioCurso >= 4 ? ' · ' + (curso.orientacion?.nombre_orientacion ?? '') : '') +
    ' · ' + (curso.turno?.nombre ?? '') +
    (columnasHoras.length ? ' (' + columnasHoras[0].inicio + ' a ' + columnasHoras[columnasHoras.length - 1].fin + ')' : '');
  const ayuda = !editable
    ? 'Solo lectura: la planificación no está en borrador'
    : sel
      ? 'Tocá un + para ubicar ' + nombreMateria(sel.mid) + ', o una clase para ver sus profesores'
      : 'Elegí una materia y su docente para empezar';
  const anioCiclo = ciclo.ciclos.find((c) => c.id_ciclo_lectivo === propuesta.id_ciclo_lectivo)?.anio_calendario;

  const guardarTexto = ocupado ? 'Guardando…' : 'Guardado';
  const guardarEstilo =
    'display: flex; align-items: center; gap: 7px; height: 32px; padding: 0 13px; border-radius: 7px; font-size: 12px; font-weight: 600;' +
    (!editable ? ' border: 1px solid #eef1f5; background: #fff; color: #c3cad4; cursor: default;' : ' border: 1px solid #c2e0cd; background: #ecf5ef; color: #2f6b45; cursor: default;');

  return (
    <div style={css('width: 1560px; min-height: 1000px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div style={css('display: flex; align-items: flex-end; gap: 24px; padding: 20px 28px 0; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px; padding-bottom: 14px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir('A12')} style={css('display: flex; align-items: center; gap: 6px; color: #2f5fd0; cursor: pointer;')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6"></path>
              </svg>
              Planificaciones
            </span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span>Ciclo lectivo {anioCiclo ?? ''}</span>
          </div>
          <div style={css('display: flex; align-items: center; gap: 12px;')}>
            <span className="mono" style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')} title={propuesta.nombre}>
              {propuesta.codigo}
            </span>
            <span
              style={css(
                'font-size: 11.5px; font-weight: 600; padding: 4px 11px; border-radius: 13px; background: ' + estadoVista.chip + '; color: ' + estadoVista.texto + ';',
              )}
            >
              {estadoVista.label}
            </span>
          </div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <div style={css('display: flex; align-items: center; gap: 16px; padding-bottom: 14px;')}>
          <div style={css('display: flex; flex-direction: column; gap: 5px; align-items: flex-end;')}>
            <div style={css('display: flex; align-items: baseline; gap: 6px;')}>
              <span className="mono" style={css('font-size: 17px; font-weight: 600;')}>{globalPuestas}</span>
              <span style={css('font-size: 12px; color: #6b7482;')}>
                de {globalTotal} h en los {cursos.length} cursos
              </span>
            </div>
            <div style={css('width: 200px; height: 5px; border-radius: 3px; background: #eef1f5; overflow: hidden;')}>
              <div
                style={css(
                  'height: 5px; width: ' + (globalTotal ? Math.round((globalPuestas / globalTotal) * 100) : 0) + '%; background: ' + (planCompleta ? '#2f6b45' : ACCENT) + ';',
                )}
              ></div>
            </div>
          </div>
          <div style={css('display: flex; gap: 2px;')}>
            {botonesCursos.map((c) => (
              <button key={c.id} onClick={c.click} style={css(c.estilo)}>
                <span>{c.label}</span>
                <span style={css(c.badgeEstilo)}>{c.badge}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={css('display: flex; gap: 16px; padding: 18px 28px 26px; align-items: flex-start;')}>
        <PanelMaterias
          ayuda={editable ? 'De ' + nombreCursoActual + ' · una fila por docente que puede dictarla' : 'La planificación está cerrada: no se edita ningún curso'}
          filtroAnio={anioCurso + '° año'}
          filtroOrientacion={'Orientación ' + (curso.orientacion?.nombre_orientacion ?? '')}
          opciones={opcionesLista}
          ubicadas={ubicadas}
          totalPlan={totalPlan}
          progresoAncho={(totalPlan ? Math.min(100, Math.round((ubicadas / totalPlan) * 100)) : 0) + '%'}
          progresoColor={completo ? '#2f6b45' : ACCENT}
        />

        {/* ===== grilla ===== */}
        <div style={css('flex-grow: 1; min-width: 0; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
          <div style={css('display: flex; align-items: center; flex-wrap: wrap; gap: 10px 12px; padding: 13px 18px; border-bottom: 1px solid #eef1f5;')}>
            <div style={css('display: flex; flex-direction: column; gap: 3px; min-width: 240px; flex-grow: 1;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>{tituloGrilla}</div>
              <div style={css('font-size: 11.5px; color: ' + (sel && editable ? '#2f6b45' : '#8b95a5') + ';')}>{ayuda}</div>
            </div>
            <div style={css('flex-grow: 1;')}></div>

            <span style={css('display: flex; flex-direction: column; gap: 1px; align-items: flex-end;')}>
              <span style={css('font-size: 11.5px; color: #4a5462; font-weight: 600;')}>Estado de la planificación</span>
              <span style={css('font-size: 10.5px; color: #a8b0bb;')}>Uno solo para todos los cursos</span>
            </span>
            <div style={css('display: flex; gap: 2px;')}>
              {estadosBotones.map((e) => (
                <button key={e.id} onClick={e.click} style={css(e.estilo)}>
                  <span style={css(e.puntoEstilo)}></span>
                  {e.label}
                </button>
              ))}
            </div>

            <div style={css('width: 1px; height: 24px; background: #e2e6ec;')}></div>

            <button
              onClick={() => {
                if (generarHabilitado) void generarAutomatico();
              }}
              style={css(
                'display: flex; align-items: center; gap: 7px; height: 32px; padding: 0 13px; border-radius: 7px; font-size: 12px; font-weight: 600;' +
                  (generarHabilitado ? ' border: none; background: #14181f; color: #fff;' : ' border: 1px solid #eef1f5; background: #fff; color: #c3cad4; cursor: default;'),
              )}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0;')}>
                <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5L13 3z"></path>
              </svg>
              Generar automáticamente
            </button>
            <button
              onClick={() => {
                if (!vaciarHabilitado) return;
                setAviso(null);
                setVaciando(true);
              }}
              style={css(
                'display: flex; align-items: center; gap: 7px; height: 32px; padding: 0 12px; border-radius: 7px; font-size: 12px; font-weight: 500;' +
                  ' border: 1px solid ' + (vaciarHabilitado ? '#edc9c4' : '#eef1f5') + ';' +
                  ' background: #fff; color: ' + (vaciarHabilitado ? '#b03a2e' : '#c3cad4') + ';' +
                  (vaciarHabilitado ? '' : ' cursor: default;'),
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0;')}>
                <path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13"></path>
              </svg>
              Vaciar
            </button>
            <button style={css(guardarEstilo)} title="Cada cambio se guarda en el momento en la planificación">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0;')}>
                <path d={ocupado ? 'M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6' : 'M20 6L9 17l-5-5'}></path>
              </svg>
              {guardarTexto}
            </button>
          </div>

          {acc.error && (
            <div style={css('padding: 12px 18px; border-bottom: 1px solid #eef1f5;')}>
              <MensajeError mensaje={acc.error} alCerrar={acc.limpiarError} />
            </div>
          )}

          {hayAccion && (
            <div
              style={css(
                'display: flex; align-items: center; gap: 11px; padding: 12px 18px; border-bottom: 1px solid #eef1f5; background: ' +
                  (vaciando ? '#fbeceb' : aviso?.tipo === 'auto' ? '#ecf5ef' : '#fdf6ec') + ';',
              )}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accionColor} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0;')}>
                <path d="M12 8v5M12 16.5v.5"></path>
                <circle cx="12" cy="12" r="9"></circle>
              </svg>
              <span style={css('font-size: 12.5px; color: ' + accionColor + '; line-height: 1.5;')}>{accionTexto}</span>
              <span style={css('flex-grow: 1;')}></span>
              {hayDeshacer && !vaciando && (
                <button
                  onClick={() => void deshacer()}
                  disabled={ocupado}
                  style={css('height: 30px; padding: 0 13px; border-radius: 7px; border: 1px solid #c2e0cd; background: #fff; color: #2f6b45; font-size: 12px; font-weight: 500; flex-shrink: 0;')}
                >
                  Deshacer
                </button>
              )}
              {vaciando && (
                <span style={css('display: flex; gap: 8px; flex-shrink: 0;')}>
                  <button
                    onClick={() => void vaciarCurso()}
                    disabled={ocupado}
                    style={css('height: 30px; padding: 0 13px; border-radius: 7px; border: none; background: #b03a2e; color: #fff; font-size: 12px; font-weight: 600;')}
                  >
                    Sí, vaciar
                  </button>
                  <button
                    onClick={() => setVaciando(false)}
                    style={css('height: 30px; padding: 0 13px; border-radius: 7px; border: 1px solid #edc9c4; background: #fff; color: #b03a2e; font-size: 12px; font-weight: 500;')}
                  >
                    Cancelar
                  </button>
                </span>
              )}
            </div>
          )}

          {banner && (
            <div style={css('display: flex; align-items: center; gap: 12px; padding: 13px 18px; border-bottom: 1px solid #eef1f5; background: ' + banner.fondo + ';')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={banner.color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0;')}>
                <path d={banner.icono}></path>
              </svg>
              <span style={css('display: flex; flex-direction: column; gap: 2px;')}>
                <span style={css('font-size: 12.5px; font-weight: 600; color: ' + banner.color + ';')}>{banner.titulo}</span>
                <span style={css('font-size: 11.5px; color: ' + banner.color + '; opacity: 0.85;')}>{banner.texto}</span>
              </span>
              <span style={css('flex-grow: 1;')}></span>
              {codigoEstado === 'REV' && (
                <span style={css('display: flex; gap: 8px; flex-shrink: 0;')}>
                  <button
                    onClick={() => void cambiarEstado('BOR', 'Dirección rechazó la planificación y volvió a borrador. Ya se puede editar de nuevo.')}
                    disabled={ocupado}
                    style={css('height: 30px; padding: 0 13px; border-radius: 7px; border: 1px solid ' + banner.borde + '; background: #fff; color: ' + banner.color + '; font-size: 12px; font-weight: 500;')}
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => void cambiarEstado('VAL')}
                    disabled={ocupado}
                    style={css('height: 30px; padding: 0 13px; border-radius: 7px; border: none; background: #2f6b45; color: #fff; font-size: 12px; font-weight: 600;')}
                  >
                    Aprobar como Dirección
                  </button>
                </span>
              )}
            </div>
          )}

          <Grilla
            gridCols={'84px ' + grilla.columnas.map((b) => (b.es_recreo ? '26px' : 'minmax(0, 1fr)')).join(' ')}
            franjas={grilla.columnas.map((b) =>
              b.es_recreo
                ? { key: 'r' + b.id, hora: '', estilo: 'padding-bottom: 4px;' }
                : { key: 'h' + b.id, hora: b.inicio, estilo: 'font-size: 11px; color: #8b95a5; text-align: center; padding-bottom: 4px; font-weight: 500;' },
            )}
            filas={filas}
          />
        </div>

        <PanelDerecho
          celda={celdaInfo}
          sel={selInfo}
          vacioTexto={
            editable
              ? 'Elegí una materia con su docente y la planilla te marca con + las horas donde puede ir. Tocá una clase ya ubicada para ver los profesores de esa materia en el curso o sumar otro.'
              : 'La planificación no está en borrador, así que ningún curso se edita. Volvé a ponerla en borrador para seguir.'
          }
          otros={otrosCursos}
        />
      </div>
    </div>
  );
}
