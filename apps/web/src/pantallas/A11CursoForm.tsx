// A11 · Alta y edición de curso. Prototipo: <template id="tpl-cursoform"> y DC.registrar("cursoform") en prototipo/index.html.
// Consulta el curso en edición (get_curso) y, para los selectores, años académicos, orientaciones y turnos.
// Las materias que se ofrecen son las del plan de estudios del año y la orientación elegidos
// (orientacion.get_plan_de_estudios({ id_anio_academico, id_orientacion }), cuando están los dos); en la edición
// también las que el curso ya dicta fuera de ese plan (curso.materias).
// Alta (/cursos/nuevo): crear_curso + asignar_curso_a_anio_academico + asignar_materia_a_curso por cada materia elegida.
// Edición (/cursos/:id): año (asignar_curso_a_anio_academico), orientación (orientacion.asignar_curso_a_orientacion)
// y materias (asignar_materia_a_curso, cambiar_horas_materia_curso, quitar_materia_curso).
// División, turno y ciclo no se cambian en un curso existente: la API no tiene command para eso.
import { useEffect, useMemo, useState } from 'react';
import type { AnioAcademico } from '@sahs/contratos';
import { horarios, orientacion as apiOrientacion, planificacion } from '../api';
import { mensajeDeError } from '../api/http';
import { useIr, useParamRuta } from '../app/navegar';
import { rutas } from '../app/rutas';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useConsulta, useInvalidar } from '../estado/consultas';
import { css } from '../lib/css';

const ACCENT = '#2f5fd0';

const AREAS: Record<string, string> = {
  Exactas: '#3a6fd8',
  'Lengua y Literatura': '#1f8f7a',
  Sociales: '#7a54c4',
  Pastoral: '#c08430',
  Artes: '#c04f7a',
};

const CAMPO =
  'width: 100%; box-sizing: border-box; height: 42px; padding: 0 10px; border-radius: 8px;' +
  ' font-size: 13px; color: #14181f; background: #fcfdfe; border: 1px solid #dfe4ea;';
const CAMPO_FIJO = CAMPO + ' background: #f4f6f8; color: #6b7482;';

const DIVISIONES = ['A', 'B', 'C', 'D', 'E'];

/** "1° año" → 1. */
function numeroDeAnio(anios: AnioAcademico[] | undefined, id: number | null | undefined): number | null {
  const a = anios?.find((x) => x.id_anio_academico === id);
  if (!a) return null;
  const n = parseInt(a.anio_curricular, 10);
  return isNaN(n) ? null : n;
}

interface Form {
  idAnio: number | null;
  division: string;
  idCiclo: number | null;
  idOrientacion: number | null;
  idTurno: number | null;
  /** id_materia → horas semanales en el curso. */
  elegidas: Record<number, number>;
}

