// Bodies y queries de entrada, con validación (class-validator) y swagger.
// Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type * as C from '@sahs/contratos';
/** Body de POST /orientacion/materias */
export class CrearMateriaDto implements C.CrearMateriaBody {
  @ApiProperty({"type":"string","example":"Matemática","required":true})
  @IsString()
  @IsNotEmpty()
  nombre_materia!: string;
  @ApiProperty({"type":"string","example":"Matemática de 1° año","required":false})
  @IsOptional()
  @IsString()
  descripcion_materia?: string;
  @ApiProperty({"type":"integer","format":"int64","example":5,"required":true})
  @Type(() => Number)
  @IsInt()
  horas_semanales!: number;
  @ApiProperty({"type":"integer","format":"int64","nullable":true,"example":1,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_area?: number | null;
  @ApiProperty({"type":"integer","format":"int64","example":2,"required":true})
  @Type(() => Number)
  @IsInt()
  id_orientacion!: number;
  @ApiProperty({"type":"integer","format":"int64","example":1,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_anio_academico?: number;
}

/** Body de POST /orientacion/areas */
export class CrearAreaDto implements C.CrearAreaBody {
  @ApiProperty({"type":"string","example":"Exactas","required":true})
  @IsString()
  @IsNotEmpty()
  nombre_area!: string;
  @ApiProperty({"type":"string","example":"Matemática y ciencias","required":false})
  @IsOptional()
  @IsString()
  descripcion_area?: string;
  @ApiProperty({"type":"integer","format":"int64","nullable":true,"example":12,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_profesor_coordinador?: number | null;
}

/** Body de POST /orientacion/orientaciones */
export class CrearOrientacionDto implements C.CrearOrientacionBody {
  @ApiProperty({"type":"string","example":"Economía","required":true})
  @IsString()
  @IsNotEmpty()
  nombre_orientacion!: string;
  @ApiProperty({"type":"string","example":"Bachiller en Economía","required":false})
  @IsOptional()
  @IsString()
  descripcion_orientacion?: string;
  @ApiProperty({"type":"string","example":"ECO","required":true})
  @IsString()
  @IsNotEmpty()
  codigo!: string;
}

/** Body de POST /orientacion/areas/{id}/materias */
export class AsignarMateriaAreaDto implements C.AsignarMateriaAreaBody {
  @ApiProperty({"type":"integer","format":"int64","example":3,"required":true})
  @Type(() => Number)
  @IsInt()
  id_materia!: number;
}

/** Body de PUT /orientacion/materias/{id}/orientacion */
export class AsignarMateriaOrientacionDto implements C.AsignarMateriaOrientacionBody {
  @ApiProperty({"type":"integer","format":"int64","example":2,"required":true})
  @Type(() => Number)
  @IsInt()
  id_orientacion!: number;
}

/** Body de POST /orientacion/orientaciones/{id}/cursos */
export class AsignarCursoAOrientacionDto implements C.AsignarCursoAOrientacionBody {
  @ApiProperty({"type":"integer","format":"int64","example":4,"required":true})
  @Type(() => Number)
  @IsInt()
  id_curso!: number;
}

/** Body de POST /orientacion/materias/{id}/clases */
export class AsignarClaseAMateriaDto implements C.AsignarClaseAMateriaBody {
  @ApiProperty({"type":"integer","format":"int64","example":40,"required":true})
  @Type(() => Number)
  @IsInt()
  id_clase!: number;
}

/** Body de PUT /orientacion/materias/{id}/anio-academico */
export class AsignarAnioAcademicoAMateriaDto implements C.AsignarAnioAcademicoAMateriaBody {
  @ApiProperty({"type":"integer","format":"int64","example":1,"required":true})
  @Type(() => Number)
  @IsInt()
  id_anio_academico!: number;
}

/** Query de GET /orientacion/plan-de-estudios */
export class GetPlanDeEstudiosQuery implements C.GetPlanDeEstudiosQuery {
  @ApiProperty({"type":"integer","format":"int64","description":"Solo esta orientación (filtro opcional); aparece en todos los años, aunque no tenga materias","example":1,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_orientacion?: number;
  @ApiProperty({"type":"integer","format":"int64","description":"Solo este año académico (filtro opcional)","example":1,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_anio_academico?: number;
}
