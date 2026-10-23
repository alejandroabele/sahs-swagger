import { Injectable } from '@nestjs/common';
import { conflicto, noEncontrado, referenciaInvalida } from '@sahs/comun';
import type { EstadoPropuesta, Propuesta } from '../dto/modelos';
import type { AsignarClaseAPropuestaDto, AsignarEstadoAPropuestaDto, CrearPropuestaDto, GetPropuestasQuery } from '../dto/entradas';
import { aEstado, Armado } from '../armado';
import { NOMBRE_ESTADO, Reglas, TRANSICIONES } from '../reglas';

@Injectable()
export class PropuestaService {
  constructor(
    private readonly a: Armado,
    private readonly reglas: Reglas,
  ) {}

  /** La propuesta nace en Borrador (BOR). */
  async crear_propuesta(body: CrearPropuestaDto): Promise<Propuesta> {
    const codigo = body.codigo.trim().toUpperCase();
    if (await this.a.propuestas.findOneBy({ codigo })) throw conflicto(`Ya existe la propuesta ${codigo}`);
    if (!(await this.a.ciclos.findOneBy({ id_ciclo_lectivo: body.id_ciclo_lectivo }))) {
      throw referenciaInvalida(`No existe el ciclo lectivo ${body.id_ciclo_lectivo}`);
    }
    const bor = await this.a.estados.findOneBy({ codigo: 'BOR' });
    if (!bor) throw conflicto('Falta el estado Borrador (BOR) en el catálogo');
    const ahora = new Date().toISOString();
    const p = await this.a.propuestas.save({
      nombre: body.nombre.trim(),
      descripcion_propuesta: body.descripcion_propuesta ?? null,
      codigo,
      id_ciclo_lectivo: body.id_ciclo_lectivo,
      id_estado: bor.id_estado,
      fecha_creacion: ahora,
      fecha_modificacion: ahora,
    });
    return this.get_propuesta(p.id_propuesta);
  }

  /**
   * Transiciones: Borrador → En revisión → Validada → Cerrada, y En revisión → Borrador.
   * Al validar una propuesta, la que estaba validada en el mismo ciclo pasa a Cerrada.
   */
  async asignar_estado_a_propuesta(id: number, body: AsignarEstadoAPropuestaDto): Promise<Propuesta> {
    const p = await this.a.propuesta(id);
    const nuevo = await this.a.estados.findOneBy({ id_estado: body.id_estado });
    if (!nuevo) throw referenciaInvalida(`No existe el estado ${body.id_estado}`);
    const actual = p.estado!.codigo;
    if (actual === nuevo.codigo) return this.get_propuesta(id);
    const conocidos = actual in TRANSICIONES && nuevo.codigo in TRANSICIONES;
    if (conocidos && !TRANSICIONES[actual].includes(nuevo.codigo)) {
      const posibles = TRANSICIONES[actual].map((c) => NOMBRE_ESTADO[c]).join(' o ') || 'ninguno';
      throw conflicto(`Una propuesta ${p.estado!.nombre} no puede pasar a ${nuevo.nombre} (puede pasar a: ${posibles})`);
    }
    if (nuevo.codigo === 'REV' && !(await this.a.propuestaClases.countBy({ id_propuesta: id }))) {
      throw conflicto('La propuesta no tiene clases: no se puede enviar a revisión');
    }
    await this.a.propuestas.manager.transaction(async (tx) => {
      if (nuevo.codigo === 'VAL') {
        const cer = await tx.findOneBy(this.a.estados.target, { codigo: 'CER' });
        const val = await tx.findOneBy(this.a.estados.target, { codigo: 'VAL' });
        if (cer && val) {
          await tx.update(this.a.propuestas.target, { id_ciclo_lectivo: p.id_ciclo_lectivo, id_estado: (val as any).id_estado }, {
            id_estado: (cer as any).id_estado,
            fecha_modificacion: new Date().toISOString(),
          });
        }
      }
      await tx.update(this.a.propuestas.target, id, { id_estado: nuevo.id_estado, fecha_modificacion: new Date().toISOString() });
    });
    return this.get_propuesta(id);
  }

  /** Agrega una clase a la propuesta. Solo en Borrador y sin choques de curso ni de docentes. */
  async asignar_clase_a_propuesta(id: number, body: AsignarClaseAPropuestaDto): Promise<Propuesta> {
    const p = await this.a.propuesta(id);
    const clase = await this.a.clases.findOneBy({ id_clase: body.id_clase });
    if (!clase) throw referenciaInvalida(`No existe la clase ${body.id_clase}`);
    if (p.estado!.codigo !== 'BOR') throw conflicto(`La propuesta ${p.codigo} está ${p.estado!.nombre}: solo se modifica en Borrador`);
    if (!(await this.a.propuestaClases.findOneBy({ id_propuesta: id, id_clase: clase.id_clase }))) {
      const fr = (await this.a.claseFranjas.findBy({ id_clase: clase.id_clase })).map((x) => x.id_franja_horaria);
      const pr = (await this.a.claseProfesores.findBy({ id_clase: clase.id_clase })).map((x) => x.id_profesor);
      await this.reglas.validarChoques(id, clase.id_clase, clase.id_curso, fr, pr);
      await this.a.propuestaClases.insert({ id_propuesta: id, id_clase: clase.id_clase });
      await this.a.tocar(id);
    }
    return this.get_propuesta(id);
  }

  async get_estado_actual_de_propuesta(id: number): Promise<EstadoPropuesta> {
    return aEstado((await this.a.propuesta(id)).estado!);
  }

  async get_propuestas(query: GetPropuestasQuery): Promise<Propuesta[]> {
    const where: Record<string, number> = {};
    if (query.id_ciclo_lectivo != null) where.id_ciclo_lectivo = query.id_ciclo_lectivo;
    if (query.id_estado != null) where.id_estado = query.id_estado;
    const l = await this.a.propuestas.find({ where, relations: { estado: true }, order: { codigo: 'DESC' } });
    return this.a.armarPropuestas(l);
  }

  async get_propuesta(id: number): Promise<Propuesta> {
    const p = await this.a.propuestas.findOne({ where: { id_propuesta: id }, relations: { estado: true } });
    if (!p) throw noEncontrado(`No existe la propuesta ${id}`);
    return (await this.a.armarPropuestas([p]))[0];
  }
}