export default function A11CursoForm() {
  const ir = useIr();
  const ciclo = useCiclo();
  const invalidar = useInvalidar();
  const idCurso = useParamRuta('id');
  const esNuevo = idCurso == null;

  const qCurso = useConsulta(['planificacion', 'get_curso', idCurso], () => planificacion.get_curso(idCurso!), { enabled: !esNuevo, retry: false });
  const qAnios = useConsulta(['planificacion', 'get_anios_academicos'], () => planificacion.get_anios_academicos());
  const qOrient = useConsulta(['orientacion', 'get_orientaciones'], () => apiOrientacion.get_orientaciones());
  const qTurnos = useConsulta(['horarios', 'get_turnos'], () => horarios.get_turnos());
  const curso = esNuevo ? null : qCurso.data ?? null;

  const [f, setF] = useState<Form>({ idAnio: null, division: 'A', idCiclo: null, idOrientacion: null, idTurno: null, elegidas: {} });
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Plan de estudios del año y la orientación elegidos.
  const qPlan = useConsulta(
    ['orientacion', 'get_plan_de_estudios', { id_anio_academico: f.idAnio, id_orientacion: f.idOrientacion }],
    () => apiOrientacion.get_plan_de_estudios({ id_anio_academico: f.idAnio!, id_orientacion: f.idOrientacion! }),
    { enabled: f.idAnio != null && f.idOrientacion != null },
  );

  const anios = useMemo(() => [...(qAnios.data ?? [])].sort((a, b) => a.id_anio_academico - b.id_anio_academico), [qAnios.data]);
  const turnos = qTurnos.data ?? [];

  // Carga del formulario: valores por defecto en el alta, o los del curso en la edición.
  const listo = (esNuevo || !qCurso.isLoading) && !!qAnios.data && !!qOrient.data && !!qTurnos.data;
  const claveCarga = esNuevo ? 'nuevo' : curso ? 'curso-' + curso.id_curso : null;
  useEffect(() => {
    if (!listo || !claveCarga) return;
    if (curso) {
      const e: Record<number, number> = {};
      (curso.materias ?? []).forEach((m) => (e[m.id_materia] = m.horas_semanales));
      setF({
        idAnio: curso.id_anio_academico ?? null,
        division: curso.division,
        idCiclo: curso.id_ciclo_lectivo,
        idOrientacion: curso.id_orientacion,
        idTurno: curso.id_turno,
        elegidas: e,
      });
    } else {
      setF({
        idAnio: anios[0]?.id_anio_academico ?? null,
        division: 'A',
        idCiclo: ciclo.activo?.id_ciclo_lectivo ?? null,
        idOrientacion: null,
        idTurno: turnos[0]?.id_turno ?? null,
        elegidas: {},
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, claveCarga]);

  if (!listo) {
    return (
      <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
        <Cabecera />
        <div className="r-margen" style={css('padding: 20px 28px;')}>
          <MensajeError mensaje={(qAnios.error ?? qOrient.error ?? qTurnos.error)?.message} />
          <Cargando />
        </div>
      </div>
    );
  }

  const anioNum = numeroDeAnio(anios, f.idAnio);
  const anioTxt = anioNum != null ? anioNum + '°' : '?°';
  const or = qOrient.data!.find((o) => o.id_orientacion === f.idOrientacion) ?? null;
  const nombreOr = or?.nombre_orientacion ?? '';
  const cicloSel = ciclo.ciclos.find((c) => c.id_ciclo_lectivo === f.idCiclo) ?? null;
  const anioCal = cicloSel?.anio_calendario ?? '';

  // Plan: materias del año y la orientación (ya ordenadas); en la edición también las que el curso ya dicta fuera de ese plan.
  type Fila = { id_materia: number; nombre_materia: string; horas_semanales: number; nombre_area?: string | null; fueraDelPlan: boolean };
  const plan: Fila[] =
    f.idOrientacion == null ? [] : (qPlan.data?.[0]?.orientaciones[0]?.materias ?? []).map((m) => ({ ...m, fueraDelPlan: false }));
  for (const m of qPlan.isLoading ? [] : curso?.materias ?? []) {
    if (f.elegidas[m.id_materia] != null && !plan.some((x) => x.id_materia === m.id_materia)) plan.push({ ...m, fueraDelPlan: true });
  }
  const elegidaHoras = (m: Fila) => f.elegidas[m.id_materia];
  const total = plan.reduce((s, m) => s + (elegidaHoras(m) ?? 0), 0);
  const cantidad = plan.filter((m) => elegidaHoras(m) != null).length;

  const identificacion = anioTxt + ' ' + f.division + (nombreOr ? ' · ' + nombreOr : '') + ' · ' + anioCal;
  const puedeGuardar = !guardando && f.idAnio != null && f.idOrientacion != null && f.idTurno != null && f.idCiclo != null;

  const cambiar = (p: Partial<Form>) => {
    setF((x) => ({ ...x, ...p }));
    setError(null);
    setAviso(null);
  };

  async function guardar() {
    if (!puedeGuardar) return;
    setError(null);
    setAviso(null);
    setGuardando(true);
    const elegidas = plan.filter((m) => elegidaHoras(m) != null);
    try {
      if (esNuevo) {
        const nuevo = await planificacion.crear_curso({ division: f.division, id_ciclo_lectivo: f.idCiclo!, id_turno: f.idTurno!, id_orientacion: f.idOrientacion! });
        await planificacion.asignar_curso_a_anio_academico(f.idAnio!, { id_curso: nuevo.id_curso });
        const fallas: string[] = [];
        for (const m of elegidas) {
          try {
            await planificacion.asignar_materia_a_curso(nuevo.id_curso, { id_materia: m.id_materia, horas_semanales: elegidaHoras(m) });
          } catch (e) {
            fallas.push(m.nombre_materia + ': ' + mensajeDeError(e));
          }
        }
        await invalidar('planificacion', 'orientacion');
        setAviso(
          identificacion +
            ' quedó creado con ' +
            (elegidas.length - fallas.length) +
            ' materias y ' +
            total +
            ' horas semanales.',
        );
        if (fallas.length) setError('No se pudieron agregar algunas materias. ' + fallas.join(' · '));
        ir(rutas.curso(nuevo.id_curso));
      } else {
        const c = curso!;
        if (f.idAnio !== (c.id_anio_academico ?? null)) await planificacion.asignar_curso_a_anio_academico(f.idAnio!, { id_curso: c.id_curso });
        if (f.idOrientacion !== c.id_orientacion) await apiOrientacion.asignar_curso_a_orientacion(f.idOrientacion!, { id_curso: c.id_curso });
        const antes = new Map((c.materias ?? []).map((m) => [m.id_materia, m.horas_semanales]));
        for (const [id] of antes) if (f.elegidas[id] == null) await planificacion.quitar_materia_curso(c.id_curso, id);
        for (const [idTxt, horas] of Object.entries(f.elegidas)) {
          const id = Number(idTxt);
          if (!antes.has(id)) await planificacion.asignar_materia_a_curso(c.id_curso, { id_materia: id, horas_semanales: horas });
          else if (antes.get(id) !== horas) await planificacion.cambiar_horas_materia_curso(c.id_curso, id, { horas_semanales: horas });
        }
        await invalidar('planificacion', 'orientacion');
        setAviso('Los cambios de ' + identificacion + ' quedaron guardados.');
      }
    } catch (e) {
      await invalidar('planificacion', 'orientacion');
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div className="r-margen" style={css('padding: 22px 28px 20px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div className="r-envolver" style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482; margin-bottom: 14px;')}>
          <span onClick={() => ir(rutas.cursos())} style={css('display: flex; align-items: center; gap: 6px; color: #2f5fd0; cursor: pointer;')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6"></path>
            </svg>
            Volver al listado
          </span>
          <span style={css('color: #c3cad4;')}>/</span>
          <span>Cursos</span>
          <span style={css('color: #c3cad4;')}>/</span>
          <span style={css('color: #14181f; font-weight: 500;')}>{esNuevo ? 'Nuevo' : identificacion}</span>
        </div>

        <div className="r-envolver r-apilar-movil" style={css('display: flex; align-items: flex-end; gap: 20px;')}>
          <div className="r-titulo" style={css('font-size: 26px; font-weight: 600; letter-spacing: -0.025em;')}>{esNuevo ? 'Nuevo curso' : identificacion}</div>
        </div>
      </div>

      {!esNuevo && !curso ? (
        <div className="r-margen" style={css('padding: 20px 28px;')}>
          <MensajeError mensaje={qCurso.error?.message ?? 'No existe el curso ' + idCurso + '.'} />
        </div>
      ) : (
        <div className="r-margen r-apilar" style={css('display: flex; gap: 18px; padding: 20px 28px 28px; align-items: flex-start;')}>
          <div style={css('width: 440px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;')}>
            <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
              <div style={css('padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
                <div style={css('font-size: 13px; font-weight: 600;')}>Identificación del curso</div>
              </div>
              <div style={css('padding: 20px; display: flex; flex-direction: column; gap: 18px;')}>
                <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                  <div style={css('display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;')}>
                    <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                      <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Año curricular *</label>
                      <select
                        value={f.idAnio ?? ''}
                        onChange={(e) => {
                          // Cambiar de año cambia el plan de estudios: las materias se vuelven a elegir.
                          cambiar({ idAnio: Number(e.target.value), elegidas: {} });
                        }}
                        style={css(CAMPO)}
                      >
                        {anios.map((a) => (
                          <option key={a.id_anio_academico} value={a.id_anio_academico}>
                            {a.anio_curricular}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                      <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>División *</label>
                      <select
                        value={f.division}
                        disabled={!esNuevo}
                        onChange={(e) => cambiar({ division: e.target.value })}
                        style={css(esNuevo ? CAMPO : CAMPO_FIJO)}
                      >
                        {(DIVISIONES.includes(f.division) ? DIVISIONES : [...DIVISIONES, f.division]).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                      <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Ciclo *</label>
                      <select
                        value={f.idCiclo ?? ''}
                        disabled={!esNuevo}
                        onChange={(e) => cambiar({ idCiclo: Number(e.target.value) })}
                        style={css(esNuevo ? CAMPO : CAMPO_FIJO)}
                      >
                        {[...ciclo.ciclos]
                          .sort((a, b) => a.anio_calendario - b.anio_calendario)
                          .map((c) => (
                            <option key={c.id_ciclo_lectivo} value={c.id_ciclo_lectivo}>
                              {c.anio_calendario}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                  <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Orientación *</label>
                  <select
                    value={f.idOrientacion ?? ''}
                    onChange={(e) => cambiar({ idOrientacion: e.target.value ? Number(e.target.value) : null, elegidas: {} })}
                    style={css(CAMPO)}
                  >
                    <option value="">Seleccioná una orientación</option>
                    {qOrient.data!.map((o) => (
                      <option key={o.id_orientacion} value={o.id_orientacion}>
                        {o.nombre_orientacion}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                  <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Turno *</label>
                  <select
                    value={f.idTurno ?? ''}
                    disabled={!esNuevo}
                    onChange={(e) => cambiar({ idTurno: Number(e.target.value) })}
                    style={css(esNuevo ? CAMPO : CAMPO_FIJO)}
                  >
                    {turnos.map((t) => (
                      <option key={t.id_turno} value={t.id_turno}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={css('display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 9px; background: #fafbfc; border: 1px solid #eef1f5;')}>
                  <span
                    style={css(
                      'width: 42px; height: 42px; border-radius: 10px; background: ' +
                        ACCENT +
                        '; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; flex-shrink: 0;',
                    )}
                  >
                    {anioTxt + ' ' + f.division}
                  </span>
                  <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
                    <div style={css('font-size: 17px; font-weight: 600; letter-spacing: -0.01em;')}>{identificacion}</div>
                  </div>
                </div>

                {error && (
                  <div style={css('display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 9px; background: #fbeceb; border: 1px solid #edc9c4;')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b03a2e" strokeWidth="2.2" strokeLinecap="round" style={css('flex-shrink: 0; margin-top: 1px;')}>
                      <path d="M12 8v5M12 16.5v.5"></path>
                      <circle cx="12" cy="12" r="9"></circle>
                    </svg>
                    <span style={css('font-size: 12.5px; color: #b03a2e; line-height: 1.5;')}>{error}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; gap: 14px;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Carga horaria semanal</div>
              <div style={css('display: flex; align-items: baseline; gap: 9px;')}>
                <span className="mono" style={css('font-size: 30px; font-weight: 600; color: ' + ACCENT + ';')}>
                  {total}
                </span>
                <span style={css('font-size: 12.5px; color: #6b7482;')}>horas semanales</span>
              </div>
              <button
                onClick={guardar}
                disabled={!puedeGuardar}
                style={css(
                  'height: 44px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600;' +
                    ' background: ' +
                    (puedeGuardar ? ACCENT : '#e2e6ec') +
                    ';' +
                    ' color: ' +
                    (puedeGuardar ? '#fff' : '#a8b0bb') +
                    ';',
                )}
              >
                {guardando ? 'Guardando…' : esNuevo ? 'Crear el curso' : 'Guardar cambios'}
              </button>
              {aviso && (
                <div style={css('display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 9px; background: #ecf5ef; border: 1px solid #c2e0cd;')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2f6b45" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0; margin-top: 1px;')}>
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  <span style={css('font-size: 12.5px; color: #2f6b45; line-height: 1.5;')}>{aviso}</span>
                </div>
              )}
            </div>
          </div>

          <div style={css('flex-grow: 1; min-width: 0; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div className="r-envolver" style={css('display: flex; align-items: center; gap: 12px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
                <div style={css('font-size: 13px; font-weight: 600;')}>Materias a dictar</div>
                <div style={css('font-size: 12px; color: #6b7482;')}>
                  Del plan de estudios de {anioTxt + ' año' + (nombreOr ? ', orientación ' + nombreOr : '')}
                </div>
              </div>
              <div style={css('flex-grow: 1;')}></div>
              <div
                style={css(
                  'font-size: 11.5px; font-weight: 600; padding: 5px 11px; border-radius: 13px;' +
                    (cantidad > 0 ? ' background: #e9f2ec; color: #2f6b45;' : ' background: #f2f4f7; color: #7a8393;'),
                )}
              >
                {cantidad === 0 ? 'Ninguna elegida' : cantidad === 1 ? '1 materia · ' + total + ' h' : cantidad + ' materias · ' + total + ' h'}
              </div>
            </div>

            {plan.length > 0 ? (
              <div>
                {plan.map((m, i) => {
                  const horasEl = elegidaHoras(m);
                  const elegida = horasEl != null;
                  const horas = horasEl ?? m.horas_semanales;
                  const area = m.nombre_area ?? '';
                  const fueraDelPlan = m.fueraDelPlan;
                  const toggle = () => {
                    const e = { ...f.elegidas };
                    if (elegida) delete e[m.id_materia];
                    else e[m.id_materia] = m.horas_semanales;
                    cambiar({ elegidas: e });
                  };
                  const sumar = (d: number) => {
                    if (!elegida) return;
                    cambiar({ elegidas: { ...f.elegidas, [m.id_materia]: Math.max(1, horas + d) } });
                  };
                  const botonEstilo =
                    'width: 26px; height: 26px; border-radius: 6px; font-size: 15px; line-height: 1;' +
                    ' display: flex; align-items: center; justify-content: center;' +
                    ' border: 1px solid ' +
                    (elegida ? '#dfe4ea' : '#eef1f5') +
                    ';' +
                    ' background: #fff; color: ' +
                    (elegida ? '#4a5462' : '#cdd4dd') +
                    ';';
                  return (
                    <div
                      key={m.id_materia}
                      style={css(
                        'display: flex; align-items: center; gap: 12px;' + ' padding: 11px 20px;' + (i === 0 ? '' : ' border-top: 1px solid #f2f4f7;') + (elegida ? '' : ' background: #fdfdfe;'),
                      )}
                    >
                      <button
                        onClick={toggle}
                        aria-label={elegida ? 'Quitar ' + m.nombre_materia : 'Agregar ' + m.nombre_materia}
                        style={css(
                          'width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0; display: flex;' +
                            ' align-items: center; justify-content: center; padding: 0;' +
                            ' border: 1.5px solid ' +
                            (elegida ? ACCENT : '#cdd4dd') +
                            ';' +
                            ' background: ' +
                            (elegida ? ACCENT : '#fff') +
                            ';',
                        )}
                      >
                        {elegida && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5"></path>
                          </svg>
                        )}
                      </button>
                      <div style={css('width: 4px; height: 28px; border-radius: 3px; background: ' + (AREAS[area] ?? '#c3cad4') + '; flex-shrink: 0;')}></div>
                      <div style={css('display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0;')}>
                        <div style={css('font-size: 13.5px; font-weight: 500;' + ' color: ' + (elegida ? '#14181f' : '#8b95a5') + ';')}>{m.nombre_materia}</div>
                        <div style={css('font-size: 11.5px; color: #8b95a5;')}>
                          {(area || 'Sin área') + (fueraDelPlan ? ' · fuera del plan de este año y orientación' : '')}
                        </div>
                      </div>
                      <div style={css('display: flex; align-items: center; gap: 3px; flex-shrink: 0;')}>
                        <button onClick={() => sumar(-1)} style={css(botonEstilo)}>
                          −
                        </button>
                        <div className="mono" style={css('width: 40px; text-align: center; font-size: 13px; font-weight: 500;' + ' color: ' + (elegida ? '#14181f' : '#b9c1cc') + ';')}>
                          {horas + ' h'}
                        </div>
                        <button onClick={() => sumar(1)} style={css(botonEstilo)}>
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : qPlan.isLoading ? (
              <Cargando />
            ) : (
              <div style={css('padding: 40px 28px; display: flex; flex-direction: column; align-items: center; gap: 13px; text-align: center;')}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b9c1cc" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4.5A1.5 1.5 0 015.5 3H19v18H5.5A1.5 1.5 0 014 19.5v-15z"></path>
                  <path d="M8 3v18"></path>
                </svg>
                <div style={css('font-size: 13px; color: #6b7482; line-height: 1.6; max-width: 330px;')}>
                  {!or ? 'Elegí la orientación del curso.' : 'El plan de estudios de ' + anioTxt + ' año (' + nombreOr + ') no tiene materias cargadas.'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
