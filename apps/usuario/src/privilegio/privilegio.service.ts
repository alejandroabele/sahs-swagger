import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrivilegioEntidad } from '@sahs/entidades';
import type { Privilegio } from '../dto/modelos';
import { aPrivilegio } from '../mapeo';

@Injectable()
export class PrivilegioService {
  constructor(@InjectRepository(PrivilegioEntidad) private readonly privilegios: Repository<PrivilegioEntidad>) {}

  /** Los privilegios se cargan por configuración (seeds): solo se consultan. */
  async get_privilegios(): Promise<Privilegio[]> {
    return (await this.privilegios.find({ order: { id_privilegio: 'ASC' } })).map(aPrivilegio);
  }
}
