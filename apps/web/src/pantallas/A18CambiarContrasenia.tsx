// A18 · Cambiar mi contraseña. Prototipo: <template id="tpl-cambiarcontrasenia"> y DC.registrar("cambiarcontrasenia")
// en prototipo/index.html. Usa cambiar_contrasenia con el id del usuario de la sesión.
// El diseño no pide la contraseña actual, así que no se verifica con login.
import { useState } from 'react';
import { usuario as api } from '../api';
import { useIr } from '../app/navegar';
import { rutas } from '../app/rutas';
import { Cabecera } from '../componentes/Cabecera';
import { useAccion } from '../estado/consultas';
import { useSesion } from '../estado/sesion';
import { css } from '../lib/css';
import './a18/responsive.css';

const ACCENT = '#2f5fd0';
/** Largo mínimo que pide el diseño (la API acepta desde 6). */
const MIN_CLAVE = 8;
const CAMPO = 'height: 38px; padding: 0 12px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; background: #fcfdfe; color: #14181f;';

function req(ok: boolean) {
  return 'font-size: 12px; display: flex; align-items: center; gap: 7px; color: ' + (ok ? '#2f6b45' : '#7a8393') + ';';
}

export default function A18CambiarContrasenia() {
  const ir = useIr();
  const { usuario: u } = useSesion();
  const [clave1, setClave1] = useState('');
  const [clave2, setClave2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const cambiar = useAccion((id: number, contrasenia: string) => api.cambiar_contrasenia(id, { contrasenia }), ['usuario']);

  const largo = clave1.length >= MIN_CLAVE;
  const igual = clave1.length > 0 && clave1 === clave2;
  const errorVisible = error || cambiar.error;

  const limpiarMensajes = () => {
    setError(null);
    setAviso(null);
    cambiar.limpiarError();
  };

  const guardar = async () => {
    if (!u) return;
    if (clave1.length < MIN_CLAVE) return setError(`La contraseña nueva tiene que tener al menos ${MIN_CLAVE} caracteres.`);
    if (clave1 !== clave2) return setError('Las dos contraseñas no coinciden.');
    limpiarMensajes();
    const hecho = await cambiar.ejecutar(u.id_usuario, clave1);
    if (!hecho) return;
    setClave1('');
    setClave2('');
    setAviso('Listo: tu contraseña cambió.');
  };

  return (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div className="r-margen r-envolver" style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div className="r-envolver a18-migas" style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir(rutas.inicio())} style={css('cursor: pointer;')}>
              Inicio
            </span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span>Mi cuenta</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span style={css('color: #14181f; font-weight: 500;')}>Cambiar mi contraseña</span>
          </div>
          <div className="r-titulo" style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Cambiar mi contraseña</div>
        </div>
      </div>

      <div className="r-margen a18-cuerpo" style={css('padding: 32px 28px; display: flex; justify-content: center;')}>
        <div className="r-ancho-movil" style={css('width: 520px; display: flex; flex-direction: column; gap: 16px;')}>
          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 24px; display: flex; flex-direction: column; gap: 16px;')}>
            <div style={css('display: flex; align-items: center; gap: 12px;')}>
              <div
                style={css(
                  'width: 40px; height: 40px; border-radius: 50%; background: #f2f5fa; color: ' +
                    ACCENT +
                    '; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700;',
                )}
              >
                {u ? u.nombre_user.slice(0, 2).toUpperCase() : ''}
              </div>
              <div className="a18-cuenta" style={css('display: flex; flex-direction: column; gap: 2px;')}>
                <span className="mono" style={css('font-size: 14px; font-weight: 600;')}>
                  {u?.nombre_user ?? ''}
                </span>
                <span style={css('font-size: 12px; color: #6b7482;')}>
                  {u?.email ?? ''} · {u?.rol?.nombre_rol ?? 'Sin rol'}
                </span>
              </div>
            </div>
            <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
              <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Contraseña nueva *</label>
              <input
                type="password"
                value={clave1}
                onChange={(e) => {
                  setClave1(e.target.value);
                  limpiarMensajes();
                }}
                placeholder={`Al menos ${MIN_CLAVE} caracteres`}
                style={css(CAMPO)}
              />
            </div>
            <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
              <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Repetir la contraseña nueva *</label>
              <input
                type="password"
                value={clave2}
                onChange={(e) => {
                  setClave2(e.target.value);
                  limpiarMensajes();
                }}
                style={css(CAMPO)}
              />
            </div>
            <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
              <span style={css(req(largo))}>{largo ? '✓' : '•'} Al menos {MIN_CLAVE} caracteres</span>
              <span style={css(req(igual))}>{igual ? '✓' : '•'} Las dos contraseñas coinciden</span>
            </div>
            {errorVisible && (
              <div style={css('font-size: 12.5px; color: #a63244; background: #fbf1f2; border: 1px solid #f1d3d8; border-radius: 8px; padding: 10px 12px; line-height: 1.45;')}>
                {errorVisible}
              </div>
            )}
            {aviso && (
              <div style={css('font-size: 12.5px; color: #245239; background: #eef6f0; border: 1px solid #cfe5d6; border-radius: 8px; padding: 10px 12px; line-height: 1.45;')}>{aviso}</div>
            )}
            <div className="r-envolver" style={css('display: flex; gap: 10px;')}>
              <button
                onClick={guardar}
                disabled={cambiar.enCurso || !u}
                style={css('flex-grow: 1; height: 40px; border-radius: 8px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 13px; font-weight: 600;')}
              >
                Guardar la contraseña nueva
              </button>
              <button
                onClick={() => {
                  setClave1('');
                  setClave2('');
                  limpiarMensajes();
                }}
                style={css('height: 40px; padding: 0 16px; border-radius: 8px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 13px; font-weight: 500;')}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
