// A17 · Usuarios y roles. Prototipo: <template id="tpl-usuarios"> y DC.registrar("usuarios") en prototipo/index.html.
// Pestaña Usuarios: get_usuarios, crear_usuario, editar_usuario, asignar_rol, cambiar_contrasenia (resetear), eliminar_usuario.
// Pestaña Roles: get_roles, get_privilegios, get_rol_privilegios (uno por rol), crear_rol, cambiar_nombre_rol,
// eliminar_rol (409 si tiene usuarios), asignar_privilegio / quitar_privilegio.
// Los commands invalidan el servicio 'usuario', así que la sesión (['usuario','get_rol_privilegios', id_rol])
// y el menú de inicio (A1) se actualizan sin recargar.
import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { Privilegio, Usuario } from '@sahs/contratos';
import { usuario as api } from '../api';
import { useIr } from '../app/navegar';
import { rutas } from '../app/rutas';
import { useLocation } from 'react-router-dom';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useAccion, useConsulta } from '../estado/consultas';
import { useSesion } from '../estado/sesion';
import { css } from '../lib/css';
import './a17/responsive.css';

const ACCENT = '#2f5fd0';
/** Privilegio «Usuarios»: si se lo quita al propio rol, se pierde el acceso a esta pantalla. */
const ID_PRIV_USUARIOS = 9;
/** Largo mínimo de contraseña que pide el diseño (la API acepta desde 6). */
const MIN_CLAVE = 8;

const CAMPO = 'height: 38px; padding: 0 12px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; background: #fcfdfe; color: #14181f;';
const COLS = 'display: grid; grid-template-columns: 220px minmax(0, 1fr) 190px 320px; gap: 12px;';
const ERROR_CAJA = 'font-size: 12.5px; color: #a63244; background: #fbf1f2; border: 1px solid #f1d3d8; border-radius: 8px; padding: 10px 12px; line-height: 1.45;';
const AVISO_CAJA = 'font-size: 12.5px; color: #245239; background: #eef6f0; border: 1px solid #cfe5d6; border-radius: 8px; padding: 10px 12px; line-height: 1.45;';
const RE_NOMBRE = /^[a-z0-9._]{3,}$/;
const RE_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function estiloTab(activa: boolean) {
  return (
    'display: flex; align-items: center; gap: 8px; height: 42px; padding: 0 16px; border: none;' +
    ' background: none; font-size: 13.5px; font-weight: 600; margin-bottom: -1px;' +
    ' border-bottom: 2px solid ' + (activa ? ACCENT : 'transparent') + ';' +
    ' color: ' + (activa ? '#14181f' : '#6b7482') + ';'
  );
}

function estiloCant(activa: boolean) {
  return 'font-size: 11px; font-weight: 600; padding: 1px 7px; border-radius: 9px;' + (activa ? ' background: ' + ACCENT + '; color: #fff;' : ' background: #f2f4f7; color: #6b7482;');
}

function estiloCaja(marcada: boolean) {
  return (
    'width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0; display: flex;' +
    ' align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff;' +
    ' border: 1.5px solid ' + (marcada ? ACCENT : '#c3cad4') + ';' +
    ' background: ' + (marcada ? ACCENT : '#fff') + ';'
  );
}

