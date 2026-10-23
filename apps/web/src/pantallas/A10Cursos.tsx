// A10 · Cursos. Prototipo: <template id="tpl-cursoslistado"> y DC.registrar("cursoslistado") en prototipo/index.html.
// Cursos del ciclo activo (get_cursos), con su turno, orientación, materias y horas, y cuántas de
// esas horas ya están ubicadas en la planificación vigente (VAL) del ciclo (get_clases de esa propuesta).
// El estado que se muestra es el de toda la planificación, no el de cada curso.
import { useMemo, useState } from 'react';
import type { AnioAcademico, Clase, Curso, Propuesta } from '@sahs/contratos';
import { planificacion } from '../api';
import { useNavegar } from '../app/navegar';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useConsulta } from '../estado/consultas';
import { css } from '../lib/css';

const ACCENT = '#2f5fd0';

const ESTADOS: Record<string, { fondo: string; texto: string }> = {
  Borrador: { fondo: '#fdf6ec', texto: '#a56a10' },
  'En revisión': { fondo: '#eef3fc', texto: '#1e4099' },
  Validada: { fondo: '#e9f2ec', texto: '#2f6b45' },
  Cerrada: { fondo: '#f2f4f7', texto: '#7a8393' },
};

const COLS = 'display: grid; grid-template-columns: 1fr 90px 92px 84px 240px 128px 28px; gap: 12px;';

/** "1° año" → 1. */
function numeroDeAnio(anios: AnioAcademico[] | undefined, id: number | null | undefined): number | null {
  const a = anios?.find((x) => x.id_anio_academico === id);
  if (!a) return null;
  const n = parseInt(a.anio_curricular, 10);
  return isNaN(n) ? null : n;
}

/**
 * Planificación que se muestra para el ciclo: la vigente (Validada); si no hay, la última cerrada
 * (un ciclo terminado queda con su planificación cerrada como histórico).
 */
function planDelCiclo(propuestas: Propuesta[] | undefined): Propuesta | null {
  const l = [...(propuestas ?? [])].sort((a, b) => b.codigo.localeCompare(a.codigo));
  return l.find((p) => p.estado?.codigo === 'VAL') ?? l.find((p) => p.estado?.codigo === 'CER') ?? null;
}

/** Horas ubicadas del curso: franjas de sus clases, sin pasarse de las horas de cada materia. */
function horasUbicadas(curso: Curso, clases: Clase[]): number {
  let n = 0;
  for (const c of clases) {
    if (c.id_curso !== curso.id_curso) continue;
    const franjas = (c.ids_franjas_horarias ?? c.franjas_horarias?.map((f) => f.id_franja_horaria) ?? []).length;
    const horas = curso.materias?.find((m) => m.id_materia === c.id_materia)?.horas_semanales ?? franjas;
    n += Math.min(franjas, horas);
  }
  return n;
}

