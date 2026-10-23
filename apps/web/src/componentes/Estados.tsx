import { css } from '../lib/css';

/** Aviso de carga dentro de una pantalla. */
export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return <div className="cargando">{texto}</div>;
}

/** Mensaje de error de la API dentro de la pantalla (sin diálogos del navegador). */
export function MensajeError({ mensaje, alCerrar }: { mensaje: string | null | undefined; alCerrar?: () => void }) {
  if (!mensaje) return null;
  return (
    <div
      role="alert"
      style={css('display: flex; align-items: flex-start; gap: 10px; padding: 11px 14px; border-radius: 8px; border: 1px solid #f0c9c4; background: #fdf0ee; color: #9a2f22; font-size: 12.5px; line-height: 1.5;')}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={css('flex-shrink: 0; margin-top: 1px;')}>
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M12 7.5v5.5M12 16v.5"></path>
      </svg>
      <span style={css('flex-grow: 1;')}>{mensaje}</span>
      {alCerrar && (
        <button onClick={alCerrar} aria-label="Cerrar" style={css('border: none; background: none; color: inherit; font-size: 14px; padding: 0 2px; line-height: 1;')}>
          ×
        </button>
      )}
    </div>
  );
}
