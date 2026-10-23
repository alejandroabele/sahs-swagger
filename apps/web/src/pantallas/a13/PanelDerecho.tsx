// A13 · panel derecho: la clase tocada en la grilla (sus profesores valen para todas sus horas),
// la materia elegida a la izquierda, o la ayuda; y abajo, los otros cursos del ciclo.
import { css } from '../../lib/css';

export interface CeldaInfo {
  materia: string;
  franja: string;
  alcance: string;
  color: string;
  docentes: { id: number; nombre: string; quitarEstilo: string; quitar: () => void }[];
  candidatos: { id: number; nombre: string; detalle: string; detalleEstilo: string; accion: string; accionEstilo: string; estilo: string; sumar: () => void }[];
  sacar: () => void;
  enCurso: boolean;
}

export interface SelInfo {
  nombre: string;
  docente: string;
  color: string;
  opciones: number;
  restantes: number;
  declaradas: string;
  otros: string;
  aviso: string;
  avisoEstilo: string;
}

export interface OtroCurso {
  id: number;
  nombre: string;
  chapa: string;
  detalle: string;
  estado: string;
  estadoEstilo: string;
  click: () => void;
}

export function PanelDerecho(p: { celda: CeldaInfo | null; sel: SelInfo | null; vacioTexto: string; otros: OtroCurso[] }) {
  const { celda, sel } = p;
  return (
    <div style={css('width: 296px; flex-shrink: 0; display: flex; flex-direction: column; gap: 14px;')}>
      {celda && (
        <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
          <div style={css('display: flex; flex-direction: column; gap: 3px; padding: 13px 16px; background: ' + celda.color + ';')}>
            <span style={css('font-size: 13.5px; font-weight: 600; color: #fff;')}>{celda.materia}</span>
            <span style={css('font-size: 11.5px; color: rgba(255,255,255,0.88);')}>{celda.franja}</span>
          </div>
          <div style={css('padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 12px;')}>
            <div style={css('font-size: 11.5px; color: #1e4099; line-height: 1.5; padding: 9px 11px; border-radius: 8px; background: #eef3fc;')}>{celda.alcance}</div>
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
            {celda.candidatos.map((c) => (
              <button key={c.id} onClick={c.sumar} disabled={celda.enCurso} style={css(c.estilo)}>
                <span style={css('display: flex; flex-direction: column; gap: 2px; flex-grow: 1; text-align: left;')}>
                  <span style={css('font-size: 12.5px; font-weight: 500;')}>{c.nombre}</span>
                  <span style={css(c.detalleEstilo)}>{c.detalle}</span>
                </span>
                <span style={css(c.accionEstilo)}>{c.accion}</span>
              </button>
            ))}
            {celda.candidatos.length === 0 && (
              <div style={css('font-size: 11.5px; color: #6b7482; line-height: 1.5;')}>No hay otros docentes habilitados en esta materia.</div>
            )}
            <div style={css('font-size: 11.5px; color: #6b7482; line-height: 1.5;')}>
              Una clase puede tener más de un profesor, por ejemplo una pareja pedagógica o EPA, que se dicta de a dos.
            </div>
            <button
              onClick={celda.sacar}
              disabled={celda.enCurso}
              style={css('height: 34px; border-radius: 8px; border: 1px solid #edc9c4; background: #fff; color: #b03a2e; font-size: 12px; font-weight: 600;')}
            >
              Sacar esta hora de la grilla
            </button>
          </div>
        </div>
      )}

      {sel && (
        <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
          <div style={css('display: flex; flex-direction: column; gap: 3px; padding: 13px 16px; background: ' + sel.color + ';')}>
            <span style={css('font-size: 13.5px; font-weight: 600; color: #fff;')}>{sel.nombre}</span>
            <span style={css('font-size: 11.5px; color: rgba(255,255,255,0.88);')}>{sel.docente}</span>
          </div>
          <div style={css('padding: 15px 16px 16px; display: flex; flex-direction: column; gap: 13px;')}>
            <div style={css('display: flex; gap: 10px;')}>
              <div style={css('flex-grow: 1; padding: 10px 12px; border-radius: 8px; background: #eaf6ee;')}>
                <div className="mono" style={css('font-size: 18px; font-weight: 600; color: #2f6b45;')}>{sel.opciones}</div>
                <div style={css('font-size: 11px; color: #55705f; margin-top: 1px;')}>franjas verdes</div>
              </div>
              <div style={css('flex-grow: 1; padding: 10px 12px; border-radius: 8px; background: #f5f6f8;')}>
                <div className="mono" style={css('font-size: 18px; font-weight: 600; color: #4a5462;')}>{sel.restantes}</div>
                <div style={css('font-size: 11px; color: #6b7482; margin-top: 1px;')}>horas por ubicar</div>
              </div>
            </div>
            <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
              <div style={css('display: flex; justify-content: space-between; font-size: 12px;')}>
                <span style={css('color: #6b7482;')}>Declaró disponible</span>
                <span className="mono" style={css('font-weight: 500;')}>{sel.declaradas}</span>
              </div>
              <div style={css('display: flex; justify-content: space-between; font-size: 12px;')}>
                <span style={css('color: #6b7482;')}>Ya dicta en otros cursos</span>
                <span className="mono" style={css('font-weight: 500;')}>{sel.otros}</span>
              </div>
            </div>
            <div style={css(sel.avisoEstilo)}>{sel.aviso}</div>
          </div>
        </div>
      )}

      {!sel && !celda && (
        <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 24px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center;')}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b9c1cc" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="17" rx="2"></rect>
            <path d="M3 9h18M9 9v12"></path>
          </svg>
          <div style={css('font-size: 12.5px; color: #6b7482; line-height: 1.55;')}>{p.vacioTexto}</div>
        </div>
      )}

      <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
        <div style={css('padding: 14px 16px 12px; border-bottom: 1px solid #eef1f5;')}>
          <div style={css('font-size: 13px; font-weight: 600;')}>Otros cursos del ciclo</div>
          <div style={css('font-size: 12px; color: #6b7482; margin-top: 3px;')}>Sus asignaciones bloquean franjas acá</div>
        </div>
        {p.otros.map((o) => (
          <div
            key={o.id}
            onClick={o.click}
            title={'Abrir ' + o.nombre}
            style={css('display: flex; align-items: center; gap: 11px; padding: 11px 16px; border-bottom: 1px solid #f4f6f8; cursor: pointer;')}
          >
            <span style={css('width: 34px; height: 30px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; background: #eef1f5; color: #5b6471;')}>
              {o.chapa}
            </span>
            <span style={css('display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0;')}>
              <span style={css('font-size: 12.5px; font-weight: 500;')}>{o.nombre}</span>
              <span style={css('font-size: 11px; color: #8b95a5;')}>{o.detalle}</span>
            </span>
            <span className="mono" style={css(o.estadoEstilo)}>
              {o.estado}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
