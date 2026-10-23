import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { conflicto, noEncontrado, referenciaInvalida } from '@sahs/comun';
import { PrivilegioEntidad, RolEntidad, UsuarioEntidad } from '@sahs/entidades';
import type { Privilegio, Rol } from '../dto/modelos';
import type { AsignarPrivilegioDto, CambiarNombreRolDto, CrearRolDto } from '../dto/entradas';
import { aPrivilegio, aRol } from '../mapeo';

@Injectable()
export class RolService {
  constructor(
    @InjectRepository(RolEntidad) private readonly roles: Repository<RolEntidad>,
    @InjectRepository(PrivilegioEntidad) private readonly privilegios: Repository<PrivilegioEntidad>,
    @InjectRepository(UsuarioEntidad) private readonly usuarios: Repository<UsuarioEntidad>,
  ) {}

  private async rol(id: number) {
    const r = await this.roles.findOne({ where: { id_rol: id }, relations: { privilegios: true } });
    if (!r) throw noEncontrado(`No existe el rol ${id}`);
    return r;
  }

  private async nombreLibre(nombre: string, salvo?: number) {
    const otro = await this.roles.createQueryBuilder('r').where('lower(r.nombre_rol) = lower(:n)', { n: nombre }).getOne();
    if (otro && otro.id_rol !== salvo) throw conflicto(`Ya existe el rol ${nombre}`);
  }

  async crear_rol(body: CrearRolDto): Promise<Rol> {
    const nombre = body.nombre_rol.trim();
    await this.nombreLibre(nombre);
    return aRol(await this.roles.save({ nombre_rol: nombre, privilegios: [] }));
  }

  async asignar_privilegio(id: number, body: AsignarPrivilegioDto): Promise<Rol> {
    const r = await this.rol(id);
    const p = await this.privilegios.findOneBy({ id_privilegio: body.id_privilegio });
    if (!p) throw referenciaInvalida(`No existe el privilegio ${body.id_privilegio}`);
    if (!r.privilegios.some((x) => x.id_privilegio === p.id_privilegio)) {
      await this.roles.createQueryBuilder().relation(RolEntidad, 'privilegios').of(id).add(p.id_privilegio);
    }
    return aRol(r);
  }

  async quitar_privilegio(id: number, idPrivilegio: number): Promise<Rol> {
    const r = await this.rol(id);
    if (!r.privilegios.some((x) => x.id_privilegio === idPrivilegio)) {
      throw noEncontrado(`El rol ${r.nombre_rol} no tiene el privilegio ${idPrivilegio}`);
    }
    await this.roles.createQueryBuilder().relation(RolEntidad, 'privilegios').of(id).remove(idPrivilegio);
    return aRol(r);
  }

  async eliminar_rol(id: number): Promise<void> {
    const r = await this.rol(id);
    const n = await this.usuarios.countBy({ id_rol: id });
    if (n) throw conflicto(`El rol ${r.nombre_rol} tiene ${n} ${n === 1 ? 'usuario' : 'usuarios'}: primero hay que asignarles otro rol`);
    await this.roles.remove(r);
  }

  async cambiar_nombre_rol(id: number, body: CambiarNombreRolDto): Promise<Rol> {
    const r = await this.rol(id);
    const nombre = body.nombre_rol.trim();
    await this.nombreLibre(nombre, id);
    r.nombre_rol = nombre;
    await this.roles.update(id, { nombre_rol: nombre });
    return aRol(r);
  }

  async get_roles(): Promise<Rol[]> {
    return (await this.roles.find({ order: { id_rol: 'ASC' } })).map(aRol);
  }

  async get_rol_privilegios(id: number): Promise<Privilegio[]> {
    const r = await this.rol(id);
    return r.privilegios.sort((a, b) => a.id_privilegio - b.id_privilegio).map(aPrivilegio);
  }
}
