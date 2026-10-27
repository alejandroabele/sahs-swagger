// Generado por tools/generar_cliente_web.mjs a partir del /docs-json del servicio. No editar a mano.
import type { AsignarPrivilegioBody, AsignarRolBody, CambiarContraseniaBody, CambiarNombreRolBody, CrearRolBody, CrearUsuarioBody, EditarUsuarioBody, LoginBody, LoginRespuesta, Privilegio, Rol, Usuario } from '@sahs/contratos';
import { pedir } from './http';

/** Servicio Usuario Service. */
export const usuario = {
  /** POST /usuario/login — Ingresar al sistema. Sin esquema de seguridad por ahora: el token se devuelve como texto simple. */
  login: (body: LoginBody) =>
    pedir<LoginRespuesta>(`/usuario/login`, { metodo: 'POST', body }),
  /** POST /usuario/usuarios — Crear usuario */
  crear_usuario: (body: CrearUsuarioBody) =>
    pedir<Usuario>(`/usuario/usuarios`, { metodo: 'POST', body }),
  /** GET /usuario/usuarios — Listar usuarios */
  get_usuarios: () =>
    pedir<Usuario[]>(`/usuario/usuarios`, { metodo: 'GET' }),
  /** PUT /usuario/usuarios/{id}/rol — Asignar el rol del usuario (reemplaza el anterior) */
  asignar_rol: (id: number, body: AsignarRolBody) =>
    pedir<Usuario>(`/usuario/usuarios/${id}/rol`, { metodo: 'PUT', body }),
  /** PUT /usuario/usuarios/{id} — Editar usuario (nombre de usuario y email). Reemplaza el nombre de usuario y el email. No cambia la contraseña (`cambiar_contrasenia`) ni el rol (`asignar_rol`). */
  editar_usuario: (id: number, body: EditarUsuarioBody) =>
    pedir<Usuario>(`/usuario/usuarios/${id}`, { metodo: 'PUT', body }),
  /** DELETE /usuario/usuarios/{id} — Eliminar usuario */
  eliminar_usuario: (id: number) =>
    pedir<void>(`/usuario/usuarios/${id}`, { metodo: 'DELETE' }),
  /** GET /usuario/usuarios/{id} — Obtener usuario (con su rol anidado) */
  get_usuario: (id: number) =>
    pedir<Usuario>(`/usuario/usuarios/${id}`, { metodo: 'GET' }),
  /** PATCH /usuario/usuarios/{id}/contrasenia — Cambiar contraseña */
  cambiar_contrasenia: (id: number, body: CambiarContraseniaBody) =>
    pedir<Usuario>(`/usuario/usuarios/${id}/contrasenia`, { metodo: 'PATCH', body }),
  /** POST /usuario/roles — Crear rol */
  crear_rol: (body: CrearRolBody) =>
    pedir<Rol>(`/usuario/roles`, { metodo: 'POST', body }),
  /** GET /usuario/roles — Listar roles */
  get_roles: () =>
    pedir<Rol[]>(`/usuario/roles`, { metodo: 'GET' }),
  /** POST /usuario/roles/{id}/privilegios — Asignar un privilegio al rol */
  asignar_privilegio: (id: number, body: AsignarPrivilegioBody) =>
    pedir<Rol>(`/usuario/roles/${id}/privilegios`, { metodo: 'POST', body }),
  /** GET /usuario/roles/{id}/privilegios — Privilegios del rol */
  get_rol_privilegios: (id: number) =>
    pedir<Privilegio[]>(`/usuario/roles/${id}/privilegios`, { metodo: 'GET' }),
  /** DELETE /usuario/roles/{id}/privilegios/{id_privilegio} — Quitar un privilegio del rol */
  quitar_privilegio: (id: number, idPrivilegio: number) =>
    pedir<Rol>(`/usuario/roles/${id}/privilegios/${idPrivilegio}`, { metodo: 'DELETE' }),
  /** DELETE /usuario/roles/{id} — Eliminar rol */
  eliminar_rol: (id: number) =>
    pedir<void>(`/usuario/roles/${id}`, { metodo: 'DELETE' }),
  /** PATCH /usuario/roles/{id} — Cambiar nombre del rol */
  cambiar_nombre_rol: (id: number, body: CambiarNombreRolBody) =>
    pedir<Rol>(`/usuario/roles/${id}`, { metodo: 'PATCH', body }),
  /** GET /usuario/privilegios — Listar privilegios */
  get_privilegios: () =>
    pedir<Privilegio[]>(`/usuario/privilegios`, { metodo: 'GET' }),
};
