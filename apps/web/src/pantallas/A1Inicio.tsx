// A1 · Inicio. Prototipo: <template id="tpl-menu"> y DC.registrar("menu") en prototipo/index.html.
// Una tarjeta por cada privilegio del rol que tiene pantalla (get_usuario → rol.id_rol → get_rol_privilegios).
import { useState } from 'react';
import { useIr } from '../app/navegar';
import { RUTA_DE_PRIVILEGIO } from '../app/rutas';
import { Cabecera } from '../componentes/Cabecera';
import { useCiclo } from '../estado/ciclo';
import { useSesion } from '../estado/sesion';
import { css } from '../lib/css';

const ACCENT = '#2f5fd0';

/** Ícono de cada privilegio (VISTA del prototipo). */
const ICONO: Record<number, string> = {
  1: 'M5 4h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM3 9h18M9 9v12M15 9v12M8 4V2M16 4V2',
  3: 'M4 4.5A1.5 1.5 0 015.5 3H19v18H5.5A1.5 1.5 0 014 19.5v-15zM8 3v18M4 17h15',
  4: 'M8.5 8a3.5 3.5 0 107 0a3.5 3.5 0 10-7 0M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6',
  5: 'M3 20V8l9-4 9 4v12M9 20v-6h6v6M3 12h18',
  7: 'M3 12a9 9 0 1018 0a9 9 0 10-18 0M12 7v5.3l3.3 2',
  8: 'M4 8h13l-3.5-3.5M20 16H7l3.5 3.5',
  9: 'M7.8 8a3.2 3.2 0 106.4 0a3.2 3.2 0 10-6.4 0M4 19.5c0-3.3 3.1-5.5 7-5.5 0.7 0 1.4 0.1 2 0.2M14.7 17.5a2.8 2.8 0 105.6 0a2.8 2.8 0 10-5.6 0M19.6 19.6L21.5 21.5',
  10: 'M12 21V11M12 11L5 4M12 11l7-7M5 4v4M5 4h4M19 4v4M19 4h-4',
  11: 'M5 4.5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2v-12a2 2 0 012-2zM3 9.5h18M8.5 4.5V2.5M15.5 4.5V2.5M8 14h3M8 17h6',
  12: 'M5 4h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM3 9h18M8 13h3M8 17h3M13 13h3',
  13: 'M3 12a9 9 0 1018 0a9 9 0 10-18 0M8.5 12l2.5 2.5 4.5-5',
  14: 'M5 3h14v18l-2.3-1.6L14.4 21l-2.4-1.6L9.6 21l-2.3-1.6L5 21V3zM9 8h6M9 12h6',
  15: 'M5 4h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM3 9h18M8 13l2 2 4-4M16 17h2',
};

export default function A1Inicio() {
  const { usuario, privilegiosDetalle } = useSesion();
  const ciclo = useCiclo();
  const ir = useIr();
  const rol = usuario?.rol ?? null;
  const [sel, setSel] = useState<number | null>(null);

  // Los privilegios sin pantalla no se muestran.
  const tarjetas = privilegiosDetalle
    .filter((p) => RUTA_DE_PRIVILEGIO[p.id_privilegio])
    .map((p) => ({ ...p, icono: ICONO[p.id_privilegio], destino: RUTA_DE_PRIVILEGIO[p.id_privilegio] }));

  return (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div className="r-margen r-envolver" style={css('display: flex; align-items: flex-end; gap: 24px; padding: 30px 44px 26px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
          <div style={css('font-size: 12px; color: #6b7482; letter-spacing: 0.04em; text-transform: uppercase; font-weight: 600;')}>Colegio Don Bosco · Nivel secundario</div>
          <div className="r-titulo" style={css('font-size: 30px; font-weight: 600; letter-spacing: -0.025em;')}>Inicio</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <div style={css('display: flex; align-items: center; gap: 10px; padding: 9px 15px; border-radius: 8px; border: 1px solid #e2e6ec; background: #fafbfc;')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7482" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4.5" width="18" height="16" rx="2"></rect>
            <path d="M3 9.5h18"></path>
          </svg>
          <span style={css('font-size: 13px; color: #4a5462;')}>Ciclo lectivo</span>
          <span className="mono" style={css('font-size: 13px; font-weight: 600;')}>{ciclo.activo?.anio_calendario ?? '—'}</span>
        </div>
      </div>

      <div className="r-margen" style={css('padding: 26px 44px 34px; display: flex; flex-direction: column; gap: 28px;')}>
        {/* privilegios del rol: una tarjeta por privilegio, sin agrupar */}
        <div style={css('display: flex; flex-direction: column; gap: 13px;')}>
          <div className="r-envolver" style={css('display: flex; align-items: baseline; gap: 11px;')}>
            <span style={css('font-size: 13px; font-weight: 600; letter-spacing: 0.02em;')}>{rol ? 'Rol ' + rol.nombre_rol : 'Sin rol asignado'}</span>
          </div>
          <div className="r-grilla" style={css('display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px;')}>
            {tarjetas.map((p) => {
              const activa = sel === p.id_privilegio;
              return (
                <button
                  key={p.id_privilegio}
                  onClick={() => ir(p.destino)}
                  onMouseEnter={() => setSel(p.id_privilegio)}
                  onMouseLeave={() => setSel(null)}
                  style={css(
                    'display: flex; align-items: center; gap: 12px; width: 100%; padding: 16px; border-radius: 11px; background: #fff;' +
                      ' border: 1px solid ' +
                      (activa ? '#14181f' : '#e2e6ec') +
                      ';' +
                      (activa ? ' box-shadow: 0 0 0 2px rgba(20,24,31,0.10);' : ' box-shadow: 0 1px 2px rgba(20,24,31,0.03);'),
                  )}
                >
                  <span
                    style={css(
                      'border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 38px; height: 38px;' +
                        ' background: ' +
                        (activa ? ACCENT : '#f2f5fa') +
                        '; color: ' +
                        (activa ? '#ffffff' : ACCENT) +
                        ';',
                    )}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={p.icono}></path>
                    </svg>
                  </span>
                  <span style={css('font-size: 14px; font-weight: 600; text-align: left; flex-grow: 1;')}>{p.descripcion_privilegio}</span>
                </button>
              );
            })}
          </div>
          {tarjetas.length === 0 && (
            <div style={css('font-size: 12.5px; color: #a56a10; background: #fdf6ec; border: 1px solid #f1dfc0; border-radius: 8px; padding: 12px 14px;')}>
              El rol no tiene privilegios asignados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
