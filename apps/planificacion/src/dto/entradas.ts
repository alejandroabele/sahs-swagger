// Bodies y queries de entrada, con validación (class-validator) y swagger.
// Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type * as C from '@sahs/contratos';
/** Body de POST /planificaciones */
export class CrearPlanificacionDto implements C.CrearPlanificacionBody {
  @ApiProperty({"type":"string","example":"Planificación 2026 v1","required":true})
  @IsString()
  @IsNotEmpty()
  nombre!: string;
  @ApiProperty({"type":"string","example":"Primera versión","required":false})
  @IsOptional()
  @IsString()
  descripcion_planificacion?: string;
  @ApiProperty({"type":"string","example":"P-2026-01","required":true})
  @IsString()
  @IsNotEmpty()
  codigo!: string;
  @ApiProperty({"type":"integer","format":"int64","example":2026,"required":true})
  @Type(() => Number)
  @IsInt()
  id_ciclo_lectivo!: number;
}

/** Body de POST /planificaciones/estados */
export class CrearEstadoPlanificacionDto implements C.CrearEstadoPlanificacionBody {
  @ApiProperty({"type":"string","example":"Vigente","required":true})
  @IsString()
  @IsNotEmpty()
  nombre!: string;
  @ApiProperty({"type":"string","example":"VIG","required":true})
  @IsString()
  @IsNotEmpty()
  codigo!: string;
}

/** Body de PUT /planificaciones/{id}/estado */
export class AsignarEstadoAPlanificacionDto implements C.AsignarEstadoAPlanificacionBody {
  @ApiProperty({"type":"integer","format":"int64","example":2,"required":true})
  @Type(() => Number)
  @IsInt()
  id_estado!: number;
}

/** Body de POST /planificacion/ciclos-lectivos */
export class CrearCicloLectivoDto implements C.CrearCicloLectivoBody {
  @ApiProperty({"type":"integer","format":"int64","example":2026,"required":true})
  @Type(() => Number)
  @IsInt()
  anio_calendario!: number;
}

/** Body de POST /planificacion/cursos */
export class CrearCursoDto implements C.CrearCursoBody {
  @ApiProperty({"type":"string","example":"A","required":true})
  @IsString()
  @IsNotEmpty()
  division!: string;
  @ApiProperty({"type":"integer","format":"int64","example":2026,"required":true})
  @Type(() => Number)
  @IsInt()
  id_ciclo_lectivo!: number;
  @ApiProperty({"type":"integer","format":"int64","example":1,"required":true})
  @Type(() => Number)
  @IsInt()
  id_turno!: number;
  @ApiProperty({"type":"integer","format":"int64","description":"Obligatoria; el ciclo básico usa su propia orientación","example":2,"required":true})
  @Type(() => Number)
  @IsInt()
  id_orientacion!: number;
}

/** Body de POST /planificacion/clases */
export class CrearClaseDto implements C.CrearClaseBody {
  @ApiProperty({"type":"string","example":"Matemática 1° A","required":false})
  @IsOptional()
  @IsString()
  descripcion?: string;
  @ApiProperty({"type":"string","example":"CL-1A-MAT","required":true})
  @IsString()
  @IsNotEmpty()
  codigo!: string;
  @ApiProperty({"type":"integer","format":"int64","example":1,"required":true})
  @Type(() => Number)
  @IsInt()
  id_curso!: number;
  @ApiProperty({"type":"integer","format":"int64","example":3,"required":true})
  @Type(() => Number)
  @IsInt()
  id_materia!: number;
  @ApiProperty({"type":"integer","format":"int64","isArray":true,"required":true})
  @IsArray()
  @IsInt({ each: true })
  ids_franjas_horarias!: number[];
  @ApiProperty({"type":"integer","format":"int64","isArray":true,"required":true})
  @IsArray()
  @IsInt({ each: true })
  ids_profesores!: number[];
}