export default function A10Cursos() {
  const ciclo = useCiclo();
  const ir = useNavegar();
  const [sel, setSel] = useState<number | null>(null);
  const idCiclo = ciclo.activo?.id_ciclo_lectivo ?? null;
  const anioCiclo = ciclo.activo?.anio_calendario ?? null;

  const qCursos = useConsulta(['planificacion', 'get_cursos', idCiclo], () => planificacion.get_cursos({ id_ciclo_lectivo: idCiclo! }), {
    enabled: !!idCiclo,
  });
  const qAnios = useConsulta(['planificacion', 'get_anios_academicos'], () => planificacion.get_anios_academicos());
  const qProp = useConsulta(['planificacion', 'get_propuestas', idCiclo], () => planificacion.get_propuestas({ id_ciclo_lectivo: idCiclo! }), {
    enabled: !!idCiclo,
  });
  const plan = planDelCiclo(qProp.data);
  const qClases = useConsulta(['planificacion', 'get_clases', { id_propuesta: plan?.id_propuesta }], () => planificacion.get_clases({ id_propuesta: plan!.id_propuesta }), {
    enabled: !!plan,
  });

  const visibles = useMemo(() => {
    const l = (qCursos.data ?? []).map((c) => ({ c, anio: numeroDeAnio(qAnios.data, c.id_anio_academico) }));
    return l.sort((a, b) => (a.anio ?? 99) - (b.anio ?? 99) || a.c.division.localeCompare(b.c.division));
  }, [qCursos.data, qAnios.data]);

  const pe = plan?.estado ? ESTADOS[plan.estado.nombre] ?? ESTADOS.Cerrada : null;
  const seleccionado = visibles.find((v) => v.c.id_curso === sel) ?? null;
  const cargando = !ciclo.activo || qCursos.isLoading || qAnios.isLoading;
  const error = qCursos.error ?? qAnios.error ?? qProp.error ?? qClases.error;

  return (
    <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir('A1')} style={css('cursor: pointer;')}>
              Inicio
            </span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span style={css('color: #14181f; font-weight: 500;')}>Cursos</span>
          </div>
          <div style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Cursos del nivel secundario</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <button
          onClick={() => ir('A11', { nuevo: 1 })}
          style={css(
            'display: flex; align-items: center; gap: 9px; height: 40px; padding: 0 17px; border-radius: 8px; border: none; background: ' +
              ACCENT +
              '; color: #fff; font-size: 13px; font-weight: 600;',
          )}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          Nuevo curso
        </button>
      </div>

      <div style={css('padding: 20px 28px 28px; display: flex; flex-direction: column; gap: 14px;')}>
        {error && <MensajeError mensaje={error.message} />}
        <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
          <div style={css('display: flex; align-items: center; gap: 14px; padding: 15px 20px; border-bottom: 1px solid #eef1f5;')}>
            <span style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Ciclo lectivo</span>
            <div style={css('display: flex; gap: 2px;')}>
              {ciclo.ciclos.map((c, i) => {
                const activo = anioCiclo === c.anio_calendario;
                const n = ciclo.ciclos.length;
                return (
                  <button
                    key={c.id_ciclo_lectivo}
                    onClick={() => {
                      ciclo.fijar(c.anio_calendario);
                      setSel(null);
                    }}
                    style={css(
                      'height: 30px; padding: 0 14px; font-size: 12px; font-weight: 500;' +
                        ' border: 1px solid ' +
                        (activo ? '#14181f' : '#e2e6ec') +
                        ';' +
                        ' background: ' +
                        (activo ? '#14181f' : '#fff') +
                        '; color: ' +
                        (activo ? '#fff' : '#4a5462') +
                        ';' +
                        ' border-radius: ' +
                        (n === 1 ? '7px' : i === 0 ? '7px 0 0 7px' : i === n - 1 ? '0 7px 7px 0' : '0') +
                        ';' +
                        (i > 0 ? ' margin-left: -1px;' : ''),
                    )}
                  >
                    {c.anio_calendario}
                  </button>
                );
              })}
            </div>
            <div style={css('flex-grow: 1;')}></div>
            <span style={css('display: flex; align-items: center; gap: 7px; font-size: 12px; color: #6b7482;')}>
              {plan ? (plan.estado?.codigo === 'VAL' ? 'Planificación vigente' : 'Última planificación') : 'Todavía no hay planificación vigente en ' + (anioCiclo ?? '')}
              <span className="mono" style={css('color: #14181f; font-weight: 500;')}>
                {plan ? plan.codigo : ''}
              </span>
              {plan && pe && (
                <span style={css('font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 12px; background: ' + pe.fondo + '; color: ' + pe.texto + ';')}>
                  {plan.estado?.nombre}
                </span>
              )}
            </span>
            <span style={css('color: #c3cad4;')}>·</span>
            <span style={css('font-size: 12px; color: #6b7482;')}>
              {cargando ? '…' : visibles.length === 0 ? 'Todavía no hay cursos en ' + (anioCiclo ?? '') : visibles.length === 1 ? '1 curso' : visibles.length + ' cursos'}
            </span>
          </div>

          <div style={css(COLS + ' padding: 10px 20px; background: #fafbfc; border-bottom: 1px solid #eef1f5;')}>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Curso</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Ciclo</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393; text-align: right;')}>Materias</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393; text-align: right;')}>Horas</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Ocupación semanal</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>En la planificación</div>
            <div></div>
          </div>

          <div>
            {cargando && <Cargando />}
            {!cargando &&
              visibles.map(({ c, anio }) => {
                const activa = sel === c.id_curso;
                const nombre = (anio ?? '?') + '° ' + c.division;
                const materias = c.materias ?? [];
                const horas = materias.reduce((s, m) => s + m.horas_semanales, 0);
                const ubicadas = plan ? horasUbicadas(c, qClases.data ?? []) : 0;
                // Capacidad: solo horas cátedra del turno (los recreos no se ocupan), toda la semana.
                const capacidad = (c.franjas_horarias ?? []).filter((f) => !f.es_recreo).length;
                const completo = horas > 0 && ubicadas >= horas;
                const avColor = completo ? '#2f6b45' : ubicadas > 0 ? '#a56a10' : '#8b95a5';
                const pct = capacidad ? Math.round((horas / capacidad) * 100) : 0;
                const incompleto = (anio ?? 0) <= 3 && materias.length < 5;
                const turno = c.turno?.nombre ?? '—';
                const orientacion = c.orientacion?.nombre_orientacion ?? '—';
                return (
                  <button
                    key={c.id_curso}
                    onClick={() => ir('A11', { id_curso: c.id_curso })}
                    onMouseEnter={() => setSel(c.id_curso)}
                    onMouseLeave={() => setSel(null)}
                    style={css(
                      COLS +
                        ' width: 100%; padding: 12px 20px;' +
                        ' border: none; border-top: 1px solid #f2f4f7; text-align: left;' +
                        ' background: ' +
                        (activa ? '#f3f6fc' : '#fff') +
                        ';' +
                        (activa ? ' box-shadow: inset 3px 0 0 ' + ACCENT + ';' : ''),
                    )}
                  >
                    <span style={css('display: flex; align-items: center; gap: 12px; min-width: 0; text-align: left;')}>
                      <span
                        style={css(
                          'width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0; display: flex;' +
                            ' align-items: center; justify-content: center; font-size: 12.5px; font-weight: 600;' +
                            ' background: ' +
                            (activa ? ACCENT : '#eef1f5') +
                            '; color: ' +
                            (activa ? '#fff' : '#5b6471') +
                            ';',
                        )}
                      >
                        {(anio ?? '?') + '°'}
                      </span>
                      <span style={css('display: flex; flex-direction: column; gap: 2px; min-width: 0;')}>
                        <span style={css('font-size: 13.5px; font-weight: 500;')}>{nombre + ' · ' + (anioCiclo ?? '')}</span>
                        <span style={css('font-size: 11.5px; color: #8b95a5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>
                          {'Turno ' +
                            turno +
                            ' · Orientación ' +
                            orientacion +
                            ' · ' +
                            (anio == null
                              ? 'Sin año académico asignado'
                              : incompleto
                                ? 'El plan de ' + anio + '° año todavía no tiene materias suficientes'
                                : materias.length + ' materias del plan de ' + anio + '° año')}
                        </span>
                      </span>
                    </span>
                    <span className="mono" style={css('font-size: 12.5px; color: #4a5462; align-self: center; text-align: left;')}>
                      {anioCiclo}
                    </span>
                    <span className="mono" style={css('font-size: 12.5px; color: #4a5462; align-self: center; text-align: right;')}>
                      {materias.length}
                    </span>
                    <span className="mono" style={css('font-size: 12.5px; color: #4a5462; align-self: center; text-align: right;')}>
                      {horas + ' h'}
                    </span>
                    <span style={css('align-self: center; display: flex; align-items: center; gap: 9px; padding-right: 12px;')}>
                      <span style={css('flex-grow: 1; height: 6px; border-radius: 3px; background: #eef1f5; overflow: hidden;')}>
                        <span style={css('display: block; height: 6px; width: ' + Math.min(100, pct) + '%; background: ' + (incompleto ? '#e0a458' : ACCENT) + ';')}></span>
                      </span>
                      <span className="mono" style={css('font-size: 11px; color: #8b95a5; flex-shrink: 0;')}>
                        {pct + '%'}
                      </span>
                    </span>
                    <span style={css('align-self: center; display: flex; flex-direction: column; gap: 4px; text-align: left; padding-right: 8px;')}>
                      <span className="mono" style={css('font-size: 11.5px; font-weight: 600; color: ' + (plan ? avColor : '#8b95a5') + ';')}>
                        {plan ? ubicadas + ' de ' + horas + ' h' : 'Sin planificación'}
                      </span>
                      <span style={css('height: 3px; border-radius: 2px; background: #eef1f5; overflow: hidden;')}>
                        <span
                          style={css(
                            'display: block; height: 3px; width: ' + (plan && horas ? Math.min(100, Math.round((ubicadas / horas) * 100)) : 0) + '%; background: ' + avColor + ';',
                          )}
                        ></span>
                      </span>
                    </span>
                    <span style={css('align-self: center; display: flex; justify-content: flex-end;')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={activa ? '#14181f' : '#c3cad4'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 6l6 6-6 6"></path>
                      </svg>
                    </span>
                  </button>
                );
              })}
          </div>

          <div
            style={css(
              'display: flex; align-items: center; gap: 10px; padding: 13px 20px; border-top: 1px solid #eef1f5;' + ' background: ' + (seleccionado ? '#f3f6fc' : '#fafbfc') + ';',
            )}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={seleccionado ? ACCENT : '#8b95a5'} strokeWidth="2" strokeLinecap="round" style={css('flex-shrink: 0;')}>
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 11.5v5M12 8v.5"></path>
            </svg>
            <span style={css('font-size: 12.5px; color: ' + (seleccionado ? '#2c4570' : '#6b7482') + '; line-height: 1.5;')}>
              {seleccionado
                ? (seleccionado.anio ?? '?') +
                  '° ' +
                  seleccionado.c.division +
                  ' · ' +
                  (anioCiclo ?? '') +
                  ' — se abre en el formulario, donde se editan el año, la orientación y las materias que se dictan.'
                : 'Hacé clic en un curso para modificarlo. La ocupación compara las horas del curso contra las horas cátedra semanales de su turno (sin recreos); la última columna muestra cuántas ya están ubicadas en la planificación vigente.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
