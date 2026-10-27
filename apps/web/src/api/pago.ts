// Generado por tools/generar_cliente_web.mjs a partir del /docs-json del servicio. No editar a mano.
import type { CalcularMontoALiquidarQuery, CrearPagoBody, FirmarReciboDeSueldoBody, GetPagosQuery, GetRecibosDeSueldoQuery, MontoLiquidar, Pago, ReciboSueldo, ValidarPagoBody } from '@sahs/contratos';
import { pedir } from './http';

/** Servicio Pago Service. */
export const pago = {
  /** POST /pago/pagos — Crear pago del profesor para un período. Genera también el único recibo de sueldo del pago, con sus conceptos y el neto de calcular_monto_a_liquidar. */
  crear_pago: (body: CrearPagoBody) =>
    pedir<Pago>(`/pago/pagos`, { metodo: 'POST', body }),
  /** GET /pago/pagos — Listar pagos (con su recibo anidado) */
  get_pagos: (query?: GetPagosQuery) =>
    pedir<Pago[]>(`/pago/pagos`, { metodo: 'GET', query }),
  /** POST /pago/pagos/{id}/validacion — Validar pago (administrativo). Deja `validado` en true y completa `firma_emisor` en el recibo del pago. */
  validar_pago: (id: number, body: ValidarPagoBody) =>
    pedir<Pago>(`/pago/pagos/${id}/validacion`, { metodo: 'POST', body }),
  /** GET /pago/profesores/{id}/monto-a-liquidar — Calcular monto a liquidar. El cálculo es interno del servicio; solo recibe el profesor y el período. Es GET porque no guarda nada (en el documento figura como command). */
  calcular_monto_a_liquidar: (id: number, query: CalcularMontoALiquidarQuery) =>
    pedir<MontoLiquidar>(`/pago/profesores/${id}/monto-a-liquidar`, { metodo: 'GET', query }),
  /** GET /pago/recibos-de-sueldo/{id}/pdf — Descargar el recibo en PDF. Es GET porque solo descarga el PDF (en el documento figura como command). */
  bajar_recibo_sueldo: (id: number) =>
    pedir<Blob>(`/pago/recibos-de-sueldo/${id}/pdf`, { metodo: 'GET', tipo: 'blob' }),
  /** POST /pago/recibos-de-sueldo/{id}/firma — Firmar recibo (profesor). Completa `firma_receptor` con el usuario y la fecha. La firma es definitiva: no hay operación para revertirla. */
  firmar_recibo_de_sueldo: (id: number, body: FirmarReciboDeSueldoBody) =>
    pedir<ReciboSueldo>(`/pago/recibos-de-sueldo/${id}/firma`, { metodo: 'POST', body }),
  /** GET /pago/recibos-de-sueldo — Listar recibos de sueldo */
  get_recibos_de_sueldo: (query?: GetRecibosDeSueldoQuery) =>
    pedir<ReciboSueldo[]>(`/pago/recibos-de-sueldo`, { metodo: 'GET', query }),
};
