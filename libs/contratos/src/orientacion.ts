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

/** Body de POST /orientacion/crear_materia */
export interface CrearMateriaBody {
  nombre_materia: string;
  descripcion_materia?: string;
  horas_semanales: number;
  id_area?: number | null;
  id_orientacion: number;
  id_anio_academico?: number;
}

/** Body de POST /orientacion/crear_area */
export interface CrearAreaBody {
  nombre_area: string;
  descripcion_area?: string;
  id_profesor_coordinador?: number | null;
}

/** Body de POST /orientacion/crear_orientacion */
export interface CrearOrientacionBody {
  nombre_orientacion: string;
  descripcion_orientacion?: string;
  codigo: string;
}

/** Body de POST /orientacion/asignar_materia_area/{id} */
export interface AsignarMateriaAreaBody {
  id_materia: number;
}

/** Body de PUT /orientacion/asignar_materia_orientacion/{id} */
export interface AsignarMateriaOrientacionBody {
  id_orientacion: number;
}

/** Body de POST /orientacion/asignar_curso_a_orientacion/{id} */
export interface AsignarCursoAOrientacionBody {
  id_curso: number;
}

/** Body de POST /orientacion/asignar_clase_a_materia/{id} */
export interface AsignarClaseAMateriaBody {
  id_clase: number;
}

/** Body de PUT /orientacion/asignar_anio_academico_a_materia/{id} */
export interface AsignarAnioAcademicoAMateriaBody {
  id_anio_academico: number;
}
