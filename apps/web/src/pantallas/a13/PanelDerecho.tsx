// A13 · panel derecho: la clase tocada en la grilla (sus profesores valen para todas sus horas).
// Solo se muestra con una clase tocada; si no, la planilla ocupa todo el ancho.
// Con `cargando`, los datos para editar todavía no llegaron.
import { css } from '../../lib/css';

export interface CeldaInfo {
  materia: string;
  franja: string;
  color: string;
  docentes: { id: number; nombre: string; quitarEstilo: string; quitar: () => void }[];
  candidatos: { id: number; nombre: string; detalle: string; detalleEstilo: string; accion: string; accionEstilo: string; estilo: string; sumar: () => void }[];
  sacar: () => void;
  enCurso: boolean;
  cargando: boolean;
}

export function PanelDerecho({ celda }: { celda: CeldaInfo }) {
  return (
    <div style={css('width: 296px; flex-shrink: 0; display: flex; flex-direction: column; gap: 14px;')}>
      <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
        <div style={css('display: flex; flex-direction: column; gap: 3px; padding: 13px 16px; background: ' + celda.color + ';')}>
          <span style={css('font-size: 13.5px; font-weight: 600; color: #fff;')}>{celda.materia}</span>
          <span style={css('font-size: 11.5px; color: rgba(255,255,255,0.88);')}>{celda.franja}</span>
        </div>
        <div style={css('padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 12px;')}>
          <div style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Profesores de la clase</div>
          <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
            {celda.docentes.map((d) => (
              <div key={d.id} style={css('display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 8px; background: #f5f7fa;')}>
                <span style={css('font-size: 12.5px; font-weight: 500; flex-grow: 1;')}>{d.nombre}</span>
                <button onClick={d.quitar} disabled={celda.enCurso} style={css(d.quitarEstilo)}>
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <div style={css('font-size: 12px; font-weight: 600; color: #4a5462; margin-top: 2px;')}>Sumar otro profesor a la clase</div>
          {celda.cargando && <div style={css('font-size: 11.5px; color: #6b7482;')}>Cargando…</div>}
          {!celda.cargando &&
            celda.candidatos.map((c) => (
              <button key={c.id} onClick={c.sumar} disabled={celda.enCurso} style={css(c.estilo)}>
                <span style={css('display: flex; flex-direction: column; gap: 2px; flex-grow: 1; text-align: left;')}>
                  <span style={css('font-size: 12.5px; font-weight: 500;')}>{c.nombre}</span>
                  <span style={css(c.detalleEstilo)}>{c.detalle}</span>
                </span>
                <span style={css(c.accionEstilo)}>{c.accion}</span>
              </button>
            ))}
          {!celda.cargando && celda.candidatos.length === 0 && (
            <div style={css('font-size: 11.5px; color: #6b7482; line-height: 1.5;')}>No hay otros docentes habilitados en esta materia.</div>
          )}
          <button
            onClick={celda.sacar}
            disabled={celda.enCurso}
            style={css('height: 34px; border-radius: 8px; border: 1px solid #edc9c4; background: #fff; color: #b03a2e; font-size: 12px; font-weight: 600;')}
          >
            Sacar esta hora de la grilla
          </button>
        </div>
      </div>
    </div>
  );
}
