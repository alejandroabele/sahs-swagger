// Generado por tools/generar_scaffold.mjs a partir de specs/*.json (corte inicial).
// Desde el corte, este archivo se mantiene a mano junto con los DTOs de cada servicio.

import type { MateriaResumen, FranjaHorariaResumen, ProfesorResumen } from './compartidos';

/** Resumen de CLASE (servicio Planificación). */
export interface ClaseResumen {
  id_clase?: number;
  codigo?: string;
  descripcion?: string;
  id_curso?: number;
}

export interface Profesor {
  readonly id_profesor: number;
  nombre: string;
  apellido: string;
  documento: string;
  legajo?: string | null;
  cargo_asociado?: string | null;
  correo_electronico?: string;
  telefono?: string;
  direccion?: string;
  /** Usuario para ingresar al sistema. Se asigna con asignar_usuario_profesor */
  id_usuario?: number | null;
  readonly lista_materias_habilitadas?: MateriaResumen[];
  readonly disponibilidad?: FranjaHorariaResumen[];
}

export interface Suplencia {
  readonly id_suplencia: number;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  /** Profesor que cubre la suplencia */
  id_profesor: number;
  readonly profesor?: ProfesorResumen;
  ids_clases: number[];
  readonly clases?: ClaseResumen[];
}

/** Body de POST /profesor_suplencias/crear_suplencia */
export interface CrearSuplenciaBody {
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  /** Profesor que cubre la suplencia */
  id_profesor: number;
  /** Clases que cubre */
  ids_clases: number[];
}

/** Body de POST /profesor_suplencias/crear_profesor */
export interface CrearProfesorBody {
  nombre: string;
  apellido: string;
  documento: string;
  correo_electronico: string;
  telefono?: string;
  direccion?: string;
}

/** Body de PUT /profesor_suplencias/editar_profesor/{id} */
export interface EditarProfesorBody {
  nombre: string;
  apellido: string;
  documento: string;
  correo_electronico: string;
  telefono: string;
  direccion: string;
  legajo: string | null;
  cargo_asociado: string | null;
}

/** Body de PUT /profesor_suplencias/asignar_usuario_profesor/{id} */
export interface AsignarUsuarioProfesorBody {
  id_usuario: number;
}

/** Body de PUT /profesor_suplencias/asignar_materias_habilitadas/{id} */
export interface AsignarMateriasHabilitadasBody {
  ids_materias: number[];
}

/** Body de PUT /profesor_suplencias/asignar_disponibilidad/{id} */
export interface AsignarDisponibilidadBody {
  ids_franjas_horarias: number[];
}

/** Query de GET /profesor_suplencias/get_profesores */
export interface GetProfesoresQuery {
  /** Usuario del profesor (filtro opcional) */
  id_usuario?: number;
}

/** Query de GET /profesor_suplencias/get_suplencias */
export interface GetSuplenciasQuery {
  /** Inicio del rango (filtro opcional) */
  fecha_desde?: string;
  /** Fin del rango (filtro opcional) */
  fecha_hasta?: string;
  /** Profesor que cubre (filtro opcional) */
  id_profesor?: number;
  /** Curso de alguna de las clases cubiertas (filtro opcional) */
  id_curso?: number;
  /** Clase incluida en la suplencia (filtro opcional) */
  id_clase?: number;
}
