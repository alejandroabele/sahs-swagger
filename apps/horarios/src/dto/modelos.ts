// Modelos de respuesta del servicio (schemas del swagger).
// Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import type * as C from '@sahs/contratos';
@ApiSchema({ name: "DiaLectivo" })
export class DiaLectivo implements C.DiaLectivo {
  @ApiProperty({"type":"integer","format":"int64","example":1,"readOnly":true,"required":true})
  id_dia_lectivo!: number;
  @ApiProperty({"type":"string","description":"Día de la semana","example":"Lunes","required":true})
  nombre_dia_lectivo!: string;
}

@ApiSchema({ name: "FranjaHoraria" })
export class FranjaHoraria implements C.FranjaHoraria {
  @ApiProperty({"type":"integer","format":"int64","example":7,"readOnly":true,"required":true})
  id_franja_horaria!: number;
  @ApiProperty({"type":"string","description":"HH:mm","example":"07:30","required":true})
  hora_inicio!: string;
  @ApiProperty({"type":"string","description":"HH:mm","example":"08:10","required":true})
  hora_fin!: string;
  @ApiProperty({"type":"string","example":"1° módulo","required":false})
  descripcion?: string;
  @ApiProperty({"type":"boolean","example":false,"required":true})
  es_recreo!: boolean;
  @ApiProperty({"type":"integer","format":"int64","example":1,"required":true})
  id_dia_lectivo!: number;
  @ApiProperty({ type: () => DiaLectivo,"readOnly":true,"required":false})
  dia_lectivo?: DiaLectivo;
}

@ApiSchema({ name: "Turno" })
export class Turno implements C.Turno {
  @ApiProperty({"type":"integer","format":"int64","example":1,"readOnly":true,"required":true})
  id_turno!: number;
  @ApiProperty({"type":"string","example":"Mañana","required":true})
  nombre!: string;
  @ApiProperty({"type":"integer","format":"int64","example":8,"required":true})
  cantidad_franjas_total!: number;
  @ApiProperty({ type: () => [FranjaHoraria],"readOnly":true,"required":false})
  franjas_horarias?: FranjaHoraria[];
}
