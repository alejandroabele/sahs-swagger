// A13 · grilla del curso: una fila por día y una columna por franja del turno (los recreos
// son columnas angostas que no se pueden ocupar), con la leyenda de abajo.
import { css } from '../../lib/css';
import { AREAS } from './modelo';

export interface CeldaVista {
  key: string;
  clase: string;
  titulo: string;
  sub: string;
  estilo: string;
  tituloEstilo: string;
  subEstilo: string;
  title?: string;
  click: () => void;
}

export function Grilla(p: {
  gridCols: string;
  franjas: { key: string; hora: string; estilo: string }[];
  filas: { dia: string; celdas: CeldaVista[] }[];
}) {
  return (
    <div style={css('padding: 16px 18px 18px;')}>
      <div style={css('display: grid; grid-template-columns: ' + p.gridCols + '; gap: 6px;')}>
        <div></div>
        {p.franjas.map((f) => (
          <div key={f.key} className="mono" style={css(f.estilo)}>
            {f.hora}
          </div>
        ))}
      </div>
      {p.filas.map((row) => (
        <div key={row.dia} style={css('display: grid; grid-template-columns: ' + p.gridCols + '; gap: 6px; margin-bottom: 6px;')}>
          <div style={css('display: flex; align-items: center; font-size: 12px; font-weight: 500; color: #4a5462;')}>{row.dia}</div>
          {row.celdas.map((c) => (
            <button key={c.key} onClick={c.click} className={c.clase} style={css(c.estilo)} title={c.title}>
              <span style={css(c.tituloEstilo)}>{c.titulo}</span>
              <span style={css(c.subEstilo)}>{c.sub}</span>
            </button>
          ))}
        </div>
      ))}

      <div style={css('display: flex; align-items: center; gap: 20px; margin-top: 16px; padding-top: 14px; border-top: 1px solid #eef1f5; flex-wrap: wrap;')}>
        <span style={css('display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: #4a5462; font-weight: 500;')}>
          <span style={css('width: 26px; height: 17px; border-radius: 4px; background: #2a55ad;')}></span>
          Clase ubicada
        </span>
        <span style={css('display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: #4a5462; font-weight: 500;')}>
          <span style={css('width: 26px; height: 17px; border-radius: 4px; background: #eaf6ee; border: 1.5px dashed #6aab84; display: flex; align-items: center; justify-content: center; color: #2f6b45; font-size: 12px; line-height: 1;')}>+</span>
          Puede ir acá
        </span>
        <span style={css('display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: #8b95a5;')}>
          <span style={css('width: 26px; height: 17px; border-radius: 4px; background: #f7f8fa; border: 1px solid #edf0f3;')}></span>
          Ocupado o sin disponibilidad
        </span>
        <span style={css('display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: #8b95a5;')}>
          <span style={css('width: 10px; height: 17px; border-radius: 3px; background: repeating-linear-gradient(135deg, #e8ecf1 0 3px, #f5f7fa 3px 6px);')}></span>
          Recreo
        </span>
        <span style={css('flex-grow: 1;')}></span>
        {Object.keys(AREAS).map((k) => (
          <span key={k} style={css('display: flex; align-items: center; gap: 6px; font-size: 11px; color: #6b7482;')}>
            <span style={css('width: 9px; height: 9px; border-radius: 3px; background: ' + AREAS[k].solido + ';')}></span>
            {k === 'Lengua y Literatura' ? 'Lengua' : k}
          </span>
        ))}
      </div>
    </div>
  );
}
