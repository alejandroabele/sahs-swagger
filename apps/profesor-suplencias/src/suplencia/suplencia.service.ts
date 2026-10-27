import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { conflicto, invalido, noEncontrado } from '@sahs/comun';
import type * as C from '@sahs/contratos';
import type { Suplencia } from '../dto/modelos';
import type { CrearSuplenciaDto, GetSuplenciasQuery } from '../dto/entradas';
import { Armado } from '../armado';

@Injectable()
export class SuplenciaService {
  constructor(private readonly a: Armado) {}

  /**
   * Crea la suplencia completa: el suplente y las clases que cubre en el período.
   * Cada clase se cubre entera. Invoca: planificacion.get_clase.
   */
  async crear_suplencia(idProfesor: number, body: CrearSuplenciaDto): Promise<Suplencia> {
    const desde = body.fecha_inicio.slice(0, 10);
    const hasta = body.fecha_fin.slice(0, 10);
    if (desde > hasta) throw invalido('La fecha de inicio tiene que ser anterior o igual a la de fin');
    const ids = [...new Set(body.ids_clases)];
    if (!ids.length) throw invalido('La suplencia tiene que cubrir al menos una clase');
    const motivo = body.motivo.trim();
    if (!motivo) throw invalido('motivo es obligatorio');
    if (!(await this.a.profesores.findOneBy({ id_profesor: idProfesor }))) {
      throw noEncontrado(`No existe el profesor ${idProfesor}`);
    }
    for (const id of ids) {
      const clase = await this.a.planificacion.exigir<C.Clase>(`clases/${id}`, `No existe la clase ${id}`);
      if ((clase.ids_profesores ?? []).includes(idProfesor)) {
        throw conflicto(`El suplente ya es docente de la clase ${clase.codigo}`);
      }
    }
    // Una clase no puede tener dos suplencias que se superpongan.
    const previas = await this.a.suplencias
      .createQueryBuilder('s')
      .innerJoin('s.clases', 'c')
      .where('c.id_clase IN (:...ids)', { ids })
      .andWhere('s.fecha_inicio <= :hasta AND s.fecha_fin >= :desde', { desde, hasta })
      .getMany();
    if (previas.length) throw conflicto(`Alguna de las clases ya tiene una suplencia entre el ${previas[0].fecha_inicio} y el ${previas[0].fecha_fin}`);

    const s = await this.a.suplencias.manager.transaction(async (tx) => {
      const nueva = await tx.save(this.a.suplencias.target, { fecha_inicio: desde, fecha_fin: hasta, motivo, id_profesor: idProfesor });
      await tx.insert(this.a.suplenciaClases.target, ids.map((id_clase) => ({ id_suplencia: (nueva as any).id_suplencia, id_clase })));
      return nueva as { id_suplencia: number };
    });
    const creada = await this.a.suplencias.findOneByOrFail({ id_suplencia: s.id_suplencia });
    return (await this.a.armarSuplencias([creada]))[0];
  }

  /**
   * Filtros (AND): fecha_desde/fecha_hasta devuelven las suplencias cuyo período se
   * superpone con el rango; id_profesor es el suplente; id_clase, las que cubren esa
   * clase; id_curso, las que cubren alguna clase del curso (Invoca: planificacion.get_clases).
   */
  async get_suplencias(query: GetSuplenciasQuery): Promise<Suplencia[]> {
    const q = this.a.suplencias.createQueryBuilder('s').orderBy('s.fecha_inicio', 'DESC').addOrderBy('s.id_suplencia', 'DESC');
    if (query.fecha_desde) q.andWhere('s.fecha_fin >= :d', { d: query.fecha_desde.slice(0, 10) });
    if (query.fecha_hasta) q.andWhere('s.fecha_inicio <= :h', { h: query.fecha_hasta.slice(0, 10) });
    if (query.id_profesor != null) q.andWhere('s.id_profesor = :p', { p: query.id_profesor });
    let idsClases: number[] | null = null;
    if (query.id_clase != null) idsClases = [query.id_clase];
    if (query.id_curso != null) {
      const delCurso = (await this.a.planificacion.listar<C.Clase>('clases', { query: { id_curso: query.id_curso } })).map((c) => c.id_clase);
      idsClases = idsClases ? idsClases.filter((x) => delCurso.includes(x)) : delCurso;
    }
    if (idsClases) {
      if (!idsClases.length) return [];
      const conClase = await this.a.suplenciaClases.find({ where: { id_clase: In(idsClases) } });
      const ids = [...new Set(conClase.map((c) => c.id_suplencia))];
      if (!ids.length) return [];
      q.andWhere('s.id_suplencia IN (:...ids)', { ids });
    }
    return this.a.armarSuplencias(await q.getMany());
  }
}
