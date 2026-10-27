// A2 · Relevamiento de disponibilidad. Prototipo: <template id="tpl-disponibilidad"> y
// DC.registrar("disponibilidad") en prototipo/index.html.
// Profesores: profesor_suplencias.get_profesores (con su disponibilidad y materias habilitadas).
// Grilla por turno: horarios.get_turnos. Guardar: asignar_disponibilidad (la lista completa, de todos los turnos).
import { useState } from 'react';
import type { Profesor } from '@sahs/contratos';
import { profesorSuplencias } from '../api';
import { useParamRuta } from '../app/navegar';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useAccion, useConsulta } from '../estado/consultas';
import { css } from '../lib/css';
import { iniciales } from '../lib/formato';
import './a2/responsive.css';
import { ACCENT, SemanaDisponibilidad, contarEn, sinRecreos, turnoPreferido, useTurnos } from './disponibilidad/Semana';

const PALETA = ['#eaf0fb', '#e8f5f2', '#f3edfa', '#fdf4e7', '#fbedf2'];
const TEXTOS = ['#1e3f80', '#155e50', '#4a2f80', '#7a5310', '#8a2e52'];

const idsDe = (p: Profesor | null | undefined): number[] =>
  (p?.disponibilidad ?? []).map((f) => f.id_franja_horaria).filter((id): id is number => id != null);

