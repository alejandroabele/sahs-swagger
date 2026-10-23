import { Injectable, StreamableFile } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { conflicto } from '@sahs/comun';
import type * as C from '@sahs/contratos';
import type { ReciboSueldo } from '../dto/modelos';
import type { FirmarReciboDeSueldoDto, GetRecibosDeSueldoQuery } from '../dto/entradas';
import { Armado, validarPeriodo } from '../armado';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const pesos = (n: number) => '$ ' + Math.round(n).toLocaleString('es-AR');
const nombrePeriodo = (p: string) => `${MESES[Number(p.slice(5, 7)) - 1]} ${p.slice(0, 4)}`;
const fecha = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

@Injectable()
export class ReciboDeSueldoService {
  constructor(private readonly a: Armado) {}

  /** PDF del recibo. Invoca: profesor_suplencias.get_profesor (nombre y documento). */
  async bajar_recibo_sueldo(id: number): Promise<StreamableFile> {
    const r = (await this.a.armarRecibos([await this.a.recibo(id)]))[0];
    const prof = await this.a.profesores.buscar<C.Profesor>(`get_profesor/${r.id_profesor}`);
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Recibo de sueldo ${r.periodo}` } });
    const partes: Buffer[] = [];
    doc.on('data', (b: Buffer) => partes.push(b));
    const fin = new Promise<Buffer>((ok) => doc.on('end', () => ok(Buffer.concat(partes))));

    doc.fontSize(16).text(r.emisor.razon_social, { continued: false });
    doc.fontSize(9).fillColor('#555').text(`CUIT ${r.emisor.cuit}`);
    doc.moveDown();
    doc.fillColor('#000').fontSize(13).text(`Recibo de sueldo · ${nombrePeriodo(r.periodo)}`);
    doc.fontSize(10).text(`Fecha de pago: ${fecha(r.fecha_pago)}`);
    if (prof) doc.text(`Profesor: ${prof.apellido}, ${prof.nombre} · DNI ${prof.documento}${prof.legajo ? ' · Legajo ' + prof.legajo : ''}`);
    doc.moveDown();
    const x1 = 50, x2 = 380, x3 = 470;
    doc.fontSize(9).fillColor('#555').text('Concepto', x1, doc.y, { continued: false });
    let y = doc.y;
    doc.text('Cantidad', x2, y - 11).text('Importe', x3, y - 11);
    doc.moveTo(50, y + 2).lineTo(545, y + 2).strokeColor('#ccc').stroke();
    doc.fillColor('#000').fontSize(10);
    for (const c of r.conceptos) {
      y = doc.y + 6;
      const cant = c.cantidad == null ? '' : c.tipo === 'haber' && c.descripcion.startsWith('Horas') ? `${c.cantidad} h` : `${c.cantidad} %`;
      doc.text(c.descripcion, x1, y, { width: 320 });
      doc.text(cant, x2, y);
      doc.text((c.tipo === 'descuento' ? '- ' : '') + pesos(c.importe), x3, y);
    }
    doc.moveDown();
    y = doc.y + 6;
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#ccc').stroke();
    doc.fontSize(10).text('Total haberes', x1, y + 8).text(pesos(r.total_bruto), x3, y + 8);
    doc.text('Total descuentos', x1, doc.y + 2).text('- ' + pesos(r.total_descuentos), x3, doc.y - 12);
    doc.fontSize(12).text('Neto a cobrar', x1, doc.y + 8).text(pesos(r.neto), x3, doc.y - 14);
    doc.moveDown(2).fontSize(9).fillColor('#555');
    doc.text(r.firma_emisor ? `Firma del emisor: ${fecha(r.firma_emisor.fecha)}` : 'Firma del emisor: pendiente', x1);
    doc.text(r.firma_receptor ? `Firma del profesor: ${fecha(r.firma_receptor.fecha)}` : 'Firma del profesor: pendiente', x1);
    doc.end();
    const pdf = await fin;
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="recibo-${r.periodo}-${r.id_profesor}.pdf"`,
      length: pdf.length,
    });
  }

  /**
   * El profesor firma la conformidad del recibo. La firma es definitiva: si ya estaba
   * firmado responde 409. El pago tiene que estar validado y quien firma tiene que ser
   * el usuario del profesor. Invoca: profesor_suplencias.get_profesor.
   */
  async firmar_recibo_de_sueldo(id: number, body: FirmarReciboDeSueldoDto): Promise<ReciboSueldo> {
    const r = await this.a.recibo(id);
    if (r.firma_receptor_fecha) throw conflicto(`El recibo ya fue firmado el ${fecha(r.firma_receptor_fecha)}: la firma no se puede cambiar`);
    const pago = await this.a.pago(r.id_pago);
    if (!pago.validado) throw conflicto('El pago todavía no está validado: el recibo no se puede firmar');
    const prof = await this.a.profesores.buscar<C.Profesor>(`get_profesor/${r.id_profesor}`);
    if (prof && prof.id_usuario != null && prof.id_usuario !== body.id_usuario) {
      throw conflicto('Solo el profesor del recibo lo puede firmar');
    }
    await this.a.recibos.update(id, { firma_receptor_id_usuario: body.id_usuario, firma_receptor_fecha: new Date().toISOString() });
    return (await this.a.armarRecibos([await this.a.recibo(id)]))[0];
  }

  async get_recibos_de_sueldo(query: GetRecibosDeSueldoQuery): Promise<ReciboSueldo[]> {
    validarPeriodo(query.periodo);
    const where: Record<string, unknown> = {};
    if (query.id_profesor != null) where.id_profesor = query.id_profesor;
    if (query.periodo) where.periodo = query.periodo;
    return this.a.armarRecibos(await this.a.recibos.find({ where, order: { periodo: 'DESC', id_recibo_sueldo: 'DESC' } }));
  }
}
