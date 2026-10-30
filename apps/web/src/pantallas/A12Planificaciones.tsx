// A12 · Planificaciones. Prototipo: <template id="tpl-planificaciones"> y DC.registrar("planificaciones") en prototipo/index.html.
// Propuestas del ciclo activo (get_propuestas) con su estado y la vigente (una por ciclo). Desde acá se
// crea una nueva vacía (crear_propuesta) y se abre cada una en el armado, donde se decide todo lo demás
// (cambio de estado, duplicar, generar la planilla).
import { useState } from 'react';
import type { Propuesta } from '@sahs/contratos';
import { planificacion } from '../api';
import { mensajeDeError } from '../api/http';
import { useIr } from '../app/navegar';
import { rutas } from '../app/rutas';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useConsulta, useInvalidar } from '../estado/consultas';
import { css } from '../lib/css';
import { fecha } from '../lib/formato';
import { siguienteCodigo } from './a13/modelo';
import './a12/responsive.css';

const ACCENT = '#2f5fd0';

const ESTADOS: Record<string, { nombre: string; fondo: string; texto: string }> = {
  BOR: { nombre: 'Borrador', fondo: '#fdf6ec', texto: '#a56a10' },
  REV: { nombre: 'En revisión', fondo: '#eef3fc', texto: '#1e4099' },
  VIG: { nombre: 'Vigente', fondo: '#e9f2ec', texto: '#2f6b45' },
  FVG: { nombre: 'Fue vigente', fondo: '#f2f4f7', texto: '#7a8393' },
};

const COLS = 'display: grid; grid-template-columns: 1fr 120px 150px 120px; gap: 12px;';

