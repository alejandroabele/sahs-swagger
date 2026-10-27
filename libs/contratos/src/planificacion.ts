// Generado por tools/generar_scaffold.mjs a partir de specs/*.json (corte inicial).
// Desde el corte, este archivo se mantiene a mano junto con los DTOs de cada servicio.

import type { MateriaResumen, FranjaHorariaResumen, ProfesorResumen } from './compartidos';

/** Resumen de TURNO (servicio Horarios). */
export interface TurnoResumen {
  id_turno?: number;
  nombre?: string;
}

/** Resumen de ORIENTACIÓN (servicio Orientación). */
export interface OrientacionResumen {
  id_orientacion?: number;
  nombre_orientacion?: string;
  codigo?: string;
}

/** Resumen de SUPLENCIA (servicio Profesor y Suplencias). */
export interface SuplenciaResumen {
  id_suplencia?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  motivo?: string;
  profesor?: ProfesorResumen;
}

/** Materia que se dicta en el curso, con sus horas. */
export interface MateriaCurso {
  id_materia: number;
  nombre_materia: string;
  /** Horas de la materia en este curso. Si no se definen, se toman las de la materia. */
  horas_semanales: number;
  /** Área de la materia (servicio Orientación), si tiene */
  id_area?: number | null;
  nombre_area?: string | null;
}

/** Catálogo gestionado con crear_estado_propuesta. Carga inicial: Borrador (BOR), En revisión (REV), Validada (VAL) y Cerrada (CER). El estado es de toda la propuesta, no de cada curso. */
export interface EstadoPropuesta {
  readonly id_estado: number;
  nombre: string;
  codigo: string;
}

export interface CicloLectivo {
  readonly id_ciclo_lectivo: number;
  anio_calendario: number;
}

export interface AnioAcademico {
  readonly id_anio_academico: number;
  anio_curricular: string;
  codigo: string;
}

export interface Propuesta {
  readonly id_propuesta: number;
  nombre: string;
  descripcion_propuesta?: string;
  readonly fecha_creacion?: string;
  readonly fecha_modificacion?: string;
  codigo: string;
  id_ciclo_lectivo: number;
  readonly estado?: EstadoPropuesta;
  ids_clases?: number[];
}

/** Muestra las materias del curso con sus horas, pero no sus clases (para eso está get_curso_clases). */
export interface Curso {
  readonly id_curso: number;
  division: string;
  id_anio_academico?: number;
  id_ciclo_lectivo: number;
  id_turno: number;
  readonly turno?: TurnoResumen;
  id_orientacion: number;
  readonly orientacion?: OrientacionResumen;
  readonly materias?: MateriaCurso[];
  readonly franjas_horarias?: FranjaHorariaResumen[];
}

export interface Clase {
  readonly id_clase: number;
  descripcion?: string;
  codigo: string;
  id_curso: number;
  id_materia: number;
  readonly materia?: MateriaResumen;
  ids_franjas_horarias?: number[];
  readonly franjas_horarias?: FranjaHorariaResumen[];
  ids_profesores?: number[];
  readonly profesores?: ProfesorResumen[];
  /** Suplencia vigente de la clase, si la hay */
  readonly suplencia?: SuplenciaResumen | null;
}

/** Body de POST /planificacion/propuestas */
export interface CrearPropuestaBody {
  nombre: string;
  descripcion_propuesta?: string;
  codigo: string;
  id_ciclo_lectivo: number;
}

/** Body de POST /planificacion/estados-propuesta */
export interface CrearEstadoPropuestaBody {
  nombre: string;
  codigo: string;
}

/** Body de PUT /planificacion/propuestas/{id}/estado */
export interface AsignarEstadoAPropuestaBody {
  id_estado: number;
}

/** Body de POST /planificacion/ciclos-lectivos */
export interface CrearCicloLectivoBody {
  anio_calendario: number;
}

