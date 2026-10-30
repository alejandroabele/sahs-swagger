import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClienteServicio, conAnidados, distintos, noEncontrado } from '@sahs/comun';
import type * as C from '@sahs/contratos';
import { AreaEntidad, MateriaClaseEntidad, MateriaEntidad, OrientacionCursoEntidad, OrientacionEntidad } from '@sahs/entidades';
import type { Area, Materia, Orientacion, ProfesorResumen } from './dto/modelos';

export const aProfesorResumen = (p: C.Profesor | C.ProfesorResumen): ProfesorResumen => ({
  id_profesor: p.id_profesor,
  nombre: p.nombre,
  apellido: p.apellido,
  legajo: p.legajo ?? undefined,
});

/**
 * Arma las respuestas del servicio (orientaciones, áreas y materias) con sus anidados.
 * Los anidados de otros servicios (el coordinador del área) solo se piden si la
 * llamada no es "plana" (ver conAnidados en @sahs/comun).
 */
@Injectable()
export class Armado {
  readonly profesores = new ClienteServicio('profesor_suplencias');
  readonly planificacion = new ClienteServicio('planificacion');

  constructor(
    @InjectRepository(OrientacionEntidad) readonly orientaciones: Repository<OrientacionEntidad>,
    @InjectRepository(OrientacionCursoEntidad) readonly cursos: Repository<OrientacionCursoEntidad>,
    @InjectRepository(AreaEntidad) readonly areas: Repository<AreaEntidad>,
    @InjectRepository(MateriaEntidad) readonly materias: Repository<MateriaEntidad>,
    @InjectRepository(MateriaClaseEntidad) readonly clases: Repository<MateriaClaseEntidad>,
  ) {}

  /* ---------- búsquedas que responden 404 ---------- */

  async orientacion(id: number) {
    const o = await this.orientaciones.findOneBy({ id_orientacion: id });
    if (!o) throw noEncontrado(`No existe la orientación ${id}`);
    return o;
  }

  async area(id: number) {
    const a = await this.areas.findOneBy({ id_area: id });
    if (!a) throw noEncontrado(`No existe el área ${id}`);
    return a;
  }

  async materia(id: number) {
    const m = await this.materias.findOneBy({ id_materia: id });
    if (!m) throw noEncontrado(`No existe la materia ${id}`);
    return m;
  }

  /* ---------- armado ---------- */

  async armarOrientaciones(lista: OrientacionEntidad[]): Promise<Orientacion[]> {
    const ids = lista.map((o) => o.id_orientacion);
    const cursos = ids.length ? await this.cursos.find({ where: { id_orientacion: In(ids) }, order: { id_curso: 'ASC' } }) : [];
    return lista.map((o) => ({
      id_orientacion: o.id_orientacion,
      nombre_orientacion: o.nombre_orientacion,
      descripcion_orientacion: o.descripcion_orientacion ?? undefined,
      codigo: o.codigo,
      ids_cursos: cursos.filter((c) => c.id_orientacion === o.id_orientacion).map((c) => c.id_curso),
    }));
  }

  /** Coordinadores (ProfesorResumen) por id, pedidos una sola vez. */
  private async coordinadores(ids: number[]): Promise<Map<number, ProfesorResumen>> {
    const out = new Map<number, ProfesorResumen>();
    if (!conAnidados() || !ids.length) return out;
    for (const id of ids) {
      const p = await this.profesores.buscar<C.Profesor>(`profesores/${id}`);
      if (p) out.set(id, aProfesorResumen(p));
    }
    return out;
  }

  async armarAreas(lista: AreaEntidad[]): Promise<Area[]> {
    const coords = await this.coordinadores(distintos(lista.map((a) => a.id_profesor_coordinador)));
    const anidar = conAnidados();
    return lista.map((a) => ({
      id_area: a.id_area,
      nombre_area: a.nombre_area,
      descripcion_area: a.descripcion_area ?? undefined,
      id_profesor_coordinador: a.id_profesor_coordinador,
      ...(anidar ? { coordinador: a.id_profesor_coordinador ? coords.get(a.id_profesor_coordinador) ?? null : null } : {}),
    }));
  }

  async armarMaterias(lista: MateriaEntidad[]): Promise<Materia[]> {
    if (!lista.length) return [];
    const ids = lista.map((m) => m.id_materia);
    const [clases, areas, orients] = await Promise.all([
      this.clases.find({ where: { id_materia: In(ids) }, order: { id_clase: 'ASC' } }),
      this.armarAreas(await this.areas.findBy({ id_area: In(distintos(lista.map((m) => m.id_area))) })),
      this.armarOrientaciones(await this.orientaciones.findBy({ id_orientacion: In(distintos(lista.map((m) => m.id_orientacion))) })),
    ]);
    return lista.map((m) => ({
      id_materia: m.id_materia,
      nombre_materia: m.nombre_materia,
      descripcion_materia: m.descripcion_materia ?? undefined,
      horas_semanales: m.horas_semanales,
      id_area: m.id_area,
      area: m.id_area ? areas.find((a) => a.id_area === m.id_area) ?? null : null,
      id_orientacion: m.id_orientacion,
      orientacion: orients.find((o) => o.id_orientacion === m.id_orientacion),
      id_anio_academico: m.id_anio_academico ?? undefined,
      ids_clases: clases.filter((c) => c.id_materia === m.id_materia).map((c) => c.id_clase),
    }));
  }

  async armarMateria(m: MateriaEntidad): Promise<Materia> {
    return (await this.armarMaterias([m]))[0];
  }

  /** Materias ordenadas como en el prototipo: por año, orientación y nombre. */
  ordenar(l: MateriaEntidad[]) {
    return l.sort(
      (a, b) =>
        (a.id_anio_academico ?? 99) - (b.id_anio_academico ?? 99) ||
        a.id_orientacion - b.id_orientacion ||
        a.nombre_materia.localeCompare(b.nombre_materia),
    );
  }

  /** Profesores habilitados en alguna de las materias (Profesor y Suplencias, llamada plana). */
  /** Solo activos: un profesor dado de baja no está disponible para ninguna materia. */
  async profesoresHabilitados(idsMaterias: number[]): Promise<ProfesorResumen[]> {
    const todos = await this.profesores.listar<C.Profesor>('profesores');
    return todos
      .filter((p) => p.activo !== false)
      .filter((p) => (p.lista_materias_habilitadas ?? []).some((mh) => mh.id_materia != null && idsMaterias.includes(mh.id_materia)))
      .sort((a, b) => a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre))
      .map(aProfesorResumen);
  }
}
