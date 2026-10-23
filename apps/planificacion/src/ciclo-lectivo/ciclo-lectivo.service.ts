import { Injectable } from '@nestjs/common';
import { conflicto, invalido } from '@sahs/comun';
import type { CicloLectivo } from '../dto/modelos';
import type { CrearCicloLectivoDto } from '../dto/entradas';
import { aCiclo, Armado } from '../armado';

@Injectable()
export class CicloLectivoService {
  constructor(private readonly a: Armado) {}

  async crear_ciclo_lectivo(body: CrearCicloLectivoDto): Promise<CicloLectivo> {
    if (body.anio_calendario < 2000 || body.anio_calendario > 2100) throw invalido('anio_calendario tiene que estar entre 2000 y 2100');
    if (await this.a.ciclos.findOneBy({ anio_calendario: body.anio_calendario })) throw conflicto(`Ya existe el ciclo lectivo ${body.anio_calendario}`);
    return aCiclo(await this.a.ciclos.save({ anio_calendario: body.anio_calendario }));
  }

  async get_ciclo_lectivo(id: number): Promise<CicloLectivo> {
    return aCiclo(await this.a.ciclo(id));
  }

  async get_ciclos_lectivos(): Promise<CicloLectivo[]> {
    return (await this.a.ciclos.find({ order: { anio_calendario: 'DESC' } })).map(aCiclo);
  }
}