export default function A17Usuarios() {
  const ir = useIr();
  const sesion = useSesion();
  // La pestaña sale de la ruta: /usuarios o /roles.
  const tab: 'usuarios' | 'roles' = useLocation().pathname === rutas.roles() ? 'roles' : 'usuarios';

  const qUsuarios = useConsulta(['usuario', 'get_usuarios'], () => api.get_usuarios());
  const qRoles = useConsulta(['usuario', 'get_roles'], () => api.get_roles());
  const qPrivilegios = useConsulta(['usuario', 'get_privilegios'], () => api.get_privilegios());
  const roles = qRoles.data ?? [];
  // No hay una operación que traiga los privilegios de todos los roles: se pide get_rol_privilegios por rol.
  // La clave es la misma que usa la sesión, así que comparten caché.
  const qPrivRoles = useQueries({
    queries: roles.map((r) => ({
      queryKey: ['usuario', 'get_rol_privilegios', r.id_rol],
      queryFn: () => api.get_rol_privilegios(r.id_rol),
    })),
  });
  const privDeRol = (id: number): Privilegio[] => {
    const i = roles.findIndex((r) => r.id_rol === id);
    return i >= 0 ? (qPrivRoles[i]?.data ?? []) : [];
  };

  const usuarios = qUsuarios.data ?? [];
  const cargando = qUsuarios.isLoading || qRoles.isLoading || qPrivilegios.isLoading;
  const errorCarga = qUsuarios.error?.message || qRoles.error?.message || qPrivilegios.error?.message;

  return (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div className="r-margen r-envolver a17-banda" style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 0; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px; padding-bottom: 16px;')}>
          <div className="r-envolver a17-migas" style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir(rutas.inicio())} style={css('cursor: pointer;')}>
              Inicio
            </span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span style={css('color: #14181f; font-weight: 500;')}>Usuarios</span>
          </div>
          <div className="r-titulo" style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Usuarios y roles</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <div style={css('display: flex; gap: 4px;')}>
          <button onClick={() => ir(rutas.usuarios())} style={css(estiloTab(tab === 'usuarios'))}>
            Usuarios <span style={css(estiloCant(tab === 'usuarios'))}>{usuarios.length}</span>
          </button>
          <button onClick={() => ir(rutas.roles())} style={css(estiloTab(tab === 'roles'))}>
            Roles <span style={css(estiloCant(tab === 'roles'))}>{roles.length}</span>
          </button>
        </div>
      </div>

      {cargando ? (
        <Cargando />
      ) : errorCarga ? (
        <div className="r-margen" style={css('padding: 20px 28px;')}>
          <MensajeError mensaje={errorCarga} />
        </div>
      ) : tab === 'usuarios' ? (
        <PestaniaUsuarios usuarios={usuarios} roles={roles} idSesion={sesion.usuario?.id_usuario ?? null} />
      ) : (
        <PestaniaRoles
          usuarios={usuarios}
          roles={roles}
          catalogo={qPrivilegios.data ?? []}
          privDeRol={privDeRol}
          miRol={sesion.usuario?.id_rol ?? null}
        />
      )}
    </div>
  );
}

/* ===================== pestaña Usuarios ===================== */

