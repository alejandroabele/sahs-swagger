// A3 · Generación de la planilla anual. Prototipo: <template id="tpl-main"> y DC.registrar("main")
// en prototipo/index.html.
// URL: ?id_curso= y ?id_propuesta= (por defecto, la propuesta en Borrador del ciclo activo y el
// primer curso con materias). Genera la grilla del curso con el algoritmo del prototipo
// (a3/generar.ts) sobre datos reales: materias del curso, docentes habilitados, disponibilidad y
// las clases que esos docentes ya tienen en la propuesta. "Guardar" reemplaza las clases del curso
// en la propuesta (eliminar_clase + crear_clase + asignar_clase_a_propuesta), solo en Borrador.
import { useEffect, useMemo, useState } from 'react';
import type { Profesor } from '@sahs/contratos';
import { orientacion, planificacion, profesorSuplencias } from '../api';
import { mensajeDeError } from '../api/http';
import { useParamNumero } from '../app/navegar';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useAccion, useConsulta } from '../estado/consultas';
import { css } from '../lib/css';
import { DIAS } from '../lib/formato';
import { generarPlan, type CeldaGen, type MateriaGen, type ResultadoA3 } from './a3/generar';
import {
  ACCENT,
  areaDe,
  armarGrilla,
  codigoClase,
  crearClaseEnPropuesta,
  dondeOcupa,
  esDeADos,
  habilitadosEn,
  nombreCurso,
  nombreProfesor,
  ocupaciones,
  ordenarCursos,
  type Bloque,
} from './a13/modelo';

const ALTO_CELDA = 58;

/** Colores de cada área en esta pantalla (los del diseño). */
const AREA: Record<string, { linea: string; fondo: string; borde: string; texto: string }> = {
  Exactas: { linea: '#3a6fd8', fondo: '#eaf0fb', borde: '#cfdcf5', texto: '#1e3f80' },
  'Lengua y Literatura': { linea: '#1f8f7a', fondo: '#e8f5f2', borde: '#c6e6df', texto: '#155e50' },
  Sociales: { linea: '#7a54c4', fondo: '#f3edfa', borde: '#ddd0ef', texto: '#4a2f80' },
  Pastoral: { linea: '#c08430', fondo: '#fdf4e7', borde: '#f0dcbe', texto: '#7a5310' },
  Artes: { linea: '#c04f7a', fondo: '#fbedf2', borde: '#f0ccd9', texto: '#8a2e52' },
  'Sin área': { linea: '#8b95a5', fondo: '#f5f6f8', borde: '#e2e6ec', texto: '#4a5462' },
};

