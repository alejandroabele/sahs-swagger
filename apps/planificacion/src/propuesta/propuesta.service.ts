import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { conflicto, contexto, ejecutarConContexto, ErrorSahs, noEncontrado, referenciaInvalida } from '@sahs/comun';
import type * as C from '@sahs/contratos';
import type { ArmadoPropuesta, EstadoPropuesta, Propuesta, ResultadoGeneracion } from '../dto/modelos';
import type { AsignarClaseAPropuestaDto, AsignarEstadoAPropuestaDto, CrearPropuestaDto, GenerarPlanillaDto, GetPropuestasQuery } from '../dto/entradas';
import { aEstado, aFranjaResumen, Armado } from '../armado';
import { NOMBRE_ESTADO, Reglas, TRANSICIONES } from '../reglas';
import { ClaseService } from '../clase/clase.service';
import { bloqueDeFranja, codigoClase, generar, horasDelTurno, type Bloque, type ClaseGen, type CursoGen } from './generacion';

@Injectable()
export class PropuestaService {
  constructor(
    private readonly a: Armado,
    private readonly reglas: Reglas,
    private readonly clasesSrv: ClaseService,
  ) {}

  /** La propuesta nace en Borrador (BOR). */
  async crear_propuesta(body: CrearPropuestaDto): Promise<Propuesta> {
    const codigo = body.codigo.trim().toUpperCase();
    if (await this.a.propuestas.findOneBy({ codigo })) throw conflicto(`Ya existe la propuesta ${codigo}`);
    if (!(await this.a.ciclos.findOneBy({ id_ciclo_lectivo: body.id_ciclo_lectivo }))) {
      throw referenciaInvalida(`No existe el ciclo lectivo ${body.id_ciclo_lectivo}`);
    }
    const bor = await this.a.estados.findOneBy({ codigo: 'BOR' });
    if (!bor) throw conflicto('Falta el estado Borrador (BOR) en el catálogo');
    const ahora = new Date().toISOString();
    const p = await this.a.propuestas.save({
      nombre: body.nombre.trim(),
      descripcion_propuesta: body.descripcion_propuesta ?? null,
      codigo,
      id_ciclo_lectivo: body.id_ciclo_lectivo,
      id_estado: bor.id_estado,
      fecha_creacion: ahora,
      fecha_modificacion: ahora,
    });
    return this.get_propuesta(p.id_propuesta);
  }

  /**
   * Transiciones: Borrador → En revisión → Validada → Cerrada, y En revisión → Borrador.
   * Al validar una propuesta, la que estaba validada en el mismo ciclo pasa a Cerrada.
   */
  async asignar_estado_a_propuesta(id: number, body: AsignarEstadoAPropuestaDto): Promise<Propuesta> {
    const p = await this.a.propuesta(id);
    const nuevo = await this.a.estados.findOneBy({ id_estado: body.id_estado });
    if (!nuevo) throw referenciaInvalida(`No existe el estado ${body.id_estado}`);
    const actual = p.estado!.codigo;
    if (actual === nuevo.codigo) return this.get_propuesta(id);
    const conocidos = actual in TRANSICIONES && nuevo.codigo in TRANSICIONES;
    if (conocidos && !TRANSICIONES[actual].includes(nuevo.codigo)) {
      const posibles = TRANSICIONES[actual].map((c) => NOMBRE_ESTADO[c]).join(' o ') || 'ninguno';
      throw conflicto(`Una propuesta ${p.estado!.nombre} no puede pasar a ${nuevo.nombre} (puede pasar a: ${posibles})`);
    }
    if (nuevo.codigo === 'REV' && !(await this.a.propuestaClases.countBy({ id_propuesta: id }))) {
      throw conflicto('La propuesta no tiene clases: no se puede enviar a revisión');
    }
    if (nuevo.codigo === 'REV' || nuevo.codigo === 'VAL') {
      const faltan = await this.cursosIncompletos(id, p.id_ciclo_lectivo);
      if (faltan.length) {
        throw conflicto(`La planificación no está completa: faltan horas en ${faltan.join(', ')}. Se envía a revisión y se valida con todos los cursos completos.`);
      }
    }
    await this.a.propuestas.manager.transaction(async (tx) => {
      if (nuevo.codigo === 'VAL') {
        const cer = await tx.findOneBy(this.a.estados.target, { codigo: 'CER' });
        const val = await tx.findOneBy(this.a.estados.target, { codigo: 'VAL' });
        if (cer && val) {
          await tx.update(this.a.propuestas.target, { id_ciclo_lectivo: p.id_ciclo_lectivo, id_estado: (val as any).id_estado }, {
            id_estado: (cer as any).id_estado,
            fecha_modificacion: new Date().toISOString(),
          });
        }
      }
      await tx.update(this.a.propuestas.target, id, { id_estado: nuevo.id_estado, fecha_modificacion: new Date().toISOString() });
    });
    return this.get_propuesta(id);
  }