function PestaniaUsuarios({ usuarios, roles, idSesion }: { usuarios: Usuario[]; roles: { id_rol: number; nombre_rol: string }[]; idSesion: number | null }) {
  const [busca, setBusca] = useState('');
  const [n, setN] = useState({ nombre: '', email: '', clave: '', rol: '' });
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [borrar, setBorrar] = useState<number | null>(null);
  // Panel lateral: alta (por defecto), reseteo de contraseña o edición de nombre y email.
  const [reset, setReset] = useState<number | null>(null);
  const [r, setR] = useState({ clave1: '', clave2: '', error: null as string | null });
  const [editar, setEditar] = useState<number | null>(null);
  const [e, setE] = useState({ nombre: '', email: '', error: null as string | null });

  const crear = useAccion((b: Parameters<typeof api.crear_usuario>[0]) => api.crear_usuario(b), ['usuario']);
  const asignarRol = useAccion((id: number, id_rol: number) => api.asignar_rol(id, { id_rol }), ['usuario']);
  const eliminar = useAccion(async (id: number) => (await api.eliminar_usuario(id), true), ['usuario']);
  const cambiarClave = useAccion((id: number, contrasenia: string) => api.cambiar_contrasenia(id, { contrasenia }), ['usuario']);
  const editarU = useAccion((id: number, nombre_user: string, email: string) => api.editar_usuario(id, { nombre_user, email }), ['usuario']);

  const q = busca.trim().toLowerCase();
  const lista = usuarios.filter((u) => !q || u.nombre_user.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  const opciones = roles.map((x) => ({ valor: String(x.id_rol), label: x.nombre_rol }));
  const resetU = reset != null ? (usuarios.find((u) => u.id_usuario === reset) ?? null) : null;
  const editU = editar != null ? (usuarios.find((u) => u.id_usuario === editar) ?? null) : null;

  const limpiarAvisos = () => {
    setError(null);
    setAviso(null);
  };

  const crearUsuario = async () => {
    const nombre = n.nombre.trim().toLowerCase();
    const email = n.email.trim().toLowerCase();
    if (!RE_NOMBRE.test(nombre)) return setError('El nombre de usuario lleva al menos 3 caracteres: letras minúsculas, números, punto o guion bajo.');
    if (usuarios.some((u) => u.nombre_user === nombre)) return setError('Ya existe un usuario «' + nombre + '».');
    if (!RE_EMAIL.test(email)) return setError('Escribí un email válido.');
    if (usuarios.some((u) => u.email.toLowerCase() === email)) return setError('El email ' + email + ' ya está registrado.');
    if (n.clave.length < MIN_CLAVE) return setError(`La contraseña provisoria tiene que tener al menos ${MIN_CLAVE} caracteres.`);
    limpiarAvisos();
    const rol = n.rol === '' ? null : roles.find((x) => String(x.id_rol) === n.rol);
    const hecho = await crear.ejecutar({ nombre_user: nombre, email, contrasenia: n.clave, ...(rol ? { id_rol: rol.id_rol } : {}) });
    if (!hecho) return;
    setN({ nombre: '', email: '', clave: '', rol: '' });
    setAviso('Se dio de alta el usuario ' + nombre + (rol ? ' con el rol ' + rol.nombre_rol + '.' : ' sin rol.'));
  };

  const guardarReset = async () => {
    if (reset == null) return;
    if (r.clave1.length < MIN_CLAVE) return setR({ ...r, error: `La contraseña provisoria tiene que tener al menos ${MIN_CLAVE} caracteres.` });
    if (r.clave1 !== r.clave2) return setR({ ...r, error: 'Las dos contraseñas no coinciden.' });
    const hecho = await cambiarClave.ejecutar(reset, r.clave1);
    if (!hecho) return;
    setReset(null);
    setR({ clave1: '', clave2: '', error: null });
    setAviso('Se reseteó la contraseña de ' + (resetU?.nombre_user ?? '') + '.');
  };

  const guardarEdicion = async () => {
    if (editar == null) return;
    const nombre = e.nombre.trim().toLowerCase();
    const email = e.email.trim().toLowerCase();
    if (!RE_NOMBRE.test(nombre)) return setE({ ...e, error: 'El nombre de usuario lleva al menos 3 caracteres: letras minúsculas, números, punto o guion bajo.' });
    if (usuarios.some((u) => u.id_usuario !== editar && u.nombre_user === nombre)) return setE({ ...e, error: 'Ya existe un usuario «' + nombre + '».' });
    if (!RE_EMAIL.test(email)) return setE({ ...e, error: 'Escribí un email válido.' });
    if (usuarios.some((u) => u.id_usuario !== editar && u.email.toLowerCase() === email)) return setE({ ...e, error: 'El email ' + email + ' ya está registrado.' });
    const hecho = await editarU.ejecutar(editar, nombre, email);
    if (!hecho) return;
    setEditar(null);
    setAviso('Se guardaron los datos de ' + nombre + '.');
  };

  const errorAlta = error || crear.error || asignarRol.error || eliminar.error;

  return (
    <div className="r-margen r-una-columna" style={css('padding: 20px 28px 28px; display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 20px; align-items: start;')}>
      <div style={css('display: flex; flex-direction: column; gap: 16px;')}>
        <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
          <div className="r-envolver" style={css('display: flex; align-items: center; gap: 14px; padding: 13px 20px; border-bottom: 1px solid #eef1f5;')}>
            <span style={css('font-size: 13px; font-weight: 600;')}>Usuarios registrados</span>
            <span style={css('font-size: 12px; color: #6b7482;')}>{usuarios.length === 1 ? '1 usuario' : usuarios.length + ' usuarios'}</span>
            <div style={css('flex-grow: 1;')}></div>
            <input
              value={busca}
              onChange={(ev) => setBusca(ev.target.value)}
              placeholder="Buscar por usuario o email"
              className="r-ancho-movil"
              style={css('height: 34px; width: 260px; padding: 0 12px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 12.5px; background: #fcfdfe;')}
            />
          </div>
          {/* La tabla se desplaza horizontalmente dentro de la tarjeta cuando no entra. */}
          <div className="r-desplazar">
            <div className="a17-tabla">
              <div style={css(COLS + ' padding: 10px 20px; background: #fafbfc; border-bottom: 1px solid #eef1f5;')}>
                <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Usuario</div>
                <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Email</div>
                <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Rol</div>
                <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393; text-align: right;')}>Acciones</div>
              </div>
              {lista.map((u, i) => {
                const esVos = u.id_usuario === idSesion;
                const confirmando = borrar === u.id_usuario;
                const marcado = reset === u.id_usuario || editar === u.id_usuario;
                const tieneRol = roles.some((x) => x.id_rol === u.id_rol);
                const ops = tieneRol ? opciones : [{ valor: String(u.id_rol ?? ''), label: 'Sin rol' }, ...opciones];
                const btnPanel = (activo: boolean) =>
                  'height: 30px; padding: 0 11px; border-radius: 7px; font-size: 11.5px; font-weight: 600; white-space: nowrap;' +
                  ' border: 1px solid ' + (activo ? ACCENT : '#dfe4ea') + '; background: ' + (activo ? '#f3f6fc' : '#fff') + ';' +
                  ' color: ' + (activo ? ACCENT : '#4a5462') + ';';
                return (
                  <div
                    key={u.id_usuario}
                    style={css(
                      COLS +
                        ' padding: 11px 20px; align-items: center;' +
                        (i === 0 ? '' : ' border-top: 1px solid #f2f4f7;') +
                        (confirmando ? ' background: #fbf1f2;' : marcado ? ' background: #f3f6fc; box-shadow: inset 3px 0 0 ' + ACCENT + ';' : ''),
                    )}
                  >
                    <span style={css('display: flex; align-items: center; gap: 8px; min-width: 0;')}>
                      <span className="mono" style={css('font-size: 13px; font-weight: 600;')}>{u.nombre_user}</span>
                      {esVos && (
                        <span style={css('font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 9px; background: #14181f; color: #fff; letter-spacing: 0.03em;')}>VOS</span>
                      )}
                    </span>
                    <span style={css('font-size: 12.5px; color: #4a5462; align-self: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;')}>{u.email}</span>
                    <span style={css('align-self: center;')}>
                      <select
                        value={String(u.id_rol ?? '')}
                        disabled={asignarRol.enCurso}
                        onChange={async (ev) => {
                          const id_rol = Number(ev.target.value);
                          limpiarAvisos();
                          const hecho = await asignarRol.ejecutar(u.id_usuario, id_rol);
                          if (hecho) setAviso(u.nombre_user + ' ahora tiene el rol ' + (roles.find((x) => x.id_rol === id_rol)?.nombre_rol ?? '') + '.');
                        }}
                        style={css('height: 32px; width: 100%; padding: 0 8px; border-radius: 7px; border: 1px solid #dfe4ea; background: #fff; font-size: 12.5px; color: #14181f;')}
                      >
                        {ops.map((o) => (
                          <option key={o.valor} value={o.valor}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </span>
                    <span style={css('align-self: center; display: flex; justify-content: flex-end; gap: 6px;')}>
                      {!confirmando ? (
                        <>
                          <button
                            onClick={() => {
                              setEditar(u.id_usuario);
                              setReset(null);
                              setBorrar(null);
                              setE({ nombre: u.nombre_user, email: u.email, error: null });
                              editarU.limpiarError();
                              setAviso(null);
                            }}
                            style={css(btnPanel(editar === u.id_usuario))}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              setReset(u.id_usuario);
                              setEditar(null);
                              setBorrar(null);
                              setR({ clave1: '', clave2: '', error: null });
                              cambiarClave.limpiarError();
                              setAviso(null);
                            }}
                            style={css(btnPanel(reset === u.id_usuario))}
                          >
                            Resetear contraseña
                          </button>
                          <button
                            onClick={() => {
                              if (esVos) {
                                setError('No podés eliminar tu propio usuario.');
                                setAviso(null);
                                return;
                              }
                              setBorrar(u.id_usuario);
                              limpiarAvisos();
                            }}
                            style={css(
                              'height: 30px; padding: 0 11px; border-radius: 7px; font-size: 11.5px; font-weight: 500;' +
                                (esVos ? ' border: 1px solid #e2e6ec; background: #f4f6f8; color: #b9c1cc; cursor: default;' : ' border: 1px solid #f1d3d8; background: #fff; color: #a63244;'),
                            )}
                          >
                            Eliminar
                          </button>
                        </>
                      ) : (
                        <>
                          <span style={css('font-size: 12px; color: #a63244; align-self: center;')}>¿Eliminar?</span>
                          <button
                            disabled={eliminar.enCurso}
                            onClick={async () => {
                              const hecho = await eliminar.ejecutar(u.id_usuario);
                              setBorrar(null);
                              if (!hecho) return;
                              if (reset === u.id_usuario) setReset(null);
                              if (editar === u.id_usuario) setEditar(null);
                              setAviso('Se eliminó el usuario ' + u.nombre_user + '.');
                            }}
                            style={css('height: 30px; padding: 0 11px; border-radius: 7px; border: none; background: #a63244; color: #fff; font-size: 11.5px; font-weight: 600;')}
                          >
                            Sí, eliminar
                          </button>
                          <button
                            onClick={() => setBorrar(null)}
                            style={css('height: 30px; padding: 0 11px; border-radius: 7px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 11.5px;')}
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {lista.length === 0 && <div style={css('padding: 22px 20px; font-size: 12.5px; color: #7a8393;')}>Ningún usuario coincide con la búsqueda.</div>}
        </div>

      </div>

      {resetU ? (
        <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 15px; box-shadow: inset 0 3px 0 ' + ACCENT + ';')}>
          <div style={css('display: flex; flex-direction: column; gap: 4px;')}>
            <div style={css('font-size: 15px; font-weight: 600;')}>Resetear contraseña</div>
            <div style={css('font-size: 12px; color: #7a8393;')}>
              Usuario{' '}
              <span className="mono" style={css('color: #14181f; font-weight: 600;')}>
                {resetU.nombre_user}
              </span>
            </div>
          </div>
          <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Contraseña provisoria *</label>
            <input type="password" value={r.clave1} onChange={(ev) => setR({ ...r, clave1: ev.target.value, error: null })} placeholder={`Al menos ${MIN_CLAVE} caracteres`} style={css(CAMPO)} />
          </div>
          <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Repetir contraseña *</label>
            <input type="password" value={r.clave2} onChange={(ev) => setR({ ...r, clave2: ev.target.value, error: null })} style={css(CAMPO)} />
          </div>
          {(r.error || cambiarClave.error) && <div style={css(ERROR_CAJA)}>{r.error || cambiarClave.error}</div>}
          <div className="r-envolver" style={css('display: flex; gap: 10px;')}>
            <button
              onClick={guardarReset}
              disabled={cambiarClave.enCurso}
              style={css('flex-grow: 1; height: 40px; border-radius: 8px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 13px; font-weight: 600;')}
            >
              Guardar contraseña provisoria
            </button>
            <button
              onClick={() => setReset(null)}
              style={css('height: 40px; padding: 0 16px; border-radius: 8px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 13px; font-weight: 500;')}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : editU ? (
        <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 15px; box-shadow: inset 0 3px 0 ' + ACCENT + ';')}>
          <div style={css('display: flex; flex-direction: column; gap: 4px;')}>
            <div style={css('font-size: 15px; font-weight: 600;')}>Editar usuario</div>
            <div style={css('font-size: 12px; color: #7a8393;')}>
              Usuario{' '}
              <span className="mono" style={css('color: #14181f; font-weight: 600;')}>
                {editU.nombre_user}
              </span>
            </div>
          </div>
          <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Nombre de usuario *</label>
            <input value={e.nombre} onChange={(ev) => setE({ ...e, nombre: ev.target.value, error: null })} placeholder="Ej.: pfernandez" style={css(CAMPO)} />
          </div>
          <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Email *</label>
            <input value={e.email} onChange={(ev) => setE({ ...e, email: ev.target.value, error: null })} placeholder="Ej.: pfernandez@donbosco.edu.ar" style={css(CAMPO)} />
          </div>
          {(e.error || editarU.error) && <div style={css(ERROR_CAJA)}>{e.error || editarU.error}</div>}
          <div className="r-envolver" style={css('display: flex; gap: 10px;')}>
            <button
              onClick={guardarEdicion}
              disabled={editarU.enCurso}
              style={css('flex-grow: 1; height: 40px; border-radius: 8px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 13px; font-weight: 600;')}
            >
              Guardar cambios
            </button>
            <button
              onClick={() => setEditar(null)}
              style={css('height: 40px; padding: 0 16px; border-radius: 8px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 13px; font-weight: 500;')}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 15px;')}>
          <div style={css('display: flex; flex-direction: column; gap: 4px;')}>
            <div style={css('font-size: 15px; font-weight: 600;')}>Nuevo usuario</div>
          </div>
          <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Nombre de usuario *</label>
            <input
              value={n.nombre}
              onChange={(ev) => {
                setN({ ...n, nombre: ev.target.value });
                limpiarAvisos();
              }}
              placeholder="Ej.: pfernandez"
              style={css(CAMPO)}
            />
          </div>
          <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Email *</label>
            <input
              value={n.email}
              onChange={(ev) => {
                setN({ ...n, email: ev.target.value });
                limpiarAvisos();
              }}
              placeholder="Ej.: pfernandez@donbosco.edu.ar"
              style={css(CAMPO)}
            />
          </div>
          <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Contraseña provisoria *</label>
            <input
              type="password"
              value={n.clave}
              onChange={(ev) => {
                setN({ ...n, clave: ev.target.value });
                limpiarAvisos();
              }}
              placeholder={`Al menos ${MIN_CLAVE} caracteres`}
              style={css(CAMPO)}
            />
          </div>
          <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Rol</label>
            <select
              value={n.rol}
              onChange={(ev) => {
                setN({ ...n, rol: ev.target.value });
                limpiarAvisos();
              }}
              style={css(CAMPO)}
            >
              {[{ valor: '', label: 'Sin rol por ahora' }, ...opciones].map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {errorAlta && <div style={css(ERROR_CAJA)}>{errorAlta}</div>}
          {aviso && !errorAlta && <div style={css(AVISO_CAJA)}>{aviso}</div>}
          <div className="r-envolver" style={css('display: flex; gap: 10px;')}>
            <button
              onClick={crearUsuario}
              disabled={crear.enCurso}
              style={css('flex-grow: 1; height: 40px; border-radius: 8px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 13px; font-weight: 600;')}
            >
              Dar de alta el usuario
            </button>
            <button
              onClick={() => {
                setN({ nombre: '', email: '', clave: '', rol: '' });
                limpiarAvisos();
                crear.limpiarError();
                asignarRol.limpiarError();
                eliminar.limpiarError();
              }}
              style={css('height: 40px; padding: 0 16px; border-radius: 8px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 13px; font-weight: 500;')}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== pestaña Roles ===================== */

function PestaniaRoles({
  usuarios,
  roles,
  catalogo,
  privDeRol,
  miRol,
}: {
  usuarios: Usuario[];
  roles: { id_rol: number; nombre_rol: string }[];
  catalogo: Privilegio[];
  privDeRol: (id: number) => Privilegio[];
  miRol: number | null;
}) {
  const [rolSel, setRolSel] = useState<number | null>(null);
  const [nuevoRol, setNuevoRol] = useState('');
  const [errorRol, setErrorRol] = useState<string | null>(null);
  const [renombrando, setRenombrando] = useState(false);
  const [nombreRol, setNombreRol] = useState('');
  const [borrandoRol, setBorrandoRol] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

  const crear = useAccion((nombre_rol: string) => api.crear_rol({ nombre_rol }), ['usuario']);
  const renombrar = useAccion((id: number, nombre_rol: string) => api.cambiar_nombre_rol(id, { nombre_rol }), ['usuario']);
  const eliminar = useAccion(async (id: number) => (await api.eliminar_rol(id), true), ['usuario']);
  // Invalida 'usuario': también la clave de la sesión, así el menú de A1 se actualiza sin recargar.
  const asignarPriv = useAccion((id: number, id_privilegio: number) => api.asignar_privilegio(id, { id_privilegio }), ['usuario']);
  const quitarPriv = useAccion((id: number, idPriv: number) => api.quitar_privilegio(id, idPriv), ['usuario']);

  const rol = roles.find((x) => x.id_rol === rolSel) ?? roles[0] ?? null;
  const usuariosConRol = (id: number) => usuarios.filter((u) => u.id_rol === id).length;

  const elegir = (id: number) => {
    setRolSel(id);
    setRenombrando(false);
    setBorrandoRol(false);
    setErrorDetalle(null);
    renombrar.limpiarError();
    eliminar.limpiarError();
    asignarPriv.limpiarError();
    quitarPriv.limpiarError();
  };

  const crearRol = async () => {
    const nombre = nuevoRol.trim();
    if (nombre.length < 3) return setErrorRol('El nombre del rol lleva al menos 3 caracteres.');
    if (roles.some((x) => x.nombre_rol.toLowerCase() === nombre.toLowerCase())) return setErrorRol('Ya existe el rol «' + nombre + '».');
    const creado = await crear.ejecutar(nombre);
    if (!creado) return;
    setNuevoRol('');
    setErrorRol(null);
    elegir(creado.id_rol);
  };

  const listaRoles = roles.map((x, i) => {
    const activo = rol != null && x.id_rol === rol.id_rol;
    const nu = usuariosConRol(x.id_rol);
    const np = privDeRol(x.id_rol).length;
    return (
      <button
        key={x.id_rol}
        onClick={() => elegir(x.id_rol)}
        style={css(
          'display: flex; flex-direction: column; align-items: flex-start; gap: 3px; width: 100%; padding: 12px 18px;' +
            ' border: none; text-align: left;' +
            (i === 0 ? '' : ' border-top: 1px solid #f2f4f7;') +
            (activo ? ' background: #f3f6fc; box-shadow: inset 3px 0 0 ' + ACCENT + ';' : ' background: #fff;'),
        )}
      >
        <span style={css('font-size: 13.5px; font-weight: 600; color: #14181f;')}>{x.nombre_rol}</span>
        <span style={css('font-size: 11.5px; color: #6b7482;')}>
          {(nu === 1 ? '1 usuario' : nu + ' usuarios') + ' · ' + (np === 1 ? '1 privilegio' : np + ' privilegios')}
        </span>
      </button>
    );
  });

  let detalle = null;
  if (rol) {
    const nu = usuariosConRol(rol.id_rol);
    const asignados = privDeRol(rol.id_rol).map((p) => p.id_privilegio);
    const esMiRol = rol.id_rol === miRol;
    const sinUsuarios = esMiRol && !asignados.includes(ID_PRIV_USUARIOS);
    const errorVisible = errorDetalle || renombrar.error || eliminar.error || asignarPriv.error || quitarPriv.error;
    const cambiando = asignarPriv.enCurso || quitarPriv.enCurso;

    const guardarNombre = async () => {
      const nombre = nombreRol.trim();
      if (nombre.length < 3) return setErrorDetalle('El nombre del rol lleva al menos 3 caracteres.');
      if (roles.some((x) => x.id_rol !== rol.id_rol && x.nombre_rol.toLowerCase() === nombre.toLowerCase())) return setErrorDetalle('Ya existe el rol «' + nombre + '».');
      const hecho = await renombrar.ejecutar(rol.id_rol, nombre);
      if (hecho) {
        setRenombrando(false);
        setErrorDetalle(null);
      }
    };

    detalle = (
      <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
        <div className="r-envolver" style={css('display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #eef1f5;')}>
          {!renombrando ? (
            <>
              <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
                <span style={css('font-size: 18px; font-weight: 600; letter-spacing: -0.01em;')}>{rol.nombre_rol}</span>
                <span style={css('font-size: 12px; color: #6b7482;')}>
                  {nu === 0 ? 'Ningún usuario tiene este rol' : nu === 1 ? '1 usuario tiene este rol' : nu + ' usuarios tienen este rol'}
                </span>
              </div>
              <div style={css('flex-grow: 1;')}></div>
              {!borrandoRol ? (
                <>
                  <button
                    onClick={() => {
                      setRenombrando(true);
                      setNombreRol(rol.nombre_rol);
                      setErrorDetalle(null);
                      renombrar.limpiarError();
                    }}
                    style={css('height: 32px; padding: 0 12px; border-radius: 7px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 12px; font-weight: 500;')}
                  >
                    Renombrar
                  </button>
                  <button
                    onClick={() => {
                      eliminar.limpiarError();
                      if (nu > 0) {
                        setErrorDetalle(
                          'No se puede eliminar: ' + (nu === 1 ? '1 usuario tiene' : nu + ' usuarios tienen') + ' este rol.',
                        );
                        return;
                      }
                      setBorrandoRol(true);
                      setErrorDetalle(null);
                    }}
                    style={css('height: 32px; padding: 0 12px; border-radius: 7px; border: 1px solid #f1d3d8; background: #fff; color: #a63244; font-size: 12px; font-weight: 500;')}
                  >
                    Eliminar rol
                  </button>
                </>
              ) : (
                <>
                  <span style={css('font-size: 12px; color: #a63244;')}>¿Eliminar el rol?</span>
                  <button
                    disabled={eliminar.enCurso}
                    onClick={async () => {
                      // La API responde 409 si el rol tiene usuarios: el mensaje queda en eliminar.error.
                      await eliminar.ejecutar(rol.id_rol);
                      setBorrandoRol(false);
                    }}
                    style={css('height: 32px; padding: 0 12px; border-radius: 7px; border: none; background: #a63244; color: #fff; font-size: 12px; font-weight: 600;')}
                  >
                    Sí, eliminar
                  </button>
                  <button
                    onClick={() => setBorrandoRol(false)}
                    style={css('height: 32px; padding: 0 12px; border-radius: 7px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 12px;')}
                  >
                    Cancelar
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <input
                value={nombreRol}
                onChange={(ev) => {
                  setNombreRol(ev.target.value);
                  setErrorDetalle(null);
                }}
                style={css('flex-grow: 1; height: 38px; padding: 0 12px; border-radius: 8px; border: 1px solid #9fb4dd; font-size: 15px; font-weight: 600;')}
              />
              <button
                onClick={guardarNombre}
                disabled={renombrar.enCurso}
                style={css('height: 36px; padding: 0 14px; border-radius: 8px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 12.5px; font-weight: 600;')}
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setRenombrando(false);
                  setErrorDetalle(null);
                  renombrar.limpiarError();
                }}
                style={css('height: 36px; padding: 0 14px; border-radius: 8px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 12.5px;')}
              >
                Cancelar
              </button>
            </>
          )}
        </div>
        {errorVisible && <div style={css('margin: 14px 20px 0; ' + ERROR_CAJA)}>{errorVisible}</div>}
        <div style={css('padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 12px;')}>
          <div className="r-envolver a17-fila-chica" style={css('display: flex; align-items: baseline; gap: 10px;')}>
            <span style={css('font-size: 13px; font-weight: 600;')}>Privilegios</span>
            <span style={css('font-size: 12px; color: #6b7482;')}>{asignados.length + ' de ' + catalogo.length + ' asignados'}</span>
          </div>
          <div className="r-una-columna-movil" style={css('display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;')}>
            {catalogo.map((p) => {
              const tiene = asignados.includes(p.id_privilegio);
              return (
                <button
                  key={p.id_privilegio}
                  disabled={cambiando}
                  onClick={() => {
                    setErrorDetalle(null);
                    asignarPriv.limpiarError();
                    quitarPriv.limpiarError();
                    if (tiene) quitarPriv.ejecutar(rol.id_rol, p.id_privilegio);
                    else asignarPriv.ejecutar(rol.id_rol, p.id_privilegio);
                  }}
                  style={css(
                    'display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 8px;' +
                      ' border: 1px solid ' + (tiene ? '#cfdcf5' : '#e2e6ec') + '; background: ' + (tiene ? '#f7f9fd' : '#fff') + ';',
                  )}
                >
                  <span style={css(estiloCaja(tiene))}>{tiene ? '✓' : ''}</span>
                  <span style={css('font-size: 13px; color: #14181f; text-align: left;')}>{p.descripcion_privilegio}</span>
                </button>
              );
            })}
          </div>
          {sinUsuarios && (
            <div style={css('font-size: 12.5px; line-height: 1.5; border-radius: 8px; padding: 10px 12px; color: #a56a10; background: #fdf6ec; border: 1px solid #f1dfc0;')}>
              Le quitaste «Usuarios» a tu propio rol: al salir de esta pantalla no vas a poder volver.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="r-margen r-una-columna" style={css('padding: 20px 28px 28px; display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 20px; align-items: start;')}>
      <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
        <div style={css('display: flex; align-items: center; padding: 13px 18px; border-bottom: 1px solid #eef1f5;')}>
          <span style={css('font-size: 13px; font-weight: 600;')}>Roles</span>
          <div style={css('flex-grow: 1;')}></div>
          <span style={css('font-size: 12px; color: #6b7482;')}>{roles.length === 1 ? '1 rol' : roles.length + ' roles'}</span>
        </div>
        {listaRoles}
        <div style={css('padding: 14px 18px; border-top: 1px solid #eef1f5; background: #fafbfc; display: flex; flex-direction: column; gap: 9px;')}>
          <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Nuevo rol</label>
          <div style={css('display: flex; gap: 8px;')}>
            <input
              value={nuevoRol}
              onChange={(ev) => {
                setNuevoRol(ev.target.value);
                setErrorRol(null);
                crear.limpiarError();
              }}
              placeholder="Ej.: Preceptor"
              style={css('flex-grow: 1; min-width: 0; height: 36px; padding: 0 11px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; background: #fff;')}
            />
            <button
              onClick={crearRol}
              disabled={crear.enCurso}
              style={css('height: 36px; padding: 0 14px; border-radius: 8px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 12.5px; font-weight: 600;')}
            >
              Crear
            </button>
          </div>
          {(errorRol || crear.error) && <div style={css('font-size: 12px; color: #a63244; line-height: 1.45;')}>{errorRol || crear.error}</div>}
        </div>
      </div>

      <div style={css('display: flex; flex-direction: column; gap: 16px;')}>
        {detalle}
      </div>
    </div>
  );
}
