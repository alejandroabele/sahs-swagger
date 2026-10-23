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

/** Resumen de CLASE (servicio Planificación). */
@ApiSchema({ name: "ClaseResumen" })
export class ClaseResumen implements C.ClaseResumen {
  @ApiProperty({"type":"integer","format":"int64","example":40,"required":false})
  id_clase?: number;
  @ApiProperty({"type":"string","example":"CL-1A-MAT","required":false})
  codigo?: string;
  @ApiProperty({"type":"string","example":"Matemática 1° A","required":false})
  descripcion?: string;
  @ApiProperty({"type":"integer","format":"int64","example":1,"required":false})
  id_curso?: number;
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

@ApiSchema({ name: "Profesor" })
export class Profesor implements C.Profesor {
  @ApiProperty({"type":"integer","format":"int64","example":12,"readOnly":true,"required":true})
  id_profesor!: number;
  @ApiProperty({"type":"string","example":"Juan","required":true})
  nombre!: string;
  @ApiProperty({"type":"string","example":"Ramírez","required":true})
  apellido!: string;
  @ApiProperty({"type":"string","example":"30123456","required":true})
  documento!: string;
  @ApiProperty({"type":"string","nullable":true,"example":"L-0042","required":false})
  legajo?: string | null;
  @ApiProperty({"type":"string","nullable":true,"example":"Profesor titular","required":false})
  cargo_asociado?: string | null;
  @ApiProperty({"type":"string","format":"email","example":"jramirez@donbosco.edu.ar","required":false})
  correo_electronico?: string;
  @ApiProperty({"type":"string","example":"+54 299 555-1234","required":false})
  telefono?: string;
  @ApiProperty({"type":"string","example":"Av. Argentina 123, Neuquén","required":false})
  direccion?: string;
  @ApiProperty({"type":"integer","format":"int64","nullable":true,"description":"Usuario para ingresar al sistema. Se asigna con asignar_usuario_profesor","example":10,"required":false})
  id_usuario?: number | null;
  @ApiProperty({ type: () => [MateriaResumen],"readOnly":true,"required":false})
  lista_materias_habilitadas?: MateriaResumen[];
  @ApiProperty({ type: () => [FranjaHorariaResumen],"readOnly":true,"required":false})
  disponibilidad?: FranjaHorariaResumen[];
}

@ApiSchema({ name: "Suplencia" })
export class Suplencia implements C.Suplencia {
  @ApiProperty({"type":"integer","format":"int64","example":15,"readOnly":true,"required":true})
  id_suplencia!: number;
  @ApiProperty({"type":"string","format":"date","example":"2026-05-04","required":true})
  fecha_inicio!: string;
  @ApiProperty({"type":"string","format":"date","example":"2026-05-08","required":true})
  fecha_fin!: string;
  @ApiProperty({"type":"string","example":"Licencia médica","required":true})
  motivo!: string;
  @ApiProperty({"type":"integer","format":"int64","description":"Profesor que cubre la suplencia","example":12,"required":true})
  id_profesor!: number;
  @ApiProperty({ type: () => ProfesorResumen,"readOnly":true,"required":false})
  profesor?: ProfesorResumen;
  @ApiProperty({"type":"integer","format":"int64","isArray":true,"required":true})
  ids_clases!: number[];
  @ApiProperty({ type: () => [ClaseResumen],"readOnly":true,"required":false})
  clases?: ClaseResumen[];
}