  /**
   * Cursos del ciclo a los que les faltan horas en la propuesta: alguna materia del curso
   * tiene menos franjas ubicadas que sus horas semanales.
   */
  private async cursosIncompletos(idPropuesta: number, idCiclo: number): Promise<string[]> {
    const cursos = await this.a.cursos.findBy({ id_ciclo_lectivo: idCiclo });
    if (!cursos.length) return [];
    const ids = cursos.map((c) => c.id_curso);
    const [materias, enPropuesta, anios] = await Promise.all([
      this.a.materiasCurso.findBy({ id_curso: In(ids) }),
      this.a.propuestaClases.findBy({ id_propuesta: idPropuesta }),
      this.a.anios.find(),
    ]);
    const clases = enPropuesta.length
      ? await this.a.clases.find({ where: { id_clase: In(enPropuesta.map((x) => x.id_clase)) }, relations: { franjas: true } })
      : [];
    const puestas = new Map<string, number>();
    for (const c of clases) {
      const k = c.id_curso + '|' + c.id_materia;
      puestas.set(k, (puestas.get(k) ?? 0) + (c.franjas?.length ?? 0));
    }
    const anioDe = new Map(anios.map((a) => [a.id_anio_academico, a.anio_curricular]));
    return cursos
      .filter((c) => materias.some((m) => m.id_curso === c.id_curso && (puestas.get(c.id_curso + '|' + m.id_materia) ?? 0) < m.horas_semanales))
      .map((c) => (c.id_anio_academico != null ? (anioDe.get(c.id_anio_academico) ?? '') + ' ' : '') + c.division)
      .map((n) => n.replace(/ año/, '').trim());
  }

  /** Agrega una clase a la propuesta. Solo en Borrador y sin choques de curso ni de docentes. */
  async asignar_clase_a_propuesta(id: number, body: AsignarClaseAPropuestaDto): Promise<Propuesta> {
    const p = await this.a.propuesta(id);
    const clase = await this.a.clases.findOneBy({ id_clase: body.id_clase });
    if (!clase) throw referenciaInvalida(`No existe la clase ${body.id_clase}`);
    if (p.estado!.codigo !== 'BOR') throw conflicto(`La propuesta ${p.codigo} está ${p.estado!.nombre}: solo se modifica en Borrador`);
    if (!(await this.a.propuestaClases.findOneBy({ id_propuesta: id, id_clase: clase.id_clase }))) {
      const fr = (await this.a.claseFranjas.findBy({ id_clase: clase.id_clase })).map((x) => x.id_franja_horaria);
      const pr = (await this.a.claseProfesores.findBy({ id_clase: clase.id_clase })).map((x) => x.id_profesor);
      await this.reglas.validarChoques(id, clase.id_clase, clase.id_curso, fr, pr);
      await this.a.propuestaClases.insert({ id_propuesta: id, id_clase: clase.id_clase });
      await this.a.tocar(id);
    }
    return this.get_propuesta(id);
  }

  async get_estado_actual_de_propuesta(id: number): Promise<EstadoPropuesta> {
    return aEstado((await this.a.propuesta(id)).estado!);
  }

  async get_propuestas(query: GetPropuestasQuery): Promise<Propuesta[]> {
    const where: Record<string, number> = {};
    if (query.id_ciclo_lectivo != null) where.id_ciclo_lectivo = query.id_ciclo_lectivo;
    if (query.id_estado != null) where.id_estado = query.id_estado;
    const l = await this.a.propuestas.find({ where, relations: { estado: true }, order: { codigo: 'DESC' } });
    return this.a.armarPropuestas(l);
  }

