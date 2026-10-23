// L1 · Login. Prototipo: <template id="tpl-login"> y DC.registrar("login") en prototipo/index.html.
import { useState } from 'react';
import { usuario as apiUsuario } from '../api';
import { useNavegar } from '../app/navegar';
import { useConsulta } from '../estado/consultas';
import { useSesion } from '../estado/sesion';
import { css } from '../lib/css';

const ACCENT = '#2f5fd0';

export default function L1Login() {
  const sesion = useSesion();
  const ir = useNavegar();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enCurso, setEnCurso] = useState(false);

  // Usuarios de ejemplo con su rol (GET /usuario/get_usuarios).
  const ejemplos = useConsulta(['usuario', 'get_usuarios'], () => apiUsuario.get_usuarios());
  const elegido = usuario.trim().toLowerCase();

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
      ir('A1');
    } catch {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setEnCurso(false);
    }
  }

  return (
    <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <div style={css('display: flex; align-items: center; gap: 20px; padding: 0 28px; height: 60px; background: #14181f; color: #fff; flex-shrink: 0;')}>
        <div style={css('display: flex; align-items: center; gap: 10px;')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4.5" width="18" height="16" rx="2"></rect>
            <path d="M3 9.5h18M8.5 4.5V2.5M15.5 4.5V2.5M9 14h6"></path>
          </svg>
          <span style={css('font-size: 15px; font-weight: 700; letter-spacing: -0.01em;')}>SAHS</span>
          <span style={css('font-size: 12px; color: #8b95a5; letter-spacing: 0.02em;')}>Sistema de Administración de Horarios</span>
        </div>
      </div>

      <div style={css('flex-grow: 1; display: flex; justify-content: center; align-items: flex-start; gap: 28px; padding: 96px 44px 40px;')}>
        {/* formulario: POST /usuario/login */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void entrar();
          }}
          style={css('width: 440px; display: flex; flex-direction: column; gap: 22px; padding: 34px 34px 30px; border-radius: 14px; background: #fff; border: 1px solid #e2e6ec; box-shadow: 0 10px 30px rgba(20,24,31,0.06);')}
        >
          <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <div style={css('font-size: 12px; color: #6b7482; letter-spacing: 0.04em; text-transform: uppercase; font-weight: 600;')}>Colegio Don Bosco · Nivel secundario</div>
            <div style={css('font-size: 28px; font-weight: 600; letter-spacing: -0.025em;')}>Ingresar</div>
            <div style={css('font-size: 13px; color: #6b7482; line-height: 1.5;')}>Entrá con tu usuario. El menú muestra las secciones que habilita tu rol.</div>
          </div>

          <label style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <span style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Usuario o email</span>
            <input
              value={usuario}
              onChange={(e) => {
                setUsuario(e.target.value);
                setError(null);
              }}
              placeholder="por ejemplo, secretaria"
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

        {/* usuarios de ejemplo (solo para la demo) */}
        <div style={css('width: 400px; display: flex; flex-direction: column; gap: 12px; padding: 24px 24px 22px; border-radius: 14px; background: #fafbfc; border: 1px dashed #d3d9e2;')}>
          <div style={css('display: flex; flex-direction: column; gap: 5px;')}>
            <div style={css('font-size: 13px; font-weight: 600;')}>Usuarios de ejemplo</div>
            <div style={css('font-size: 12px; color: #6b7482; line-height: 1.5;')}>
              Tocá uno para completar el usuario. La contraseña de los usuarios de ejemplo es <span className="mono">sahs2026</span>.
            </div>
          </div>
          <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
            {(ejemplos.data ?? []).map((u) => {
              const activo = u.nombre_user.toLowerCase() === elegido;
              return (
                <button
                  key={u.id_usuario}
                  type="button"
                  onClick={() => {
                    setUsuario(u.nombre_user);
                    setError(null);
                  }}
                  style={css(
                    'display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; background: #fff; border: 1px solid ' +
                      (activo ? ACCENT : '#e2e6ec') +
                      ';',
                  )}
                >
                  <span className="mono" style={css('font-size: 13px; font-weight: 600; flex-grow: 1; text-align: left;')}>
                    {u.nombre_user}
                  </span>
                  <span style={css('font-size: 12px; color: #6b7482;')}>{u.rol?.nombre_rol ?? 'Sin rol'}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
