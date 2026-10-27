import { Injectable } from '@nestjs/common';
import { conflicto, noEncontrado, referenciaInvalida } from '@sahs/comun';
import type * as C from '@sahs/contratos';
import type { Area, Materia, ProfesorResumen } from '../dto/modelos';
import type { AsignarMateriaAreaDto, CrearAreaDto } from '../dto/entradas';
import { Armado } from '../armado';

@Injectable()
export class AreaService {
  constructor(private readonly a: Armado) {}

  async crear_area(body: CrearAreaDto): Promise<Area> {
    const nombre = body.nombre_area.trim();
    const dup = await this.a.areas.createQueryBuilder('a').where('lower(a.nombre_area) = lower(:n)', { n: nombre }).getOne();
    if (dup) throw conflicto(`Ya existe el área ${nombre}`);
    if (body.id_profesor_coordinador != null) {
      await this.a.profesores.exigir<C.Profesor>(`profesores/${body.id_profesor_coordinador}`, `No existe el profesor ${body.id_profesor_coordinador}`);
    }
    const area = await this.a.areas.save({
      nombre_area: nombre,
      descripcion_area: body.descripcion_area ?? null,
      id_profesor_coordinador: body.id_profesor_coordinador ?? null,
    });
    return this.get_area(area.id_area);
  }

  async asignar_materia_area(id: number, body: AsignarMateriaAreaDto): Promise<Materia> {
    await this.a.area(id);
    const m = await this.a.materias.findOneBy({ id_materia: body.id_materia });
    if (!m) throw referenciaInvalida(`No existe la materia ${body.id_materia}`);
    await this.a.materias.update(m.id_materia, { id_area: id });
    return this.a.armarMateria(await this.a.materia(m.id_materia));
  }

  async eliminar_area(id: number): Promise<void> {
    await this.a.area(id);
    // Las materias del área quedan sin área.
    await this.a.materias.update({ id_area: id }, { id_area: null });
    await this.a.areas.delete(id);
  }

  async quitar_materia_area(id: number, idMateria: number): Promise<Materia> {
    const area = await this.a.area(id);
    const m = await this.a.materia(idMateria);
    if (m.id_area !== id) throw noEncontrado(`La materia ${m.nombre_materia} no pertenece al área ${area.nombre_area}`);
    await this.a.materias.update(idMateria, { id_area: null });
    return this.a.armarMateria(await this.a.materia(idMateria));
  }

  async get_area(id: number): Promise<Area> {
    return (await this.a.armarAreas([await this.a.area(id)]))[0];
  }

  async get_areas(): Promise<Area[]> {
    return this.a.armarAreas(await this.a.areas.find({ order: { id_area: 'ASC' } }));
  }

  async get_materias_area(id: number): Promise<Materia[]> {
    await this.a.area(id);
    return this.a.armarMaterias(this.a.ordenar(await this.a.materias.findBy({ id_area: id })));
  }

  /** Profesores habilitados en alguna materia del área. */
  async get_profesores_area(id: number): Promise<ProfesorResumen[]> {
    await this.a.area(id);
    const ids = (await this.a.materias.findBy({ id_area: id })).map((m) => m.id_materia);
    return ids.length ? this.a.profesoresHabilitados(ids) : [];
  }
}