  /**
   * Fachada de la pantalla de armado (A13): en una respuesta, lo que antes eran
   * get_propuesta + get_posibles_estados_de_propuestas + get_cursos + get_anios_academicos.
   * Las tablas propias se leen en paralelo y los datos de otros servicios se piden una sola
   * vez por request (armarCursos). No trae clases: el cliente las pide por curso.
   * Invoca: orientacion.get_materias, orientacion.get_orientaciones, horarios.get_turnos.
   */
  async get_armado_propuesta(id: number): Promise<ArmadoPropuesta> {
    const p = await this.a.propuesta(id);
    const [propuestas, estados, cursos] = await Promise.all([
      this.a.armarPropuestas([p]),
      this.a.estados.find({ order: { id_estado: 'ASC' } }),
      this.a.cursos.find({ where: { id_ciclo_lectivo: p.id_ciclo_lectivo } }),
    ]);
    cursos.sort((x, y) => (x.id_anio_academico ?? 99) - (y.id_anio_academico ?? 99) || x.division.localeCompare(y.division));
    return { propuesta: propuestas[0], estados: estados.map(aEstado), cursos: await this.a.armarCursos(cursos) };
  }

  async get_propuesta(id: number): Promise<Propuesta> {
    const p = await this.a.propuestas.findOne({ where: { id_propuesta: id }, relations: { estado: true } });
    if (!p) throw noEncontrado(`No existe la propuesta ${id}`);
    return (await this.a.armarPropuestas([p]))[0];
  }

