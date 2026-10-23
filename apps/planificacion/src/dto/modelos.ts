// Modelos de respuesta del servicio (schemas del swagger).
// Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import type * as C from '@sahs/contratos';
/** Resumen de MATERIA (servicio Orientación). */
@ApiSchema({ name: "MateriaResumen" })
export class MateriaResumen implements C.MateriaResumen {
  @ApiProperty({"type":"integer","format":"int64","example":3,"required":false})
  id_materia?: number;
  @ApiProperty({"type":"string","example":"Matemática","required":false})
  nombre_materia?: string;
  @ApiProperty({"type":"integer","format":"int64","example":5,"required":false})
  horas_semanales?: number;
}

/** Resumen de FRANJA_HORARIA (servicio Horarios). */
@ApiSchema({ name: "FranjaHorariaResumen" })
export class FranjaHorariaResumen implements C.FranjaHorariaResumen {
  @ApiProperty({"type":"integer","format":"int64","example":7,"required":false})
  id_franja_horaria?: number;
  @ApiProperty({"type":"string","example":"07:30","required":false})
  hora_inicio?: string;
  @ApiProperty({"type":"string","example":"08:10","required":false})
  hora_fin?: string;
  @ApiProperty({"type":"boolean","example":false,"required":false})
  es_recreo?: boolean;
  @ApiProperty({"type":"string","example":"Lunes","required":false})
  nombre_dia_lectivo?: string;
}

/** Resumen de PROFESOR (servicio Profesor y Suplencias). */
@ApiSchema({ name: "ProfesorResumen" })
export class ProfesorResumen implements C.ProfesorResumen {
  @ApiProperty({"type":"integer","format":"int64","example":12,"required":false})
  id_profesor?: number;
  @ApiProperty({"type":"string","example":"Juan","required":false})
  nombre?: string;
  @ApiProperty({"type":"string","example":"Ramírez","required":false})
  apellido?: string;
  @ApiProperty({"type":"string","example":"L-0042","required":false})
  legajo?: string;
}

/** Resumen de TURNO (servicio Horarios). */
@ApiSchema({ name: "TurnoResumen" })
export class TurnoResumen implements C.TurnoResumen {
  @ApiProperty({"type":"integer","format":"int64","example":1,"required":false})
  id_turno?: number;
  @ApiProperty({"type":"string","example":"Mañana","required":false})
  nombre?: string;
}

/** Resumen de ORIENTACIÓN (servicio Orientación). */
@ApiSchema({ name: "OrientacionResumen" })
export class OrientacionResumen implements C.OrientacionResumen {
  @ApiProperty({"type":"integer","format":"int64","example":2,"required":false})
  id_orientacion?: number;
  @ApiProperty({"type":"string","example":"Economía","required":false})
  nombre_orientacion?: string;
  @ApiProperty({"type":"string","example":"ECO","required":false})
  codigo?: string;
}

/** Resumen de SUPLENCIA (servicio Profesor y Suplencias). */
@ApiSchema({ name: "SuplenciaResumen" })
export class SuplenciaResumen implements C.SuplenciaResumen {
  @ApiProperty({"type":"integer","format":"int64","example":15,"required":false})
  id_suplencia?: number;
  @ApiProperty({"type":"string","format":"date","example":"2026-05-04","required":false})
  fecha_inicio?: string;
  @ApiProperty({"type":"string","format":"date","example":"2026-05-08","required":false})
  fecha_fin?: string;
  @ApiProperty({"type":"string","example":"Licencia médica","required":false})
  motivo?: string;
  @ApiProperty({ type: () => ProfesorResumen,"required":false})
  profesor?: ProfesorResumen;
}

/** Materia que se dicta en el curso, con sus horas. */
@ApiSchema({ name: "MateriaCurso" })
export class MateriaCurso implements C.MateriaCurso {
  @ApiProperty({"type":"integer","format":"int64","example":3,"required":true})
  id_materia!: number;
  @ApiProperty({"type":"string","example":"Matemática","required":true})
  nombre_materia!: string;
  @ApiProperty({"type":"integer","format":"int64","description":"Horas de la materia en este curso. Si no se definen, se toman las de la materia.","example":4,"required":true})
  horas_semanales!: number;
}

/** Catálogo gestionado con crear_estado_propuesta. Carga inicial: Borrador (BOR), En revisión (REV), Validada (VAL) y Cerrada (CER). El estado es de toda la propuesta, no de cada curso. */
@ApiSchema({ name: "EstadoPropuesta" })
export class EstadoPropuesta implements C.EstadoPropuesta {
  @ApiProperty({"type":"integer","format":"int64","example":1,"readOnly":true,"required":true})
  id_estado!: number;
  @ApiProperty({"type":"string","example":"Borrador","required":true})
  nombre!: string;
  @ApiProperty({"type":"string","example":"BOR","required":true})
  codigo!: string;
}

