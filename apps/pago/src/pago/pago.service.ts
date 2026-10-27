import { Injectable } from '@nestjs/common';
import { conflicto, noEncontrado } from '@sahs/comun';
import type * as C from '@sahs/contratos';
import type { MontoLiquidar, Pago } from '../dto/modelos';
import type { CalcularMontoALiquidarQuery, CrearPagoDto, GetPagosQuery, ValidarPagoDto } from '../dto/entradas';
import { Armado, validarPeriodo } from '../armado';

@Injectable()
export class PagoService {
  constructor(private readonly a: Armado) {}

  /**
   * Crea el pago y su único recibo, con los conceptos y el neto de la liquidación.
   * Invoca: profesor_suplencias.get_profesor.
   */
  async crear_pago(body: CrearPagoDto): Promise<Pago> {
    validarPeriodo(body.periodo);
    await this.a.profesores.exigir<C.Profesor>(`profesores/${body.id_profesor}`, `No existe el profesor ${body.id_profesor}`);
    if (await this.a.pagos.findOneBy({ id_profesor: body.id_profesor, periodo: body.periodo })) {
      throw conflicto(`El profesor ya tiene un pago del período ${body.periodo}`);
    }
    const liq = await this.a.liquidar(body.id_profesor, body.periodo);
    const fecha = await this.a.fechaPago(body.periodo);
    const razon = await this.a.parametro('emisor_razon_social');
    const cuit = await this.a.parametro('emisor_cuit');
    const id = await this.a.pagos.manager.transaction(async (tx) => {
      const pago = (await tx.save(this.a.pagos.target, { id_profesor: body.id_profesor, periodo: body.periodo, validado: false })) as { id_pago: number };
      const recibo = (await tx.save(this.a.recibos.target, {
        id_pago: pago.id_pago,
        id_profesor: body.id_profesor,
        periodo: body.periodo,
        fecha_pago: fecha,
        emisor_razon_social: razon,
        emisor_cuit: cuit,
        total_bruto: liq.total_bruto,
        total_descuentos: liq.total_descuentos,
        neto: liq.neto,
        firma_emisor_id_usuario: null,
        firma_emisor_fecha: null,
        firma_receptor_id_usuario: null,
        firma_receptor_fecha: null,
      })) as { id_recibo_sueldo: number };
      await tx.insert(
        this.a.conceptos.target,
        liq.conceptos.map((c, i) => ({ ...c, orden: i, id_recibo_sueldo: recibo.id_recibo_sueldo })),
      );
      return pago.id_pago;
    });
    return (await this.a.armarPagos([await this.a.pago(id)]))[0];
  }

  /** Deja validado el pago y completa la firma del emisor en el recibo. */
  async validar_pago(id: number, body: ValidarPagoDto): Promise<Pago> {
    const p = await this.a.pago(id);
    if (p.validado) throw conflicto('El pago ya está validado');
    const fecha = new Date().toISOString();
    await this.a.pagos.manager.transaction(async (tx) => {
      await tx.update(this.a.pagos.target, id, { validado: true });
      await tx.update(this.a.recibos.target, { id_pago: id }, { firma_emisor_id_usuario: body.id_usuario, firma_emisor_fecha: fecha });
    });
    return (await this.a.armarPagos([await this.a.pago(id)]))[0];
  }

  /** {id} es el profesor. No guarda nada. Invoca: profesor_suplencias.get_profesor. */
  async calcular_monto_a_liquidar(id: number, query: CalcularMontoALiquidarQuery): Promise<MontoLiquidar> {
    validarPeriodo(query.periodo);
    const p = await this.a.profesores.buscar<C.Profesor>(`profesores/${id}`);
    if (!p) throw noEncontrado(`No existe el profesor ${id}`);
    const liq = await this.a.liquidar(id, query.periodo);
    return { id_profesor: id, periodo: query.periodo, monto: liq.neto };
  }

  async get_pagos(query: GetPagosQuery): Promise<Pago[]> {
    validarPeriodo(query.periodo);
    const where: Record<string, unknown> = {};
    if (query.id_profesor != null) where.id_profesor = query.id_profesor;
    if (query.periodo) where.periodo = query.periodo;
    return this.a.armarPagos(await this.a.pagos.find({ where, order: { periodo: 'DESC', id_pago: 'DESC' } }));
  }
}
