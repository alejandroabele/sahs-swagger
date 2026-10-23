import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CicloLectivo } from '@sahs/contratos';
import { planificacion } from '../api';
import { useConsulta } from './consultas';
import { useSesion } from './sesion';

const CLAVE = 'sahs.cicloActivo';

export interface CicloGlobal {
  /** Ciclos lectivos, del más nuevo al más viejo. */
  ciclos: CicloLectivo[];
  /** Ciclo elegido en la cabecera (el mismo en todas las pantallas). */
  activo: CicloLectivo | null;
  fijar: (anio: number) => void;
  /** "En curso", "Cerrado" o "Próximo", según el año del ciclo. */
  estado: (anio: number) => string;
}

const Ctx = createContext<CicloGlobal | null>(null);

export function estadoCiclo(anio: number): string {
  const actual = new Date().getFullYear();
  return anio < actual ? 'Cerrado' : anio === actual ? 'En curso' : 'Próximo';
}

/** Ciclo lectivo global (como CicloGlobal del prototipo), guardado en localStorage. */
export function CicloProvider({ children }: { children: ReactNode }) {
  const { iniciada } = useSesion();
  const q = useConsulta(['planificacion', 'get_ciclos_lectivos'], () => planificacion.get_ciclos_lectivos(), { enabled: iniciada });
  const [anio, setAnio] = useState<number | null>(() => {
    const v = Number(localStorage.getItem(CLAVE));
    return v || null;
  });
  const ciclos = useMemo(() => [...(q.data ?? [])].sort((a, b) => b.anio_calendario - a.anio_calendario), [q.data]);

  useEffect(() => {
    if (!ciclos.length) return;
    if (anio == null || !ciclos.some((c) => c.anio_calendario === anio)) {
      const actual = new Date().getFullYear();
      const elegido = ciclos.find((c) => c.anio_calendario === actual) ?? ciclos[0];
      setAnio(elegido.anio_calendario);
    }
  }, [ciclos, anio]);

  // Si otra pestaña cambia el ciclo, se sigue el cambio.
  useEffect(() => {
    const f = (e: StorageEvent) => {
      if (e.key === CLAVE && e.newValue) setAnio(Number(e.newValue));
    };
    window.addEventListener('storage', f);
    return () => window.removeEventListener('storage', f);
  }, []);

  const valor = useMemo<CicloGlobal>(
    () => ({
      ciclos,
      activo: ciclos.find((c) => c.anio_calendario === anio) ?? null,
      fijar: (a: number) => {
        localStorage.setItem(CLAVE, String(a));
        setAnio(a);
      },
      estado: estadoCiclo,
    }),
    [ciclos, anio],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCiclo(): CicloGlobal {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCiclo fuera de CicloProvider');
  return c;
}
