import { Injectable } from '@nestjs/common';
import { conflicto, referenciaInvalida } from '@sahs/comun';
import type { AnioAcademico, Curso } from '../dto/modelos';
import type { AsignarCursoAAnioAcademicoDto, CrearAnioAcademicoDto } from '../dto/entradas';
import { aAnio, Armado } from '../armado';

@Injectable()
export class AnioAcademicoService {
  constructor(private readonly a: Armado) {}

  async crear_anio_academico(body: CrearAnioAcademicoDto): Promise<AnioAcademico> {
    const codigo = body.codigo.trim().toUpperCase();
    if (await this.a.anios.findOneBy({ codigo })) throw conflicto(`Ya existe el año académico ${codigo}`);
    return aAnio(await this.a.anios.save({ anio_curricular: body.anio_curricular.trim(), codigo }));
  }

  async asignar_curso_a_anio_academico(id: number, body: AsignarCursoAAnioAcademicoDto): Promise<Curso> {
    await this.a.anio(id);
    const c = await this.a.cursos.findOneBy({ id_curso: body.id_curso });
    if (!c) throw referenciaInvalida(`No existe el curso ${body.id_curso}`);
    await this.a.cursos.update(c.id_curso, { id_anio_academico: id });
    return this.a.armarCurso(await this.a.curso(c.id_curso));
  }

  async get_anio_academico(id: number): Promise<AnioAcademico> {
    return aAnio(await this.a.anio(id));
  }

  async get_anios_academicos(): Promise<AnioAcademico[]> {
    return (await this.a.anios.find({ order: { id_anio_academico: 'ASC' } })).map(aAnio);
  }

  async get_cursos_anio_academico(id: number): Promise<Curso[]> {
    await this.a.anio(id);
    return this.a.armarCursos(await this.a.cursos.find({ where: { id_anio_academico: id }, order: { id_ciclo_lectivo: 'DESC', division: 'ASC' } }));
  }
}
