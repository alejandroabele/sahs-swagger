import { Injectable } from '@nestjs/common';
import { conflicto, invalido, referenciaInvalida } from '@sahs/comun';
import type * as C from '@sahs/contratos';
import type { FranjaHorariaResumen, Profesor } from '../dto/modelos';
import type {
  AsignarActivoProfesorDto,
  AsignarDisponibilidadDto,
  AsignarMateriasHabilitadasDto,
  AsignarUsuarioProfesorDto,
  CrearProfesorDto,
  EditarProfesorDto,
  GetProfesoresQuery,
} from '../dto/entradas';
import { Armado } from '../armado';

const vacioANull = (s: string | null | undefined) => (s == null || s.trim() === '' ? null : s.trim());

@Injectable()
export class ProfesorService {
  constructor(private readonly a: Armado) {}

  private async documentoLibre(documento: string, salvo?: number) {
    const otro = await this.a.profesores.findOneBy({ documento });
    if (otro && otro.id_profesor !== salvo) throw conflicto(`Ya hay un profesor con el documento ${documento}`);
  }

  private async legajoLibre(legajo: string | null, salvo?: number) {
    if (!legajo) return;
    const otro = await this.a.profesores.findOneBy({ legajo });
    if (otro && otro.id_profesor !== salvo) throw conflicto(`El legajo ${legajo} ya es de ${otro.apellido}, ${otro.nombre}`);
  }

  /** No crea el usuario: se asigna después con asignar_usuario_profesor. */
  async crear_profesor(body: CrearProfesorDto): Promise<Profesor> {
    const documento = body.documento.trim();
    await this.documentoLibre(documento);
    const p = await this.a.profesores.save({
      nombre: body.nombre.trim(),
      apellido: body.apellido.trim(),
      documento,
      correo_electronico: body.correo_electronico.trim().toLowerCase(),
      telefono: vacioANull(body.telefono),
      direccion: vacioANull(body.direccion),
      legajo: null,
      cargo_asociado: null,
      id_usuario: null,
      activo: true,
    });
    return this.get_profesor(p.id_profesor);
  }

  /** Reemplaza todos los datos editables. null en legajo o cargo los deja vacíos. */
  async editar_profesor(id: number, body: EditarProfesorDto): Promise<Profesor> {
    await this.a.profesor(id);
    const documento = body.documento.trim();
    const legajo = vacioANull(body.legajo);
    await this.documentoLibre(documento, id);
    await this.legajoLibre(legajo, id);
    await this.a.profesores.update(id, {
      nombre: body.nombre.trim(),
      apellido: body.apellido.trim(),
      documento,
      correo_electronico: body.correo_electronico.trim().toLowerCase(),
      telefono: vacioANull(body.telefono),
      direccion: vacioANull(body.direccion),
      legajo,
      cargo_asociado: vacioANull(body.cargo_asociado),
    });
    return this.get_profesor(id);
  }

  /** Vincula un usuario existente. Invoca: usuario.get_usuario. */
  async asignar_usuario_profesor(id: number, body: AsignarUsuarioProfesorDto): Promise<Profesor> {
    await this.a.profesor(id);
    await this.a.usuario.exigir<C.Usuario>(`usuarios/${body.id_usuario}`, `No existe el usuario ${body.id_usuario}`);
    const otro = await this.a.profesores.findOneBy({ id_usuario: body.id_usuario });
    if (otro && otro.id_profesor !== id) throw conflicto(`Ese usuario ya está vinculado a ${otro.apellido}, ${otro.nombre}`);
    await this.a.profesores.update(id, { id_usuario: body.id_usuario });
    return this.get_profesor(id);
  }

  /** Reemplaza las materias habilitadas. Invoca: orientacion.get_materia. */
  async asignar_materias_habilitadas(id: number, body: AsignarMateriasHabilitadasDto): Promise<Profesor> {
    await this.a.profesor(id);
    const ids = [...new Set(body.ids_materias)];
    for (const m of ids) await this.a.orientacion.exigir<C.Materia>(`materias/${m}`, `No existe la materia ${m}`);
    await this.a.materias.manager.transaction(async (tx) => {
      await tx.delete(this.a.materias.target, { id_profesor: id });
      if (ids.length) await tx.insert(this.a.materias.target, ids.map((id_materia) => ({ id_profesor: id, id_materia })));
    });
    return this.get_profesor(id);
  }

  /** Reemplaza la disponibilidad. Los recreos no se pueden declarar. Invoca: horarios.get_franja_horaria. */
  async asignar_disponibilidad(id: number, body: AsignarDisponibilidadDto): Promise<Profesor> {
    await this.a.profesor(id);
    const ids = [...new Set(body.ids_franjas_horarias)];
    for (const f of ids) {
      const franja = await this.a.horarios.exigir<C.FranjaHoraria>(`franjas-horarias/${f}`, `No existe la franja horaria ${f}`);
      if (franja.es_recreo) throw invalido(`La franja ${franja.hora_inicio}–${franja.hora_fin} es un recreo: no se puede declarar como disponible`);
    }
    await this.a.disponibilidad.manager.transaction(async (tx) => {
      await tx.delete(this.a.disponibilidad.target, { id_profesor: id });
      if (ids.length) await tx.insert(this.a.disponibilidad.target, ids.map((id_franja_horaria) => ({ id_profesor: id, id_franja_horaria })));
    });
    return this.get_profesor(id);
  }

  /**
   * Baja lógica (activo: false) o reactivación (activo: true). No se da de baja a un docente
   * de una clase de una propuesta Vigente. Invoca: planificacion.get_posibles_estados_de_propuestas,
   * planificacion.get_propuestas, planificacion.get_clases.
   */
  async asignar_activo_profesor(id: number, body: AsignarActivoProfesorDto): Promise<Profesor> {
    const p = await this.a.profesor(id);
    if (!body.activo && p.activo) {
      const vig = (await this.a.planificacion.listar<C.EstadoPropuesta>('estados-propuesta')).find((e) => e.codigo === 'VIG');
      const vigentes = vig ? await this.a.planificacion.listar<C.Propuesta>(`propuestas?id_estado=${vig.id_estado}`) : [];
      if (vigentes.length) {
        const suyas = await this.a.planificacion.listar<C.Clase>(`clases?id_profesor=${id}`);
        for (const prop of vigentes) {
          const clase = suyas.find((c) => (prop.ids_clases ?? []).includes(c.id_clase));
          if (clase) {
            throw conflicto(
              `${p.nombre} ${p.apellido} es docente de ${clase.codigo} en la planificación Vigente ${prop.codigo}: no se puede dar de baja`,
            );
          }
        }
      }
    }
    await this.a.profesores.update(id, { activo: body.activo });
    return this.get_profesor(id);
  }

  async get_profesor(id: number): Promise<Profesor> {
    return this.a.armarProfesor(await this.a.profesor(id));
  }

  async get_profesores(query: GetProfesoresQuery): Promise<Profesor[]> {
    const where: { id_usuario?: number; activo?: boolean } = {};
    if (query.id_usuario != null) where.id_usuario = query.id_usuario;
    if (query.activo != null) where.activo = query.activo;
    const l = await this.a.profesores.find({ where, order: { apellido: 'ASC', nombre: 'ASC' } });
    return this.a.armarProfesores(l);
  }

  async get_disponibilidad_profesor(id: number): Promise<FranjaHorariaResumen[]> {
    return (await this.get_profesor(id)).disponibilidad ?? [];
  }
}
