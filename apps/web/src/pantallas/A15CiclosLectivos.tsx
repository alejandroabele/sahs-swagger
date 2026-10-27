// A15 · Ciclos lectivos. Prototipo: <template id="tpl-cicloslectivos"> y DC.registrar("cicloslectivos") en prototipo/index.html.
// Lista los ciclos (get_ciclos_lectivos, los mismos que usa la cabecera), da de alta un ciclo
// (crear_ciclo_lectivo) y elige el ciclo que usa toda la aplicación (useCiclo().fijar).
import { useState } from 'react';
import { planificacion } from '../api';
import { useIr } from '../app/navegar';
import { rutas } from '../app/rutas';
import { Cabecera } from '../componentes/Cabecera';
import { useCiclo } from '../estado/ciclo';
import { useAccion } from '../estado/consultas';
import { css } from '../lib/css';

const ACCENT = '#2f5fd0';

const COLS = 'display: grid; grid-template-columns: 1fr 170px; gap: 12px;';
const CAMPO = 'height: 38px; padding: 0 12px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; background: #fcfdfe; color: #14181f;';

function caja(marcada: boolean): string {
  return (
    'width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0; margin-top: 1px; display: flex;' +
    ' align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff;' +
    ' border: 1.5px solid ' + (marcada ? ACCENT : '#c3cad4') + ';' +
    ' background: ' + (marcada ? ACCENT : '#fff') + ';'
  );
}

export default function A15CiclosLectivos() {
  const ciclo = useCiclo();
  const ir = useIr();

  const [anio, setAnio] = useState('');
  const [usar, setUsar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const ciclos = ciclo.ciclos;
  const enUso = ciclo.activo?.anio_calendario ?? null;

  const alta = useAccion((nuevo: number) => planificacion.crear_ciclo_lectivo({ anio_calendario: nuevo }), ['planificacion']);

  const limpiar = () => {
    setAnio('');
    setUsar(false);
    setAviso(null);
    alta.limpiarError();
  };

  const crear = async () => {
    const nuevo = Number(anio.trim());
    const r = await alta.ejecutar(nuevo);
    if (!r) return;
    if (usar) ciclo.fijar(r.anio_calendario);
    setAnio('');
    setUsar(false);
    setAviso('Se dio de alta el ciclo ' + r.anio_calendario + '.');
  };

  const errorTexto = alta.error;

  return (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div className="r-margen r-envolver" style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir(rutas.inicio())} style={css('cursor: pointer;')}>Inicio</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span style={css('color: #14181f; font-weight: 500;')}>Ciclos lectivos</span>
          </div>
          <div className="r-titulo" style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Ciclos lectivos</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <div style={css('display: flex; flex-direction: column; align-items: flex-end; gap: 3px;')}>
          <span style={css('font-size: 11.5px; color: #7a8393;')}>Ciclo en uso</span>
          <span className="mono" style={css('font-size: 20px; font-weight: 600;')}>{enUso ?? '—'}</span>
        </div>
      </div>

      <div className="r-margen r-una-columna" style={css('padding: 20px 28px 28px; display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 20px; align-items: start;')}>
        <div style={css('display: flex; flex-direction: column; gap: 16px;')}>
          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('display: flex; align-items: center; gap: 14px; padding: 15px 20px; border-bottom: 1px solid #eef1f5;')}>
              <span style={css('font-size: 13px; font-weight: 600;')}>Ciclos registrados</span>
              <div style={css('flex-grow: 1;')}></div>
              <span style={css('font-size: 12px; color: #6b7482;')}>{ciclos.length === 1 ? '1 ciclo' : ciclos.length + ' ciclos'}</span>
            </div>
            <div style={css(COLS + ' padding: 10px 20px; background: #fafbfc; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Ciclo</div>
              <div></div>
            </div>
            {ciclos.map((c, i) => {
              const usa = c.anio_calendario === enUso;
              return (
                <div
                  key={c.id_ciclo_lectivo}
                  style={css(
                    COLS + ' padding: 15px 20px;' + (i === 0 ? '' : ' border-top: 1px solid #f2f4f7;') + (usa ? ' background: #f3f6fc; box-shadow: inset 3px 0 0 ' + ACCENT + ';' : ''),
                  )}
                >
                  <span style={css('display: flex; align-items: center; gap: 10px;')}>
                    <span className="mono" style={css('font-size: 16px; font-weight: 600;')}>{c.anio_calendario}</span>
                    {usa && (
                      <span style={css('font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 9px; background: #14181f; color: #fff; letter-spacing: 0.03em;')}>EN USO</span>
                    )}
                  </span>
                  <span style={css('align-self: center; display: flex; justify-content: flex-end;')}>
                    <button
                      onClick={() => !usa && ciclo.fijar(c.anio_calendario)}
                      style={css(
                        'height: 30px; padding: 0 12px; border-radius: 7px; font-size: 11.5px; font-weight: 600; white-space: nowrap;' +
                          (usa ? ' border: 1px solid #e2e6ec; background: #f4f6f8; color: #8b95a5; cursor: default;' : ' border: 1px solid ' + ACCENT + '; background: #fff; color: ' + ACCENT + ';'),
                      )}
                    >
                      {usa ? 'En uso' : 'Usar en la aplicación'}
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 16px;')}>
          <div style={css('font-size: 15px; font-weight: 600;')}>Nuevo ciclo lectivo</div>

          <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Año calendario *</label>
            <input
              value={anio}
              onChange={(e) => {
                setAnio(e.target.value);
                setAviso(null);
                alta.limpiarError();
              }}
              placeholder="Ej.: 2027"
              style={css(CAMPO)}
            />
          </div>
          <button
            onClick={() => setUsar(!usar)}
            style={css('display: flex; align-items: flex-start; gap: 11px; padding: 12px 13px; border-radius: 9px; border: 1px solid #e2e6ec; background: #fafbfc; text-align: left;')}
          >
            <span style={css(caja(usar))}>{usar ? '✓' : ''}</span>
            <span style={css('font-size: 13px; font-weight: 600; color: #14181f;')}>Usarlo en la aplicación al crearlo</span>
          </button>

          {errorTexto && (
            <div style={css('font-size: 12.5px; color: #a63244; background: #fbf1f2; border: 1px solid #f1d3d8; border-radius: 8px; padding: 10px 12px; line-height: 1.45;')}>{errorTexto}</div>
          )}
          {aviso && (
            <div style={css('font-size: 12.5px; color: #245239; background: #eef6f0; border: 1px solid #cfe5d6; border-radius: 8px; padding: 10px 12px; line-height: 1.45;')}>{aviso}</div>
          )}

          <div style={css('display: flex; gap: 10px;')}>
            <button
              onClick={crear}
              disabled={alta.enCurso}
              style={css('flex-grow: 1; height: 40px; border-radius: 8px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 13px; font-weight: 600;' + (alta.enCurso ? ' opacity: 0.7;' : ''))}
            >
              {alta.enCurso ? 'Dando de alta…' : 'Dar de alta el ciclo'}
            </button>
            <button onClick={limpiar} style={css('height: 40px; padding: 0 16px; border-radius: 8px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 13px; font-weight: 500;')}>
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
