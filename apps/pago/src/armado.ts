import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClienteServicio, invalido, noEncontrado } from '@sahs/comun';
import type * as C from '@sahs/contratos';
import {
  ConceptoReciboEntidad,
  liquidar,
  PagoEntidad,
  ParametroPagoEntidad,
  ReciboSueldoEntidad,
  ValorHoraEntidad,
  type HorasMateria,
  type Liquidacion,
} from '@sahs/entidades';
import type { Pago, ReciboSueldo } from './dto/modelos';

export const PERIODO = /^\d{4}-(0[1-9]|1[0-2])$/;

export function validarPeriodo(p: string | undefined) {
  if (p != null && !PERIODO.test(p)) throw invalido('periodo tiene que tener el formato AAAA-MM');
}

/** Pagos y recibos con sus anidados, y la liquidación de un profesor. */
@Injectable()
export class Armado {
  readonly profesores = new ClienteServicio('profesor_suplencias');
  readonly planificacion = new ClienteServicio('planificacion');

  constructor(
    @InjectRepository(PagoEntidad) readonly pagos: Repository<PagoEntidad>,
    @InjectRepository(ReciboSueldoEntidad) readonly recibos: Repository<ReciboSueldoEntidad>,
    @InjectRepository(ConceptoReciboEntidad) readonly conceptos: Repository<ConceptoReciboEntidad>,
    @InjectRepository(ParametroPagoEntidad) readonly parametros: Repository<ParametroPagoEntidad>,
    @InjectRepository(ValorHoraEntidad) readonly valoresHora: Repository<ValorHoraEntidad>,
  ) {}

  async pago(id: number) {
    const p = await this.pagos.findOneBy({ id_pago: id });
    if (!p) throw noEncontrado(`No existe el pago ${id}`);
    return p;
  }

  async recibo(id: number) {
    const r = await this.recibos.findOneBy({ id_recibo_sueldo: id });
    if (!r) throw noEncontrado(`No existe el recibo de sueldo ${id}`);
    return r;
  }

  async armarRecibos(lista: ReciboSueldoEntidad[]): Promise<ReciboSueldo[]> {
    if (!lista.length) return [];
    const cs = await this.conceptos.find({ where: { id_recibo_sueldo: In(lista.map((r) => r.id_recibo_sueldo)) }, order: { orden: 'ASC' } });
    return lista.map((r) => ({
      id_recibo_sueldo: r.id_recibo_sueldo,
      id_pago: r.id_pago,
      id_profesor: r.id_profesor,
      periodo: r.periodo,
      fecha_pago: r.fecha_pago,
      emisor: { razon_social: r.emisor_razon_social, cuit: r.emisor_cuit },
      conceptos: cs
        .filter((c) => c.id_recibo_sueldo === r.id_recibo_sueldo)
        .map((c) => ({ descripcion: c.descripcion, cantidad: c.cantidad, importe: c.importe, tipo: c.tipo })),
      total_bruto: r.total_bruto,
      total_descuentos: r.total_descuentos,
      neto: r.neto,
      firma_emisor: r.firma_emisor_fecha ? { id_usuario: r.firma_emisor_id_usuario as number, fecha: r.firma_emisor_fecha } : null,
      firma_receptor: r.firma_receptor_fecha ? { id_usuario: r.firma_receptor_id_usuario as number, fecha: r.firma_receptor_fecha } : null,
    }));
  }

  async armarPagos(lista: PagoEntidad[]): Promise<Pago[]> {
    if (!lista.length) return [];
    const recibos = await this.armarRecibos(await this.recibos.findBy({ id_pago: In(lista.map((p) => p.id_pago)) }));
    return lista.map((p) => ({
      id_pago: p.id_pago,
      id_profesor: p.id_profesor,
      periodo: p.periodo,
      validado: !!p.validado,
      recibo_sueldo: recibos.find((r) => r.id_pago === p.id_pago),
    }));
  }

  /* ---------- liquidación ---------- */

