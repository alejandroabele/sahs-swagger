import { Injectable } from '@nestjs/common';
import { conflicto } from '@sahs/comun';
import type { EstadoPropuesta } from '../dto/modelos';
import type { CrearEstadoPropuestaDto } from '../dto/entradas';
import { aEstado, Armado } from '../armado';

@Injectable()
export class EstadoDePropuestaService {
  constructor(private readonly a: Armado) {}

  async crear_estado_propuesta(body: CrearEstadoPropuestaDto): Promise<EstadoPropuesta> {
    const codigo = body.codigo.trim().toUpperCase();
    if (await this.a.estados.findOneBy({ codigo })) throw conflicto(`Ya existe el estado ${codigo}`);
    return aEstado(await this.a.estados.save({ nombre: body.nombre.trim(), codigo }));
  }

  async get_posibles_estados_de_propuestas(): Promise<EstadoPropuesta[]> {
    return (await this.a.estados.find({ order: { id_estado: 'ASC' } })).map(aEstado);
  }
}
