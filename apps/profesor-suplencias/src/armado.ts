import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClienteServicio, conAnidados, noEncontrado } from '@sahs/comun';
import type * as C from '@sahs/contratos';
import {
  ProfesorDisponibilidadEntidad,
  ProfesorEntidad,
  ProfesorMateriaEntidad,
  SuplenciaClaseEntidad,
  SuplenciaEntidad,
} from '@sahs/entidades';
import type { ClaseResumen, FranjaHorariaResumen, MateriaResumen, Profesor, ProfesorResumen, Suplencia } from './dto/modelos';

export const aProfesorResumen = (p: ProfesorEntidad): ProfesorResumen => ({
  id_profesor: p.id_profesor,
  nombre: p.nombre,
  apellido: p.apellido,
  legajo: p.legajo ?? undefined,
});

export const aFranjaResumen = (f: C.FranjaHoraria): FranjaHorariaResumen => ({
  id_franja_horaria: f.id_franja_horaria,
  hora_inicio: f.hora_inicio,
  hora_fin: f.hora_fin,
  es_recreo: f.es_recreo,
  nombre_dia_lectivo: f.dia_lectivo?.nombre_dia_lectivo,
});

/**
 * Arma profesores y suplencias con sus anidados. Los datos de otros servicios
 * (materias, franjas, clases) se piden con un listado por request; si la llamada es
 * plana (la hace otro servicio), solo se devuelven los ids.
 */
@Injectable()
export class Armado {
  readonly usuario = new ClienteServicio('usuario');
  readonly orientacion = new ClienteServicio('orientacion');
  readonly planificacion = new ClienteServicio('planificacion');
  readonly horarios = new ClienteServicio('horarios');

  constructor(
    @InjectRepository(ProfesorEntidad) readonly profesores: Repository<ProfesorEntidad>,
    @InjectRepository(ProfesorMateriaEntidad) readonly materias: Repository<ProfesorMateriaEntidad>,
    @InjectRepository(ProfesorDisponibilidadEntidad) readonly disponibilidad: Repository<ProfesorDisponibilidadEntidad>,
    @InjectRepository(SuplenciaEntidad) readonly suplencias: Repository<SuplenciaEntidad>,
    @InjectRepository(SuplenciaClaseEntidad) readonly suplenciaClases: Repository<SuplenciaClaseEntidad>,
  ) {}

  async profesor(id: number) {
    const p = await this.profesores.findOneBy({ id_profesor: id });
    if (!p) throw noEncontrado(`No existe el profesor ${id}`);
    return p;
  }

  /** Franjas de Horarios por id (un solo listado por request). */
  async franjas(): Promise<Map<number, C.FranjaHoraria>> {
    const l = await this.horarios.listar<C.FranjaHoraria>('get_franjas_horarias');
    return new Map(l.map((f) => [f.id_franja_horaria, f]));
  }

  /** Materias de Orientación por id (un solo listado por request). */
  async materiasPorId(): Promise<Map<number, C.Materia>> {
    const l = await this.orientacion.listar<C.Materia>('get_materias');
    return new Map(l.map((m) => [m.id_materia, m]));
  }

  /** Clases de Planificación por id (un solo listado por request, llamada plana). */
  async clasesPorId(): Promise<Map<number, C.Clase>> {
    const l = await this.planificacion.listar<C.Clase>('get_clases');
    return new Map(l.map((c) => [c.id_clase, c]));
  }

  async armarProfesores(lista: ProfesorEntidad[]): Promise<Profesor[]> {
    if (!lista.length) return [];
    const ids = lista.map((p) => p.id_profesor);
    const [mats, disp] = await Promise.all([
      this.materias.find({ where: { id_profesor: In(ids) } }),
      this.disponibilidad.find({ where: { id_profesor: In(ids) } }),
    ]);
    const anidar = conAnidados();
    const materias = anidar && mats.length ? await this.materiasPorId() : new Map<number, C.Materia>();
    const franjas = anidar && disp.length ? await this.franjas() : new Map<number, C.FranjaHoraria>();
    const ordenFranja = (a: FranjaHorariaResumen, b: FranjaHorariaResumen) => (a.id_franja_horaria ?? 0) - (b.id_franja_horaria ?? 0);
    return lista.map((p) => {
      const mp = mats.filter((m) => m.id_profesor === p.id_profesor);
      const dp = disp.filter((d) => d.id_profesor === p.id_profesor);
      const lista_materias_habilitadas: MateriaResumen[] = mp.map((m) => {
        const mt = materias.get(m.id_materia);
        return anidar && mt
          ? { id_materia: mt.id_materia, nombre_materia: mt.nombre_materia, horas_semanales: mt.horas_semanales }
          : { id_materia: m.id_materia };
      });
      const disponibilidad: FranjaHorariaResumen[] = dp
        .map((d) => {
          const f = franjas.get(d.id_franja_horaria);
          return anidar && f ? aFranjaResumen(f) : { id_franja_horaria: d.id_franja_horaria };
        })
        .sort(ordenFranja);
      return {
        id_profesor: p.id_profesor,
        nombre: p.nombre,
        apellido: p.apellido,
        documento: p.documento,
        legajo: p.legajo,
        cargo_asociado: p.cargo_asociado,
        correo_electronico: p.correo_electronico ?? undefined,
        telefono: p.telefono ?? undefined,
        direccion: p.direccion ?? undefined,
        id_usuario: p.id_usuario,
        lista_materias_habilitadas,
        disponibilidad,
      };
    });
  }

  async armarProfesor(p: ProfesorEntidad): Promise<Profesor> {
    return (await this.armarProfesores([p]))[0];
  }

  async armarSuplencias(lista: SuplenciaEntidad[]): Promise<Suplencia[]> {
    if (!lista.length) return [];
    const ids = lista.map((s) => s.id_suplencia);
    const sc = await this.suplenciaClases.find({ where: { id_suplencia: In(ids) }, order: { id_clase: 'ASC' } });
    const profes = await this.profesores.findBy({ id_profesor: In([...new Set(lista.map((s) => s.id_profesor))]) });
    const anidar = conAnidados();
    const clases = anidar && sc.length ? await this.clasesPorId() : new Map<number, C.Clase>();
    return lista.map((s) => {
      const idsClases = sc.filter((c) => c.id_suplencia === s.id_suplencia).map((c) => c.id_clase);
      const p = profes.find((x) => x.id_profesor === s.id_profesor);
      return {
        id_suplencia: s.id_suplencia,
        fecha_inicio: s.fecha_inicio,
        fecha_fin: s.fecha_fin,
        motivo: s.motivo,
        id_profesor: s.id_profesor,
        profesor: p ? aProfesorResumen(p) : undefined,
        ids_clases: idsClases,
        clases: idsClases.map((id): ClaseResumen => {
          const c = clases.get(id);
          return anidar && c ? { id_clase: c.id_clase, codigo: c.codigo, descripcion: c.descripcion, id_curso: c.id_curso } : { id_clase: id };
        }),
      };
    });
  }
}
