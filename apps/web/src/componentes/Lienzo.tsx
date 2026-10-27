import type { ReactNode } from 'react';

/**
 * Contenedor de cada pantalla. Las pantallas ocupan el ancho de la ventana: en
 * escritorio se estiran y en pantallas angostas reacomodan sus bloques (ver
 * las clases responsive de estilos.css).
 * `ancho` es el ancho del diseño original (1440 o 1560 px); se conserva solo como referencia.
 */
export function Lienzo({ children }: { ancho?: number; children: ReactNode }) {
  return <div className="pantalla">{children}</div>;
}
