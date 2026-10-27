import { css } from '../lib/css';
import { useIr } from '../app/navegar';
import { rutas } from '../app/rutas';
import { useCiclo } from '../estado/ciclo';
import { useSesion } from '../estado/sesion';

const ACCENT = '#2f5fd0';

/**
 * Cabecera única del diseño: logo (lleva al inicio), selector de ciclo lectivo,
 * usuario y rol, "Cambiar mi contraseña" (A18) y "Cerrar sesión".
 * Las pantallas del profesor (P2 a P4) no muestran el selector de ciclo: conCiclo={false}.
 */
export function Cabecera({ conCiclo = true }: { conCiclo?: boolean }) {
  const ir = useIr();
  const { usuario, salir } = useSesion();
  const ciclo = useCiclo();
  const nombre = usuario?.nombre_user ?? '';
  const rol = usuario?.rol?.nombre_rol ?? 'Sin rol';

  return (
    <div className="cab" style={css('display: flex; align-items: center; gap: 20px; padding: 0 28px; height: 60px; background: #14181f; color: #fff; flex-shrink: 0;')}>
      <div onClick={() => ir(rutas.inicio())} title="Ir al inicio" style={css('display: flex; align-items: center; gap: 10px; cursor: pointer;')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4.5" width="18" height="16" rx="2"></rect>
          <path d="M3 9.5h18M8.5 4.5V2.5M15.5 4.5V2.5M9 14h6"></path>
        </svg>
        <span style={css('font-size: 15px; font-weight: 700; letter-spacing: -0.01em;')}>SAHS</span>
        <span className="cab-subtitulo" style={css('font-size: 12px; color: #8b95a5; letter-spacing: 0.02em;')}>Sistema de Administración de Horarios</span>
      </div>
      <div style={css('flex-grow: 1;')}></div>
      {conCiclo && (
        <div className="cab-ciclo" style={css('display: flex; align-items: center; gap: 9px; padding: 0 5px 0 11px; height: 36px; border-radius: 8px; background: #1d222b; border: 1px solid #2f3743;')}>
          <svg className="cab-ciclo-icono" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b95a5" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4.5" width="18" height="16" rx="2"></rect>
            <path d="M3 9.5h18M8.5 4.5V2.5M15.5 4.5V2.5"></path>
          </svg>
          <span className="cab-ciclo-etiqueta" style={css('font-size: 12px; color: #8b95a5;')}>Ciclo lectivo</span>
          <select
            value={ciclo.activo ? String(ciclo.activo.anio_calendario) : ''}
            onChange={(e) => ciclo.fijar(Number(e.target.value))}
            style={css('height: 26px; padding: 0 6px; border-radius: 6px; border: 1px solid #3a4250; background: #262c36; color: #fff; font-size: 12.5px; font-weight: 600;')}
          >
            {ciclo.ciclos.map((c) => (
              <option key={c.id_ciclo_lectivo} value={c.anio_calendario}>
                {c.anio_calendario}
              </option>
            ))}
          </select>
        </div>
      )}
      <div style={css('display: flex; align-items: center; gap: 6px; flex-shrink: 0;')}>
        <div style={css('display: flex; align-items: center; gap: 9px; font-size: 13px; color: #c3cad4; padding-right: 4px; white-space: nowrap;')}>
          <div style={css('width: 26px; height: 26px; border-radius: 50%; background: #3a4250; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #fff;')}>
            {nombre.slice(0, 2).toUpperCase()}
          </div>
          <span className="cab-usuario-texto">
            <span style={css('color: #fff; font-weight: 600;')}>{nombre}</span> · {rol}
          </span>
        </div>
        <button
          onClick={() => ir(rutas.cambiarContrasenia())}
          title="Cambiar mi contraseña"
          aria-label="Cambiar mi contraseña"
          style={css('display: flex; align-items: center; justify-content: center; gap: 6px; height: 30px; width: 32px; padding: 0; border-radius: 7px; border: 1px solid #2f3743; background: #1d222b; color: #c3cad4; font-size: 12px;')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2"></rect>
            <path d="M8 11V8a4 4 0 018 0v3"></path>
          </svg>
        </button>
        <button
          onClick={salir}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          style={css('display: flex; align-items: center; justify-content: center; gap: 6px; height: 30px; width: 32px; padding: 0; border-radius: 7px; border: 1px solid #2f3743; background: #1d222b; color: #c3cad4; font-size: 12px;')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l5-5-5-5M15 12H4"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
