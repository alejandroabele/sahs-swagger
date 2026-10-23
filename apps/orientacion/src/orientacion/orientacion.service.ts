import { Injectable } from '@nestjs/common';
import { conflicto } from '@sahs/comun';
import type * as C from '@sahs/contratos';
import type { Materia, Orientacion } from '../dto/modelos';
import type { AsignarCursoAOrientacionDto, CrearOrientacionDto } from '../dto/entradas';
import { Armado } from '../armado';

@Injectable()
export class OrientacionService {
  constructor(private readonly a: Armado) {}

  async crear_orientacion(body: CrearOrientacionDto): Promise<Orientacion> {
    const codigo = body.codigo.trim().toUpperCase();
    const nombre = body.nombre_orientacion.trim();
    const dup = await this.a.orientaciones
      .createQueryBuilder('o')
      .where('lower(o.nombre_orientacion) = lower(:n) OR o.codigo = :c', { n: nombre, c: codigo })
      .getOne();
    if (dup) throw conflicto('Ya existe una orientación con ese nombre o ese código');
    const o = await this.a.orientaciones.save({ nombre_orientacion: nombre, codigo, descripcion_orientacion: body.descripcion_orientacion ?? null });
    return this.get_orientacion(o.id_orientacion);
  }

  async eliminar_orientacion(id: number): Promise<void> {
    const o = await this.a.orientacion(id);
    const materias = await this.a.materias.countBy({ id_orientacion: id });
    if (materias) throw conflicto(`La orientación ${o.nombre_orientacion} tiene ${materias} materias: primero hay que quitarlas`);
    const cursos = await this.a.cursos.countBy({ id_orientacion: id });
    if (cursos) throw conflicto(`La orientación ${o.nombre_orientacion} tiene ${cursos} cursos`);
    await this.a.orientaciones.delete(id);
  }

  /**
   * Asigna (o cambia) la orientación de un curso. Orientación es el dueño de este dato;
   * Planificación lo registra acá al crear el curso. Invoca: planificacion.get_curso.
   */
  async asignar_curso_a_orientacion(id: number, body: AsignarCursoAOrientacionDto): Promise<Orientacion> {
    await this.a.orientacion(id);
    await this.a.planificacion.exigir<C.Curso>(`get_curso/${body.id_curso}`, `No existe el curso ${body.id_curso}`);
    await this.a.cursos.save({ id_curso: body.id_curso, id_orientacion: id });
    return this.get_orientacion(id);
  }

  async get_orientacion(id: number): Promise<Orientacion> {
    return (await this.a.armarOrientaciones([await this.a.orientacion(id)]))[0];
  }

  async get_orientaciones(): Promise<Orientacion[]> {
    return this.a.armarOrientaciones(await this.a.orientaciones.find({ order: { id_orientacion: 'ASC' } }));
  }

  async get_materias_orientacion(id: number): Promise<Materia[]> {
    await this.a.orientacion(id);
    return this.a.armarMaterias(this.a.ordenar(await this.a.materias.findBy({ id_orientacion: id })));
  }
}
