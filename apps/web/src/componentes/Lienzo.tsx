import { useLayoutEffect, useRef, type ReactNode } from 'react';

/**
 * Armazón de la pantalla: el diseño tiene un ancho fijo (1440 o 1560 px) y se escala
 * para entrar en el ancho de la ventana, igual que en el prototipo.
 */
export function Lienzo({ ancho, children }: { ancho: number; children: ReactNode }) {
  const escena = useRef<HTMLDivElement>(null);
  const marco = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const escalar = () => {
      if (!escena.current || !marco.current || !lienzo.current) return;
      const k = Math.min(1, escena.current.clientWidth / ancho);
      lienzo.current.style.transform = `scale(${k})`;
      marco.current.style.width = Math.round(ancho * k) + 'px';
      marco.current.style.height = Math.round(lienzo.current.scrollHeight * k) + 'px';
    };
    escalar();
    const ro = new ResizeObserver(escalar);
    if (lienzo.current) ro.observe(lienzo.current);
    if (escena.current) ro.observe(escena.current);
    window.addEventListener('resize', escalar);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', escalar);
    };
  }, [ancho]);

  return (
    <div className="escena" ref={escena}>
      <div className="marco" ref={marco}>
        <div className="lienzo" ref={lienzo} style={{ width: ancho }}>
          {children}
        </div>
      </div>
    </div>
  );
}
