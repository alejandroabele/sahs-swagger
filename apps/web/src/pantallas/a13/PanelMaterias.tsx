// A13 · panel izquierdo "Materias y docentes": una fila por materia × docente habilitado.
import { css } from '../../lib/css';

export interface OpcionMateria {
  key: string;
  clase: string;
  nombre: string;
  docente: string;
  marcaEstilo: string;
  nombreEstilo: string;
  docenteEstilo: string;
  progreso: string;
  progresoEstilo: string;
  filaEstilo: string;
  click: () => void;
}

export function PanelMaterias(p: {
  ayuda: string;
  filtroAnio: string;
  filtroOrientacion: string;
  opciones: OpcionMateria[];
  ubicadas: number;
  totalPlan: number;
  progresoAncho: string;
  progresoColor: string;
}) {
  return (
    <div style={css('width: 330px; flex-shrink: 0; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
      <div style={css('padding: 14px 16px 12px; border-bottom: 1px solid #eef1f5;')}>
        <div style={css('font-size: 13px; font-weight: 600;')}>Materias y docentes</div>
        <div style={css('font-size: 12px; color: #6b7482; margin-top: 3px;')}>{p.ayuda}</div>
        <div style={css('display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-top: 9px;')}>
          <span style={css('font-size: 11px; color: #7a8393;')}>Filtro automático</span>
          <span style={css('font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 10px; background: #eef3fc; color: #1e4099;')}>{p.filtroAnio}</span>
          <span style={css('font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 10px; background: #eef3fc; color: #1e4099;')}>{p.filtroOrientacion}</span>
        </div>
      </div>
      <div style={css('max-height: 588px; overflow-y: auto;')}>
        {p.opciones.map((o) => (
          <button key={o.key} onClick={o.click} className={o.clase} style={css(o.filaEstilo)}>
            <span style={css(o.marcaEstilo)}></span>
            <span style={css('display: flex; flex-direction: column; gap: 3px; flex-grow: 1; min-width: 0; text-align: left;')}>
              <span style={css(o.nombreEstilo)}>{o.nombre}</span>
              <span style={css(o.docenteEstilo)}>{o.docente}</span>
            </span>
            <span style={css(o.progresoEstilo)}>{o.progreso}</span>
          </button>
        ))}
        {p.opciones.length === 0 && (
          <div style={css('padding: 16px; font-size: 12px; color: #8b95a5;')}>El curso no tiene materias en su plan.</div>
        )}
      </div>
      <div style={css('display: flex; align-items: center; gap: 10px; padding: 13px 16px; background: #f8fafc; border-top: 1px solid #eef1f5;')}>
        <span style={css('font-size: 12px; color: #6b7482;')}>Ubicadas</span>
        <div style={css('flex-grow: 1;')}></div>
        <span className="mono" style={css('font-size: 15px; font-weight: 600;')}>{p.ubicadas}</span>
        <span style={css('font-size: 12px; color: #7a8393;')}>de {p.totalPlan} h</span>
      </div>
      <div style={css('height: 4px; background: #eef1f5;')}>
        <div style={css('height: 4px; width: ' + p.progresoAncho + '; background: ' + p.progresoColor + ';')}></div>
      </div>
    </div>
  );
}
