// Generado por tools/generar_scaffold.mjs a partir de specs/*.json (corte inicial).
// Desde el corte, este archivo se mantiene a mano junto con los DTOs de cada servicio.

/** Cuerpo de toda respuesta de error */
export interface ErrorApi {
  codigo: string;
  mensaje: string;
}

export interface Health {
  status: string;
}

/** Resumen de MATERIA (servicio Orientación). */
export interface MateriaResumen {
  id_materia?: number;
  nombre_materia?: string;
  horas_semanales?: number;
  /** Área de la materia (servicio Orientación), si tiene */
  id_area?: number | null;
  nombre_area?: string | null;
}

/** Resumen de FRANJA_HORARIA (servicio Horarios). */
export interface FranjaHorariaResumen {
  id_franja_horaria?: number;
  hora_inicio?: string;
  hora_fin?: string;
  es_recreo?: boolean;
  nombre_dia_lectivo?: string;
}

/** Resumen de PROFESOR (servicio Profesor y Suplencias). */
export interface ProfesorResumen {
  id_profesor?: number;
  nombre?: string;
  apellido?: string;
  legajo?: string;
}
