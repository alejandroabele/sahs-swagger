// Bodies y queries de entrada, con validación (class-validator) y swagger.
// Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import type * as C from '@sahs/contratos';
/** Body de POST /pago/pagos */
export class CrearPagoDto implements C.CrearPagoBody {
  @ApiProperty({"type":"integer","format":"int64","example":12,"required":true})
  @Type(() => Number)
  @IsInt()
  id_profesor!: number;
  @ApiProperty({"type":"string","description":"Período liquidado (AAAA-MM)","example":"2026-03","required":true})
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  periodo!: string;
}

/** Body de POST /pago/pagos/{id}/validacion */
export class ValidarPagoDto implements C.ValidarPagoBody {
  @ApiProperty({"type":"integer","format":"int64","description":"Administrativo que valida","example":1,"required":true})
  @Type(() => Number)
  @IsInt()
  id_usuario!: number;
}

/** Query de GET /pago/profesores/{id}/monto-a-liquidar */
export class CalcularMontoALiquidarQuery implements C.CalcularMontoALiquidarQuery {
  @ApiProperty({"type":"string","description":"Período a liquidar (AAAA-MM)","example":"2026-03","required":true})
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  periodo!: string;
}

/** Body de POST /pago/recibos-de-sueldo/{id}/firma */
export class FirmarReciboDeSueldoDto implements C.FirmarReciboDeSueldoBody {
  @ApiProperty({"type":"integer","format":"int64","description":"Usuario del profesor que firma","example":10,"required":true})
  @Type(() => Number)
  @IsInt()
  id_usuario!: number;
}

/** Query de GET /pago/pagos */
export class GetPagosQuery implements C.GetPagosQuery {
  @ApiProperty({"type":"integer","format":"int64","description":"Profesor liquidado (filtro opcional)","example":12,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_profesor?: number;
  @ApiProperty({"type":"string","description":"Período liquidado (AAAA-MM) (filtro opcional)","example":"2026-03","required":false})
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  periodo?: string;
}

/** Query de GET /pago/recibos-de-sueldo */
export class GetRecibosDeSueldoQuery implements C.GetRecibosDeSueldoQuery {
  @ApiProperty({"type":"integer","format":"int64","description":"Profesor liquidado (filtro opcional)","example":12,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_profesor?: number;
  @ApiProperty({"type":"string","description":"Período liquidado (AAAA-MM) (filtro opcional)","example":"2026-03","required":false})
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  periodo?: string;
}
