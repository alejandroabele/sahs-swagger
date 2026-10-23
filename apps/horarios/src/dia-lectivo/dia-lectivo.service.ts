import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { conflicto, noEncontrado } from '@sahs/comun';
import { DiaLectivoEntidad, FranjaHorariaEntidad } from '@sahs/entidades';
import type { DiaLectivo, FranjaHoraria } from '../dto/modelos';
import type { CrearDiaLectivoDto } from '../dto/entradas';
import { aDiaLectivo, aFranja, ordenFranjas, REL_FRANJA } from '../mapeo';

@Injectable()
export class DiaLectivoService {
  constructor(
    @InjectRepository(DiaLectivoEntidad) private readonly dias: Repository<DiaLectivoEntidad>,
    @InjectRepository(FranjaHorariaEntidad) private readonly franjas: Repository<FranjaHorariaEntidad>,
  ) {}

  private async dia(id: number) {
    const d = await this.dias.findOneBy({ id_dia_lectivo: id });
    if (!d) throw noEncontrado(`No existe el día lectivo ${id}`);
    return d;
  }

  async crear_dia_lectivo(body: CrearDiaLectivoDto): Promise<DiaLectivo> {
    const nombre = body.nombre_dia_lectivo.trim();
    if (await this.dias.findOneBy({ nombre_dia_lectivo: nombre })) throw conflicto(`Ya existe el día lectivo ${nombre}`);
    const orden = ((await this.dias.maximum('orden')) ?? 0) + 1;
    return aDiaLectivo(await this.dias.save({ nombre_dia_lectivo: nombre, orden }));
  }

  async eliminar_dia_lectivo(id: number): Promise<void> {
    const d = await this.dia(id);
    const n = await this.franjas.countBy({ id_dia_lectivo: id });
    if (n) throw conflicto(`El día ${d.nombre_dia_lectivo} tiene ${n} franjas horarias: primero hay que eliminarlas`);
    await this.dias.delete(id);
  }

  async get_dia_lectivo(id: number): Promise<DiaLectivo> {
    return aDiaLectivo(await this.dia(id));
  }

  async get_dias_lectivos(): Promise<DiaLectivo[]> {
    return (await this.dias.find({ order: { orden: 'ASC', id_dia_lectivo: 'ASC' } })).map(aDiaLectivo);
  }

  async get_franja_horaria_dia_lectivo(id: number): Promise<FranjaHoraria[]> {
    await this.dia(id);
    const l = await this.franjas.find({ where: { id_dia_lectivo: id }, relations: REL_FRANJA });
    return l.sort(ordenFranjas).map(aFranja);
  }
}