export default function A3GeneracionPlanilla() {
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
  const propuesta = idPropParam ? qPropuesta.data : (qPropuestas.data ?? []).find((p) => p.estado?.codigo === 'BOR');
  const idCiclo = propuesta?.id_ciclo_lectivo ?? ciclo.activo?.id_ciclo_lectivo;
  const idProp = propuesta?.id_propuesta;

  const qCursos = useConsulta(['planificacion', 'get_cursos', idCiclo], () => planificacion.get_cursos({ id_ciclo_lectivo: idCiclo! }), {
    enabled: !!idCiclo,
  });
  const qClases = useConsulta(['planificacion', 'get_clases', { id_propuesta: idProp }], () => planificacion.get_clases({ id_propuesta: idProp! }), {
    enabled: !!idProp,
  });
  const qAnios = useConsulta(['planificacion', 'get_anios_academicos'], () => planificacion.get_anios_academicos());
  const qProfes = useConsulta(['profesor_suplencias', 'get_profesores'], () => profesorSuplencias.get_profesores());
  const qMaterias = useConsulta(['orientacion', 'get_materias'], () => orientacion.get_materias());

  const acc = useAccion((fn: () => Promise<unknown>) => fn(), ['planificacion']);

  const anios = qAnios.data ?? [];
  const cursos = useMemo(() => ordenarCursos(qCursos.data ?? [], anios), [qCursos.data, anios]);
  const curso =
    cursos.find((c) => c.id_curso === idCursoParam) ?? (idCursoParam ? undefined : cursos.find((c) => (c.materias ?? []).length > 0)) ?? null;
  const clases = qClases.data ?? [];
  const profesores = qProfes.data ?? [];
  const materiasApi = qMaterias.data ?? [];

  // ---- estado de la pantalla
  const [horas, setHoras] = useState<Record<number, number>>({});
  const [respetar, setRespetar] = useState(true);
  const [res, setRes] = useState<ResultadoA3 | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);

  const idCurso = curso?.id_curso;
  useEffect(() => {
    const h: Record<number, number> = {};
    for (const m of curso?.materias ?? []) h[m.id_materia] = m.horas_semanales;
    setHoras(h);
    setRes(null);
    setGuardado(false);
    setErrores([]);
    // Las horas se reinician solo al cambiar de curso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCurso, curso?.materias?.length]);

  const grilla = useMemo(() => armarGrilla(curso?.franjas_horarias), [curso]);
  const dispPorProf = useMemo(
    () => new Map(profesores.map((p) => [p.id_profesor, new Set((p.disponibilidad ?? []).map((f) => f.id_franja_horaria))])),
    [profesores],
  );
  const disponible = (pid: number, fid: number) => !!dispPorProf.get(pid)?.has(fid);
  // Las clases de los otros cursos en la propuesta bloquean a sus docentes.
  const ocsFuera = useMemo(() => ocupaciones(clases.filter((c) => c.id_curso !== idCurso)), [clases, idCurso]);
  const ocupadoFuera = (pid: number, b: Bloque) => !!dondeOcupa(ocsFuera, pid, b);
  const clasesCurso = clases.filter((c) => c.id_curso === idCurso);

  const cargando =
    (idPropParam ? qPropuesta.isLoading : qPropuestas.isLoading || !ciclo.activo) || qCursos.isLoading || qClases.isLoading || qProfes.isLoading || qMaterias.isLoading || qAnios.isLoading;
  const errorCarga = qPropuesta.error ?? qPropuestas.error ?? qCursos.error ?? qClases.error ?? qProfes.error ?? qMaterias.error;

  if (!curso || cargando) {
    return (
      <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
        <Cabecera />
        {cargando ? (
          <Cargando />
        ) : (
          <div style={css('padding: 26px 28px;')}>
            <MensajeError mensaje={errorCarga ? mensajeDeError(errorCarga) : 'No se encontró el curso, o el ciclo lectivo no tiene cursos con materias.'} />
          </div>
        )}
      </div>
    );
  }

  // ======== cálculo de la vista (como renderVals() del prototipo) ========
  const nomCurso = nombreCurso(curso, anios);
  const editable = propuesta?.estado?.codigo === 'BOR';
  const ocupado = acc.enCurso;

  /** Docentes de la materia: los de su clase en la propuesta, todos si es EPA, o el habilitado con más margen. */
  const docentesPara = (mid: number, nombre: string): number[] => {
    const hab = habilitadosEn(mid, profesores);
    const ids = hab.map((p) => p.id_profesor);
    const actual = clasesCurso.find((c) => c.id_materia === mid)?.ids_profesores ?? [];
    if (actual.length && actual.every((x) => ids.includes(x))) return actual;
    if (esDeADos(nombre)) return ids;
    const margen = (p: Profesor) => grilla.horas.filter((b) => disponible(p.id_profesor, b.id) && !ocupadoFuera(p.id_profesor, b)).length;
    const mejor = [...hab].sort((a, b) => margen(b) - margen(a))[0];
    return mejor ? [mejor.id_profesor] : [];
  };
  const profPorId = new Map(profesores.map((p) => [p.id_profesor, p]));
  const nombres = (ids: number[], sep: string) => ids.map((id) => nombreProfesor(profPorId.get(id))).join(sep);

  const S: MateriaGen[] = (curso.materias ?? []).map((m) => ({
    id: m.id_materia,
    n: m.nombre_materia,
    area: areaDe(m.id_materia, materiasApi),
    t: docentesPara(m.id_materia, m.nombre_materia),
  }));

  const total = S.reduce((n, s) => n + (horas[s.id] ?? 0), 0);
  const H = grilla.columnas.filter((b) => !b.es_recreo).length;
  const capacidad = grilla.horas.length;

  const cambiarHoras = (id: number, delta: number) => {
    setHoras((h) => ({ ...h, [id]: Math.max(0, Math.min(8, (h[id] ?? 0) + delta)) }));
    setRes(null);
    setGuardado(false);
  };

  // Antes de generar se muestra lo que el curso ya tiene en la propuesta.
  const actual = new Map<number, CeldaGen>();
  if (!res) {
    for (const c of clasesCurso) {
      const nombre = c.materia?.nombre_materia ?? S.find((s) => s.id === c.id_materia)?.n ?? 'Materia';
      for (const f of c.ids_franjas_horarias ?? []) {
        const b = grilla.porId.get(f);
        if (b) actual.set(f, { id: c.id_materia, n: nombre, area: areaDe(c.id_materia, materiasApi), t: c.ids_profesores ?? [], forzada: false, bloque: b });
      }
    }
  }

  let forzadas = 0;
  const filas = grilla.columnas.map((b) => {
    const horario = b.inicio + '–' + b.fin;
    if (b.es_recreo) return { key: 'r' + b.id, esRecreo: true, horario, hora: '', celdas: [] as ReturnType<typeof celdaVista>[] };
    const sl = (b.hora ?? 1) - 1;
    const celdas = DIAS.map((_, d) => {
      const bd = grilla.horasPorDia[d][sl];
      const cell = res ? res.grid[d]?.[sl] ?? null : bd ? actual.get(bd.id) ?? null : null;
      if (cell?.forzada) forzadas++;
      return celdaVista(cell);
    });
    return { key: 'h' + b.id, esRecreo: false, horario, hora: b.hora + '° hora', celdas };
  });

  function celdaVista(cell: CeldaGen | null) {
    if (!cell) {
      return {
        estilo: 'height: ' + ALTO_CELDA + 'px; border-radius: 7px; border: 1px dashed #d6dce4; background: #fcfdfe; display: flex; flex-direction: column; justify-content: center; padding: 0 9px; overflow: hidden;',
        titulo: '',
        sub: '',
        tituloEstilo: 'font-size: 12px;',
        subEstilo: 'font-size: 10px;',
      };
    }
    const a = AREA[cell.area] ?? AREA['Sin área'];
    const esEpa = esDeADos(cell.n);
    const docentes = nombres(cell.t, ' + ');
    return {
      estilo:
        'height: ' + ALTO_CELDA + 'px; border-radius: 7px; display: flex; flex-direction: column; justify-content: center; gap: 2px; padding: 0 9px; overflow: hidden;' +
        ' background: ' + (cell.forzada ? '#fdf1e3' : a.fondo) + ';' +
        ' border: 1px ' + (cell.forzada ? 'dashed #e0a458' : 'solid ' + a.borde) + ';' +
        (esEpa && !cell.forzada ? ' background-image: repeating-linear-gradient(135deg, rgba(122,84,196,0.07) 0 6px, transparent 6px 12px);' : ''),
      titulo: cell.n,
      sub: cell.forzada ? '⚠ ' + docentes : docentes,
      tituloEstilo:
        'font-size: 12px; font-weight: 600; color: ' + (cell.forzada ? '#8a4b12' : a.texto) + '; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;',
      subEstilo: 'font-size: 10px; color: ' + (cell.forzada ? '#8a4b12' : a.texto) + '; opacity: 0.82; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
    };
  }

  let ubicadas = 0;
  if (res) res.grid.forEach((row) => row.forEach((c) => c && ubicadas++));
  const faltantes = res ? res.faltantes : [];
  const conteo: Record<string, number> = {};
  faltantes.forEach((n) => (conteo[n] = (conteo[n] ?? 0) + 1));
  const detalle = Object.keys(conteo)
    .map((n) => conteo[n] + ' h de ' + n)
    .join(', ');

  let hayAviso = false;
  let textoAviso = '';
  if (faltantes.length > 0) {
    hayAviso = true;
    textoAviso =
      'Quedaron sin ubicar ' + detalle + '. No hay franja libre donde su docente esté disponible: bajá la carga horaria de esa materia o ampliá la disponibilidad declarada.';
  } else if (forzadas > 0) {
    hayAviso = true;
    textoAviso =
      forzadas + ' hora(s) quedaron asignadas fuera de la disponibilidad declarada, marcadas con ⚠ en la grilla. Entran todas las materias, pero esos docentes no pueden dictarlas en esa franja.';
  }
  if (res && forzadas > 0) textoAviso += ' La planificación no acepta esas horas: para guardar, generá respetando la disponibilidad.';
  const alerta = respetar ? faltantes.length : forzadas;

  const puedeGuardar = !!res && !guardado && editable && forzadas === 0 && !ocupado && !!propuesta;
  const guardar = async () => {
    if (!puedeGuardar || !res || !propuesta) return;
    const errs: string[] = [];
    const ok = await acc.ejecutar(async () => {
      // Se reemplazan las clases del curso en la propuesta por las generadas.
      for (const c of clasesCurso) await planificacion.eliminar_clase(c.id_clase);
      const porMateria = new Map<number, CeldaGen[]>();
      res.grid.forEach((row) => row.forEach((c) => c && (porMateria.get(c.id) ?? porMateria.set(c.id, []).get(c.id)!).push(c)));
      for (const [mid, celdas] of porMateria) {
        const nom = celdas[0].n;
        try {
          await crearClaseEnPropuesta(propuesta.id_propuesta, {
            codigo: codigoClase(propuesta.codigo, nomCurso, nom),
            descripcion: `${nom} · ${nomCurso}`,
            id_curso: curso.id_curso,
            id_materia: mid,
            ids_franjas_horarias: celdas.map((c) => c.bloque.id),
            ids_profesores: celdas[0].t,
          });
        } catch (e) {
          errs.push(`${nom}: ${mensajeDeError(e)}`);
        }
      }
      return true;
    });
    setErrores(errs);
    if (ok !== undefined && errs.length === 0) setGuardado(true);
  };

  const generar = () => {
    const cacheEscasez = new Map<number, number>();
    const escasez = (fid: number) => {
      let n = cacheEscasez.get(fid);
      if (n === undefined) {
        n = profesores.filter((p) => disponible(p.id_profesor, fid)).length;
        cacheEscasez.set(fid, n);
      }
      return n;
    };
    setRes(generarPlan({ materias: S, horas, respetar, horasPorDia: grilla.horasPorDia, disponible, ocupadoFuera, escasez }));
    setGuardado(false);
    setErrores([]);
    acc.limpiarError();
  };

  const anioCiclo = ciclo.ciclos.find((c) => c.id_ciclo_lectivo === curso.id_ciclo_lectivo)?.anio_calendario;
  const planAyuda = !propuesta
    ? 'No hay una planificación en Borrador en este ciclo: creala desde Planificaciones.'
    : editable
      ? 'Se envía a validación completa desde el armado de la planificación.'
      : 'Solo se guarda en una planificación en Borrador.';
  const guardarLabel = ocupado ? 'Guardando…' : guardado && propuesta ? 'Guardada en ' + propuesta.codigo : 'Guardar en la planificación';
  const mensajeErrores = [acc.error, ...errores].filter(Boolean).join(' · ');

  return (
    <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      {/* ======= encabezado de pantalla ======= */}
      <div style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span>Ciclo lectivo {anioCiclo ?? ''}</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span>Nivel secundario</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span style={css('color: #14181f; font-weight: 500;')}>{nomCurso}</span>
          </div>
          <div style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Generación de la planilla anual</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <div style={css('display: flex; align-items: center; gap: 14px;')}>
          <div style={css('display: flex; flex-direction: column; align-items: flex-end; gap: 5px;')}>
            <div style={css('display: flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 20px; border: 1px solid #f0dcbe; background: #fdf6ec; color: #a56a10; font-size: 12px; font-weight: 600;')}>
              <span style={css('width: 7px; height: 7px; border-radius: 50%; background: #a56a10;')}></span>
              {propuesta ? (
                <>
                  Planificación <span className="mono">{propuesta.codigo}</span> · {propuesta.estado?.nombre ?? ''}
                </>
              ) : (
                'Sin planificación en borrador'
              )}
            </div>
            <div style={css('font-size: 11.5px; color: #7a8393;')}>{planAyuda}</div>
          </div>
          <button
            onClick={() => void guardar()}
            disabled={!puedeGuardar}
            title={res && forzadas > 0 ? 'Hay horas fuera de la disponibilidad declarada: la planificación no las acepta' : undefined}
            style={css(
              'height: 36px; padding: 0 16px; border-radius: 7px; border: 1px solid #d3d9e2; background: #fff; color: ' +
                (puedeGuardar ? '#14181f' : '#a8b0bb') +
                '; font-size: 13px; font-weight: 500;',
            )}
          >
            {guardarLabel}
          </button>
        </div>
      </div>

      {/* ======= cuerpo ======= */}
      <div style={css('display: flex; gap: 20px; padding: 20px 28px 28px; align-items: flex-start;')}>
        {/* ---- panel izquierdo: parámetros ---- */}
        <div style={css('width: 388px; display: flex; flex-direction: column; gap: 16px; flex-shrink: 0;')}>
          {mensajeErrores && <MensajeError mensaje={mensajeErrores} alCerrar={() => (setErrores([]), acc.limpiarError())} />}

          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('padding: 14px 16px 12px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Carga horaria semanal</div>
              <div style={css('font-size: 12px; color: #6b7482; margin-top: 3px;')}>Horas cátedra por materia para {nomCurso}</div>
            </div>

            <div style={css('max-height: 428px; overflow-y: auto;')}>
              {S.map((s, i) => {
                const a = AREA[s.area] ?? AREA['Sin área'];
                return (
                  <div key={s.id} style={css('display: flex; align-items: center; gap: 11px; padding: 9px 16px;' + (i === 0 ? '' : ' border-top: 1px solid #f2f4f7;'))}>
                    <div style={css('width: 4px; height: 30px; border-radius: 3px; background: ' + a.linea + '; flex-shrink: 0;')}></div>
                    <div style={css('display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0;')}>
                      <div style={css('font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>{s.n}</div>
                      <div style={css('font-size: 11px; color: ' + (s.t.length ? '#7a8393' : '#b03a2e') + '; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>
                        {s.t.length ? nombres(s.t, ' · ') : 'Sin docente habilitado'}
                      </div>
                    </div>
                    <div style={css('display: flex; align-items: center; gap: 2px; flex-shrink: 0;')}>
                      <button
                        onClick={() => cambiarHoras(s.id, -1)}
                        style={css('width: 26px; height: 26px; border-radius: 6px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 15px; line-height: 1; display: flex; align-items: center; justify-content: center;')}
                      >
                        −
                      </button>
                      <div className="mono" style={css('width: 30px; text-align: center; font-size: 14px; font-weight: 500;')}>
                        {horas[s.id] ?? 0}
                      </div>
                      <button
                        onClick={() => cambiarHoras(s.id, 1)}
                        style={css('width: 26px; height: 26px; border-radius: 6px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 15px; line-height: 1; display: flex; align-items: center; justify-content: center;')}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
              {S.length === 0 && <div style={css('padding: 16px; font-size: 12px; color: #8b95a5;')}>El curso no tiene materias en su plan.</div>}
            </div>

            <div style={css('display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #f8fafc; border-top: 1px solid #eef1f5;')}>
              <span style={css('font-size: 12px; color: #6b7482;')}>Total a ubicar</span>
              <div style={css('flex-grow: 1;')}></div>
              <span className="mono" style={css('font-size: 15px; font-weight: 600;')}>{total}</span>
              <span style={css('font-size: 12px; color: #7a8393;')}>de {capacidad} horas cátedra</span>
            </div>
            <div style={css('height: 4px; background: #eef1f5;')}>
              <div
                style={css(
                  'height: 4px; width: ' + Math.min(100, Math.round((total / (capacidad || 1)) * 100)) + '%; background: ' + (total > capacidad ? '#c2410c' : ACCENT) + ';',
                )}
              ></div>
            </div>
          </div>

          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 14px 16px;')}>
            <div style={css('display: flex; align-items: flex-start; gap: 11px;')}>
              <button
                onClick={() => {
                  setRespetar(!respetar);
                  setRes(null);
                  setGuardado(false);
                }}
                aria-label="Respetar disponibilidad declarada"
                style={css(
                  'width: 38px; height: 22px; border-radius: 11px; border: none; padding: 0; flex-shrink: 0; display: flex; align-items: center; transition: background 0.15s;' +
                    ' background: ' + (respetar ? ACCENT : '#cdd4dd') + '; justify-content: ' + (respetar ? 'flex-end' : 'flex-start') + ';',
                )}
              >
                <span style={css('width: 18px; height: 18px; border-radius: 50%; background: #fff; margin: 0 2px; box-shadow: 0 1px 2px rgba(20,24,31,0.25);')}></span>
              </button>
              <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
                <div style={css('font-size: 13px; font-weight: 500;')}>Respetar disponibilidad declarada</div>
                <div style={css('font-size: 11.5px; color: #7a8393; line-height: 1.45;')}>Solo ubica una materia en franjas donde su docente declaró estar disponible.</div>
              </div>
            </div>
          </div>

          <button
            onClick={generar}
            style={css(
              'height: 46px; border-radius: 8px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 9px; box-shadow: 0 1px 2px rgba(20,24,31,0.16);',
            )}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5L13 3z"></path>
            </svg>
            Generar planilla automáticamente
          </button>

          {res && (
            <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 11px;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Resultado de la generación</div>
              <div style={css('display: flex; gap: 10px;')}>
                <div style={css('flex-grow: 1; padding: 10px 12px; border-radius: 8px; background: #f2f7f3;')}>
                  <div className="mono" style={css('font-size: 19px; font-weight: 600; color: #2f6b45;')}>{ubicadas}</div>
                  <div style={css('font-size: 11px; color: #55705f; margin-top: 1px;')}>horas ubicadas</div>
                </div>
                <div style={css('flex-grow: 1; padding: 10px 12px; border-radius: 8px; background: ' + (alerta > 0 ? '#fdf4e7' : '#f5f6f8') + ';')}>
                  <div className="mono" style={css('font-size: 19px; font-weight: 600; color: ' + (alerta > 0 ? '#a56a10' : '#6b7482') + ';')}>{alerta}</div>
                  <div style={css('font-size: 11px; color: ' + (alerta > 0 ? '#a56a10' : '#6b7482') + '; margin-top: 1px;')}>{respetar ? 'sin ubicar' : 'fuera de disponibilidad'}</div>
                </div>
                <div style={css('flex-grow: 1; padding: 10px 12px; border-radius: 8px; background: #f5f6f8;')}>
                  <div className="mono" style={css('font-size: 19px; font-weight: 600; color: #4a5462;')}>{Math.max(0, capacidad - ubicadas)}</div>
                  <div style={css('font-size: 11px; color: #6b7482; margin-top: 1px;')}>franjas libres</div>
                </div>
              </div>
              {hayAviso && (
                <div style={css('display: flex; gap: 9px; padding: 11px 12px; border-radius: 8px; background: #fdf6ec; align-items: flex-start;')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a56a10" strokeWidth="2" strokeLinecap="round" style={css('flex-shrink: 0; margin-top: 1px;')}>
                    <path d="M12 8v5M12 16.5v.5"></path>
                    <circle cx="12" cy="12" r="9"></circle>
                  </svg>
                  <div style={css('font-size: 12px; color: #7a5310; line-height: 1.5;')}>{textoAviso}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---- panel derecho: grilla ---- */}
        <div style={css('flex-grow: 1; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden; min-width: 0;')}>
          <div style={css('display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-bottom: 1px solid #eef1f5;')}>
            <div style={css('font-size: 13px; font-weight: 600;')}>Planilla semanal · {nomCurso}</div>
            <div style={css('font-size: 12px; color: #6b7482;')}>
              Turno {curso.turno?.nombre ?? ''} · {H} horas cátedra por día · {capacidad} por semana
            </div>
            <div style={css('flex-grow: 1;')}></div>
            <div style={css('display: flex; align-items: center; gap: 14px; font-size: 11.5px; color: #6b7482;')}>
              <span style={css('display: flex; align-items: center; gap: 6px;')}>
                <span style={css('width: 11px; height: 11px; border-radius: 3px; background: #eaf0fb; border: 1px solid #cfdcf5;')}></span>Materia
              </span>
              <span style={css('display: flex; align-items: center; gap: 6px;')}>
                <span style={css('width: 11px; height: 11px; border-radius: 3px; background: #f3edfa; border: 1px solid #ddd0ef;')}></span>EPA
              </span>
              <span style={css('display: flex; align-items: center; gap: 6px;')}>
                <span style={css('width: 11px; height: 11px; border-radius: 3px; background: #fff; border: 1px dashed #cdd4dd;')}></span>Libre
              </span>
            </div>
          </div>

          <div style={css('padding: 14px 18px 18px;')}>
            <div style={css('display: grid; grid-template-columns: 104px repeat(5, minmax(0, 1fr)); gap: 5px; margin-bottom: 5px;')}>
              <div></div>
              {DIAS.map((n) => (
                <div key={n} style={css('font-size: 12px; color: #4a5462; text-align: center; padding-bottom: 3px; font-weight: 500;')}>
                  {n}
                </div>
              ))}
            </div>

            {filas.map((row) =>
              row.esRecreo ? (
                <div key={row.key} style={css('display: grid; grid-template-columns: 104px minmax(0, 1fr); gap: 5px; margin-bottom: 5px;')}>
                  <div className="mono" style={css('display: flex; align-items: center; font-size: 10.5px; color: #9aa3af;')}>{row.horario}</div>
                  <div
                    style={css(
                      'height: 20px; border-radius: 6px; background: repeating-linear-gradient(135deg, #f2f4f7 0 6px, #f8f9fb 6px 12px); display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 600; color: #8b95a5; letter-spacing: 0.04em;',
                    )}
                  >
                    Recreo
                  </div>
                </div>
              ) : (
                <div key={row.key} style={css('display: grid; grid-template-columns: 104px repeat(5, minmax(0, 1fr)); gap: 5px; margin-bottom: 5px;')}>
                  <div style={css('display: flex; flex-direction: column; justify-content: center; gap: 1px;')}>
                    <span style={css('font-size: 12px; font-weight: 500; color: #4a5462;')}>{row.hora}</span>
                    <span className="mono" style={css('font-size: 10.5px; color: #8b95a5;')}>{row.horario}</span>
                  </div>
                  {row.celdas.map((c, i) => (
                    <div key={i} style={css(c.estilo)}>
                      <div style={css(c.tituloEstilo)}>{c.titulo}</div>
                      <div className="mono" style={css(c.subEstilo)}>
                        {c.sub}
                      </div>
                    </div>
                  ))}
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

