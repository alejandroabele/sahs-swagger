// Generado por tools/generar_scaffold.mjs a partir de specs/*.json (corte inicial).
// Desde el corte, este archivo se mantiene a mano junto con los DTOs de cada servicio.

export interface Firma {
  /** Usuario que firmó */
  id_usuario: number;
  fecha: string;
}

/** Institución que emite el recibo. */
export interface Emisor {
  razon_social: string;
  cuit: string;
}

/** Línea del recibo: un haber o un descuento. */
export interface ConceptoRecibo {
  descripcion: string;
  /** Cantidad del concepto (horas, años de antigüedad…); null si no aplica */
  cantidad?: number | null;
  /** Importe positivo; el tipo indica si suma o resta */
  importe: number;
  tipo: "haber" | "descuento";
}

export interface ReciboSueldo {
  readonly id_recibo_sueldo: number;
  id_pago: number;
  /** Copiado del pago, para filtrar los recibos */
  id_profesor: number;
  /** Período liquidado (AAAA-MM) */
  periodo: string;
  fecha_pago: string;
  emisor: Emisor;
  conceptos: ConceptoRecibo[];
  /** Suma de los haberes */
  total_bruto: number;
  /** Suma de los descuentos */
  total_descuentos: number;
  /** total_bruto - total_descuentos */
  neto: number;
  /** Firma del administrativo (se completa en validar_pago) */
  firma_emisor?: Firma | null;
  /** Firma del profesor (se completa en firmar_recibo_de_sueldo) */
  firma_receptor?: Firma | null;
}

/** Cada pago tiene un único recibo de sueldo, que viene anidado. */
export interface Pago {
  readonly id_pago: number;
  id_profesor: number;
  /** Período liquidado (AAAA-MM) */
  periodo: string;
  validado: boolean;
  readonly recibo_sueldo?: ReciboSueldo;
}

export interface MontoLiquidar {
  id_profesor: number;
  /** Período liquidado (AAAA-MM) */
  periodo: string;
  monto: number;
}

/** Body de POST /pago/pagos */
export interface CrearPagoBody {
  id_profesor: number;
  /** Período liquidado (AAAA-MM) */
  periodo: string;
}

/** Body de POST /pago/pagos/{id}/validacion */
export interface ValidarPagoBody {
  /** Administrativo que valida */
  id_usuario: number;
}

/** Query de GET /pago/profesores/{id}/monto-a-liquidar */
export interface CalcularMontoALiquidarQuery {
  /** Período a liquidar (AAAA-MM) */
  periodo: string;
}

/** Body de POST /pago/recibos-de-sueldo/{id}/firma */
export interface FirmarReciboDeSueldoBody {
  /** Usuario del profesor que firma */
  id_usuario: number;
}

/** Query de GET /pago/pagos */
export interface GetPagosQuery {
  /** Profesor liquidado (filtro opcional) */
  id_profesor?: number;
  /** Período liquidado (AAAA-MM) (filtro opcional) */
  periodo?: string;
}

/** Query de GET /pago/recibos-de-sueldo */
export interface GetRecibosDeSueldoQuery {
  /** Profesor liquidado (filtro opcional) */
  id_profesor?: number;
  /** Período liquidado (AAAA-MM) (filtro opcional) */
  periodo?: string;
}
