import { Injectable } from '@nestjs/common';
import { conflicto, invalido, noEncontrado, referenciaInvalida } from '@sahs/comun';
import type * as C from '@sahs/contratos';
import type { Clase, Curso } from '../dto/modelos';
import type { AsignarMateriaACursoDto, CambiarHorasMateriaCursoDto, CrearCursoDto, GetCursosQuery } from '../dto/entradas';
import { Armado } from '../armado';

@Injectable()
export class CursoService {
  constructor(private readonly a: Armado) {}

  /**
   * Crea el curso y registra su orientación en el servicio Orientación, que es el dueño
   * de ese dato. Invoca: horarios.get_turno, orientacion.get_orientacion,
   * orientacion.asignar_curso_a_orientacion.
   */
  async crear_curso(body: CrearCursoDto): Promise<Curso> {
    const division = body.division.trim().toUpperCase();
    if (!division) throw invalido('division es obligatorio');
    if (!(await this.a.ciclos.findOneBy({ id_ciclo_lectivo: body.id_ciclo_lectivo }))) {
      throw referenciaInvalida(`No existe el ciclo lectivo ${body.id_ciclo_lectivo}`);
    }
    await this.a.horarios.exigir<C.Turno>(`get_turno/${body.id_turno}`, `No existe el turno ${body.id_turno}`);
    await this.a.orientacion.exigir<C.Orientacion>(`get_orientacion/${body.id_orientacion}`, `No existe la orientación ${body.id_orientacion}`);
    const c = await this.a.cursos.save({ division, id_ciclo_lectivo: body.id_ciclo_lectivo, id_turno: body.id_turno, id_anio_academico: null });
    try {
      await this.a.orientacion.enviar('POST', `asignar_curso_a_orientacion/${body.id_orientacion}`, { id_curso: c.id_curso });
    } catch (e) {
      await this.a.cursos.delete(c.id_curso);
      throw e;
    }
    return this.get_curso(c.id_curso);
  }

  /** Si no se indican las horas, se toman las de la materia. Invoca: orientacion.get_materia. */
  async asignar_materia_a_curso(id: number, body: AsignarMateriaACursoDto): Promise<Curso> {
    await this.a.curso(id);
    const m = await this.a.orientacion.exigir<C.Materia>(`get_materia/${body.id_materia}`, `No existe la materia ${body.id_materia}`);
    if (await this.a.materiasCurso.findOneBy({ id_curso: id, id_materia: body.id_materia })) {
      throw conflicto(`El curso ya dicta ${m.nombre_materia}`);
    }
    const horas = body.horas_semanales ?? m.horas_semanales;
    if (horas < 1 || horas > 20) throw invalido('Las horas semanales van de 1 a 20');
    await this.a.materiasCurso.insert({ id_curso: id, id_materia: body.id_materia, horas_semanales: horas });
    return this.get_curso(id);
  }

  /** Solo cambia las horas en este curso; la materia no se modifica. */
  async cambiar_horas_materia_curso(id: number, body: CambiarHorasMateriaCursoDto): Promise<Curso> {
    await this.a.curso(id);
    const mc = await this.a.materiasCurso.findOneBy({ id_curso: id, id_materia: body.id_materia });
    if (!mc) throw noEncontrado(`El curso no dicta la materia ${body.id_materia}`);
    if (body.horas_semanales < 1 || body.horas_semanales > 20) throw invalido('Las horas semanales van de 1 a 20');
    await this.a.materiasCurso.update({ id_curso: id, id_materia: body.id_materia }, { horas_semanales: body.horas_semanales });
    return this.get_curso(id);
  }

  async quitar_materia_curso(id: number, idMateria: number): Promise<Curso> {
    await this.a.curso(id);
    if (!(await this.a.materiasCurso.findOneBy({ id_curso: id, id_materia: idMateria }))) {
      throw noEncontrado(`El curso no dicta la materia ${idMateria}`);
    }
    const clases = await this.a.clases.countBy({ id_curso: id, id_materia: idMateria });
    if (clases) throw conflicto(`La materia tiene ${clases} clases en este curso: primero hay que quitarlas de la planificación`);
    await this.a.materiasCurso.delete({ id_curso: id, id_materia: idMateria });
    return this.get_curso(id);
  }

  async get_curso_clases(id: number): Promise<Clase[]> {
    await this.a.curso(id);
    return this.a.armarClases(await this.a.clases.find({ where: { id_curso: id }, order: { id_clase: 'ASC' } }));
  }

  async get_curso(id: number): Promise<Curso> {
    return this.a.armarCurso(await this.a.curso(id));
  }

  async get_cursos(query: GetCursosQuery): Promise<Curso[]> {
    const where = query.id_ciclo_lectivo != null ? { id_ciclo_lectivo: query.id_ciclo_lectivo } : {};
    const l = await this.a.cursos.find({
      where,
      relations: { anio_academico: true, ciclo_lectivo: true },
      order: { id_ciclo_lectivo: 'DESC' },
    });
    l.sort(
      (x, y) =>
        (y.ciclo_lectivo?.anio_calendario ?? 0) - (x.ciclo_lectivo?.anio_calendario ?? 0) ||
        (x.anio_academico?.id_anio_academico ?? 99) - (y.anio_academico?.id_anio_academico ?? 99) ||
        x.division.localeCompare(y.division),
    );
    return this.a.armarCursos(l);
  }
}
