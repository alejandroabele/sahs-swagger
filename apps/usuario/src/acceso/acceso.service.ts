import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { invalido } from '@sahs/comun';
import { UsuarioEntidad } from '@sahs/entidades';
import type { LoginRespuesta } from '../dto/modelos';
import type { LoginDto } from '../dto/entradas';
import { aUsuario } from '../mapeo';

const MENSAJE = 'Usuario o contraseña incorrectos';

@Injectable()
export class AccesoService {
  constructor(@InjectRepository(UsuarioEntidad) private readonly usuarios: Repository<UsuarioEntidad>) {}

  /**
   * Busca por email o por nombre de usuario (sin distinguir mayúsculas) y compara la
   * contraseña con bcrypt. El token es un JWT con el id del usuario; la API todavía no lo valida.
   */
  async login(body: LoginDto): Promise<LoginRespuesta> {
    const texto = body.email.trim().toLowerCase();
    const u = await this.usuarios
      .createQueryBuilder('u')
      .addSelect('u.contrasenia')
      .leftJoinAndSelect('u.rol', 'rol')
      .where('lower(u.email) = :t OR lower(u.nombre_user) = :t', { t: texto })
      .getOne();
    if (!u || !(await bcrypt.compare(body.contrasenia, u.contrasenia))) throw invalido(MENSAJE);
    const token = jwt.sign({ id_usuario: u.id_usuario, nombre_user: u.nombre_user }, process.env.JWT_SECRET || 'sahs-desarrollo', {
      expiresIn: '12h',
      subject: String(u.id_usuario),
    });
    return { token, usuario: aUsuario(u) };
  }
}
