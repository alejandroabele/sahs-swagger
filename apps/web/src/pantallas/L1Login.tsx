// L1 · Login. Prototipo: <template id="tpl-login"> y DC.registrar("login") en prototipo/index.html.
// Solo el formulario: no consulta la API hasta que se envía (POST /usuario/login).
import { useState } from 'react';
import { usuario as apiUsuario } from '../api';
import { useIr } from '../app/navegar';
import { rutas } from '../app/rutas';
import { useSesion } from '../estado/sesion';
import { css } from '../lib/css';
import './l1/responsive.css';

const ACCENT = '#2f5fd0';

export default function L1Login() {
  const sesion = useSesion();
  const ir = useIr();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enCurso, setEnCurso] = useState(false);

  async function entrar() {
    if (!usuario.trim() || !clave) {
      setError('Usuario o contraseña incorrectos');
      return;
    }
    setEnCurso(true);
    try {
      const r = await apiUsuario.login({ email: usuario.trim(), contrasenia: clave });
      setClave('');
      setError(null);
      sesion.entrar(r);
      ir(rutas.inicio());
    } catch {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setEnCurso(false);
    }
  }

  return (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <div className="l1-barra" style={css('display: flex; align-items: center; gap: 20px; padding: 0 28px; height: 60px; background: #14181f; color: #fff; flex-shrink: 0;')}>
        <div style={css('display: flex; align-items: center; gap: 10px;')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4.5" width="18" height="16" rx="2"></rect>
            <path d="M3 9.5h18M8.5 4.5V2.5M15.5 4.5V2.5M9 14h6"></path>
          </svg>
          <span style={css('font-size: 15px; font-weight: 700; letter-spacing: -0.01em;')}>SAHS</span>
          <span className="r-ocultar-movil" style={css('font-size: 12px; color: #8b95a5; letter-spacing: 0.02em;')}>Sistema de Administración de Horarios</span>
        </div>
      </div>

      <div className="r-margen l1-cuerpo" style={css('flex-grow: 1; display: flex; justify-content: center; align-items: flex-start; gap: 28px; padding: 96px 44px 40px;')}>
        {/* formulario: POST /usuario/login */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void entrar();
          }}
          className="l1-tarjeta"
          style={css('width: 440px; display: flex; flex-direction: column; gap: 22px; padding: 34px 34px 30px; border-radius: 14px; background: #fff; border: 1px solid #e2e6ec; box-shadow: 0 10px 30px rgba(20,24,31,0.06);')}
        >
          <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <div style={css('font-size: 12px; color: #6b7482; letter-spacing: 0.04em; text-transform: uppercase; font-weight: 600;')}>Colegio Don Bosco · Nivel secundario</div>
            <div style={css('font-size: 28px; font-weight: 600; letter-spacing: -0.025em;')}>Ingresar</div>
          </div>

          <label style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <span style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Usuario o email</span>
            <input
              value={usuario}
              onChange={(e) => {
                setUsuario(e.target.value);
                setError(null);
              }}
              autoComplete="username"
              style={css('height: 42px; padding: 0 13px; border-radius: 8px; border: 1px solid #d3d9e2; background: #fff; font-size: 14px; color: #14181f;')}
            />
          </label>

          <label style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <span style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Contraseña</span>
            <input
              type="password"
              value={clave}
              onChange={(e) => {
                setClave(e.target.value);
                setError(null);
              }}
              autoComplete="current-password"
              style={css('height: 42px; padding: 0 13px; border-radius: 8px; border: 1px solid #d3d9e2; background: #fff; font-size: 14px; color: #14181f;')}
            />
          </label>

          {error && (
            <div role="alert" style={css('display: flex; align-items: center; gap: 9px; font-size: 13px; color: #a3322b; background: #fdf1f0; border: 1px solid #f3cfcb; border-radius: 8px; padding: 11px 13px;')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={css('flex-shrink: 0;')}>
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 7.5v5.5M12 16v.5"></path>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" disabled={enCurso} style={css(`height: 44px; border-radius: 8px; border: none; background: ${ACCENT}; color: #fff; font-size: 14px; font-weight: 600;${enCurso ? ' opacity: 0.7;' : ''}`)}>
            {enCurso ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

      </div>
    </div>
  );
}
