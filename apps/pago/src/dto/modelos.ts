// Modelos de respuesta del servicio (schemas del swagger).
// Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import type * as C from '@sahs/contratos';
@ApiSchema({ name: "Firma" })
export class Firma implements C.Firma {
  @ApiProperty({"type":"integer","format":"int64","description":"Usuario que firmó","example":10,"required":true})
  id_usuario!: number;
  @ApiProperty({"type":"string","format":"date-time","example":"2026-04-05T10:15:00-03:00","required":true})
  fecha!: string;
}

/** Institución que emite el recibo. */
@ApiSchema({ name: "Emisor" })
export class Emisor implements C.Emisor {
  @ApiProperty({"type":"string","example":"Colegio Don Bosco","required":true})
  razon_social!: string;
  @ApiProperty({"type":"string","example":"30-12345678-9","required":true})
  cuit!: string;
}

/** Línea del recibo: un haber o un descuento. */
@ApiSchema({ name: "ConceptoRecibo" })
export class ConceptoRecibo implements C.ConceptoRecibo {
  @ApiProperty({"type":"string","example":"Horas cátedra · Matemática","required":true})
  descripcion!: string;
  @ApiProperty({"type":"number","format":"double","nullable":true,"description":"Cantidad del concepto (horas, años de antigüedad…); null si no aplica","example":10,"required":false})
  cantidad?: number | null;
  @ApiProperty({"type":"number","format":"double","description":"Importe positivo; el tipo indica si suma o resta","example":520000,"required":true})
  importe!: number;
  @ApiProperty({"type":"string","enum":["haber","descuento"],"example":"haber","required":true})
  tipo!: "haber" | "descuento";
}

@ApiSchema({ name: "ReciboSueldo" })
export class ReciboSueldo implements C.ReciboSueldo {
  @ApiProperty({"type":"integer","format":"int64","example":300,"readOnly":true,"required":true})
  id_recibo_sueldo!: number;
  @ApiProperty({"type":"integer","format":"int64","example":90,"required":true})
  id_pago!: number;
  @ApiProperty({"type":"integer","format":"int64","description":"Copiado del pago, para filtrar los recibos","example":12,"required":true})
  id_profesor!: number;
  @ApiProperty({"type":"string","description":"Período liquidado (AAAA-MM)","example":"2026-03","required":true})
  periodo!: string;
  @ApiProperty({"type":"string","format":"date","example":"2026-04-01","required":true})
  fecha_pago!: string;
  @ApiProperty({ type: () => Emisor,"required":true})
  emisor!: Emisor;
  @ApiProperty({ type: () => [ConceptoRecibo],"required":true})
  conceptos!: ConceptoRecibo[];
  @ApiProperty({"type":"number","format":"double","description":"Suma de los haberes","example":1050000,"required":true})
  total_bruto!: number;
  @ApiProperty({"type":"number","format":"double","description":"Suma de los descuentos","example":205000,"required":true})
  total_descuentos!: number;
  @ApiProperty({"type":"number","format":"double","description":"total_bruto - total_descuentos","example":845000,"required":true})
  neto!: number;
  @ApiProperty({ type: () => Firma,"nullable":true,"description":"Firma del administrativo (se completa en validar_pago)","required":false})
  firma_emisor?: Firma | null;
  @ApiProperty({ type: () => Firma,"nullable":true,"description":"Firma del profesor (se completa en firmar_recibo_de_sueldo)","required":false})
  firma_receptor?: Firma | null;
}

/** Cada pago tiene un único recibo de sueldo, que viene anidado. */
@ApiSchema({ name: "Pago" })
export class Pago implements C.Pago {
  @ApiProperty({"type":"integer","format":"int64","example":90,"readOnly":true,"required":true})
  id_pago!: number;
  @ApiProperty({"type":"integer","format":"int64","example":12,"required":true})
  id_profesor!: number;
  @ApiProperty({"type":"string","description":"Período liquidado (AAAA-MM)","example":"2026-03","required":true})
  periodo!: string;
  @ApiProperty({"type":"boolean","example":false,"required":true})
  validado!: boolean;
  @ApiProperty({ type: () => ReciboSueldo,"readOnly":true,"required":false})
  recibo_sueldo?: ReciboSueldo;
}

@ApiSchema({ name: "MontoLiquidar" })
export class MontoLiquidar implements C.MontoLiquidar {
  @ApiProperty({"type":"integer","format":"int64","example":12,"required":true})
  id_profesor!: number;
  @ApiProperty({"type":"string","description":"Período liquidado (AAAA-MM)","example":"2026-03","required":true})
  periodo!: string;
  @ApiProperty({"type":"number","format":"double","example":845000,"required":true})
  monto!: number;
}