@ApiSchema({ name: "CicloLectivo" })
export class CicloLectivo implements C.CicloLectivo {
  @ApiProperty({"type":"integer","format":"int64","example":2026,"readOnly":true,"required":true})
  id_ciclo_lectivo!: number;
  @ApiProperty({"type":"integer","format":"int64","example":2026,"required":true})
  anio_calendario!: number;
}

@ApiSchema({ name: "AnioAcademico" })
export class AnioAcademico implements C.AnioAcademico {
  @ApiProperty({"type":"integer","format":"int64","example":1,"readOnly":true,"required":true})
  id_anio_academico!: number;
  @ApiProperty({"type":"string","example":"1° año","required":true})
  anio_curricular!: string;
  @ApiProperty({"type":"string","example":"1ER","required":true})
  codigo!: string;
}

@ApiSchema({ name: "Propuesta" })
export class Propuesta implements C.Propuesta {
  @ApiProperty({"type":"integer","format":"int64","example":5,"readOnly":true,"required":true})
  id_propuesta!: number;
  @ApiProperty({"type":"string","example":"Propuesta 2026 v1","required":true})
  nombre!: string;
  @ApiProperty({"type":"string","example":"Primera versión de la grilla 2026","required":false})
  descripcion_propuesta?: string;
  @ApiProperty({"type":"string","format":"date-time","example":"2026-02-10T09:00:00-03:00","readOnly":true,"required":false})
  fecha_creacion?: string;
  @ApiProperty({"type":"string","format":"date-time","example":"2026-02-12T18:30:00-03:00","readOnly":true,"required":false})
  fecha_modificacion?: string;
  @ApiProperty({"type":"string","example":"P-2026-01","required":true})
  codigo!: string;
  @ApiProperty({"type":"integer","format":"int64","example":2026,"required":true})
  id_ciclo_lectivo!: number;
  @ApiProperty({ type: () => EstadoPropuesta,"readOnly":true,"required":false})
  estado?: EstadoPropuesta;
  @ApiProperty({"type":"integer","format":"int64","isArray":true,"required":false})
  ids_clases?: number[];
}

/** Muestra las materias del curso con sus horas, pero no sus clases (para eso está get_curso_clases). */
@ApiSchema({ name: "Curso" })
export class Curso implements C.Curso {
  @ApiProperty({"type":"integer","format":"int64","example":1,"readOnly":true,"required":true})
  id_curso!: number;
  @ApiProperty({"type":"string","example":"A","required":true})
  division!: string;
  @ApiProperty({"type":"integer","format":"int64","example":1,"required":false})
  id_anio_academico?: number;
  @ApiProperty({"type":"integer","format":"int64","example":2026,"required":true})
  id_ciclo_lectivo!: number;
  @ApiProperty({"type":"integer","format":"int64","example":1,"required":true})
  id_turno!: number;
  @ApiProperty({ type: () => TurnoResumen,"readOnly":true,"required":false})
  turno?: TurnoResumen;
  @ApiProperty({"type":"integer","format":"int64","example":2,"required":true})
  id_orientacion!: number;
  @ApiProperty({ type: () => OrientacionResumen,"readOnly":true,"required":false})
  orientacion?: OrientacionResumen;
  @ApiProperty({ type: () => [MateriaCurso],"readOnly":true,"required":false})
  materias?: MateriaCurso[];
  @ApiProperty({ type: () => [FranjaHorariaResumen],"readOnly":true,"required":false})
  franjas_horarias?: FranjaHorariaResumen[];
}

@ApiSchema({ name: "Clase" })
export class Clase implements C.Clase {
  @ApiProperty({"type":"integer","format":"int64","example":40,"readOnly":true,"required":true})
  id_clase!: number;
  @ApiProperty({"type":"string","example":"Matemática 1° A","required":false})
  descripcion?: string;
  @ApiProperty({"type":"string","example":"CL-1A-MAT","required":true})
  codigo!: string;
  @ApiProperty({"type":"integer","format":"int64","example":1,"required":true})
  id_curso!: number;
  @ApiProperty({"type":"integer","format":"int64","example":3,"required":true})
  id_materia!: number;
  @ApiProperty({ type: () => MateriaResumen,"readOnly":true,"required":false})
  materia?: MateriaResumen;
  @ApiProperty({"type":"integer","format":"int64","isArray":true,"required":false})
  ids_franjas_horarias?: number[];
  @ApiProperty({ type: () => [FranjaHorariaResumen],"readOnly":true,"required":false})
  franjas_horarias?: FranjaHorariaResumen[];
  @ApiProperty({"type":"integer","format":"int64","isArray":true,"required":false})
  ids_profesores?: number[];
  @ApiProperty({ type: () => [ProfesorResumen],"readOnly":true,"required":false})
  profesores?: ProfesorResumen[];
  @ApiProperty({ type: () => SuplenciaResumen,"nullable":true,"description":"Suplencia vigente de la clase, si la hay","readOnly":true,"required":false})
  suplencia?: SuplenciaResumen | null;
}
