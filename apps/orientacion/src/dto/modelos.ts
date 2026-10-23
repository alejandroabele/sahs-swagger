// Modelos de respuesta del servicio (schemas del swagger).
// Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import type * as C from '@sahs/contratos';
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

@ApiSchema({ name: "Orientacion" })
export class Orientacion implements C.Orientacion {
  @ApiProperty({"type":"integer","format":"int64","example":2,"readOnly":true,"required":true})
  id_orientacion!: number;
  @ApiProperty({"type":"string","example":"Economía","required":true})
  nombre_orientacion!: string;
  @ApiProperty({"type":"string","example":"Bachiller en Economía y Administración","required":false})
  descripcion_orientacion?: string;
  @ApiProperty({"type":"string","example":"ECO","required":true})
  codigo!: string;
  @ApiProperty({"type":"integer","format":"int64","isArray":true,"required":false})
  ids_cursos?: number[];
}

@ApiSchema({ name: "Area" })
export class Area implements C.Area {
  @ApiProperty({"type":"integer","format":"int64","example":1,"readOnly":true,"required":true})
  id_area!: number;
  @ApiProperty({"type":"string","example":"Exactas","required":true})
  nombre_area!: string;
  @ApiProperty({"type":"string","example":"Matemática, ciencias naturales e informática","required":false})
  descripcion_area?: string;
  @ApiProperty({"type":"integer","format":"int64","nullable":true,"example":12,"required":false})
  id_profesor_coordinador?: number | null;
  @ApiProperty({ type: () => ProfesorResumen,"nullable":true,"description":"Profesor que coordina el área","readOnly":true,"required":false})
  coordinador?: ProfesorResumen | null;
}

@ApiSchema({ name: "Materia" })
export class Materia implements C.Materia {
  @ApiProperty({"type":"integer","format":"int64","example":3,"readOnly":true,"required":true})
  id_materia!: number;
  @ApiProperty({"type":"string","example":"Matemática","required":true})
  nombre_materia!: string;
  @ApiProperty({"type":"string","example":"Matemática de 1° año","required":false})
  descripcion_materia?: string;
  @ApiProperty({"type":"integer","format":"int64","example":5,"required":true})
  horas_semanales!: number;
  @ApiProperty({"type":"integer","format":"int64","nullable":true,"description":"Una materia puede no tener área","example":1,"required":false})
  id_area?: number | null;
  @ApiProperty({ type: () => Area,"nullable":true,"readOnly":true,"required":false})
  area?: Area | null;
  @ApiProperty({"type":"integer","format":"int64","description":"Orientación de la materia. Dos materias con el mismo nombre en distintas orientaciones son materias distintas.","example":2,"required":true})
  id_orientacion!: number;
  @ApiProperty({ type: () => Orientacion,"readOnly":true,"required":false})
  orientacion?: Orientacion;
  @ApiProperty({"type":"integer","format":"int64","example":1,"required":false})
  id_anio_academico?: number;
  @ApiProperty({"type":"integer","format":"int64","isArray":true,"required":false})
  ids_clases?: number[];
}