export default function A2Disponibilidad() {
  const { activo } = useCiclo();
  const idInicial = useParamRuta('idProfesor');
  const qProfes = useConsulta(['profesor_suplencias', 'get_profesores'], () => profesorSuplencias.get_profesores());
  const qTurnos = useTurnos();

  const [sel, setSel] = useState<number | null>(idInicial);
  // Cambios sin guardar de cada docente (como el state.disp del prototipo).
  const [borradores, setBorradores] = useState<Record<number, number[]>>({});
  const [idTurno, setIdTurno] = useState<number | null>(null);
  const [guardado, setGuardado] = useState(false);

  const profes = qProfes.data ?? [];
  const turnos = qTurnos.data ?? [];
  const actual = profes.find((p) => p.id_profesor === sel) ?? profes[0] ?? null;
  const idActual = actual?.id_profesor ?? null;
  const listaDe = (p: Profesor) => borradores[p.id_profesor] ?? idsDe(p);
  const ids = actual ? listaDe(actual) : [];
  const turno = turnos.find((t) => t.id_turno === idTurno) ?? turnoPreferido(ids, turnos);

  const guardar = useAccion(
    (id: number, lista: number[]) => profesorSuplencias.asignar_disponibilidad(id, { ids_franjas_horarias: lista }),
    ['profesor_suplencias'],
  );

  if (qProfes.isLoading || qTurnos.isLoading) {
    return (
      <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
        <Cabecera />
        <Cargando />
      </div>
    );
  }

  const cambiar = (lista: number[]) => {
    if (!actual) return;
    setBorradores((b) => ({ ...b, [actual.id_profesor]: lista }));
    // El turno queda fijo mientras se edita (no salta al preferido).
    if (turno) setIdTurno(turno.id_turno);
    setGuardado(false);
  };
  const elegir = (p: Profesor) => {
    setSel(p.id_profesor);
    setIdTurno(turnoPreferido(listaDe(p), turnos)?.id_turno ?? null);
    setGuardado(false);
    guardar.limpiarError();
  };
  const alGuardar = async () => {
    if (!actual) return;
    const r = await guardar.ejecutar(actual.id_profesor, sinRecreos(ids, turnos));
    if (r) {
      setBorradores((b) => {
        const c = { ...b };
        delete c[actual.id_profesor];
        return c;
      });
      if (turno) setIdTurno(turno.id_turno);
      setGuardado(true);
    }
  };

  const relevados = profes.filter((p) => contarEn(listaDe(p), turnos) > 0).length;
  const materias = [...new Set((actual?.lista_materias_habilitadas ?? []).map((m) => m.nombre_materia ?? '').filter(Boolean))];
  const nombreDe = (p: Profesor) => p.nombre + ' ' + p.apellido;

  return (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div className="r-margen r-envolver" style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span>Ciclo lectivo {activo?.anio_calendario ?? ''}</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span>Relevamiento previo al armado</span>
          </div>
          <div className="r-titulo" style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Disponibilidad horaria declarada</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <button
          onClick={alGuardar}
          disabled={!actual || guardar.enCurso}
          style={css('height: 38px; padding: 0 18px; border-radius: 7px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 13px; font-weight: 600;')}
        >
          {guardar.enCurso ? 'Guardando…' : guardado ? 'Guardado' : 'Guardar disponibilidad'}
        </button>
      </div>

      {(qProfes.error || qTurnos.error || guardar.error) && (
        <div className="r-margen" style={css('padding: 16px 28px 0;')}>
          <MensajeError
            mensaje={guardar.error ?? qProfes.error?.message ?? qTurnos.error?.message}
            alCerrar={guardar.error ? guardar.limpiarError : undefined}
          />
        </div>
      )}

      <div className="r-margen r-apilar" style={css('display: flex; gap: 18px; padding: 20px 28px 28px; align-items: flex-start;')}>
        <div style={css('width: 262px; flex-shrink: 0; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
          <div style={css('padding: 14px 16px 11px; border-bottom: 1px solid #eef1f5;')}>
            <div style={css('font-size: 13px; font-weight: 600;')}>Docentes</div>
            <div style={css('font-size: 12px; color: #6b7482; margin-top: 3px;')}>
              {relevados} de {profes.length} relevados
            </div>
          </div>
          <div className="a2-lista" style={css('max-height: 560px; overflow-y: auto;')}>
            {profes.map((p) => {
              const activoP = p.id_profesor === idActual;
              return (
                <button
                  key={p.id_profesor}
                  onClick={() => elegir(p)}
                  style={css(
                    'display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 16px; border: none;' +
                      ' border-left: 3px solid ' +
                      (activoP ? ACCENT : 'transparent') +
                      ';' +
                      ' background: ' +
                      (activoP ? '#f3f6fc' : '#fff') +
                      '; text-align: left;',
                  )}
                >
                  <span
                    style={css(
                      'width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; display: flex;' +
                        ' align-items: center; justify-content: center; font-size: 10.5px; font-weight: 600;' +
                        ' background: ' +
                        (activoP ? ACCENT : '#eef1f5') +
                        '; color: ' +
                        (activoP ? '#fff' : '#5b6471') +
                        ';',
                    )}
                  >
                    {iniciales(p.nombre, p.apellido)}
                  </span>
                  <span style={css('display: flex; flex-direction: column; gap: 1px; text-align: left; min-width: 0; flex-grow: 1;')}>
                    <span style={css('font-size: 12.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>{nombreDe(p)}</span>
                    <span className="mono" style={css('font-size: 10.5px; color: #7a8393;')}>
                      {contarEn(listaDe(p), turnos)} franjas
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={css('flex-grow: 1; min-width: 0; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
          <div className="r-envolver" style={css('display: flex; align-items: center; gap: 14px; padding: 15px 20px; border-bottom: 1px solid #eef1f5;')}>
            <div style={css('display: flex; flex-direction: column; gap: 2px;')}>
              <div style={css('font-size: 14px; font-weight: 600;')}>{actual ? nombreDe(actual) : 'Sin docentes cargados'}</div>
              <div style={css('font-size: 12px; color: #6b7482;')}>
                {materias.length ? 'Habilitado en ' + materias.join(', ') : 'Sin materias habilitadas'}
              </div>
            </div>
          </div>
          {actual && <SemanaDisponibilidad turnos={turnos} turno={turno} ids={ids} alElegirTurno={setIdTurno} alCambiar={cambiar} />}
        </div>

        <div style={css('width: 296px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;')}>
          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 16px;')}>
            <div style={css('font-size: 13px; font-weight: 600; margin-bottom: 11px;')}>Materias que puede dictar</div>
            <div style={css('display: flex; flex-wrap: wrap; gap: 6px;')}>
              {materias.map((n, i) => (
                <span
                  key={n}
                  style={css('font-size: 11.5px; font-weight: 500; padding: 5px 10px; border-radius: 14px; background: ' + PALETA[i % 5] + '; color: ' + TEXTOS[i % 5] + ';')}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
