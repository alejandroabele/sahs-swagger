import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useState } from 'react';
import { mensajeDeError } from '../api/http';

export type Servicio = 'usuario' | 'pago' | 'horarios' | 'planificacion' | 'orientacion' | 'profesor_suplencias';

/**
 * Consulta a la API con caché. La clave empieza con el servicio y la operación:
 *   useConsulta(['orientacion', 'get_materias'], () => orientacion.get_materias())
 * Así, después de un command, se invalida todo lo del servicio con useAccion.
 */
export function useConsulta<T>(
  clave: [Servicio, string, ...unknown[]],
  fn: () => Promise<T>,
  opciones: Omit<UseQueryOptions<T, Error, T, unknown[]>, 'queryKey' | 'queryFn'> = {},
) {
  return useQuery<T, Error, T, unknown[]>({ queryKey: clave, queryFn: fn, ...opciones });
}

/**
 * Command de la API. Al terminar bien invalida las consultas de los servicios indicados
 * (por defecto, todos), para que las pantallas muestren los datos nuevos sin recargar.
 * `error` queda con el mensaje del servicio para mostrarlo dentro de la pantalla.
 */
export function useAccion<A extends unknown[], R>(fn: (...args: A) => Promise<R>, invalidar?: Servicio[]) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const m = useMutation<R, Error, A>({
    mutationFn: (args: A) => fn(...args),
    onMutate: () => setError(null),
    onError: (e) => setError(mensajeDeError(e)),
    onSuccess: async () => {
      if (!invalidar) await qc.invalidateQueries();
      else await Promise.all(invalidar.map((s) => qc.invalidateQueries({ queryKey: [s] })));
    },
  });
  return {
    /** Ejecuta el command. Devuelve el resultado, o undefined si falló (el mensaje queda en `error`). */
    ejecutar: async (...args: A): Promise<R | undefined> => {
      try {
        return await m.mutateAsync(args);
      } catch {
        return undefined;
      }
    },
    enCurso: m.isPending,
    error,
    limpiarError: () => setError(null),
  };
}

/** Invalida a mano las consultas de uno o más servicios. */
export function useInvalidar() {
  const qc = useQueryClient();
  return (...servicios: Servicio[]) =>
    servicios.length ? Promise.all(servicios.map((s) => qc.invalidateQueries({ queryKey: [s] }))) : qc.invalidateQueries();
}
