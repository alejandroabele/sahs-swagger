// Generado por tools/generar_cliente_web.mjs a partir del /docs-json del servicio. No editar a mano.
import type { CalcularMontoALiquidarQuery, CrearPagoBody, FirmarReciboDeSueldoBody, GetPagosQuery, GetRecibosDeSueldoQuery, MontoLiquidar, Pago, ReciboSueldo, ValidarPagoBody } from '@sahs/contratos';
import { pedir } from './http';

/** Servicio Pago Service. */
export const pago = {
  /** POST /pago/crear_pago — Crear pago del profesor para un período. Genera también el único recibo de sueldo del pago, con sus conceptos y el neto de calcular_monto_a_liquidar. */
  crear_pago: (body: CrearPagoBody) =>
    pedir<Pago>(`/pago/crear_pago`, { metodo: 'POST', body }),
  /** POST /pago/validar_pago/{id} — Validar pago (administrativo). Deja `validado` en true y completa `firma_emisor` en el recibo del pago. */
  validar_pago: (id: number, body: ValidarPagoBody) =>
    pedir<Pago>(`/pago/validar_pago/${id}`, { metodo: 'POST', body }),
  /** GET /pago/calcular_monto_a_liquidar/{id} — Calcular monto a liquidar. El cálculo es interno del servicio; solo recibe el profesor y el período. Es GET porque no guarda nada (en el documento figura como command). */
  calcular_monto_a_liquidar: (id: number, query: CalcularMontoALiquidarQuery) =>
    pedir<MontoLiquidar>(`/pago/calcular_monto_a_liquidar/${id}`, { metodo: 'GET', query }),
  /** GET /pago/get_pagos — Listar pagos (con su recibo anidado) */
  get_pagos: (query?: GetPagosQuery) =>
    pedir<Pago[]>(`/pago/get_pagos`, { metodo: 'GET', query }),
  /** GET /pago/bajar_recibo_sueldo/{id} — Descargar el recibo en PDF. Es GET porque solo descarga el PDF (en el documento figura como command). */
  bajar_recibo_sueldo: (id: number) =>
    pedir<Blob>(`/pago/bajar_recibo_sueldo/${id}`, { metodo: 'GET', tipo: 'blob' }),
  /** POST /pago/firmar_recibo_de_sueldo/{id} — Firmar recibo (profesor). Completa `firma_receptor` con el usuario y la fecha. La firma es definitiva: no hay operación para revertirla. */
  firmar_recibo_de_sueldo: (id: number, body: FirmarReciboDeSueldoBody) =>
    pedir<ReciboSueldo>(`/pago/firmar_recibo_de_sueldo/${id}`, { metodo: 'POST', body }),
  /** GET /pago/get_recibos_de_sueldo — Listar recibos de sueldo */
  get_recibos_de_sueldo: (query?: GetRecibosDeSueldoQuery) =>
    pedir<ReciboSueldo[]>(`/pago/get_recibos_de_sueldo`, { metodo: 'GET', query }),
};
