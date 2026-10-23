import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { conflicto, noEncontrado, referenciaInvalida } from '@sahs/comun';
import { FranjaHorariaEntidad, TurnoEntidad } from '@sahs/entidades';
import type { Turno } from '../dto/modelos';
import type { AsignarFranjaATurnoDto, CrearTurnoDto } from '../dto/entradas';
import { aTurno, REL_TURNO } from '../mapeo';

@Injectable()
export class TurnoService {
  constructor(
    @InjectRepository(TurnoEntidad) private readonly turnos: Repository<TurnoEntidad>,
    @InjectRepository(FranjaHorariaEntidad) private readonly franjas: Repository<FranjaHorariaEntidad>,
  ) {}

  private async turno(id: number) {
    const t = await this.turnos.findOne({ where: { id_turno: id }, relations: REL_TURNO });
    if (!t) throw noEncontrado(`No existe el turno ${id}`);
    return t;
  }

  async crear_turno(body: CrearTurnoDto): Promise<Turno> {
    const nombre = body.nombre.trim();
    if (await this.turnos.findOneBy({ nombre })) throw conflicto(`Ya existe el turno ${nombre}`);
    const t = await this.turnos.save({ nombre, cantidad_franjas_total: body.cantidad_franjas_total, franjas_horarias: [] });
    return this.get_turno(t.id_turno);
  }

  async eliminar_turno(id: number): Promise<void> {
    const t = await this.turno(id);
    await this.turnos.remove(t);
  }

  async asignar_franja_a_turno(id: number, body: AsignarFranjaATurnoDto): Promise<Turno> {
    const t = await this.turno(id);
    const f = await this.franjas.findOneBy({ id_franja_horaria: body.id_franja_horaria });
    if (!f) throw referenciaInvalida(`No existe la franja horaria ${body.id_franja_horaria}`);
    if (!t.franjas_horarias.some((x) => x.id_franja_horaria === f.id_franja_horaria)) {
      await this.turnos.createQueryBuilder().relation(TurnoEntidad, 'franjas_horarias').of(id).add(f.id_franja_horaria);
    }
    return this.get_turno(id);
  }

  async eliminar_franja_horaria_turno(id: number, idFranjaHoraria: number): Promise<Turno> {
    const t = await this.turno(id);
    if (!t.franjas_horarias.some((x) => x.id_franja_horaria === idFranjaHoraria)) {
      throw noEncontrado(`La franja ${idFranjaHoraria} no pertenece al turno ${t.nombre}`);
    }
    await this.turnos.createQueryBuilder().relation(TurnoEntidad, 'franjas_horarias').of(id).remove(idFranjaHoraria);
    return this.get_turno(id);
  }

  async get_turno(id: number): Promise<Turno> {
    return aTurno(await this.turno(id));
  }

  async get_turnos(): Promise<Turno[]> {
    return (await this.turnos.find({ relations: REL_TURNO, order: { id_turno: 'ASC' } })).map(aTurno);
  }
}