export default function A12Planificaciones() {
  const ciclo = useCiclo();
  const ir = useIr();
  const invalidar = useInvalidar();
  const idCiclo = ciclo.activo?.id_ciclo_lectivo ?? null;
  const anio = ciclo.activo?.anio_calendario ?? null;

  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progreso, setProgreso] = useState<string | null>(null);

  const qProp = useConsulta(['planificacion', 'get_propuestas', idCiclo], () => planificacion.get_propuestas({ id_ciclo_lectivo: idCiclo! }), {
    enabled: !!idCiclo,
  });

  const visibles = [...(qProp.data ?? [])].sort((a, b) => b.codigo.localeCompare(a.codigo));
  const ocupado = progreso != null;

  const limpiar = () => {
    setAviso(null);
    setError(null);
  };

  /** Crea una propuesta vacía en Borrador. El código sigue al último del año en todos los ciclos. */
  async function nueva() {
    if (!idCiclo || anio == null) return;
    limpiar();
    setProgreso('Creando la planificación…');
    try {
      const codigo = siguienteCodigo(anio, await planificacion.get_propuestas());
      const p = await planificacion.crear_propuesta({ nombre: 'Planificación ' + anio, descripcion_propuesta: 'Creada desde cero', codigo, id_ciclo_lectivo: idCiclo });
      setAviso(p.codigo + ' se creó vacía.');
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setProgreso(null);
      await invalidar('planificacion');
    }
  }

  const cargando = !ciclo.activo || qProp.isLoading;
  const errorCarga = qProp.error;

  return (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div className="r-margen r-envolver" style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir(rutas.inicio())} style={css('cursor: pointer;')}>
              Inicio
            </span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span style={css('color: #14181f; font-weight: 500;')}>Planificación anual</span>
          </div>
          <div className="r-titulo" style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Planificaciones</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <button
          onClick={() => void nueva()}
          disabled={ocupado || !idCiclo}
          style={css(
            'display: flex; align-items: center; gap: 9px; height: 40px; padding: 0 17px; border-radius: 8px; border: none; background: ' +
              ACCENT +
              '; color: #fff; font-size: 13px; font-weight: 600;' +
              (ocupado ? ' opacity: 0.6;' : ''),
          )}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          Nueva planificación
        </button>
      </div>

      <div className="r-margen" style={css('padding: 20px 28px 28px; display: flex; flex-direction: column; gap: 16px;')}>
        {errorCarga && <MensajeError mensaje={errorCarga.message} />}
        <MensajeError mensaje={error} alCerrar={() => setError(null)} />

        {progreso && (
          <div style={css('display: flex; align-items: center; gap: 11px; padding: 14px 16px; border-radius: 10px; background: #f3f6fc; border: 1px solid #cfdcf5;')}>
            <span style={css('font-size: 12.5px; color: #2c4570; line-height: 1.55;')}>{progreso}</span>
          </div>
        )}

        {aviso && (
          <div style={css('display: flex; align-items: flex-start; gap: 11px; padding: 14px 16px; border-radius: 10px; background: #ecf5ef; border: 1px solid #c2e0cd;')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2f6b45" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0; margin-top: 1px;')}>
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
            <span style={css('font-size: 12.5px; color: #2f6b45; line-height: 1.55;')}>{aviso}</span>
          </div>
        )}

        <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
          <div className="r-envolver" style={css('display: flex; align-items: center; gap: 14px; padding: 15px 20px; border-bottom: 1px solid #eef1f5;')}>
            <span style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Ciclo lectivo</span>
            <div style={css('display: flex; gap: 2px;')}>
              {ciclo.ciclos.map((c, i) => {
                const activo = anio === c.anio_calendario;
                const n = ciclo.ciclos.length;
                return (
                  <button
                    key={c.id_ciclo_lectivo}
                    onClick={() => {
                      ciclo.fijar(c.anio_calendario);
                      limpiar();
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
            <span style={css('font-size: 12px; color: #6b7482;')}>
              {cargando
                ? '…'
                : visibles.length === 0
                  ? 'Todavía no hay planificaciones en ' + (anio ?? '')
                  : visibles.length === 1
                    ? '1 planificación'
                    : visibles.length + ' planificaciones'}
            </span>
          </div>

          <div className="r-desplazar">
          <div className="a12-tabla">
          <div style={css(COLS + ' padding: 10px 20px; background: #fafbfc; border-bottom: 1px solid #eef1f5;')}>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Planificación</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Estado</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Última modificación</div>
            <div></div>
          </div>

          {!cargando &&
            visibles.map((p, i) => (
              <FilaPropuesta
                key={p.id_propuesta}
                p={p}
                primera={i === 0}
                alAbrir={() => ir(rutas.armado(p.id_propuesta))}
              />
            ))}
          </div>
          </div>
          {cargando && <Cargando />}
        </div>
      </div>
    </div>
  );
}

/** Una fila del listado: lo que se decide sobre la propuesta se hace adentro, en el armado. */
function FilaPropuesta(props: { p: Propuesta; primera: boolean; alAbrir: () => void }) {
  const { p } = props;
  const codigo = p.estado?.codigo ?? 'BOR';
  const e = ESTADOS[codigo] ?? ESTADOS.FVG;
  const origen = p.descripcion_propuesta ? p.nombre + ' · ' + p.descripcion_propuesta : p.nombre;

  return (
    <div style={css(COLS + ' padding: 14px 20px;' + (props.primera ? '' : ' border-top: 1px solid #f2f4f7;'))}>
      <div style={css('display: flex; flex-direction: column; gap: 3px; min-width: 0; padding-right: 12px;')}>
        <div style={css('display: flex; align-items: center; gap: 8px;')}>
          <span className="mono" style={css('font-size: 13.5px; font-weight: 600;')}>
            {p.codigo}
          </span>
          {codigo === 'VIG' && (
            <span style={css('font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 9px; background: #14181f; color: #fff; letter-spacing: 0.03em;')}>VIGENTE</span>
          )}
        </div>
        <div style={css('font-size: 11.5px; color: #8b95a5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')} title={origen}>
          {origen}
        </div>
      </div>
      <div style={css('align-self: center;')}>
        <span style={css('font-size: 11.5px; font-weight: 600; padding: 4px 11px; border-radius: 13px;' + ' background: ' + e.fondo + '; color: ' + e.texto + ';')}>
          {p.estado?.nombre ?? e.nombre}
        </span>
      </div>
      <div style={css('align-self: center; font-size: 12px; color: #6b7482;')}>{fecha(p.fecha_modificacion ?? p.fecha_creacion)}</div>
      <div style={css('align-self: center; display: flex; gap: 7px; justify-content: flex-end;')}>
        <button
          onClick={props.alAbrir}
          style={css('height: 30px; padding: 0 13px; border-radius: 7px; font-size: 11.5px; font-weight: 600; white-space: nowrap; border: none; background: ' + ACCENT + '; color: #fff;')}
        >
          Abrir
        </button>
      </div>
    </div>
  );
}
