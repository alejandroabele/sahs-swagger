// A3 · Generación de la planilla anual. Prototipo: <template id="tpl-main"> y DC.registrar("main")
// en prototipo/index.html.
// Ruta: /planificaciones/:id/generacion y /planificaciones/:id/generacion/:idCurso. Sin curso en la
// ruta se abre el primero del ciclo. Muestra la grilla del curso con sus clases guardadas en la
// propuesta y la carga horaria de cada materia. "Generar planilla automáticamente" llama a
// generar_planilla con el curso: la API completa las horas que faltan (siempre respetando la
// disponibilidad declarada) y guarda el resultado; acá solo se recarga y se muestra el resumen.
import { useEffect, useMemo, useState } from 'react';
import type { ResultadoGeneracion } from '@sahs/contratos';
import { planificacion } from '../api';
import { mensajeDeError } from '../api/http';
import { useIr, useParamRuta } from '../app/navegar';
import { rutas } from '../app/rutas';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useAccion, useConsulta } from '../estado/consultas';
import { css } from '../lib/css';
import { DIAS } from '../lib/formato';
import { ACCENT, areaDe, armarGrilla, esDeADos, nombreCurso, nombreProfesor, ordenarCursos } from './a13/modelo';
import './a3/responsive.css';

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
  const ir = useIr();
  const idPropParam = useParamRuta('id');
  const idCursoParam = useParamRuta('idCurso');

  // ---- datos: propuesta, cursos del ciclo, años y las clases del curso visible en la propuesta.
  const qPropuesta = useConsulta(['planificacion', 'get_propuesta', idPropParam], () => planificacion.get_propuesta(idPropParam!), {
    enabled: !!idPropParam,
  });
  const propuesta = idPropParam ? qPropuesta.data : undefined;
  const idCiclo = propuesta?.id_ciclo_lectivo;
  const idProp = propuesta?.id_propuesta;

  const qCursos = useConsulta(['planificacion', 'get_cursos', idCiclo], () => planificacion.get_cursos({ id_ciclo_lectivo: idCiclo! }), {
    enabled: !!idCiclo,
  });
  const qAnios = useConsulta(['planificacion', 'get_anios_academicos'], () => planificacion.get_anios_academicos());

  const anios = qAnios.data ?? [];
  const cursos = useMemo(() => ordenarCursos(qCursos.data ?? [], anios), [qCursos.data, anios]);
  const curso = (idCursoParam && cursos.find((c) => c.id_curso === idCursoParam)) || null;
  const idCurso = curso?.id_curso;

  const qClases = useConsulta(
    ['planificacion', 'get_clases', { id_propuesta: idProp, id_curso: idCurso }],
    () => planificacion.get_clases({ id_propuesta: idProp!, id_curso: idCurso! }),
    { enabled: !!idProp && !!idCurso },
  );
  const clasesCurso = qClases.data ?? [];

  const acc = useAccion((fn: () => Promise<unknown>) => fn(), ['planificacion']);

  // ---- estado de la pantalla: el resumen de la última generación del curso.
  const [res, setRes] = useState<ResultadoGeneracion | null>(null);
  useEffect(() => {
    setRes(null);
    acc.limpiarError();
    // Solo al cambiar de curso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCurso]);

  const grilla = useMemo(() => armarGrilla(curso?.franjas_horarias), [curso]);

  // Sin curso en la ruta: se abre el primero del ciclo (reemplaza la URL, no suma un paso al historial).
  const primerCurso = qAnios.data ? cursos[0]?.id_curso : undefined; // el orden necesita los años
  useEffect(() => {
    if (idProp && !idCursoParam && primerCurso) ir(rutas.generacion(idProp, primerCurso), { replace: true });
  }, [idProp, idCursoParam, primerCurso, ir]);

  const cargando = qPropuesta.isLoading || qCursos.isLoading || qAnios.isLoading;
  const errorCarga = qPropuesta.error ?? qCursos.error;

  if (!propuesta || cargando) {
    return (
      <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
        <Cabecera />
        {cargando ? (
          <Cargando />
        ) : (
          <div className="r-margen" style={css('padding: 26px 28px;')}>
            <MensajeError mensaje={errorCarga ? mensajeDeError(errorCarga) : 'No se encontró la planificación.'} />
          </div>
        )}
      </div>
    );
  }

  const miga = (
    <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
      <span onClick={() => ir(rutas.planificaciones())} style={css('display: flex; align-items: center; gap: 6px; color: #2f5fd0; cursor: pointer;')}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6"></path>
        </svg>
        Planificaciones
      </span>
      <span style={css('color: #c3cad4;')}>/</span>
      <span className="mono">{propuesta.codigo}</span>
      {curso && (
        <>
          <span style={css('color: #c3cad4;')}>/</span>
          <span style={css('color: #14181f; font-weight: 500;')}>{nombreCurso(curso, anios)}</span>
        </>
      )}
    </div>
  );

  // Cursos del ciclo: se genera la planilla de un curso a la vez.
  const barraCursos = cursos.length > 0 && (
    <div className="r-margen r-desplazar" style={css('display: flex; gap: 2px; padding: 12px 28px; background: #fff; border-bottom: 1px solid #e2e6ec;')}>
      {cursos.map((c, i) => {
        const activo = c.id_curso === curso?.id_curso;
        return (
          <button
            key={c.id_curso}
            onClick={() => ir(rutas.generacion(propuesta.id_propuesta, c.id_curso))}
            style={css(
              'display: flex; align-items: center; height: 34px; padding: 0 13px; font-size: 12.5px; font-weight: 500; white-space: nowrap;' +
                ' border: 1px solid ' + (activo ? '#14181f' : '#e2e6ec') + '; background: ' + (activo ? '#14181f' : '#fff') + '; color: ' + (activo ? '#fff' : '#4a5462') + ';' +
                ' border-radius: ' + (i === 0 ? '7px 0 0 7px' : i === cursos.length - 1 ? '0 7px 7px 0' : '0') + ';' +
                (i > 0 ? ' margin-left: -1px;' : ''),
            )}
          >
            {nombreCurso(c, anios)}
          </button>
        );
      })}
    </div>
  );

  // Sin curso en la ruta se abre el primero (useEffect de arriba); mientras tanto, la barra de cursos.
  if (!curso) {
    return (
      <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
        <Cabecera />
        <div className="r-margen" style={css('display: flex; flex-direction: column; gap: 6px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
          {miga}
          <div className="r-titulo" style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Generación de la planilla anual</div>
        </div>
        {barraCursos}
        {cursos.length === 0 && (
          <div className="r-margen" style={css('padding: 26px 28px;')}>
            <MensajeError mensaje="El ciclo lectivo de esta planificación no tiene cursos." />
          </div>
        )}
      </div>
    );
  }

  // ======== cálculo de la vista (como renderVals() del prototipo) ========
  const nomCurso = nombreCurso(curso, anios);
  const editable = propuesta.estado?.codigo === 'BOR';
  const ocupado = acc.enCurso;
  const materias = curso.materias ?? [];

  // Lo que el curso tiene guardado en la propuesta: franja → clase.
  interface Celda {
    n: string;
    area: string;
    docentes: string;
  }
  const porFranja = new Map<number, Celda>();
  const puestas = new Map<number, number>();
  const docentesDe = new Map<number, string>();
  for (const c of clasesCurso) {
    const m = materias.find((x) => x.id_materia === c.id_materia);
    const nombre = c.materia?.nombre_materia ?? m?.nombre_materia ?? 'Materia';
    const docentes = (c.profesores ?? []).map((p) => nombreProfesor(p)).join(' + ');
    if (!docentesDe.has(c.id_materia)) docentesDe.set(c.id_materia, (c.profesores ?? []).map((p) => nombreProfesor(p)).join(' · '));
    puestas.set(c.id_materia, (puestas.get(c.id_materia) ?? 0) + (c.ids_franjas_horarias ?? []).length);
    for (const f of c.ids_franjas_horarias ?? []) {
      if (grilla.porId.has(f)) porFranja.set(f, { n: nombre, area: areaDe(c.materia?.nombre_area ?? m?.nombre_area), docentes });
    }
  }

  const total = materias.reduce((n, m) => n + m.horas_semanales, 0);
  const ubicadasCurso = porFranja.size;
  const H = grilla.columnas.filter((b) => !b.es_recreo).length;
  const capacidad = grilla.horas.length;

  const filas = grilla.columnas.map((b) => {
    const horario = b.inicio + '–' + b.fin;
    if (b.es_recreo) return { key: 'r' + b.id, esRecreo: true, horario, hora: '', celdas: [] as ReturnType<typeof celdaVista>[] };
    const sl = (b.hora ?? 1) - 1;
    const celdas = DIAS.map((_, d) => {
      const bd = grilla.horasPorDia[d][sl];
      return celdaVista(bd ? porFranja.get(bd.id) ?? null : null);
    });
    return { key: 'h' + b.id, esRecreo: false, horario, hora: b.hora + '° hora', celdas };
  });

  function celdaVista(cell: Celda | null) {
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
    return {
      estilo:
        'height: ' + ALTO_CELDA + 'px; border-radius: 7px; display: flex; flex-direction: column; justify-content: center; gap: 2px; padding: 0 9px; overflow: hidden;' +
        ' background: ' + a.fondo + '; border: 1px solid ' + a.borde + ';' +
        (esEpa ? ' background-image: repeating-linear-gradient(135deg, rgba(122,84,196,0.07) 0 6px, transparent 6px 12px);' : ''),
      titulo: cell.n,
      sub: cell.docentes,
      tituloEstilo: 'font-size: 12px; font-weight: 600; color: ' + a.texto + '; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;',
      subEstilo: 'font-size: 10px; color: ' + a.texto + '; opacity: 0.82; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
    };
  }

  const sinUbicar = res ? res.sin_ubicar.reduce((n, x) => n + x.horas, 0) : 0;
  let textoAviso = '';
  if (res && res.sin_ubicar.length) {
    textoAviso =
      'Quedaron sin ubicar ' + res.sin_ubicar.map((x) => x.horas + ' h de ' + x.materia).join(', ') +
      '. No hay franja libre donde su docente esté disponible: bajá la carga horaria de esa materia o ampliá la disponibilidad declarada.';
  }
  if (res && res.errores.length) textoAviso += (textoAviso ? ' ' : '') + 'La planificación rechazó: ' + res.errores.join('; ') + '.';

  const puedeGenerar = editable && !ocupado;
  const generar = async () => {
    if (!puedeGenerar) return;
    const r = (await acc.ejecutar(() => planificacion.generar_planilla(propuesta.id_propuesta, { id_curso: curso.id_curso }))) as ResultadoGeneracion | undefined;
    if (r) setRes(r);
  };

  return (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      {/* ======= encabezado de pantalla ======= */}
      <div className="r-margen r-envolver" style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          {miga}
          <div className="r-titulo" style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Generación de la planilla anual</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <div className="r-apilar-movil" style={css('display: flex; align-items: center; gap: 14px;')}>
          <div className="a3-estado" style={css('display: flex; flex-direction: column; align-items: flex-end; gap: 5px;')}>
            <div style={css('display: flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 20px; border: 1px solid #f0dcbe; background: #fdf6ec; color: #a56a10; font-size: 12px; font-weight: 600;')}>
              <span style={css('width: 7px; height: 7px; border-radius: 50%; background: #a56a10;')}></span>
              Planificación <span className="mono">{propuesta.codigo}</span> · {propuesta.estado?.nombre ?? ''}
            </div>
          </div>
        </div>
      </div>

      {barraCursos}

      {/* ======= cuerpo ======= */}
      <div className="r-margen r-apilar" style={css('display: flex; gap: 20px; padding: 20px 28px 28px; align-items: flex-start;')}>
        {/* ---- panel izquierdo: carga horaria y generación ---- */}
        <div style={css('width: 388px; display: flex; flex-direction: column; gap: 16px; flex-shrink: 0;')}>
          {(acc.error || qClases.error) && (
            <MensajeError mensaje={acc.error ?? (qClases.error ? mensajeDeError(qClases.error) : null)} alCerrar={acc.limpiarError} />
          )}

          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('padding: 14px 16px 12px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Carga horaria semanal</div>
              <div style={css('font-size: 12px; color: #6b7482; margin-top: 3px;')}>Horas cátedra por materia para {nomCurso}</div>
            </div>

            <div className="a3-lista" style={css('max-height: 428px; overflow-y: auto;')}>
              {materias.map((m, i) => {
                const a = AREA[areaDe(m.nombre_area)] ?? AREA['Sin área'];
                const p = puestas.get(m.id_materia) ?? 0;
                const completa = p >= m.horas_semanales;
                const docentes = docentesDe.get(m.id_materia);
                return (
                  <div key={m.id_materia} style={css('display: flex; align-items: center; gap: 11px; padding: 9px 16px;' + (i === 0 ? '' : ' border-top: 1px solid #f2f4f7;'))}>
                    <div style={css('width: 4px; height: 30px; border-radius: 3px; background: ' + a.linea + '; flex-shrink: 0;')}></div>
                    <div style={css('display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0;')}>
                      <div style={css('font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>{m.nombre_materia}</div>
                      <div style={css('font-size: 11px; color: #7a8393; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>
                        {docentes || 'Sin docente asignado'}
                      </div>
                    </div>
                    <span
                      className="mono"
                      style={css(
                        'font-size: 11.5px; font-weight: 600; padding: 3px 9px; border-radius: 11px; flex-shrink: 0;' +
                          (completa ? ' background: #e9f2ec; color: #2f6b45;' : ' background: #f2f4f7; color: #7a8393;'),
                      )}
                    >
                      {completa ? '✓ ' + m.horas_semanales + ' h' : p + '/' + m.horas_semanales + ' h'}
                    </span>
                  </div>
                );
              })}
              {materias.length === 0 && <div style={css('padding: 16px; font-size: 12px; color: #8b95a5;')}>El curso no tiene materias en su plan.</div>}
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

          <button
            onClick={() => void generar()}
            disabled={!puedeGenerar}
            title={editable ? undefined : 'La planilla solo se genera con la planificación en Borrador'}
            style={css(
              'height: 46px; border-radius: 8px; border: none; background: ' + (puedeGenerar ? ACCENT : '#cdd4dd') + '; color: #fff; font-size: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 9px; box-shadow: 0 1px 2px rgba(20,24,31,0.16);',
            )}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5L13 3z"></path>
            </svg>
            {ocupado ? 'Generando…' : 'Generar planilla automáticamente'}
          </button>

          {res && (
            <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 11px;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Resultado de la generación</div>
              <div style={css('display: flex; gap: 10px;')}>
                <div style={css('flex-grow: 1; padding: 10px 12px; border-radius: 8px; background: #f2f7f3;')}>
                  <div className="mono" style={css('font-size: 19px; font-weight: 600; color: #2f6b45;')}>{res.horas_ubicadas}</div>
                  <div style={css('font-size: 11px; color: #55705f; margin-top: 1px;')}>horas ubicadas</div>
                </div>
                <div style={css('flex-grow: 1; padding: 10px 12px; border-radius: 8px; background: ' + (sinUbicar > 0 ? '#fdf4e7' : '#f5f6f8') + ';')}>
                  <div className="mono" style={css('font-size: 19px; font-weight: 600; color: ' + (sinUbicar > 0 ? '#a56a10' : '#6b7482') + ';')}>{sinUbicar}</div>
                  <div style={css('font-size: 11px; color: ' + (sinUbicar > 0 ? '#a56a10' : '#6b7482') + '; margin-top: 1px;')}>sin ubicar</div>
                </div>
                <div style={css('flex-grow: 1; padding: 10px 12px; border-radius: 8px; background: #f5f6f8;')}>
                  <div className="mono" style={css('font-size: 19px; font-weight: 600; color: #4a5462;')}>{Math.max(0, capacidad - ubicadasCurso)}</div>
                  <div style={css('font-size: 11px; color: #6b7482; margin-top: 1px;')}>franjas libres</div>
                </div>
              </div>
              {textoAviso && (
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
          <div className="r-envolver" style={css('display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-bottom: 1px solid #eef1f5;')}>
            <div style={css('font-size: 13px; font-weight: 600;')}>Planilla semanal · {nomCurso}</div>
            <div style={css('font-size: 12px; color: #6b7482;')}>
              Turno {curso.turno?.nombre ?? ''} · {H} horas cátedra por día · {capacidad} por semana
            </div>
            <div style={css('flex-grow: 1;')}></div>
            <div className="r-envolver" style={css('display: flex; align-items: center; gap: 14px; font-size: 11.5px; color: #6b7482;')}>
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

          <div className="a3-grilla" style={css('padding: 14px 18px 18px;')}>
            {/* En angosto, la grilla se desplaza horizontalmente dentro de la tarjeta (ver a3/responsive.css). */}
            <div className="a3-desplazar">
              <div className="a3-grilla-min">
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
      </div>
    </div>
  );
}

