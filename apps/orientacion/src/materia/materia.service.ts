import { Injectable } from '@nestjs/common';
import { conflicto, invalido, referenciaInvalida } from '@sahs/comun';
import type * as C from '@sahs/contratos';
import type { Materia, ProfesorResumen } from '../dto/modelos';
import type {
  AsignarAnioAcademicoAMateriaDto,
  AsignarClaseAMateriaDto,
  AsignarMateriaOrientacionDto,
  CrearMateriaDto,
} from '../dto/entradas';
import { Armado } from '../armado';

@Injectable()
export class MateriaService {
  constructor(private readonly a: Armado) {}

  /** Una materia es única por nombre, orientación y año. */
  private async unica(nombre: string, idOrientacion: number, idAnio: number | null, salvo?: number) {
    const q = this.a.materias
      .createQueryBuilder('m')
      .where('lower(m.nombre_materia) = lower(:n) AND m.id_orientacion = :o', { n: nombre, o: idOrientacion });
    if (idAnio == null) q.andWhere('m.id_anio_academico IS NULL');
    else q.andWhere('m.id_anio_academico = :a', { a: idAnio });
    const otra = await q.getOne();
    if (otra && otra.id_materia !== salvo) throw conflicto(`${nombre} ya existe en ese año de esa orientación`);
  }

  private async exigirAnio(id: number) {
    await this.a.planificacion.exigir<C.AnioAcademico>(`get_anio_academico/${id}`, `No existe el año académico ${id}`);
  }

  async crear_materia(body: CrearMateriaDto): Promise<Materia> {
    const nombre = body.nombre_materia.trim();
    if (body.horas_semanales < 1 || body.horas_semanales > 20) throw invalido('Las horas semanales van de 1 a 20');
    if (!(await this.a.orientaciones.findOneBy({ id_orientacion: body.id_orientacion }))) {
      throw referenciaInvalida(`No existe la orientación ${body.id_orientacion}`);
    }
    if (body.id_area != null && !(await this.a.areas.findOneBy({ id_area: body.id_area }))) {
      throw referenciaInvalida(`No existe el área ${body.id_area}`);
    }
    if (body.id_anio_academico != null) await this.exigirAnio(body.id_anio_academico);
    await this.unica(nombre, body.id_orientacion, body.id_anio_academico ?? null);
    const m = await this.a.materias.save({
      nombre_materia: nombre,
      descripcion_materia: body.descripcion_materia ?? null,
      horas_semanales: body.horas_semanales,
      id_area: body.id_area ?? null,
      id_orientacion: body.id_orientacion,
      id_anio_academico: body.id_anio_academico ?? null,
    });
    return this.get_materia(m.id_materia);
  }

  async eliminar_materia(id: number): Promise<void> {
    const m = await this.a.materia(id);
    // Se descartan las clases que Planificación ya eliminó (eliminar_clase).
    let clases = 0;
    for (const c of await this.a.clases.findBy({ id_materia: id })) {
      if (await this.a.planificacion.buscar<C.Clase>(`get_clase/${c.id_clase}`)) clases++;
      else await this.a.clases.delete({ id_clase: c.id_clase });
    }
    if (clases) throw conflicto(`${m.nombre_materia} tiene ${clases} clases en las planificaciones: no se puede eliminar`);
    await this.a.materias.delete(id);
  }

  async asignar_materia_orientacion(id: number, body: AsignarMateriaOrientacionDto): Promise<Materia> {
    const m = await this.a.materia(id);
    if (!(await this.a.orientaciones.findOneBy({ id_orientacion: body.id_orientacion }))) {
      throw referenciaInvalida(`No existe la orientación ${body.id_orientacion}`);
    }
    await this.unica(m.nombre_materia, body.id_orientacion, m.id_anio_academico, id);
    await this.a.materias.update(id, { id_orientacion: body.id_orientacion });
    return this.get_materia(id);
  }

  /**
   * Registra una clase de la materia (ids_clases). La materia de la clase la define
   * Planificación al crearla: si no coincide, responde 409. Invoca: planificacion.get_clase.
   */
  async asignar_clase_a_materia(id: number, body: AsignarClaseAMateriaDto): Promise<Materia> {
    const m = await this.a.materia(id);
    const clase = await this.a.planificacion.exigir<C.Clase>(`get_clase/${body.id_clase}`, `No existe la clase ${body.id_clase}`);
    if (clase.id_materia !== id) throw conflicto(`La clase ${clase.codigo} es de otra materia, no de ${m.nombre_materia}`);
    await this.a.clases.save({ id_clase: body.id_clase, id_materia: id });
    return this.get_materia(id);
  }

  async asignar_anio_academico_a_materia(id: number, body: AsignarAnioAcademicoAMateriaDto): Promise<Materia> {
    const m = await this.a.materia(id);
    await this.exigirAnio(body.id_anio_academico);
    await this.unica(m.nombre_materia, m.id_orientacion, body.id_anio_academico, id);
    await this.a.materias.update(id, { id_anio_academico: body.id_anio_academico });
    return this.get_materia(id);
  }

  async get_materia(id: number): Promise<Materia> {
    return this.a.armarMateria(await this.a.materia(id));
  }

  async get_materias(): Promise<Materia[]> {
    return this.a.armarMaterias(this.a.ordenar(await this.a.materias.find()));
  }

  async get_profesores_materia(id: number): Promise<ProfesorResumen[]> {
    await this.a.materia(id);
    return this.a.profesoresHabilitados([id]);
  }
}
