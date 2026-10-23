// Generado por tools/generar_cliente_web.mjs a partir del /docs-json del servicio. No editar a mano.
import type { AsignarPrivilegioBody, AsignarRolBody, CambiarContraseniaBody, CambiarNombreRolBody, CrearRolBody, CrearUsuarioBody, EditarUsuarioBody, LoginBody, LoginRespuesta, Privilegio, Rol, Usuario } from '@sahs/contratos';
import { pedir } from './http';

/** Servicio Usuario Service. */
export const usuario = {
  /** POST /usuario/login — Ingresar al sistema. Sin esquema de seguridad por ahora: el token se devuelve como texto simple. */
  login: (body: LoginBody) =>
    pedir<LoginRespuesta>(`/usuario/login`, { metodo: 'POST', body }),
  /** POST /usuario/crear_usuario — Crear usuario */
  crear_usuario: (body: CrearUsuarioBody) =>
    pedir<Usuario>(`/usuario/crear_usuario`, { metodo: 'POST', body }),
  /** PUT /usuario/asignar_rol/{id} — Asignar el rol del usuario (reemplaza el anterior) */
  asignar_rol: (id: number, body: AsignarRolBody) =>
    pedir<Usuario>(`/usuario/asignar_rol/${id}`, { metodo: 'PUT', body }),
  /** PUT /usuario/editar_usuario/{id} — Editar usuario (nombre de usuario y email). Reemplaza el nombre de usuario y el email. No cambia la contraseña (`cambiar_contrasenia`) ni el rol (`asignar_rol`). */
  editar_usuario: (id: number, body: EditarUsuarioBody) =>
    pedir<Usuario>(`/usuario/editar_usuario/${id}`, { metodo: 'PUT', body }),
  /** PATCH /usuario/cambiar_contrasenia/{id} — Cambiar contraseña */
  cambiar_contrasenia: (id: number, body: CambiarContraseniaBody) =>
    pedir<Usuario>(`/usuario/cambiar_contrasenia/${id}`, { metodo: 'PATCH', body }),
  /** DELETE /usuario/eliminar_usuario/{id} — Eliminar usuario */
  eliminar_usuario: (id: number) =>
    pedir<void>(`/usuario/eliminar_usuario/${id}`, { metodo: 'DELETE' }),
  /** GET /usuario/get_usuario/{id} — Obtener usuario (con su rol anidado) */
  get_usuario: (id: number) =>
    pedir<Usuario>(`/usuario/get_usuario/${id}`, { metodo: 'GET' }),
  /** GET /usuario/get_usuarios — Listar usuarios */
  get_usuarios: () =>
    pedir<Usuario[]>(`/usuario/get_usuarios`, { metodo: 'GET' }),
  /** POST /usuario/crear_rol — Crear rol */
  crear_rol: (body: CrearRolBody) =>
    pedir<Rol>(`/usuario/crear_rol`, { metodo: 'POST', body }),
  /** POST /usuario/asignar_privilegio/{id} — Asignar un privilegio al rol */
  asignar_privilegio: (id: number, body: AsignarPrivilegioBody) =>
    pedir<Rol>(`/usuario/asignar_privilegio/${id}`, { metodo: 'POST', body }),
  /** DELETE /usuario/quitar_privilegio/{id}/{id_privilegio} — Quitar un privilegio del rol */
  quitar_privilegio: (id: number, idPrivilegio: number) =>
    pedir<Rol>(`/usuario/quitar_privilegio/${id}/${idPrivilegio}`, { metodo: 'DELETE' }),
  /** DELETE /usuario/eliminar_rol/{id} — Eliminar rol */
  eliminar_rol: (id: number) =>
    pedir<void>(`/usuario/eliminar_rol/${id}`, { metodo: 'DELETE' }),
  /** PATCH /usuario/cambiar_nombre_rol/{id} — Cambiar nombre del rol */
  cambiar_nombre_rol: (id: number, body: CambiarNombreRolBody) =>
    pedir<Rol>(`/usuario/cambiar_nombre_rol/${id}`, { metodo: 'PATCH', body }),
  /** GET /usuario/get_roles — Listar roles */
  get_roles: () =>
    pedir<Rol[]>(`/usuario/get_roles`, { metodo: 'GET' }),
  /** GET /usuario/get_rol_privilegios/{id} — Privilegios del rol */
  get_rol_privilegios: (id: number) =>
    pedir<Privilegio[]>(`/usuario/get_rol_privilegios/${id}`, { metodo: 'GET' }),
  /** GET /usuario/get_privilegios — Listar privilegios */
  get_privilegios: () =>
    pedir<Privilegio[]>(`/usuario/get_privilegios`, { metodo: 'GET' }),
};
