// Generado por tools/generar_scaffold.mjs a partir de specs/*.json (corte inicial).
// Desde el corte, este archivo se mantiene a mano junto con los DTOs de cada servicio.

import type { ProfesorResumen } from './compartidos';

export interface Orientacion {
  readonly id_orientacion: number;
  nombre_orientacion: string;
  descripcion_orientacion?: string;
  codigo: string;
  ids_cursos?: number[];
}

export interface Area {
  readonly id_area: number;
  nombre_area: string;
  descripcion_area?: string;
  id_profesor_coordinador?: number | null;
  /** Profesor que coordina el área */
  readonly coordinador?: ProfesorResumen | null;
}

export interface Materia {
  readonly id_materia: number;
  nombre_materia: string;
  descripcion_materia?: string;
  horas_semanales: number;
  /** Una materia puede no tener área */
  id_area?: number | null;
  readonly area?: Area | null;
  /** Orientación de la materia. Dos materias con el mismo nombre en distintas orientaciones son materias distintas. */
  id_orientacion: number;
  readonly orientacion?: Orientacion;
  id_anio_academico?: number;
  ids_clases?: number[];
}

/** Body de POST /orientacion/materias */
export interface CrearMateriaBody {
  nombre_materia: string;
  descripcion_materia?: string;
  horas_semanales: number;
  id_area?: number | null;
  id_orientacion: number;
  id_anio_academico?: number;
}

/** Body de POST /orientacion/areas */
export interface CrearAreaBody {
  nombre_area: string;
  descripcion_area?: string;
  id_profesor_coordinador?: number | null;
}

/** Body de POST /orientacion/orientaciones */
export interface CrearOrientacionBody {
  nombre_orientacion: string;
  descripcion_orientacion?: string;
  codigo: string;
}

/** Body de POST /orientacion/areas/{id}/materias */
export interface AsignarMateriaAreaBody {
  id_materia: number;
}

/** Body de PUT /orientacion/materias/{id}/orientacion */
export interface AsignarMateriaOrientacionBody {
  id_orientacion: number;
}

/** Body de POST /orientacion/orientaciones/{id}/cursos */
export interface AsignarCursoAOrientacionBody {
  id_curso: number;
}

/** Body de POST /orientacion/materias/{id}/clases */
export interface AsignarClaseAMateriaBody {
  id_clase: number;
}

/** Body de PUT /orientacion/materias/{id}/anio-academico */
export interface AsignarAnioAcademicoAMateriaBody {
  id_anio_academico: number;
}

/** Materia dentro del plan de estudios (GET /orientacion/plan-de-estudios). */
export interface PlanDeEstudiosMateria {
  id_materia: number;
  nombre_materia: string;
  descripcion_materia?: string;
  horas_semanales: number;
  id_area?: number | null;
  nombre_area?: string | null;
}

/** Orientación de un año del plan de estudios, con sus materias. */
export interface PlanDeEstudiosOrientacion {
  id_orientacion: number;
  nombre_orientacion: string;
  codigo: string;
  materias: PlanDeEstudiosMateria[];
}

/** Un año académico del plan de estudios: año → orientaciones → materias. */
export interface PlanDeEstudiosAnio {
  id_anio_academico: number;
  /** Nombre del año (servicio Planificación), por ejemplo "1° año" */
  anio_curricular: string;
  orientaciones: PlanDeEstudiosOrientacion[];
}

/** Query de GET /orientacion/plan-de-estudios */
export interface GetPlanDeEstudiosQuery {
  /** Solo esta orientación (aparece en todos los años, aunque no tenga materias) */
  id_orientacion?: number;
  /** Solo este año académico */
  id_anio_academico?: number;
}
