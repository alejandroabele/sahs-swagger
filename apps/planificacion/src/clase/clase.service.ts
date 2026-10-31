import { Injectable } from '@nestjs/common';

import { referenciaInvalida } from '@sahs/comun';
import type { Clase } from '../dto/modelos';
import type { AsignarCursoAClaseDto, CrearClaseDto, EditarClaseDto, GetClasesQuery } from '../dto/entradas';
import { Armado } from '../armado';
import { Reglas } from '../reglas';

@Injectable()
export class ClaseService {
  constructor(
    private readonly a: Armado,
    private readonly reglas: Reglas,
  ) {}

  /**
   * Crea la clase (materia + curso) con sus franjas y sus docentes, que son los mismos en
   * todas las franjas. Verifica que los docentes estén habilitados y disponibles.
   * Los choques se controlan al agregarla a una propuesta (asignar_clase_a_propuesta).
   * Invoca: profesor_suplencias.get_disponibilidad_profesor, orientacion.asignar_clase_a_materia.
   */
  async crear_clase(body: CrearClaseDto): Promise<Clase> {
    const fr = [...new Set(body.ids_franjas_horarias)];
    const pr = [...new Set(body.ids_profesores)];
    if (!(await this.a.cursos.findOneBy({ id_curso: body.id_curso }))) throw referenciaInvalida(`No existe el curso ${body.id_curso}`);
    await this.reglas.validarClase(body.id_curso, body.id_materia, fr, pr);
    const c = await this.a.clases.manager.transaction(async (tx) => {
      const nueva = (await tx.save(this.a.clases.target, {
        codigo: body.codigo.trim(),
        descripcion: body.descripcion ?? null,
        id_curso: body.id_curso,
        id_materia: body.id_materia,
      })) as { id_clase: number };
      await tx.insert(this.a.claseFranjas.target, fr.map((id_franja_horaria) => ({ id_clase: nueva.id_clase, id_franja_horaria })));
      await tx.insert(this.a.claseProfesores.target, pr.map((id_profesor) => ({ id_clase: nueva.id_clase, id_profesor })));
      return nueva;
    });
    // Orientación registra la clase en la materia (ids_clases).
    await this.a.orientacion.enviar('POST', `materias/${body.id_materia}/clases`, { id_clase: c.id_clase });
    return this.get_clase(c.id_clase);
  }

  /** Reemplaza las franjas y los docentes de la clase. Solo si sus propuestas están en Borrador. */
  async editar_clase(id: number, body: EditarClaseDto): Promise<Clase> {
    const clase = await this.a.clase(id);
    const propuestas = await this.reglas.exigirEditable(id);
    const fr = [...new Set(body.ids_franjas_horarias)];
    const pr = [...new Set(body.ids_profesores)];
    await this.reglas.validarClase(clase.id_curso, clase.id_materia, fr, pr);
    for (const p of propuestas) await this.reglas.validarChoques(p, id, clase.id_curso, fr, pr);
    for (const p of propuestas) await this.reglas.validarHorasMateria(p, id, clase.id_curso, clase.id_materia, fr.length);
    await this.a.clases.manager.transaction(async (tx) => {
      if (body.descripcion !== undefined) await tx.update(this.a.clases.target, id, { descripcion: body.descripcion });
      await tx.delete(this.a.claseFranjas.target, { id_clase: id });
      await tx.delete(this.a.claseProfesores.target, { id_clase: id });
      await tx.insert(this.a.claseFranjas.target, fr.map((id_franja_horaria) => ({ id_clase: id, id_franja_horaria })));
      await tx.insert(this.a.claseProfesores.target, pr.map((id_profesor) => ({ id_clase: id, id_profesor })));
    });
    for (const p of propuestas) await this.a.tocar(p);
    return this.get_clase(id);
  }

  /** Elimina la clase. Solo si sus propuestas están en Borrador. */
  async eliminar_clase(id: number): Promise<void> {
    await this.a.clase(id);
    const propuestas = await this.reglas.exigirEditable(id);
    await this.a.clases.delete(id);
    for (const p of propuestas) await this.a.tocar(p);
  }

  async asignar_curso_a_clase(id: number, body: AsignarCursoAClaseDto): Promise<Clase> {
    const clase = await this.a.clase(id);
    const propuestas = await this.reglas.exigirEditable(id);
    if (!(await this.a.cursos.findOneBy({ id_curso: body.id_curso }))) throw referenciaInvalida(`No existe el curso ${body.id_curso}`);
    const fr = (await this.a.claseFranjas.findBy({ id_clase: id })).map((x) => x.id_franja_horaria);
    const pr = (await this.a.claseProfesores.findBy({ id_clase: id })).map((x) => x.id_profesor);
    await this.reglas.validarClase(body.id_curso, clase.id_materia, fr, pr);
    for (const p of propuestas) await this.reglas.validarChoques(p, id, body.id_curso, fr, pr);
    for (const p of propuestas) await this.reglas.validarHorasMateria(p, id, body.id_curso, clase.id_materia, fr.length);
    await this.a.clases.update(id, { id_curso: body.id_curso });
    return this.get_clase(id);
  }

  /** Con la suplencia vigente anidada. Invoca: profesor_suplencias.get_suplencias. */
  async get_clase(id: number): Promise<Clase> {
    return (await this.a.armarClases([await this.a.clase(id)], true))[0];
  }

  /** Filtros (AND): id_profesor (docente de la clase), id_curso e id_propuesta. */
  async get_clases(query: GetClasesQuery): Promise<Clase[]> {
    const q = this.a.clases.createQueryBuilder('c').orderBy('c.id_clase', 'ASC');
    if (query.id_curso != null) q.andWhere('c.id_curso = :cu', { cu: query.id_curso });
    if (query.id_profesor != null) {
      q.andWhere('c.id_clase IN (SELECT id_clase FROM planificacion_clase_profesor WHERE id_profesor = :pr)', { pr: query.id_profesor });
    }
    if (query.id_propuesta != null) {
      q.andWhere('c.id_clase IN (SELECT id_clase FROM planificacion_propuesta_clase WHERE id_propuesta = :pp)', { pp: query.id_propuesta });
    }
    return this.a.armarClases(await q.getMany());
  }
}

