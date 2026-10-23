import type { PrivilegioEntidad, RolEntidad, UsuarioEntidad } from '@sahs/entidades';
import type { Privilegio, Rol, Usuario } from './dto/modelos';

export const aRol = (r: RolEntidad): Rol => ({ id_rol: r.id_rol, nombre_rol: r.nombre_rol });

export const aPrivilegio = (p: PrivilegioEntidad): Privilegio => ({
  id_privilegio: p.id_privilegio,
  descripcion_privilegio: p.descripcion_privilegio,
});

/** Usuario con su rol anidado. Nunca incluye la contraseña. */
export const aUsuario = (u: UsuarioEntidad): Usuario => ({
  id_usuario: u.id_usuario,
  nombre_user: u.nombre_user,
  email: u.email,
  id_rol: u.id_rol as number,
  rol: u.rol ? aRol(u.rol) : undefined,
});
