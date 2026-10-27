import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LoginRespuesta, Privilegio, Profesor, Usuario } from '@sahs/contratos';
import { profesorSuplencias, usuario as apiUsuario } from '../api';
import { useConsulta } from './consultas';

const CLAVE = 'sahs.sesion';

interface Guardada {
  token: string;
  id_usuario: number;
}

export interface Sesion {
  /** true si hay una sesión iniciada en esta pestaña. */
  iniciada: boolean;
  /** true mientras se cargan el usuario y sus privilegios. */
  cargando: boolean;
  usuario: Usuario | null;
  /** Ids de los privilegios del rol del usuario. */
  privilegios: number[];
  privilegiosDetalle: Privilegio[];
  /** Profesor vinculado al usuario (para las pantallas P2 a P4), si lo hay. */
  entrar: (r: LoginRespuesta) => void;
  salir: () => void;
}

const Ctx = createContext<Sesion | null>(null);

function leer(): Guardada | null {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE) || 'null');
  } catch {
    return null;
  }
}

/**
 * Sesión de la pestaña (sessionStorage): sobrevive a una recarga, y cada pestaña puede
 * tener su propio usuario. Carga el usuario (con su rol) y los privilegios del rol.
 */
export function SesionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [guardada, setGuardada] = useState<Guardada | null>(leer);

  const qUsuario = useConsulta(['usuario', 'get_usuario', guardada?.id_usuario], () => apiUsuario.get_usuario(guardada!.id_usuario), {
    enabled: !!guardada,
    retry: false,
  });
  const idRol = qUsuario.data?.id_rol;
  const qPriv = useConsulta(['usuario', 'get_rol_privilegios', idRol], () => apiUsuario.get_rol_privilegios(idRol!), {
    enabled: idRol != null,
  });

  // Si el usuario de la sesión ya no existe (lo borraron), se cierra la sesión.
  useEffect(() => {
    if (guardada && qUsuario.isError) {
      sessionStorage.removeItem(CLAVE);
      setGuardada(null);
    }
  }, [guardada, qUsuario.isError]);

  const entrar = useCallback(
    (r: LoginRespuesta) => {
      const g = { token: r.token, id_usuario: r.usuario.id_usuario };
      sessionStorage.setItem(CLAVE, JSON.stringify(g));
      qc.setQueryData(['usuario', 'get_usuario', g.id_usuario], r.usuario);
      setGuardada(g);
    },
    [qc],
  );

  const salir = useCallback(() => {
    sessionStorage.removeItem(CLAVE);
    setGuardada(null);
    qc.clear();
  }, [qc]);

  const valor = useMemo<Sesion>(
    () => ({
      iniciada: !!guardada,
      cargando: !!guardada && (qUsuario.isLoading || (idRol != null && qPriv.isLoading)),
      usuario: qUsuario.data ?? null,
      privilegios: (qPriv.data ?? []).map((p) => p.id_privilegio),
      privilegiosDetalle: qPriv.data ?? [],
      entrar,
      salir,
    }),
    [guardada, qUsuario.isLoading, qUsuario.data, idRol, qPriv.isLoading, qPriv.data, entrar, salir],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

/**
 * Profesor vinculado al usuario de la sesión. Solo lo piden las pantallas del profesor
 * (mi horario, mi disponibilidad y mis recibos), no la sesión de todas las pantallas.
 */
export function useMiProfesor(): { profesor: Profesor | null; cargando: boolean } {
  const { usuario } = useSesion();
  const idUsuario = usuario?.id_usuario;
  const q = useConsulta(
    ['profesor_suplencias', 'get_profesores', { id_usuario: idUsuario }],
    () => profesorSuplencias.get_profesores({ id_usuario: idUsuario! }),
    { enabled: idUsuario != null },
  );
  return { profesor: q.data?.[0] ?? null, cargando: idUsuario == null || q.isLoading };
}

export function useSesion(): Sesion {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSesion fuera de SesionProvider');
  return s;
}
