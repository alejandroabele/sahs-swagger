// Generado por tools/generar_scaffold.mjs a partir de specs/*.json (corte inicial).
// Desde el corte, este archivo se mantiene a mano junto con los DTOs de cada servicio.

export interface DiaLectivo {
  readonly id_dia_lectivo: number;
  /** Día de la semana */
  nombre_dia_lectivo: string;
}

export interface FranjaHoraria {
  readonly id_franja_horaria: number;
  /** HH:mm */
  hora_inicio: string;
  /** HH:mm */
  hora_fin: string;
  descripcion?: string;
  es_recreo: boolean;
  id_dia_lectivo: number;
  readonly dia_lectivo?: DiaLectivo;
}

export interface Turno {
  readonly id_turno: number;
  nombre: string;
  cantidad_franjas_total: number;
  readonly franjas_horarias?: FranjaHoraria[];
}

/** Body de POST /horarios/crear_dia_lectivo */
export interface CrearDiaLectivoBody {
  nombre_dia_lectivo: string;
}

/** Body de POST /horarios/crear_franja_horaria */
export interface CrearFranjaHorariaBody {
  hora_inicio: string;
  hora_fin: string;
  descripcion?: string;
  es_recreo: boolean;
  id_dia_lectivo: number;
}

/** Body de POST /horarios/crear_turno */
export interface CrearTurnoBody {
  nombre: string;
  cantidad_franjas_total: number;
}

/** Body de POST /horarios/asignar_franja_a_turno/{id} */
export interface AsignarFranjaATurnoBody {
  id_franja_horaria: number;
}
