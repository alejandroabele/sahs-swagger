// P3 · Mi disponibilidad. Prototipo: <template id="tpl-midisponibilidad"> y
// DC.registrar("midisponibilidad") en prototipo/index.html.
// La disponibilidad del profesor de la sesión (useSesion().profesor), con la grilla por turno de
// horarios.get_turnos. Guardar: profesor_suplencias.asignar_disponibilidad (lista completa, de todos los turnos).
import { useState } from 'react';
import { profesorSuplencias } from '../api';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useAccion } from '../estado/consultas';
import { useSesion } from '../estado/sesion';
import { css } from '../lib/css';
import { ACCENT, ResumenDeclaradas, SemanaDisponibilidad, sinRecreos, turnoPreferido, useTurnos } from './disponibilidad/Semana';

export default function P3MiDisponibilidad() {
  const { profesor } = useSesion();
  const { activo } = useCiclo();
  const qTurnos = useTurnos();
  // Cambios sin guardar; null = la disponibilidad guardada del profesor.
  const [borrador, setBorrador] = useState<number[] | null>(null);
  const [idTurno, setIdTurno] = useState<number | null>(null);
  const [guardado, setGuardado] = useState(false);
  const guardar = useAccion(
    (id: number, lista: number[]) => profesorSuplencias.asignar_disponibilidad(id, { ids_franjas_horarias: lista }),
    ['profesor_suplencias'],
  );

  const raiz = 'width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;';

  if (qTurnos.isLoading) {
    return (
      <div style={css(raiz)}>
        <Cabecera conCiclo={false} />
        <Cargando />
      </div>
    );
  }

  const turnos = qTurnos.data ?? [];
  const guardadas = (profesor?.disponibilidad ?? []).map((f) => f.id_franja_horaria).filter((id): id is number => id != null);
  const ids = borrador ?? guardadas;
  const turno = turnos.find((t) => t.id_turno === idTurno) ?? turnoPreferido(ids, turnos);

  const cambiar = (lista: number[]) => {
    setBorrador(lista);
    // El turno queda fijo mientras se edita (no salta al preferido).
    if (turno) setIdTurno(turno.id_turno);
    setGuardado(false);
  };
  const alGuardar = async () => {
    if (!profesor) return;
    const r = await guardar.ejecutar(profesor.id_profesor, sinRecreos(ids, turnos));
    if (r) {
      // La sesión vuelve a leer al profesor (se invalidó profesor_suplencias); mientras, se muestra lo guardado.
      setBorrador(sinRecreos(ids, turnos));
      if (turno) setIdTurno(turno.id_turno);
      setGuardado(true);
    }
  };

  return (
    <div style={css(raiz)}>
      <Cabecera conCiclo={false} />

      <div style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span>Ciclo lectivo {activo?.anio_calendario ?? ''}</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span>Relevamiento para el armado de horarios</span>
          </div>
          <div style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Mi disponibilidad horaria</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <button
          onClick={alGuardar}
          disabled={!profesor || guardar.enCurso}
          title={profesor ? undefined : 'Tu usuario no está vinculado a un profesor'}
          style={css(
            'height: 38px; padding: 0 18px; border-radius: 7px; border: none; font-size: 13px;' +
              ' font-weight: 600; color: #fff; background: ' +
              (guardado ? '#2f6b45' : ACCENT) +
              ';' +
              (profesor ? '' : ' opacity: 0.5;'),
          )}
        >
          {guardar.enCurso ? 'Guardando…' : guardado ? 'Cambios guardados' : 'Guardar mi disponibilidad'}
        </button>
      </div>

      {!profesor ? (
        <div style={css('padding: 20px 28px 28px;')}>
          <div style={css('border-radius: 10px; padding: 14px 16px; border: 1px solid #f0dcbe; background: #fdf6ec; font-size: 12.5px; line-height: 1.55; color: #7a5310;')}>
            Tu usuario no está vinculado a un profesor. Pedile a secretaría que lo asigne desde la ficha del profesor para poder declarar tu disponibilidad.
          </div>
        </div>
      ) : (
        <>
          {(qTurnos.error || guardar.error) && (
            <div style={css('padding: 16px 28px 0;')}>
              <MensajeError mensaje={guardar.error ?? qTurnos.error?.message} alCerrar={guardar.error ? guardar.limpiarError : undefined} />
            </div>
          )}
          <div style={css('display: flex; gap: 18px; padding: 20px 28px 28px; align-items: flex-start;')}>
            <div style={css('flex-grow: 1; min-width: 0; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
              <div style={css('display: flex; align-items: center; gap: 14px; padding: 15px 20px; border-bottom: 1px solid #eef1f5;')}>
                <div style={css('font-size: 13px; font-weight: 600;')}>Semana tipo</div>
                <div style={css('flex-grow: 1;')}></div>
                <div style={css('font-size: 11.5px; color: #6b7482;')}>Tocá una franja para marcarla o desmarcarla</div>
              </div>
              <SemanaDisponibilidad turnos={turnos} turno={turno} ids={ids} alElegirTurno={setIdTurno} alCambiar={cambiar} />
            </div>

            <div style={css('width: 306px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;')}>
              <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 16px;')}>
                <div style={css('font-size: 13px; font-weight: 600; margin-bottom: 13px;')}>Mi semana</div>
                <div style={css('display: flex; flex-direction: column; gap: 11px;')}>
                  <ResumenDeclaradas ids={ids} turnos={turnos} turno={turno} />
                </div>
              </div>

              <div style={css('border-radius: 10px; padding: 14px 16px; border: 1px solid #dfe8f7; background: #f3f6fc;')}>
                <div style={css('display: flex; gap: 10px; align-items: flex-start;')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" style={css('flex-shrink: 0; margin-top: 1px;')}>
                    <path d="M12 8v5M12 16.5v.5"></path>
                    <circle cx="12" cy="12" r="9"></circle>
                  </svg>
                  <div style={css('font-size: 12px; line-height: 1.55; color: #2c4570;')}>
                    Lo que marques acá es lo que secretaría ve al armar la grilla del ciclo. Podés modificarlo hasta el cierre del relevamiento.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
