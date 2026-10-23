import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Navegación entre pantallas por su código. Los parámetros van en la URL, así una
 * ficha se puede recargar o compartir:
 *   ir('A9', { id_profesor: 3 })   →  /A9?id_profesor=3
 *   ir('A11', { nuevo: 1 })        →  /A11?nuevo=1
 *   ir('A13', { id_propuesta: 4, id_curso: 2 })
 */
export function useNavegar() {
  const nav = useNavigate();
  return useCallback(
    (codigo: string, params?: Record<string, string | number | boolean | null | undefined>) => {
      const qs = Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined && v !== null && v !== false)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      nav(`/${codigo}${qs ? '?' + qs : ''}`);
    },
    [nav],
  );
}

/** Lee un parámetro numérico de la URL (?id_profesor=3 → 3). */
export function useParamNumero(nombre: string): number | null {
  const [sp] = useSearchParams();
  const v = sp.get(nombre);
  return v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : null;
}

/** Lee un parámetro de texto de la URL. */
export function useParam(nombre: string): string | null {
  const [sp] = useSearchParams();
  return sp.get(nombre);
}
