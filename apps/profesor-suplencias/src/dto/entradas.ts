// Bodies y queries de entrada, con validación (class-validator) y swagger.
// Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import type * as C from '@sahs/contratos';
/** Body de POST /profesor-suplencias/suplencias */
export class CrearSuplenciaDto implements C.CrearSuplenciaBody {
  @ApiProperty({"type":"string","format":"date","example":"2026-05-04","required":true})
  @IsDateString()
  @IsNotEmpty()
  fecha_inicio!: string;
  @ApiProperty({"type":"string","format":"date","example":"2026-05-08","required":true})
  @IsDateString()
  @IsNotEmpty()
  fecha_fin!: string;
  @ApiProperty({"type":"string","example":"Licencia médica","required":true})
  @IsString()
  @IsNotEmpty()
  motivo!: string;
  @ApiProperty({"type":"integer","format":"int64","isArray":true,"description":"Clases que cubre","required":true})
  @IsArray()
  @IsInt({ each: true })
  ids_clases!: number[];
}

/** Body de POST /profesor-suplencias/profesores */
export class CrearProfesorDto implements C.CrearProfesorBody {
  @ApiProperty({"type":"string","example":"Juan","required":true})
  @IsString()
  @IsNotEmpty()
  nombre!: string;
  @ApiProperty({"type":"string","example":"Ramírez","required":true})
  @IsString()
  @IsNotEmpty()
  apellido!: string;
  @ApiProperty({"type":"string","example":"30123456","required":true})
  @IsString()
  @IsNotEmpty()
  documento!: string;
  @ApiProperty({"type":"string","format":"email","example":"jramirez@donbosco.edu.ar","required":true})
  @IsEmail()
  @IsNotEmpty()
  correo_electronico!: string;
  @ApiProperty({"type":"string","example":"+54 299 555-1234","required":false})
  @IsOptional()
  @IsString()
  telefono?: string;
  @ApiProperty({"type":"string","example":"Av. Argentina 123, Neuquén","required":false})
  @IsOptional()
  @IsString()
  direccion?: string;
}

/** Body de PUT /profesor-suplencias/profesores/{id} */
export class EditarProfesorDto implements C.EditarProfesorBody {
  @ApiProperty({"type":"string","example":"Juan","required":true})
  @IsString()
  @IsNotEmpty()
  nombre!: string;
  @ApiProperty({"type":"string","example":"Ramírez","required":true})
  @IsString()
  @IsNotEmpty()
  apellido!: string;
  @ApiProperty({"type":"string","example":"30123456","required":true})
  @IsString()
  @IsNotEmpty()
  documento!: string;
  @ApiProperty({"type":"string","format":"email","example":"jramirez@donbosco.edu.ar","required":true})
  @IsEmail()
  @IsNotEmpty()
  correo_electronico!: string;
  @ApiProperty({"type":"string","example":"+54 299 555-1234","required":true})
  @IsString()
  @IsNotEmpty()
  telefono!: string;
  @ApiProperty({"type":"string","example":"Av. Argentina 123, Neuquén","required":true})
  @IsString()
  @IsNotEmpty()
  direccion!: string;
  @ApiProperty({"type":"string","nullable":true,"example":"L-0042","required":true})
  @ValidateIf((o) => o.legajo !== null)
  @IsString()
  legajo!: string | null;
  @ApiProperty({"type":"string","nullable":true,"example":"Profesor titular","required":true})
  @ValidateIf((o) => o.cargo_asociado !== null)
  @IsString()
  cargo_asociado!: string | null;
}

/** Body de PUT /profesor-suplencias/profesores/{id}/usuario */
export class AsignarUsuarioProfesorDto implements C.AsignarUsuarioProfesorBody {
  @ApiProperty({"type":"integer","format":"int64","example":10,"required":true})
  @Type(() => Number)
  @IsInt()
  id_usuario!: number;
}

/** Body de PUT /profesor-suplencias/profesores/{id}/activo */
export class AsignarActivoProfesorDto implements C.AsignarActivoProfesorBody {
  @ApiProperty({"type":"boolean","description":"false da de baja al profesor (baja lógica); true lo reactiva","example":false,"required":true})
  @IsBoolean()
  activo!: boolean;
}

/** Body de PUT /profesor-suplencias/profesores/{id}/materias-habilitadas */
export class AsignarMateriasHabilitadasDto implements C.AsignarMateriasHabilitadasBody {
  @ApiProperty({"type":"integer","format":"int64","isArray":true,"required":true})
  @IsArray()
  @IsInt({ each: true })
  ids_materias!: number[];
}

/** Body de PUT /profesor-suplencias/profesores/{id}/disponibilidad */
export class AsignarDisponibilidadDto implements C.AsignarDisponibilidadBody {
  @ApiProperty({"type":"integer","format":"int64","isArray":true,"required":true})
  @IsArray()
  @IsInt({ each: true })
  ids_franjas_horarias!: number[];
}

/** Query de GET /profesor-suplencias/profesores */
export class GetProfesoresQuery implements C.GetProfesoresQuery {
  @ApiProperty({"type":"integer","format":"int64","description":"Usuario del profesor (filtro opcional)","example":10,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_usuario?: number;
  @ApiProperty({"type":"boolean","description":"Solo activos (true) o solo dados de baja (false) (filtro opcional)","example":true,"required":false})
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  activo?: boolean;
}

/** Query de GET /profesor-suplencias/suplencias */
export class GetSuplenciasQuery implements C.GetSuplenciasQuery {
  @ApiProperty({"type":"string","format":"date","description":"Inicio del rango (filtro opcional)","example":"2026-05-11","required":false})
  @IsOptional()
  @IsDateString()
  fecha_desde?: string;
  @ApiProperty({"type":"string","format":"date","description":"Fin del rango (filtro opcional)","example":"2026-05-15","required":false})
  @IsOptional()
  @IsDateString()
  fecha_hasta?: string;
  @ApiProperty({"type":"integer","format":"int64","description":"Profesor que cubre (filtro opcional)","example":12,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_profesor?: number;
  @ApiProperty({"type":"integer","format":"int64","description":"Curso de alguna de las clases cubiertas (filtro opcional)","example":1,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_curso?: number;
  @ApiProperty({"type":"integer","format":"int64","description":"Clase incluida en la suplencia (filtro opcional)","example":40,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_clase?: number;
}
