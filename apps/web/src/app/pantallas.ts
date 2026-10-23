import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface DefPantalla {
  titulo: string;
  /** Ancho del diseño en px. La pantalla se escala para entrar en la ventana. */
  ancho: number;
  /** Privilegio que da acceso a la pantalla; null = cualquier usuario con sesión. */
  privilegio: number | null;
  publica?: boolean;
  componente: LazyExoticComponent<ComponentType>;
}

/**
 * Pantallas de la app, con el mismo código que en el canvas del diseño
 * (CONFIG.pantallas del prototipo).
 */
export const PANTALLAS: Record<string, DefPantalla> = {
  L1: { titulo: 'Login', ancho: 1440, privilegio: null, publica: true, componente: lazy(() => import('../pantallas/L1Login')) },
  A1: { titulo: 'Inicio', ancho: 1440, privilegio: null, componente: lazy(() => import('../pantallas/A1Inicio')) },
  A2: { titulo: 'Relevamiento de disponibilidad', ancho: 1440, privilegio: 15, componente: lazy(() => import('../pantallas/A2Disponibilidad')) },
  A3: { titulo: 'Generación de la planilla anual', ancho: 1440, privilegio: 1, componente: lazy(() => import('../pantallas/A3GeneracionPlanilla')) },
  A4: { titulo: 'Suplencias del período', ancho: 1440, privilegio: 8, componente: lazy(() => import('../pantallas/A4Suplencias')) },
  A5: { titulo: 'Materias', ancho: 1440, privilegio: 3, componente: lazy(() => import('../pantallas/A5Materias')) },
  A6: { titulo: 'Ficha de la materia', ancho: 1440, privilegio: 3, componente: lazy(() => import('../pantallas/A6MateriaDetalle')) },
  A7: { titulo: 'Profesores', ancho: 1440, privilegio: 4, componente: lazy(() => import('../pantallas/A7Profesores')) },
  A8: { titulo: 'Alta de profesor', ancho: 1440, privilegio: 4, componente: lazy(() => import('../pantallas/A8ProfesorAlta')) },
  A9: { titulo: 'Ficha del profesor', ancho: 1440, privilegio: 4, componente: lazy(() => import('../pantallas/A9ProfesorDetalle')) },
  A10: { titulo: 'Cursos', ancho: 1440, privilegio: 5, componente: lazy(() => import('../pantallas/A10Cursos')) },
  A11: { titulo: 'Alta y edición de curso', ancho: 1440, privilegio: 5, componente: lazy(() => import('../pantallas/A11CursoForm')) },
  A12: { titulo: 'Planificaciones', ancho: 1440, privilegio: 1, componente: lazy(() => import('../pantallas/A12Planificaciones')) },
  A13: { titulo: 'Armado de la planificación', ancho: 1560, privilegio: 1, componente: lazy(() => import('../pantallas/A13PlanificacionManual')) },
  A14: { titulo: 'Orientaciones', ancho: 1440, privilegio: 10, componente: lazy(() => import('../pantallas/A14Orientaciones')) },
  A15: { titulo: 'Ciclos lectivos', ancho: 1440, privilegio: 11, componente: lazy(() => import('../pantallas/A15CiclosLectivos')) },
  A16: { titulo: 'Turnos y franjas horarias', ancho: 1440, privilegio: 7, componente: lazy(() => import('../pantallas/A16Turnos')) },
  A17: { titulo: 'Usuarios y roles', ancho: 1440, privilegio: 9, componente: lazy(() => import('../pantallas/A17Usuarios')) },
  A18: { titulo: 'Cambiar mi contraseña', ancho: 1440, privilegio: null, componente: lazy(() => import('../pantallas/A18CambiarContrasenia')) },
  P2: { titulo: 'Mi grilla horaria', ancho: 1440, privilegio: 12, componente: lazy(() => import('../pantallas/P2MiHorario')) },
  P3: { titulo: 'Mi disponibilidad', ancho: 1440, privilegio: 13, componente: lazy(() => import('../pantallas/P3MiDisponibilidad')) },
  P4: { titulo: 'Mis recibos', ancho: 1440, privilegio: 14, componente: lazy(() => import('../pantallas/P4MisRecibos')) },
};

/**
 * Qué pantalla abre cada tarjeta del inicio (CONFIG.privilegios del prototipo).
 * Los privilegios sin pantalla (2 "Recibos de sueldo" y 6 "Áreas") se muestran como "Pendiente".
 */
export const PANTALLA_DE_PRIVILEGIO: Record<number, string> = {
  1: 'A12',
  3: 'A5',
  4: 'A7',
  5: 'A10',
  7: 'A16',
  8: 'A4',
  9: 'A17',
  10: 'A14',
  11: 'A15',
  12: 'P2',
  13: 'P3',
  14: 'P4',
  15: 'A2',
};

export function puedeVer(codigo: string, privilegios: number[]): boolean {
  const p = PANTALLAS[codigo];
  if (!p) return false;
  if (p.publica || p.privilegio == null) return true;
  return privilegios.includes(p.privilegio);
}