  async parametro(clave: string): Promise<string> {
    const p = await this.parametros.findOneBy({ clave });
    if (!p) throw invalido(`Falta el parámetro de liquidación ${clave}`);
    return p.valor;
  }

  async valorHora(periodo: string): Promise<number> {
    const v = await this.valoresHora
      .createQueryBuilder('v')
      .where('v.desde_periodo <= :p', { p: periodo })
      .orderBy('v.desde_periodo', 'DESC')
      .getOne();
    if (!v) throw invalido(`No hay valor de hora cátedra cargado para ${periodo}`);
    return v.valor;
  }

  /**
   * Horas semanales del profesor en la propuesta vigente del ciclo del período,
   * agrupadas por materia. Hay una sola Vigente por ciclo.
   * Invoca: planificacion.get_ciclos_lectivos, get_propuestas, get_clases, get_cursos, get_anios_academicos.
   */
  async horasDelProfesor(idProfesor: number, periodo: string): Promise<HorasMateria[]> {
    const anio = Number(periodo.slice(0, 4));
    const ciclo = (await this.planificacion.listar<C.CicloLectivo>('ciclos-lectivos')).find((c) => c.anio_calendario === anio);
    if (!ciclo) return [];
    const props = await this.planificacion.listar<C.Propuesta>('propuestas', { query: { id_ciclo_lectivo: ciclo.id_ciclo_lectivo } });
    const vigente = props.find((p) => p.estado?.codigo === 'VIG');
    if (!vigente) return [];
    const [clases, cursos, anios] = await Promise.all([
      this.planificacion.listar<C.Clase>('clases', { completo: true, query: { id_profesor: idProfesor, id_propuesta: vigente.id_propuesta } }),
      this.planificacion.listar<C.Curso>('cursos', { query: { id_ciclo_lectivo: ciclo.id_ciclo_lectivo } }),
      this.planificacion.listar<C.AnioAcademico>('anios-academicos'),
    ]);
    const nombreCurso = (id: number) => {
      const c = cursos.find((x) => x.id_curso === id);
      if (!c) return '';
      const a = anios.find((x) => x.id_anio_academico === c.id_anio_academico);
      return `${a ? a.anio_curricular.replace(/\s*año$/, '') : ''} ${c.division}`.trim();
    };
    const porMateria = new Map<number, { nombre: string; horas: number; cursos: string[] }>();
    for (const c of clases) {
      const m = porMateria.get(c.id_materia) ?? { nombre: c.materia?.nombre_materia ?? `Materia ${c.id_materia}`, horas: 0, cursos: [] };
      m.horas += (c.ids_franjas_horarias ?? []).length;
      const n = nombreCurso(c.id_curso);
      if (n && !m.cursos.includes(n)) m.cursos.push(n);
      porMateria.set(c.id_materia, m);
    }
    return [...porMateria.values()]
      .filter((m) => m.horas > 0)
      .map((m) => ({ descripcion: m.cursos.length ? `${m.nombre} (${m.cursos.join(' y ')})` : m.nombre, horas: m.horas }));
  }

  async liquidar(idProfesor: number, periodo: string): Promise<Liquidacion> {
    const horas = await this.horasDelProfesor(idProfesor, periodo);
    return liquidar(horas, periodo, {
      valor_hora: await this.valorHora(periodo),
      antiguedad_pct: Number(await this.parametro('antiguedad_pct')),
      jubilacion_pct: Number(await this.parametro('jubilacion_pct')),
      obra_social_pct: Number(await this.parametro('obra_social_pct')),
      sindical_pct: Number(await this.parametro('sindical_pct')),
    });
  }

  /** Fecha de pago: el día configurado del mes siguiente al período. */
  async fechaPago(periodo: string): Promise<string> {
    const dia = Number(await this.parametro('dia_pago'));
    let [a, m] = periodo.split('-').map(Number);
    m += 1;
    if (m > 12) {
      m = 1;
      a += 1;
    }
    return `${a}-${String(m).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }
}
