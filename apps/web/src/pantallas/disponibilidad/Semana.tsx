// Grilla de disponibilidad por turno, compartida por A2 (Relevamiento de disponibilidad)
// y P3 (Mi disponibilidad). Prototipo: el bloque "Turno" + grilla + leyenda de
// tpl-disponibilidad y tpl-midisponibilidad, y los métodos idsDe/horasDe/contarEn/
// turnoPreferido/grilla/botonesTurno de DC.registrar("disponibilidad").
import type { FranjaHoraria, Turno } from '@sahs/contratos';
import { horarios } from '../../api';
import { useConsulta } from '../../estado/consultas';
import { css } from '../../lib/css';
import { DIAS } from '../../lib/formato';

export const ACCENT = '#2f5fd0';

/** Turnos del colegio con sus franjas (horas cátedra y recreos). */
export function useTurnos() {
  return useConsulta(['horarios', 'get_turnos'], () => horarios.get_turnos());
}

/** Ids de las horas cátedra (sin recreos) de un turno. */
export function horasDe(t: Turno | null | undefined): number[] {
  return (t?.franjas_horarias ?? []).filter((f) => !f.es_recreo).map((f) => f.id_franja_horaria);
}

/** Cuántas franjas de la lista son horas cátedra del turno (o de cualquier turno si no se indica). */
export function contarEn(ids: number[], turnos: Turno[], turno?: Turno | null): number {
  const set = new Set(ids);
  const validas = new Set<number>();
  (turno ? [turno] : turnos).forEach((t) => horasDe(t).forEach((id) => validas.add(id)));
  let n = 0;
  validas.forEach((id) => {
    if (set.has(id)) n++;
  });
  return n;
}

/** El turno con más franjas declaradas; si no hay ninguna, Mañana (o el primero). */
export function turnoPreferido(ids: number[], turnos: Turno[]): Turno | null {
  let mejor: Turno | null = null;
  let max = 0;
  turnos.forEach((t) => {
    const n = contarEn(ids, turnos, t);
    if (n > max) {
      max = n;
      mejor = t;
    }
  });
  return mejor ?? turnos.find((t) => t.nombre === 'Mañana') ?? turnos[0] ?? null;
}

/** Ids de recreo (de cualquier turno): nunca se guardan como disponibilidad. */
export function sinRecreos(ids: number[], turnos: Turno[]): number[] {
  const recreos = new Set<number>();
  turnos.forEach((t) => (t.franjas_horarias ?? []).forEach((f) => f.es_recreo && recreos.add(f.id_franja_horaria)));
  return ids.filter((id) => !recreos.has(id));
}

interface Fila {
  inicio: string;
  fin: string;
  es_recreo: boolean;
  hora: number; // Nª hora (0 en los recreos)
  porDia: Record<string, FranjaHoraria | undefined>;
}

/** Arma las filas de la grilla: un bloque por horario (horas y recreos), con la franja de cada día. */
function filasDe(t: Turno): Fila[] {
  const porClave = new Map<string, Fila>();
  (t.franjas_horarias ?? []).forEach((f) => {
    const clave = f.hora_inicio + '|' + f.hora_fin + '|' + (f.es_recreo ? 'r' : 'h');
    let fila = porClave.get(clave);
    if (!fila) {
      fila = { inicio: f.hora_inicio, fin: f.hora_fin, es_recreo: f.es_recreo, hora: 0, porDia: {} };
      porClave.set(clave, fila);
    }
    fila.porDia[f.dia_lectivo?.nombre_dia_lectivo ?? ''] = f;
  });
  const filas = [...porClave.values()].sort((a, b) => a.inicio.localeCompare(b.inicio));
  let n = 0;
  filas.forEach((f) => {
    if (!f.es_recreo) f.hora = ++n;
  });
  return filas;
}

/** "08:00 a 13:40 · 6 horas por día" (como turnoHorario del prototipo). */
export function textoHorario(t: Turno | null): string {
  const fr = t?.franjas_horarias ?? [];
  if (!t || !fr.length) return '';
  const inicio = fr.reduce((m, f) => (f.hora_inicio < m ? f.hora_inicio : m), fr[0].hora_inicio);
  const fin = fr.reduce((m, f) => (f.hora_fin > m ? f.hora_fin : m), fr[0].hora_fin);
  const total = horasDe(t).length;
  return `${inicio} a ${fin} · ${Math.round((total / DIAS.length) * 10) / 10} horas por día`;
}

/**
 * Selector de turno, grilla de la semana y leyenda con "Marcar toda la semana" y "Limpiar".
 * Marcar y limpiar actúan solo sobre el turno elegido; los recreos no se marcan.
 */
