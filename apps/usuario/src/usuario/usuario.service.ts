import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { conflicto, invalido, noEncontrado, referenciaInvalida } from '@sahs/comun';
import { RolEntidad, UsuarioEntidad } from '@sahs/entidades';
import type { Usuario } from '../dto/modelos';
import type { AsignarRolDto, CambiarContraseniaDto, CrearUsuarioDto, EditarUsuarioDto } from '../dto/entradas';
import { aUsuario } from '../mapeo';

export const MIN_CONTRASENIA = 6;

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(UsuarioEntidad) private readonly usuarios: Repository<UsuarioEntidad>,
    @InjectRepository(RolEntidad) private readonly roles: Repository<RolEntidad>,
  ) {}

  private async usuario(id: number) {
    const u = await this.usuarios.findOne({ where: { id_usuario: id }, relations: { rol: true } });
    if (!u) throw noEncontrado(`No existe el usuario ${id}`);
    return u;
  }

  private async exigirRol(id: number) {
    if (!(await this.roles.findOneBy({ id_rol: id }))) throw referenciaInvalida(`No existe el rol ${id}`);
  }

  /** El nombre de usuario y el email no se pueden repetir (sin distinguir mayúsculas). */
  private async libres(nombre: string, email: string, salvo?: number) {
    const otro = await this.usuarios
      .createQueryBuilder('u')
      .where('(lower(u.nombre_user) = lower(:n) OR lower(u.email) = lower(:e))', { n: nombre, e: email })
      .getOne();
    if (otro && otro.id_usuario !== salvo) {
      throw conflicto(otro.nombre_user.toLowerCase() === nombre.toLowerCase() ? `Ya existe el usuario ${nombre}` : `Ya hay un usuario con el email ${email}`);
    }
  }

  private validarContrasenia(c: string) {
    if (c.length < MIN_CONTRASENIA) throw invalido(`La contraseña tiene que tener al menos ${MIN_CONTRASENIA} caracteres`);
  }

  async crear_usuario(body: CrearUsuarioDto): Promise<Usuario> {
    const nombre = body.nombre_user.trim();
    const email = body.email.trim().toLowerCase();
    if (/\s/.test(nombre)) throw invalido('El nombre de usuario no puede tener espacios');
    this.validarContrasenia(body.contrasenia);
    await this.libres(nombre, email);
    if (body.id_rol != null) await this.exigirRol(body.id_rol);
    const u = await this.usuarios.save({
      nombre_user: nombre,
      email,
      id_rol: body.id_rol ?? null,
      contrasenia: await bcrypt.hash(body.contrasenia, 10),
    });
    return this.get_usuario(u.id_usuario);
  }

  async asignar_rol(id: number, body: AsignarRolDto): Promise<Usuario> {
    await this.usuario(id);
    await this.exigirRol(body.id_rol);
    await this.usuarios.update(id, { id_rol: body.id_rol });
    return this.get_usuario(id);
  }

  async editar_usuario(id: number, body: EditarUsuarioDto): Promise<Usuario> {
    await this.usuario(id);
    const nombre = body.nombre_user.trim();
    const email = body.email.trim().toLowerCase();
    if (/\s/.test(nombre)) throw invalido('El nombre de usuario no puede tener espacios');
    await this.libres(nombre, email, id);
    await this.usuarios.update(id, { nombre_user: nombre, email });
    return this.get_usuario(id);
  }

  async cambiar_contrasenia(id: number, body: CambiarContraseniaDto): Promise<Usuario> {
    await this.usuario(id);
    this.validarContrasenia(body.contrasenia);
    await this.usuarios.update(id, { contrasenia: await bcrypt.hash(body.contrasenia, 10) });
    return this.get_usuario(id);
  }

  async eliminar_usuario(id: number): Promise<void> {
    await this.usuario(id);
    await this.usuarios.delete(id);
  }

  async get_usuario(id: number): Promise<Usuario> {
    return aUsuario(await this.usuario(id));
  }

  async get_usuarios(): Promise<Usuario[]> {
    return (await this.usuarios.find({ relations: { rol: true }, order: { id_usuario: 'ASC' } })).map(aUsuario);
  }
}