/** Body de POST /planificacion/cursos/{id}/materias */
export class AsignarMateriaACursoDto implements C.AsignarMateriaACursoBody {
  @ApiProperty({"type":"integer","format":"int64","example":3,"required":true})
  @Type(() => Number)
  @IsInt()
  id_materia!: number;
  @ApiProperty({"type":"integer","format":"int64","description":"Horas semanales de la materia en el curso","example":4,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  horas_semanales?: number;
}

/** Body de PATCH /planificacion/cursos/{id}/materias/{id_materia} */
export class CambiarHorasMateriaCursoDto implements C.CambiarHorasMateriaCursoBody {
  @ApiProperty({"type":"integer","format":"int64","description":"Horas semanales de la materia en el curso","example":4,"required":true})
  @Type(() => Number)
  @IsInt()
  horas_semanales!: number;
}

/** Body de PUT /planificacion/clases/{id}/curso */
export class AsignarCursoAClaseDto implements C.AsignarCursoAClaseBody {
  @ApiProperty({"type":"integer","format":"int64","example":1,"required":true})
  @Type(() => Number)
  @IsInt()
  id_curso!: number;
}

/** Body de POST /planificacion/anios-academicos */
export class CrearAnioAcademicoDto implements C.CrearAnioAcademicoBody {
  @ApiProperty({"type":"string","example":"1° año","required":true})
  @IsString()
  @IsNotEmpty()
  anio_curricular!: string;
  @ApiProperty({"type":"string","example":"1ER","required":true})
  @IsString()
  @IsNotEmpty()
  codigo!: string;
}

/** Body de POST /planificaciones/{id}/clases */
export class AsignarClaseAPlanificacionDto implements C.AsignarClaseAPlanificacionBody {
  @ApiProperty({"type":"integer","format":"int64","example":40,"required":true})
  @Type(() => Number)
  @IsInt()
  id_clase!: number;
}

/** Body de POST /planificacion/anios-academicos/{id}/cursos */
export class AsignarCursoAAnioAcademicoDto implements C.AsignarCursoAAnioAcademicoBody {
  @ApiProperty({"type":"integer","format":"int64","example":1,"required":true})
  @Type(() => Number)
  @IsInt()
  id_curso!: number;
}

/** Query de GET /planificaciones */
export class GetPlanificacionesQuery implements C.GetPlanificacionesQuery {
  @ApiProperty({"type":"integer","format":"int64","description":"Ciclo lectivo de la planificación (filtro opcional)","example":2026,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_ciclo_lectivo?: number;
  @ApiProperty({"type":"integer","format":"int64","description":"Estado actual de la planificación (filtro opcional)","example":1,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_estado?: number;
}

/** Query de GET /planificacion/cursos */
export class GetCursosQuery implements C.GetCursosQuery {
  @ApiProperty({"type":"integer","format":"int64","description":"Ciclo lectivo del curso (filtro opcional)","example":2026,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_ciclo_lectivo?: number;
}

/** Query de GET /planificacion/clases */
export class GetClasesQuery implements C.GetClasesQuery {
  @ApiProperty({"type":"integer","format":"int64","description":"Profesor que figura en `ids_profesores` (filtro opcional)","example":12,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_profesor?: number;
  @ApiProperty({"type":"integer","format":"int64","description":"Curso de la clase (filtro opcional)","example":1,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_curso?: number;
  @ApiProperty({"type":"integer","format":"int64","description":"Planificación que incluye la clase (filtro opcional)","example":5,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_planificacion?: number;
}

/** Body de PUT /planificacion/clases/{id} (agregado: no está en el documento). */
export class EditarClaseDto implements C.EditarClaseBody {
  @ApiProperty({"type":"string","example":"Matemática 1° A","required":false})
  @IsOptional()
  @IsString()
  descripcion?: string;
  @ApiProperty({"type":"integer","format":"int64","isArray":true,"required":true,"description":"Reemplaza las franjas de la clase"})
  @IsArray()
  @IsInt({ each: true })
  ids_franjas_horarias!: number[];
  @ApiProperty({"type":"integer","format":"int64","isArray":true,"required":true,"description":"Reemplaza los docentes de la clase (los mismos en todas sus franjas)"})
  @IsArray()
  @IsInt({ each: true })
  ids_profesores!: number[];
}

/** Body de POST /planificaciones/{id}/generacion (agregado: no está en el documento). */
export class GenerarPlanillaDto implements C.GenerarPlanillaBody {
  @ApiProperty({"type":"integer","format":"int64","description":"Solo ese curso (tiene que ser del ciclo de la planificación). Sin él, todos los cursos del ciclo.","example":1,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_curso?: number;
}