/** Body de POST /planificacion/cursos */
export interface CrearCursoBody {
  division: string;
  id_ciclo_lectivo: number;
  id_turno: number;
  /** Obligatoria; el ciclo básico usa su propia orientación */
  id_orientacion: number;
}

/** Body de POST /planificacion/clases */
export interface CrearClaseBody {
  descripcion?: string;
  codigo: string;
  id_curso: number;
  id_materia: number;
  ids_franjas_horarias: number[];
  ids_profesores: number[];
}

/** Body de POST /planificacion/cursos/{id}/materias */
export interface AsignarMateriaACursoBody {
  id_materia: number;
  /** Horas semanales de la materia en el curso */
  horas_semanales?: number;
}

/** Body de PATCH /planificacion/cursos/{id}/materias/{id_materia} */
export interface CambiarHorasMateriaCursoBody {
  /** Horas semanales de la materia en el curso */
  horas_semanales: number;
}

/** Body de PUT /planificacion/clases/{id}/curso */
export interface AsignarCursoAClaseBody {
  id_curso: number;
}

/** Body de POST /planificacion/anios-academicos */
export interface CrearAnioAcademicoBody {
  anio_curricular: string;
  codigo: string;
}

/** Body de POST /planificacion/propuestas/{id}/clases */
export interface AsignarClaseAPropuestaBody {
  id_clase: number;
}

/** Body de POST /planificacion/anios-academicos/{id}/cursos */
export interface AsignarCursoAAnioAcademicoBody {
  id_curso: number;
}

/** Query de GET /planificacion/propuestas */
export interface GetPropuestasQuery {
  /** Ciclo lectivo de la propuesta (filtro opcional) */
  id_ciclo_lectivo?: number;
  /** Estado actual de la propuesta (filtro opcional) */
  id_estado?: number;
}

/** Query de GET /planificacion/cursos */
export interface GetCursosQuery {
  /** Ciclo lectivo del curso (filtro opcional) */
  id_ciclo_lectivo?: number;
}

/** Query de GET /planificacion/clases */
export interface GetClasesQuery {
  /** Profesor que figura en `ids_profesores` (filtro opcional) */
  id_profesor?: number;
  /** Curso de la clase (filtro opcional) */
  id_curso?: number;
  /** Propuesta que incluye la clase (filtro opcional) */
  id_propuesta?: number;
}

/** Body de PUT /planificacion/clases/{id} (agregado: no está en el documento) */
export interface EditarClaseBody {
  descripcion?: string;
  /** Reemplaza las franjas de la clase */
  ids_franjas_horarias: number[];
  /** Reemplaza los docentes de la clase (los mismos en todas sus franjas) */
  ids_profesores: number[];
}

/** Body de POST /planificacion/propuestas/{id}/generacion (agregado: no está en el documento). */
export interface GenerarPlanillaBody {
  /** Solo ese curso. Sin él, todos los cursos del ciclo de la propuesta. */
  id_curso?: number;
}

/** Horas de una materia de un curso que la generación no pudo ubicar. */
export interface HorasSinUbicar {
  id_curso: number;
  id_materia: number;
  /** "1° A" */
  curso: string;
  materia: string;
  horas: number;
}

/** Clase creada o editada por la generación, con lo que tenía antes (para deshacer). */
export interface CambioGeneracion {
  id_clase: number;
  /** true si la generación creó la clase (deshacer = eliminarla). */
  creada: boolean;
  /** Franjas que tenía la clase antes de generar (vacío si se creó). */
  ids_franjas_horarias_previas: number[];
  /** Docentes que tenía la clase antes de generar (vacío si se creó). */
  ids_profesores_previos: number[];
}

/** Resultado de generar_planilla. */
export interface ResultadoGeneracion {
  /** Horas cátedra ubicadas y guardadas. */
  horas_ubicadas: number;
  sin_ubicar: HorasSinUbicar[];
  cambios: CambioGeneracion[];
  /** Mensajes de las reglas que rechazaron un cambio (409); el resto se guardó igual. */
  errores: string[];
}
