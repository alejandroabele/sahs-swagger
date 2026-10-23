import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClienteServicio, conAnidados, hoy, noEncontrado } from '@sahs/comun';
import type * as C from '@sahs/contratos';
import {
  AnioAcademicoEntidad,
  CicloLectivoEntidad,
  ClaseEntidad,
  ClaseFranjaEntidad,
  ClaseProfesorEntidad,
  CursoEntidad,
  EstadoPropuestaEntidad,
  MateriaCursoEntidad,
  PropuestaClaseEntidad,
  PropuestaEntidad,
} from '@sahs/entidades';
import type {
  AnioAcademico,
  CicloLectivo,
  Clase,
  Curso,
  EstadoPropuesta,
  FranjaHorariaResumen,
  ProfesorResumen,
  Propuesta,
  SuplenciaResumen,
} from './dto/modelos';

export const aEstado = (e: EstadoPropuestaEntidad): EstadoPropuesta => ({ id_estado: e.id_estado, nombre: e.nombre, codigo: e.codigo });
export const aCiclo = (c: CicloLectivoEntidad): CicloLectivo => ({ id_ciclo_lectivo: c.id_ciclo_lectivo, anio_calendario: c.anio_calendario });
export const aAnio = (a: AnioAcademicoEntidad): AnioAcademico => ({
  id_anio_academico: a.id_anio_academico,
  anio_curricular: a.anio_curricular,
  codigo: a.codigo,
});

export const aFranjaResumen = (f: C.FranjaHoraria): FranjaHorariaResumen => ({
  id_franja_horaria: f.id_franja_horaria,
  hora_inicio: f.hora_inicio,
  hora_fin: f.hora_fin,
  es_recreo: f.es_recreo,
  nombre_dia_lectivo: f.dia_lectivo?.nombre_dia_lectivo,
});

export const aProfesorResumen = (p: C.Profesor | C.ProfesorResumen): ProfesorResumen => ({
  id_profesor: p.id_profesor,
  nombre: p.nombre,
  apellido: p.apellido,
  legajo: p.legajo ?? undefined,
});

export const nombreFranja = (f: C.FranjaHoraria) => `${f.dia_lectivo?.nombre_dia_lectivo ?? ''} ${f.hora_inicio}`.trim();

/**
 * Arma propuestas, cursos y clases con sus anidados. Los datos de otros servicios
 * (materias, franjas, turnos, profesores, orientaciones, suplencias) se piden con un
 * listado por request. Si la llamada es plana (la hace otro servicio) no se piden.
 */
@Injectable()
export class Armado {
  readonly orientacion = new ClienteServicio('orientacion');
  readonly horarios = new ClienteServicio('horarios');
  readonly profesores = new ClienteServicio('profesor_suplencias');

  constructor(
    @InjectRepository(EstadoPropuestaEntidad) readonly estados: Repository<EstadoPropuestaEntidad>,
    @InjectRepository(CicloLectivoEntidad) readonly ciclos: Repository<CicloLectivoEntidad>,
    @InjectRepository(AnioAcademicoEntidad) readonly anios: Repository<AnioAcademicoEntidad>,
    @InjectRepository(PropuestaEntidad) readonly propuestas: Repository<PropuestaEntidad>,
    @InjectRepository(PropuestaClaseEntidad) readonly propuestaClases: Repository<PropuestaClaseEntidad>,
    @InjectRepository(CursoEntidad) readonly cursos: Repository<CursoEntidad>,
    @InjectRepository(MateriaCursoEntidad) readonly materiasCurso: Repository<MateriaCursoEntidad>,
    @InjectRepository(ClaseEntidad) readonly clases: Repository<ClaseEntidad>,
    @InjectRepository(ClaseFranjaEntidad) readonly claseFranjas: Repository<ClaseFranjaEntidad>,
    @InjectRepository(ClaseProfesorEntidad) readonly claseProfesores: Repository<ClaseProfesorEntidad>,
  ) {}

  /* ---------- búsquedas que responden 404 ---------- */

