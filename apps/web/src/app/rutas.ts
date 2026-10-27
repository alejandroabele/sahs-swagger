/**
 * Rutas de la app. Cada pantalla tiene una o más rutas (patrones de React Router) y
 * se navega con las funciones de `rutas`, que arman la URL con sus parámetros:
 *
 *   ir(rutas.materia(5))                 →  /materias/5
 *   ir(rutas.armado(5, 2))               →  /planificaciones/5/cursos/2
 *
 * Los códigos de pantalla (A1…P4) son internos: no aparecen en las URLs.
 */
export const RUTAS: Record<string, string[]> = {
  L1: ['/login'],
  A1: ['/'],
  A2: ['/disponibilidad', '/disponibilidad/:idProfesor'],
  A3: ['/planificaciones/:id/generacion', '/planificaciones/:id/generacion/:idCurso'],
  A4: ['/suplencias'],
  A5: ['/materias'],
  A6: ['/materias/:id'],
  A7: ['/profesores'],
  A8: ['/profesores/nuevo'],
  A9: ['/profesores/:id'],
  A10: ['/cursos'],
  A11: ['/cursos/nuevo', '/cursos/:id'],
  A12: ['/planificaciones'],
  A13: ['/planificaciones/:id', '/planificaciones/:id/cursos/:idCurso'],
  A14: ['/orientaciones'],
  A15: ['/ciclos-lectivos'],
  A16: ['/turnos'],
  A17: ['/usuarios', '/roles'],
  A18: ['/mi-cuenta/contrasenia'],
  P2: ['/mi-horario'],
  P3: ['/mi-disponibilidad'],
  P4: ['/mis-recibos'],
};

export const rutas = {
  login: () => '/login',
  inicio: () => '/',
  disponibilidad: (idProfesor?: number) => (idProfesor ? `/disponibilidad/${idProfesor}` : '/disponibilidad'),
  generacion: (idPropuesta: number, idCurso?: number) =>
    `/planificaciones/${idPropuesta}/generacion` + (idCurso ? `/${idCurso}` : ''),
  suplencias: () => '/suplencias',
  materias: () => '/materias',
  materia: (id: number) => `/materias/${id}`,
  profesores: () => '/profesores',
  profesorNuevo: () => '/profesores/nuevo',
  profesor: (id: number) => `/profesores/${id}`,
  cursos: () => '/cursos',
  cursoNuevo: () => '/cursos/nuevo',
  curso: (id: number) => `/cursos/${id}`,
  planificaciones: () => '/planificaciones',
  armado: (idPropuesta: number, idCurso?: number) =>
    `/planificaciones/${idPropuesta}` + (idCurso ? `/cursos/${idCurso}` : ''),
  orientaciones: () => '/orientaciones',
  ciclosLectivos: () => '/ciclos-lectivos',
  turnos: () => '/turnos',
  usuarios: () => '/usuarios',
  roles: () => '/roles',
  cambiarContrasenia: () => '/mi-cuenta/contrasenia',
  miHorario: () => '/mi-horario',
  miDisponibilidad: () => '/mi-disponibilidad',
  misRecibos: () => '/mis-recibos',
};

/** Ruta a la que lleva cada tarjeta del inicio. Los privilegios sin pantalla no figuran y no se muestran. */
export const RUTA_DE_PRIVILEGIO: Record<number, string> = {
  1: rutas.planificaciones(),
  3: rutas.materias(),
  4: rutas.profesores(),
  5: rutas.cursos(),
  7: rutas.turnos(),
  8: rutas.suplencias(),
  9: rutas.usuarios(),
  10: rutas.orientaciones(),
  11: rutas.ciclosLectivos(),
  12: rutas.miHorario(),
  13: rutas.miDisponibilidad(),
  14: rutas.misRecibos(),
  15: rutas.disponibilidad(),
};
