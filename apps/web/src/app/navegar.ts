import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Navegación entre pantallas. Las URLs se arman con `rutas` (app/rutas.ts):
 *   const ir = useIr();
 *   ir(rutas.profesor(3));
 * Con `{ replace: true }` la ruta nueva reemplaza a la actual en el historial
 * (por ejemplo, para completar un parámetro que faltaba en la URL).
 */
export function useIr() {
  const nav = useNavigate();
  return useCallback((ruta: string, opciones?: { replace?: boolean }) => nav(ruta, opciones), [nav]);
}

/** Lee un parámetro numérico de la ruta (/profesores/:id → 3). Si falta o no es un número, null. */
export function useParamRuta(nombre: string): number | null {
  const v = useParams()[nombre];
  return v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : null;
}