  async propuesta(id: number) {
    const p = await this.propuestas.findOne({ where: { id_propuesta: id }, relations: { estado: true } });
    if (!p) throw noEncontrado(`No existe la propuesta ${id}`);
    return p;
  }

  async curso(id: number) {
    const c = await this.cursos.findOneBy({ id_curso: id });
    if (!c) throw noEncontrado(`No existe el curso ${id}`);
    return c;
  }

  async clase(id: number) {
    const c = await this.clases.findOneBy({ id_clase: id });
    if (!c) throw noEncontrado(`No existe la clase ${id}`);
    return c;
  }

  async ciclo(id: number) {
    const c = await this.ciclos.findOneBy({ id_ciclo_lectivo: id });
    if (!c) throw noEncontrado(`No existe el ciclo lectivo ${id}`);
    return c;
  }

  async anio(id: number) {
    const a = await this.anios.findOneBy({ id_anio_academico: id });
    if (!a) throw noEncontrado(`No existe el año académico ${id}`);
    return a;
  }

  /* ---------- datos de otros servicios (un listado por request) ---------- */

  async materiasPorId(): Promise<Map<number, C.Materia>> {
    return new Map((await this.orientacion.listar<C.Materia>('get_materias')).map((m) => [m.id_materia, m]));
  }

  async franjasPorId(): Promise<Map<number, C.FranjaHoraria>> {
    return new Map((await this.horarios.listar<C.FranjaHoraria>('get_franjas_horarias')).map((f) => [f.id_franja_horaria, f]));
  }

  async turnosPorId(): Promise<Map<number, C.Turno>> {
    return new Map((await this.horarios.listar<C.Turno>('get_turnos')).map((t) => [t.id_turno, t]));
  }

  async profesoresPorId(): Promise<Map<number, C.Profesor>> {
    return new Map((await this.profesores.listar<C.Profesor>('get_profesores')).map((p) => [p.id_profesor, p]));
  }

  /** Orientación de cada curso (la guarda el servicio Orientación en ids_cursos). */
  async orientacionPorCurso(): Promise<Map<number, C.Orientacion>> {
    const out = new Map<number, C.Orientacion>();
    for (const o of await this.orientacion.listar<C.Orientacion>('get_orientaciones')) {
      for (const id of o.ids_cursos ?? []) out.set(id, o);
    }
    return out;
  }

  /* ---------- armado ---------- */

  async armarPropuestas(lista: PropuestaEntidad[]): Promise<Propuesta[]> {
    if (!lista.length) return [];
    const pc = await this.propuestaClases.find({ where: { id_propuesta: In(lista.map((p) => p.id_propuesta)) }, order: { id_clase: 'ASC' } });
    return lista.map((p) => ({
      id_propuesta: p.id_propuesta,
      nombre: p.nombre,
      descripcion_propuesta: p.descripcion_propuesta ?? undefined,
      fecha_creacion: p.fecha_creacion,
      fecha_modificacion: p.fecha_modificacion,
      codigo: p.codigo,
      id_ciclo_lectivo: p.id_ciclo_lectivo,
      estado: p.estado ? aEstado(p.estado) : undefined,
      ids_clases: pc.filter((x) => x.id_propuesta === p.id_propuesta).map((x) => x.id_clase),
    }));
  }

  async armarCursos(lista: CursoEntidad[]): Promise<Curso[]> {
    if (!lista.length) return [];
    const mc = await this.materiasCurso.find({ where: { id_curso: In(lista.map((c) => c.id_curso)) } });
    const anidar = conAnidados();
    const [materias, turnos, orients] = anidar
      ? await Promise.all([this.materiasPorId(), this.turnosPorId(), this.orientacionPorCurso()])
      : [new Map<number, C.Materia>(), new Map<number, C.Turno>(), new Map<number, C.Orientacion>()];
    return lista.map((c) => {
      const t = turnos.get(c.id_turno);
      const o = orients.get(c.id_curso);
      const base: Curso = {
        id_curso: c.id_curso,
        division: c.division,
        id_anio_academico: c.id_anio_academico ?? undefined,
        id_ciclo_lectivo: c.id_ciclo_lectivo,
        id_turno: c.id_turno,
        id_orientacion: o?.id_orientacion as number,
        materias: mc
          .filter((m) => m.id_curso === c.id_curso)
          .map((m) => ({ id_materia: m.id_materia, nombre_materia: materias.get(m.id_materia)?.nombre_materia as string, horas_semanales: m.horas_semanales }))
          .sort((a, b) => (a.nombre_materia ?? '').localeCompare(b.nombre_materia ?? '')),
      };
      if (!anidar) return base;
      return {
        ...base,
        turno: t ? { id_turno: t.id_turno, nombre: t.nombre } : undefined,
        orientacion: o ? { id_orientacion: o.id_orientacion, nombre_orientacion: o.nombre_orientacion, codigo: o.codigo } : undefined,
        franjas_horarias: (t?.franjas_horarias ?? []).map(aFranjaResumen),
      };
    });
  }

