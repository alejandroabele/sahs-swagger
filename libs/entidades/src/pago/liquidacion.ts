/**
 * Liquidación de sueldo de un profesor (servicio Pago). Función pura: la usan el
 * servicio Pago (calcular_monto_a_liquidar y crear_pago) y los seeds.
 *
 * Fórmula (tomada del recibo de ejemplo del prototipo, P4):
 *   haberes    = horas cátedra semanales de cada materia × valor de la hora del período
 *              + antigüedad (porcentaje sobre las horas)
 *              + sueldo anual complementario en junio y diciembre (50 % de horas + antigüedad)
 *   descuentos = jubilación + obra social + aporte sindical (porcentajes sobre el bruto)
 *   neto       = haberes − descuentos
 */
export interface HorasMateria {
  /** Ej.: "Matemática (1° B y 1° A)" */
  descripcion: string;
  horas: number;
}

export interface ParametrosLiquidacion {
  valor_hora: number;
  antiguedad_pct: number;
  jubilacion_pct: number;
  obra_social_pct: number;
  sindical_pct: number;
}

export interface Concepto {
  descripcion: string;
  cantidad: number | null;
  importe: number;
  tipo: 'haber' | 'descuento';
}

export interface Liquidacion {
  conceptos: Concepto[];
  total_bruto: number;
  total_descuentos: number;
  neto: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** true si el período (YYYY-MM) lleva sueldo anual complementario (junio y diciembre). */
export function llevaSac(periodo: string): boolean {
  const mes = Number(periodo.slice(5, 7));
  return mes === 6 || mes === 12;
}

export function liquidar(horas: HorasMateria[], periodo: string, p: ParametrosLiquidacion): Liquidacion {
  const conceptos: Concepto[] = [];
  let base = 0;
  for (const h of horas) {
    const importe = r2(h.horas * p.valor_hora);
    base += importe;
    conceptos.push({ descripcion: 'Horas cátedra · ' + h.descripcion, cantidad: h.horas, importe, tipo: 'haber' });
  }
  const antiguedad = r2((base * p.antiguedad_pct) / 100);
  conceptos.push({ descripcion: 'Antigüedad', cantidad: p.antiguedad_pct, importe: antiguedad, tipo: 'haber' });
  let bruto = base + antiguedad;
  if (llevaSac(periodo)) {
    const sac = r2((base + antiguedad) / 2);
    conceptos.push({ descripcion: 'Sueldo anual complementario', cantidad: 50, importe: sac, tipo: 'haber' });
    bruto += sac;
  }
  bruto = r2(bruto);
  const descuentos: [string, number][] = [
    ['Aporte jubilatorio', p.jubilacion_pct],
    ['Obra social', p.obra_social_pct],
    ['Aporte sindical', p.sindical_pct],
  ];
  let totalDesc = 0;
  for (const [d, pct] of descuentos) {
    const importe = r2((bruto * pct) / 100);
    totalDesc += importe;
    conceptos.push({ descripcion: d, cantidad: pct, importe, tipo: 'descuento' });
  }
  totalDesc = r2(totalDesc);
  return { conceptos, total_bruto: bruto, total_descuentos: totalDesc, neto: r2(bruto - totalDesc) };
}

/** Parámetros por defecto (los carga el seed en pago_parametro). */
export const PARAMETROS_PAGO_INICIALES: Record<string, string> = {
  antiguedad_pct: '10',
  jubilacion_pct: '11',
  obra_social_pct: '3',
  sindical_pct: '2',
  dia_pago: '5',
  emisor_razon_social: 'Instituto Don Bosco · Neuquén',
  emisor_cuit: '30-54672310-9',
};

/** Valor de la hora cátedra por período (desde). */
export const VALORES_HORA_INICIALES: [string, number][] = [
  ['2025-01', 9800],
  ['2026-03', 10900],
  ['2026-04', 11350],
  ['2026-07', 12600],
];
