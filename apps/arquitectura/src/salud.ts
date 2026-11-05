import { useEffect, useState } from 'react';

export type Salud = 'arriba' | 'caido' | 'desconocido';

const INTERVALO_MS = 10_000;

async function consultar(id: string): Promise<Salud> {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}salud/${id}`, { cache: 'no-store' });
    if (!r.ok) return 'caido';
    const cuerpo = (await r.json()) as { status?: string };
    return cuerpo.status === 'UP' ? 'arriba' : 'caido';
  } catch {
    return 'caido';
  }
}

/** Estado de cada servicio, consultado cada 10 s mientras `activo` es true. */
export function useSalud(ids: string[], activo: boolean): Record<string, Salud> {
  const [estado, setEstado] = useState<Record<string, Salud>>({});
  const clave = ids.join(',');

  useEffect(() => {
    if (!activo) return;
    let vivo = true;
    const revisar = async () => {
      const resultados = await Promise.all(ids.map(async (id) => [id, await consultar(id)] as const));
      if (vivo) setEstado(Object.fromEntries(resultados));
    };
    revisar();
    const t = setInterval(revisar, INTERVALO_MS);
    return () => {
      vivo = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, activo]);

  return estado;
}
