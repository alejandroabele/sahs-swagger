import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { conflicto, referenciaInvalida } from '@sahs/comun';
import type * as C from '@sahs/contratos';
import { Armado, nombreFranja } from './armado';

/** Transiciones de estado permitidas entre los estados de catálogo. */
export const TRANSICIONES: Record<string, string[]> = {
  BOR: ['REV'],
  REV: ['VIG', 'BOR'],
  // Una Vigente pasa sola a Fue vigente cuando otra del ciclo pasa a Vigente.
  VIG: [],
  FVG: [],
};

export const NOMBRE_ESTADO: Record<string, string> = { BOR: 'Borrador', REV: 'En revisión', VIG: 'Vigente', FVG: 'Fue vigente' };

/** Reglas de negocio de las clases: franjas del turno, docentes habilitados y disponibles, choques. */
@Injectable()
export class Reglas {
  constructor(private readonly a: Armado) {}

  /**
   * Valida franjas y docentes de una clase del curso:
   * - las franjas existen, no son recreos y son del turno del curso;
   * - los docentes existen, están habilitados en la materia y declararon esas franjas
   *   como disponibles (Invoca: profesor_suplencias.get_disponibilidad_profesor).
   */
  async validarClase(idCurso: number, idMateria: number, idsFranjas: number[], idsProfesores: number[]) {
    const curso = await this.a.curso(idCurso);
    const dicta = await this.a.materiasCurso.findOneBy({ id_curso: idCurso, id_materia: idMateria });
    const materia = await this.a.orientacion.exigir<C.Materia>(`materias/${idMateria}`, `No existe la materia ${idMateria}`);
    if (!dicta) throw conflicto(`El curso no dicta ${materia.nombre_materia}`);
    if (!idsFranjas.length) throw conflicto('La clase tiene que tener al menos una franja');
    if (!idsProfesores.length) throw conflicto('La clase tiene que tener al menos un docente');

    const franjas = await this.a.franjasPorId();
    const turno = await this.a.horarios.exigir<C.Turno>(`turnos/${curso.id_turno}`, `No existe el turno ${curso.id_turno}`);
    const delTurno = new Set((turno.franjas_horarias ?? []).map((f) => f.id_franja_horaria));
    for (const id of idsFranjas) {
      const f = franjas.get(id);
      if (!f) throw referenciaInvalida(`No existe la franja horaria ${id}`);
      if (f.es_recreo) throw conflicto(`La franja ${nombreFranja(f)} es un recreo: no se puede ocupar`);
      if (!delTurno.has(id)) throw conflicto(`La franja ${nombreFranja(f)} no es del turno ${turno.nombre} del curso`);
    }
    const profes = await this.a.profesoresPorId();
    for (const idp of idsProfesores) {
      const p = profes.get(idp);
      if (!p) throw referenciaInvalida(`No existe el profesor ${idp}`);
      const nombre = `${p.nombre} ${p.apellido}`;
      if (p.activo === false) throw conflicto(`${nombre} está dado de baja: no se le pueden asignar clases`);
      if (!(p.lista_materias_habilitadas ?? []).some((m) => m.id_materia === idMateria)) {
        throw conflicto(`${nombre} no tiene habilitada la materia ${materia.nombre_materia}`);
      }
      const disp = await this.a.profesores.listar<C.FranjaHorariaResumen>(`profesores/${idp}/disponibilidad`);
      const libres = new Set(disp.map((d) => d.id_franja_horaria));
      for (const id of idsFranjas) {
        if (!libres.has(id)) throw conflicto(`${nombre} no está disponible el ${nombreFranja(franjas.get(id)!)}`);
      }
    }
  }

  /**
   * Choques dentro de una propuesta: el curso no puede tener dos clases en la misma franja
   * y un docente no puede estar en dos clases a la vez.
   */
  async validarChoques(idPropuesta: number, idClase: number, idCurso: number, idsFranjas: number[], idsProfesores: number[]) {
    const otras = (await this.a.propuestaClases.findBy({ id_propuesta: idPropuesta })).map((x) => x.id_clase).filter((x) => x !== idClase);
    if (!otras.length) return;
    const [clases, fr, pr] = await Promise.all([
      this.a.clases.findBy({ id_clase: In(otras) }),
      this.a.claseFranjas.findBy({ id_clase: In(otras), id_franja_horaria: In(idsFranjas) }),
      this.a.claseProfesores.findBy({ id_clase: In(otras) }),
    ]);
    if (!fr.length) return;
    const franjas = await this.a.franjasPorId();
    for (const f of fr) {
      const otra = clases.find((c) => c.id_clase === f.id_clase)!;
      const donde = franjas.get(f.id_franja_horaria);
      const cuando = donde ? nombreFranja(donde) : `franja ${f.id_franja_horaria}`;
      if (otra.id_curso === idCurso) throw conflicto(`El curso ya tiene la clase ${otra.codigo} el ${cuando}`);
      const comunes = pr.filter((p) => p.id_clase === otra.id_clase && idsProfesores.includes(p.id_profesor));
      if (comunes.length) {
        const profes = await this.a.profesoresPorId();
        const p = profes.get(comunes[0].id_profesor);
        throw conflicto(`${p ? p.nombre + ' ' + p.apellido : 'El docente'} ya tiene la clase ${otra.codigo} el ${cuando}`);
      }
    }
  }

  /**
   * Dentro de la propuesta, las franjas de las clases de una materia en un curso no superan
   * sus horas semanales en el curso. `franjas` es la cantidad de franjas de la clase `idClase`.
   */
  async validarHorasMateria(idPropuesta: number, idClase: number, idCurso: number, idMateria: number, franjas: number) {
    const dicta = await this.a.materiasCurso.findOneBy({ id_curso: idCurso, id_materia: idMateria });
    if (!dicta) return;
    const otras = (await this.a.propuestaClases.findBy({ id_propuesta: idPropuesta })).map((x) => x.id_clase).filter((x) => x !== idClase);
    const mismas = otras.length
      ? await this.a.clases.find({ where: { id_clase: In(otras), id_curso: idCurso, id_materia: idMateria }, relations: { franjas: true } })
      : [];
    const puestas = mismas.reduce((n, c) => n + (c.franjas?.length ?? 0), 0);
    if (puestas + franjas > dicta.horas_semanales) {
      const curso = await this.a.curso(idCurso);
      const anio = curso.id_anio_academico != null ? (await this.a.anios.findOneBy({ id_anio_academico: curso.id_anio_academico }))?.anio_curricular : null;
      const nombreCurso = ((anio ? anio + ' ' : '') + curso.division).replace(/ año/, '').trim();
      const materia = await this.a.orientacion.exigir<C.Materia>(`materias/${idMateria}`, `No existe la materia ${idMateria}`);
      throw conflicto(
        `${materia.nombre_materia} en ${nombreCurso} ya tiene ${puestas} de ${dicta.horas_semanales} h: la clase suma ${franjas} más`,
      );
    }
  }

  /** Una clase solo se modifica si todas las propuestas que la incluyen están en Borrador. */
  async exigirEditable(idClase: number) {
    const pcs = await this.a.propuestaClases.find({ where: { id_clase: idClase }, relations: { propuesta: { estado: true } } });
    const bloqueada = pcs.find((x) => x.propuesta?.estado?.codigo !== 'BOR');
    if (bloqueada) {
      throw conflicto(`La clase es de la propuesta ${bloqueada.propuesta?.codigo} (${bloqueada.propuesta?.estado?.nombre}): solo se edita en Borrador`);
    }
    return pcs.map((x) => x.id_propuesta);
  }
}
