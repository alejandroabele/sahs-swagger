import { Injectable } from '@nestjs/common';
import { conflicto } from '@sahs/comun';
import type { EstadoPlanificacion } from '../dto/modelos';
import type { CrearEstadoPlanificacionDto } from '../dto/entradas';
import { aEstado, Armado } from '../armado';

@Injectable()
export class EstadoDePlanificacionService {
  constructor(private readonly a: Armado) {}

  async crear_estado_planificacion(body: CrearEstadoPlanificacionDto): Promise<EstadoPlanificacion> {
    const codigo = body.codigo.trim().toUpperCase();
    if (await this.a.estados.findOneBy({ codigo })) throw conflicto(`Ya existe el estado ${codigo}`);
    return aEstado(await this.a.estados.save({ nombre: body.nombre.trim(), codigo }));
  }

  async get_posibles_estados_de_planificaciones(): Promise<EstadoPlanificacion[]> {
    return (await this.a.estados.find({ order: { id_estado: 'ASC' } })).map(aEstado);
  }
}