export function SemanaDisponibilidad({
  turnos,
  turno,
  ids,
  alElegirTurno,
  alCambiar,
}: {
  turnos: Turno[];
  turno: Turno | null;
  ids: number[];
  alElegirTurno: (id_turno: number) => void;
  alCambiar: (ids: number[]) => void;
}) {
  const set = new Set(ids);
  const filas = turno ? filasDe(turno) : [];
  const alto = 44;

  const alternar = (id: number) => alCambiar(set.has(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  const marcarTodo = () => {
    const nueva = ids.slice();
    horasDe(turno).forEach((id) => {
      if (!set.has(id)) nueva.push(id);
    });
    alCambiar(nueva);
  };
  const limpiar = () => {
    const delTurno = new Set(horasDe(turno));
    alCambiar(ids.filter((id) => !delTurno.has(id)));
  };

  return (
    <div style={css('padding: 18px 20px 22px;')}>
      <div className="r-envolver" style={css('display: flex; align-items: center; gap: 10px; margin-bottom: 16px;')}>
        <span style={css('font-size: 12px; color: #6b7482;')}>Turno</span>
        <div style={css('display: flex; gap: 6px; flex-wrap: wrap;')}>
          {turnos.map((t) => {
            const activo = t.id_turno === turno?.id_turno;
            const n = contarEn(ids, turnos, t);
            return (
              <button
                key={t.id_turno}
                onClick={() => alElegirTurno(t.id_turno)}
                style={css(
                  'display: flex; align-items: center; gap: 7px; height: 30px; padding: 0 12px; border-radius: 15px;' +
                    ' font-size: 12px; font-weight: 500;' +
                    (activo
                      ? ' border: 1.5px solid ' + ACCENT + '; background: #eef3fc; color: #1e3f80;'
                      : ' border: 1px solid #dfe4ea; background: #fff; color: #4a5462;'),
                )}
              >
                {t.nombre}
                <span
                  className="mono"
                  style={css(
                    'font-size: 10.5px; padding: 1px 6px; border-radius: 8px;' +
                      (n > 0 ? ' background: #e9f2ec; color: #2f6b45;' : ' background: #f2f4f7; color: #8b95a5;'),
                  )}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <span className="mono" style={css('font-size: 11.5px; color: #8b95a5;')}>
          {textoHorario(turno)}
        </span>
      </div>

      {/* En pantallas angostas la grilla se desplaza horizontalmente dentro de la tarjeta. */}
      <div className="r-desplazar">
        <div className="r-min-600">
          <div style={css('display: grid; grid-template-columns: 104px repeat(5, minmax(0, 1fr)); gap: 6px; margin-bottom: 8px;')}>
            <div></div>
            {DIAS.map((d) => (
              <div key={d} style={css('font-size: 12px; color: #4a5462; text-align: center; font-weight: 500;')}>
                {d}
              </div>
            ))}
          </div>
          {filas.map((row) => {
            const horario = row.inicio + ' – ' + row.fin;
            if (row.es_recreo) {
              return (
                <div key={horario + 'r'} style={css('display: grid; grid-template-columns: 104px minmax(0, 1fr); gap: 6px; margin-bottom: 6px;')}>
                  <div className="mono" style={css('display: flex; align-items: center; font-size: 10.5px; color: #9aa3af;')}>
                    {horario}
                  </div>
                  <div
                    style={css(
                      'height: 20px; border-radius: 6px; background: repeating-linear-gradient(135deg, #f2f4f7 0 6px, #f8f9fb 6px 12px); display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 600; color: #8b95a5; letter-spacing: 0.04em;',
                    )}
                  >
                    Recreo
                  </div>
                </div>
              );
            }
            return (
              <div key={horario} style={css('display: grid; grid-template-columns: 104px repeat(5, minmax(0, 1fr)); gap: 6px; margin-bottom: 6px;')}>
                <div style={css('display: flex; flex-direction: column; justify-content: center; gap: 1px;')}>
                  <span style={css('font-size: 12px; font-weight: 500; color: #4a5462;')}>{row.hora}ª hora</span>
                  <span className="mono" style={css('font-size: 10.5px; color: #8b95a5;')}>
                    {horario}
                  </span>
                </div>
                {DIAS.map((dia) => {
                  const f = row.porDia[dia];
                  const libre = !!(f && set.has(f.id_franja_horaria));
                  return (
                    <button
                      key={dia}
                      disabled={!f}
                      onClick={() => f && alternar(f.id_franja_horaria)}
                      style={css(
                        'height: ' +
                          alto +
                          'px; width: 100%; border-radius: 7px; font-size: 10.5px; font-weight: 500;' +
                          ' display: flex; align-items: center; justify-content: center;' +
                          (libre
                            ? ' background: #e9f2ec; border: 1px solid #bfdcca; color: #2f6b45;'
                            : ' background: #fafbfc; border: 1px dashed #d6dce4; color: transparent;'),
                      )}
                    >
                      {libre ? 'Disponible' : ''}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="r-envolver" style={css('display: flex; align-items: center; gap: 18px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eef1f5;')}>
        <div style={css('display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: #6b7482;')}>
          <span style={css('width: 13px; height: 13px; border-radius: 4px; background: #e9f2ec; border: 1px solid #bfdcca;')}></span>Disponible
        </div>
        <div style={css('display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: #6b7482;')}>
          <span style={css('width: 13px; height: 13px; border-radius: 4px; background: #fafbfc; border: 1px dashed #d6dce4;')}></span>No disponible
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <button
          onClick={marcarTodo}
          style={css('height: 30px; padding: 0 13px; border-radius: 7px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 12px; font-weight: 500;')}
        >
          Marcar toda la semana
        </button>
        <button
          onClick={limpiar}
          style={css('height: 30px; padding: 0 13px; border-radius: 7px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 12px; font-weight: 500;')}
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}

/** Bloque "N franjas declaradas de M" con la barra y el detalle por turno (Resumen del docente / Mi semana). */