  /**
   * Genera la planilla: completa las horas que faltan en los cursos del ciclo de la propuesta
   * (o solo en `id_curso`) con las reglas de generacion.ts, y guarda cada cambio con
   * crear_clase + asignar_clase_a_propuesta (clases nuevas) o editar_clase (franjas sumadas a
   * una clase existente), así corren las validaciones de siempre. Si una regla rechaza un
   * cambio, sigue con el resto y devuelve el mensaje en `errores`.
   * Invoca: orientacion.get_materias, horarios.get_turnos, horarios.get_franjas_horarias,
   * profesor_suplencias.get_profesores (y lo que invocan crear_clase y editar_clase).
   */
  async generar_planilla(id: number, body: GenerarPlanillaDto): Promise<ResultadoGeneracion> {
    const p = await this.a.propuesta(id);
    if (p.estado!.codigo !== 'BOR') {
      throw conflicto(`La propuesta ${p.codigo} está ${p.estado!.nombre}: la planilla solo se genera en Borrador`);
    }
    const delCiclo = await this.a.cursos.findBy({ id_ciclo_lectivo: p.id_ciclo_lectivo });
    const lista = body?.id_curso != null ? delCiclo.filter((c) => c.id_curso === body.id_curso) : delCiclo;
    if (body?.id_curso != null && !lista.length) {
      throw referenciaInvalida(`El curso ${body.id_curso} no es del ciclo lectivo ${p.id_ciclo_lectivo} de la propuesta`);
    }
    const resultado: ResultadoGeneracion = { horas_ubicadas: 0, sin_ubicar: [], cambios: [], errores: [] };
    if (!lista.length) return resultado;

    // Datos: cursos con sus materias y las franjas de su turno, clases de la propuesta con sus
    // franjas y docentes, y profesores con habilitaciones y disponibilidad (ids, llamada plana).
    const idsCursos = lista.map((c) => c.id_curso);
    const idsClases = (await this.a.propuestaClases.findBy({ id_propuesta: id })).map((x) => x.id_clase);
    const [materiasCurso, anios, materias, turnos, franjas, profesores, clases, claseFr, clasePr] = await Promise.all([
      this.a.materiasCurso.findBy({ id_curso: In(idsCursos) }),
      this.a.anios.find(),
      this.a.materiasPorId(),
      this.a.turnosPorId(),
      this.a.franjasPorId(),
      this.a.profesores.listar<C.Profesor>('profesores'),
      idsClases.length ? this.a.clases.find({ where: { id_clase: In(idsClases) }, order: { id_clase: 'ASC' } }) : Promise.resolve([]),
      idsClases.length ? this.a.claseFranjas.findBy({ id_clase: In(idsClases) }) : Promise.resolve([]),
      idsClases.length ? this.a.claseProfesores.findBy({ id_clase: In(idsClases) }) : Promise.resolve([]),
    ]);
    const anioDe = new Map(anios.map((x) => [x.id_anio_academico, parseInt(x.anio_curricular, 10) || 0]));
    const nombreCurso = new Map(lista.map((c) => [c.id_curso, `${c.id_anio_academico != null ? anioDe.get(c.id_anio_academico) ?? 0 : 0}° ${c.division}`]));
    const nombreMateria = (mid: number) => materias.get(mid)?.nombre_materia ?? `Materia ${mid}`;

    const cursosGen: CursoGen[] = lista.map((c) => ({
      id: c.id_curso,
      nombre: nombreCurso.get(c.id_curso)!,
      horas: horasDelTurno((turnos.get(c.id_turno)?.franjas_horarias ?? []).map(aFranjaResumen)),
      plan: materiasCurso
        .filter((m) => m.id_curso === c.id_curso)
        .map((m) => ({ mid: m.id_materia, nombre: nombreMateria(m.id_materia), h: m.horas_semanales })),
    }));
    const previas = new Map<number, { franjas: number[]; profes: number[] }>();
    const clasesGen: ClaseGen[] = clases.map((c) => {
      const fr = claseFr.filter((x) => x.id_clase === c.id_clase).map((x) => x.id_franja_horaria).sort((x, y) => x - y);
      const pr = clasePr.filter((x) => x.id_clase === c.id_clase).map((x) => x.id_profesor);
      previas.set(c.id_clase, { franjas: fr, profes: pr });
      const bloques = fr
        .map((f) => franjas.get(f))
        .filter((f): f is C.FranjaHoraria => !!f)
        .map((f) => bloqueDeFranja(aFranjaResumen(f)))
        .filter((b): b is Bloque => !!b);
      return { id_curso: c.id_curso, id_materia: c.id_materia, bloques, profes: pr };
    });

    const r = generar({ cursos: cursosGen, clases: clasesGen, profesores });
    resultado.sin_ubicar = r.sinUbicar.map((x) => ({ id_curso: x.cid, id_materia: x.mid, curso: x.curso, materia: x.materia, horas: x.horas }));

    // Guardado: llamadas planas internas (sin anidar suplencias en cada clase), con la misma
    // caché del request para no volver a pedir franjas, turnos y profesores.
    await ejecutarConContexto({ anidados: false, cache: contexto().cache }, async () => {
      for (const ch of r.cambios) {
        const curso = nombreCurso.get(ch.cid)!;
        const materia = nombreMateria(ch.mid);
        const existente = clases.find((c) => c.id_curso === ch.cid && c.id_materia === ch.mid);
        try {
          if (existente) {
            const antes = previas.get(existente.id_clase)!;
            await this.clasesSrv.editar_clase(existente.id_clase, { ids_franjas_horarias: [...antes.franjas, ...ch.nuevas], ids_profesores: antes.profes });
            resultado.cambios.push({ id_clase: existente.id_clase, creada: false, ids_franjas_horarias_previas: antes.franjas, ids_profesores_previos: antes.profes });
          } else {
            const nueva = await this.clasesSrv.crear_clase({
              codigo: codigoClase(p.codigo, curso, materia),
              descripcion: `${materia} · ${curso}`,
              id_curso: ch.cid,
              id_materia: ch.mid,
              ids_franjas_horarias: ch.nuevas,
              ids_profesores: ch.profes,
            });
            try {
              await this.asignar_clase_a_propuesta(id, { id_clase: nueva.id_clase });
            } catch (e) {
              await this.clasesSrv.eliminar_clase(nueva.id_clase).catch(() => undefined);
              throw e;
            }
            resultado.cambios.push({ id_clase: nueva.id_clase, creada: true, ids_franjas_horarias_previas: [], ids_profesores_previos: [] });
          }
          resultado.horas_ubicadas += ch.nuevas.length;
        } catch (e) {
          if (!(e instanceof ErrorSahs) || e.getStatus() >= 500) throw e;
          const cuerpo = e.getResponse() as { mensaje?: string };
          resultado.errores.push(`${materia} en ${curso}: ${cuerpo.mensaje ?? e.message}`);
          // Lo que no se guardó vuelve a quedar sin ubicar.
          const pend = resultado.sin_ubicar.find((x) => x.id_curso === ch.cid && x.id_materia === ch.mid);
          if (pend) pend.horas += ch.nuevas.length;
          else resultado.sin_ubicar.push({ id_curso: ch.cid, id_materia: ch.mid, curso, materia, horas: ch.nuevas.length });
        }
      }
    });
    return resultado;
  }
}