  async armarCurso(c: CursoEntidad): Promise<Curso> {
    return (await this.armarCursos([c]))[0];
  }

  /**
   * Clases con materia, franjas y profesores. La suplencia vigente solo se anida en
   * get_clase (conSuplencia): en los listados no, para no hacer una llamada por clase.
   */
  async armarClases(lista: ClaseEntidad[], conSuplencia = false): Promise<Clase[]> {
    if (!lista.length) return [];
    const ids = lista.map((c) => c.id_clase);
    const [fr, pr] = await Promise.all([
      this.claseFranjas.find({ where: { id_clase: In(ids) } }),
      this.claseProfesores.find({ where: { id_clase: In(ids) } }),
    ]);
    const anidar = conAnidados();
    const [materias, franjas, profes] = anidar
      ? await Promise.all([this.materiasPorId(), this.franjasPorId(), this.profesoresPorId()])
      : [new Map<number, C.Materia>(), new Map<number, C.FranjaHoraria>(), new Map<number, C.Profesor>()];
    const salida: Clase[] = [];
    for (const c of lista) {
      const idsFr = fr.filter((x) => x.id_clase === c.id_clase).map((x) => x.id_franja_horaria);
      const idsPr = pr.filter((x) => x.id_clase === c.id_clase).map((x) => x.id_profesor);
      const base: Clase = {
        id_clase: c.id_clase,
        descripcion: c.descripcion ?? undefined,
        codigo: c.codigo,
        id_curso: c.id_curso,
        id_materia: c.id_materia,
        ids_franjas_horarias: idsFr.sort((a, b) => a - b),
        ids_profesores: idsPr,
      };
      if (!anidar) {
        salida.push(base);
        continue;
      }
      const m = materias.get(c.id_materia);
      const clase: Clase = {
        ...base,
        materia: m ? { id_materia: m.id_materia, nombre_materia: m.nombre_materia, horas_semanales: m.horas_semanales } : undefined,
        franjas_horarias: idsFr.map((id) => franjas.get(id)).filter((f): f is C.FranjaHoraria => !!f).map(aFranjaResumen),
        profesores: idsPr.map((id) => profes.get(id)).filter((p): p is C.Profesor => !!p).map(aProfesorResumen),
      };
      if (conSuplencia) clase.suplencia = await this.suplenciaVigente(c.id_clase);
      salida.push(clase);
    }
    return salida;
  }

  /** Suplencia vigente hoy. Invoca: profesor_suplencias.get_suplencias (id_clase y la fecha del día). */
  async suplenciaVigente(idClase: number): Promise<SuplenciaResumen | null> {
    const f = hoy();
    const l = await this.profesores.listar<C.Suplencia>('get_suplencias', { query: { id_clase: idClase, fecha_desde: f, fecha_hasta: f } });
    const s = l[0];
    if (!s) return null;
    return {
      id_suplencia: s.id_suplencia,
      fecha_inicio: s.fecha_inicio,
      fecha_fin: s.fecha_fin,
      motivo: s.motivo,
      profesor: s.profesor ? aProfesorResumen(s.profesor) : undefined,
    };
  }

  /** Marca la propuesta como modificada. */
  async tocar(idPropuesta: number) {
    await this.propuestas.update(idPropuesta, { fecha_modificacion: new Date().toISOString() });
  }
}
