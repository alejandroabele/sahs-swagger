import { Injectable } from '@nestjs/common';
import { conflicto, invalido, referenciaInvalida } from '@sahs/comun';
import type * as C from '@sahs/contratos';
import type { Materia, PlanDeEstudiosAnio, ProfesorResumen } from '../dto/modelos';
import type {
  AsignarAnioAcademicoAMateriaDto,
  AsignarClaseAMateriaDto,
  AsignarMateriaOrientacionDto,
  CrearMateriaDto,
  GetPlanDeEstudiosQuery,
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
    await this.a.planificacion.exigir<C.AnioAcademico>(`anios-academicos/${id}`, `No existe el año académico ${id}`);
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
      if (await this.a.planificacion.buscar<C.Clase>(`clases/${c.id_clase}`)) clases++;
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
    const clase = await this.a.planificacion.exigir<C.Clase>(`clases/${body.id_clase}`, `No existe la clase ${body.id_clase}`);
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

  /**
   * Plan de estudios armado en tres niveles: año académico → orientación → materias.
   * El nombre del año lo da Planificación. Invoca: planificacion.get_anios_academicos.
   */
  async get_plan_de_estudios(q: GetPlanDeEstudiosQuery): Promise<PlanDeEstudiosAnio[]> {
    const donde: Record<string, number> = {};
    if (q.id_orientacion != null) donde.id_orientacion = q.id_orientacion;
    if (q.id_anio_academico != null) donde.id_anio_academico = q.id_anio_academico;
    const [materias, orientaciones, areas, anios] = await Promise.all([
      this.a.materias.findBy(donde),
      this.a.orientaciones.find(),
      this.a.areas.find(),
      this.a.planificacion.listar<C.AnioAcademico>('anios-academicos'),
    ]);
    if (q.id_orientacion != null && !orientaciones.some((o) => o.id_orientacion === q.id_orientacion)) {
      throw referenciaInvalida(`No existe la orientación ${q.id_orientacion}`);
    }
    const nombreArea = new Map(areas.map((x) => [x.id_area, x.nombre_area]));
    const numero = (a: C.AnioAcademico) => parseInt(a.anio_curricular, 10) || 99;
    return anios
      .filter((a) => q.id_anio_academico == null || a.id_anio_academico === q.id_anio_academico)
      .sort((x, y) => numero(x) - numero(y))
      .map((a) => ({
        id_anio_academico: a.id_anio_academico,
        anio_curricular: a.anio_curricular,
        orientaciones: orientaciones
          .filter((o) => (q.id_orientacion != null ? o.id_orientacion === q.id_orientacion : materias.some((m) => m.id_orientacion === o.id_orientacion && m.id_anio_academico === a.id_anio_academico)))
          .sort((x, y) => x.nombre_orientacion.localeCompare(y.nombre_orientacion))
          .map((o) => ({
            id_orientacion: o.id_orientacion,
            nombre_orientacion: o.nombre_orientacion,
            codigo: o.codigo,
            materias: materias
              .filter((m) => m.id_orientacion === o.id_orientacion && m.id_anio_academico === a.id_anio_academico)
              .sort((x, y) => x.nombre_materia.localeCompare(y.nombre_materia))
              .map((m) => ({
                id_materia: m.id_materia,
                nombre_materia: m.nombre_materia,
                descripcion_materia: m.descripcion_materia ?? undefined,
                horas_semanales: m.horas_semanales,
                id_area: m.id_area ?? null,
                nombre_area: m.id_area != null ? (nombreArea.get(m.id_area) ?? null) : null,
              })),
          })),
      }))
      .filter((a) => a.orientaciones.length > 0);
  }

  async get_profesores_materia(id: number): Promise<ProfesorResumen[]> {
    await this.a.materia(id);
    return this.a.profesoresHabilitados([id]);
  }
}
