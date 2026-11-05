import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { invalido, noEncontrado, referenciaInvalida } from '@sahs/comun';
import { DiaLectivoEntidad, FranjaHorariaEntidad } from '@sahs/entidades';
import type { FranjaHoraria } from '../dto/modelos';
import type { CrearFranjaHorariaDto } from '../dto/entradas';
import { aFranja, ordenFranjas, REL_FRANJA } from '../mapeo';

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const minutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

@Injectable()
export class FranjaHorariaService {
  constructor(
    @InjectRepository(FranjaHorariaEntidad) private readonly franjas: Repository<FranjaHorariaEntidad>,
    @InjectRepository(DiaLectivoEntidad) private readonly dias: Repository<DiaLectivoEntidad>,
  ) {}

  async crear_franja_horaria(body: CrearFranjaHorariaDto): Promise<FranjaHoraria> {
    if (!HORA.test(body.hora_inicio) || !HORA.test(body.hora_fin)) throw invalido('Las horas van en formato HH:MM, de 00:00 a 23:59', 'RN-10');
    if (body.hora_inicio >= body.hora_fin) throw invalido('La hora de inicio tiene que ser anterior a la de fin', 'RN-16');
    if (minutos(body.hora_fin) - minutos(body.hora_inicio) < 10) throw invalido('La franja tiene que durar al menos 10 minutos', 'RN-19');
    if (!(await this.dias.findOneBy({ id_dia_lectivo: body.id_dia_lectivo }))) {
      throw referenciaInvalida(`No existe el día lectivo ${body.id_dia_lectivo}`);
    }
    const f = await this.franjas.save({
      hora_inicio: body.hora_inicio,
      hora_fin: body.hora_fin,
      descripcion: body.descripcion ?? null,
      es_recreo: body.es_recreo,
      id_dia_lectivo: body.id_dia_lectivo,
    });
    return this.get_franja_horaria(f.id_franja_horaria);
  }

  async get_franja_horaria(id: number): Promise<FranjaHoraria> {
    const f = await this.franjas.findOne({ where: { id_franja_horaria: id }, relations: REL_FRANJA });
    if (!f) throw noEncontrado(`No existe la franja horaria ${id}`);
    return aFranja(f);
  }

  async get_franjas_horarias(): Promise<FranjaHoraria[]> {
    return (await this.franjas.find({ relations: REL_FRANJA })).sort(ordenFranjas).map(aFranja);
  }
}
