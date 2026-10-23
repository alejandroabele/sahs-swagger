// Bodies y queries de entrada, con validación (class-validator) y swagger.
// Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import type * as C from '@sahs/contratos';
/** Body de POST /horarios/crear_dia_lectivo */
export class CrearDiaLectivoDto implements C.CrearDiaLectivoBody {
  @ApiProperty({"type":"string","example":"Lunes","required":true})
  @IsString()
  @IsNotEmpty()
  nombre_dia_lectivo!: string;
}

/** Body de POST /horarios/crear_franja_horaria */
export class CrearFranjaHorariaDto implements C.CrearFranjaHorariaBody {
  @ApiProperty({"type":"string","example":"07:30","required":true})
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  hora_inicio!: string;
  @ApiProperty({"type":"string","example":"08:10","required":true})
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  hora_fin!: string;
  @ApiProperty({"type":"string","example":"1° módulo","required":false})
  @IsOptional()
  @IsString()
  descripcion?: string;
  @ApiProperty({"type":"boolean","example":false,"required":true})
  @IsBoolean()
  es_recreo!: boolean;
  @ApiProperty({"type":"integer","format":"int64","example":1,"required":true})
  @Type(() => Number)
  @IsInt()
  id_dia_lectivo!: number;
}

/** Body de POST /horarios/crear_turno */
export class CrearTurnoDto implements C.CrearTurnoBody {
  @ApiProperty({"type":"string","example":"Mañana","required":true})
  @IsString()
  @IsNotEmpty()
  nombre!: string;
  @ApiProperty({"type":"integer","format":"int64","example":8,"required":true})
  @Type(() => Number)
  @IsInt()
  cantidad_franjas_total!: number;
}

/** Body de POST /horarios/asignar_franja_a_turno/{id} */
export class AsignarFranjaATurnoDto implements C.AsignarFranjaATurnoBody {
  @ApiProperty({"type":"integer","format":"int64","example":7,"required":true})
  @Type(() => Number)
  @IsInt()
  id_franja_horaria!: number;
}
