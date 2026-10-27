// A9 · Ficha del profesor. Prototipo: <template id="tpl-profesordetalle"> y DC.registrar("profesordetalle") en prototipo/index.html.
// Ruta /profesores/:id. Profesor (profesor_suplencias.get_profesor) y edición de sus datos (editar_profesor).
// Usuario: usuario.get_usuarios (nombre del usuario asignado y selector para asignar), usuario.editar_usuario
// y asignar_usuario_profesor. Materias habilitadas (asignar_materias_habilitadas) con
// orientacion.get_plan_de_estudios (año y orientación de cada una, y selector agrupado). Disponibilidad declarada: grilla del turno con más
// franjas declaradas (horarios.get_turnos).
import { useEffect, useMemo, useState } from 'react';
import type { Profesor } from '@sahs/contratos';
import { horarios, orientacion, profesorSuplencias, usuario } from '../api';
import { useIr, useParamRuta } from '../app/navegar';
import { rutas } from '../app/rutas';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useAccion, useConsulta } from '../estado/consultas';
import { css } from '../lib/css';
import './a7/responsive.css';
import { DIAS, iniciales } from '../lib/formato';
import { ACCENT, colorArea, filasDelTurno, gruposDelPlan, materiasDelPlan, turnoPrincipal } from './a7/comun';

const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const CAMPO = 'height: 38px; padding: 0 12px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; background: #fcfdfe; color: #14181f;';
const PILL = 'font-size: 11.5px; font-weight: 600; padding: 4px 11px; border-radius: 13px;';
const AVISO_OK = 'margin: 14px 20px 0; font-size: 12.5px; color: #245239; background: #eef6f0; border: 1px solid #cfe5d6; border-radius: 8px; padding: 10px 12px; line-height: 1.45;';
const ERROR_TXT = 'font-size: 12px; color: #a63244; line-height: 1.45;';
const TARJETA = 'background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;';
const ETIQUETA = 'font-size: 11.5px; color: #7a8393; margin-bottom: 5px;';

export default function A9ProfesorDetalle() {
  const ir = useIr();
  const id = useParamRuta('id');
  useEffect(() => {
    if (id == null) ir(rutas.profesores());
  }, [id, ir]);
  const qProf = useConsulta(['profesor_suplencias', 'get_profesor', id], () => profesorSuplencias.get_profesor(id!), { enabled: id != null });

  return (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />
      {qProf.isLoading && <Cargando />}
      {qProf.error && (
        <div className="r-margen" style={css('padding: 20px 28px;')}>
          <MensajeError mensaje={qProf.error.message} />
        </div>
      )}
      {qProf.data && <Ficha key={qProf.data.id_profesor} p={qProf.data} />}
    </div>
  );
}

function Ficha({ p }: { p: Profesor }) {
  const ir = useIr();

  const qPlan = useConsulta(['orientacion', 'get_plan_de_estudios'], () => orientacion.get_plan_de_estudios());
  const qTurnos = useConsulta(['horarios', 'get_turnos'], () => horarios.get_turnos());
  const qUsuarios = useConsulta(['usuario', 'get_usuarios'], () => usuario.get_usuarios());
  const materias = useMemo(() => materiasDelPlan(qPlan.data), [qPlan.data]);

  // ---- disponibilidad declarada ----
  const turno = turnoPrincipal(p, qTurnos.data);
  const marcadas = new Set((p.disponibilidad ?? []).map((f) => f.id_franja_horaria));
  const filas = filasDelTurno(turno);

  // ---- materias habilitadas ----
  const idsHab = new Set((p.lista_materias_habilitadas ?? []).map((m) => m.id_materia!));
  const etiqueta = (m: NonNullable<ReturnType<typeof materias.get>>) => {
    const n = parseInt(m.anio_curricular, 10);
    const o = m.nombre_orientacion;
    return m.nombre_materia + (n ? ' ' + n + '°' : '') + (o && o !== 'Básica' ? ' · ' + o : '');
  };
  const habilitadas = (p.lista_materias_habilitadas ?? []).map((mr) => {
    const m = materias.get(mr.id_materia ?? -1);
    return { id: mr.id_materia!, label: m ? etiqueta(m) : mr.nombre_materia ?? '', color: colorArea(mr.nombre_area) };
  });
  const [editandoHab, setEditandoHab] = useState(false);
  const accHab = useAccion(profesorSuplencias.asignar_materias_habilitadas, ['profesor_suplencias']);
  const toggleMateria = (idMateria: number) => {
    const ids = new Set(idsHab);
    if (ids.has(idMateria)) ids.delete(idMateria);
    else ids.add(idMateria);
    void accHab.ejecutar(p.id_profesor, { ids_materias: [...ids] });
  };

  // ---- datos personales (editar_profesor) ----
  type Campos = { nombre: string; apellido: string; documento: string; legajo: string; telefono: string; cargo: string; correo: string; direccion: string };
  const [editDatos, setEditDatos] = useState<Campos | null>(null);
  const [errorDatos, setErrorDatos] = useState<string | null>(null);
  const [avisoDatos, setAvisoDatos] = useState<string | null>(null);
  const accDatos = useAccion(profesorSuplencias.editar_profesor, ['profesor_suplencias']);
  const CAMPOS: [keyof Campos, string, string, boolean][] = [
    ['nombre', 'Nombre *', 'Ej.: Juan', false],
    ['apellido', 'Apellido *', 'Ej.: Ramírez', false],
    ['documento', 'Documento *', 'Ej.: 30.123.456', false],
    ['legajo', 'Legajo', 'Vacío = sin legajo', false],
    ['telefono', 'Teléfono', 'Ej.: 299 415-2210', false],
    ['cargo', 'Cargo', 'Vacío = sin cargo', false],
    ['correo', 'Correo electrónico *', 'Ej.: j.ramirez@donbosco.edu.ar', true],
    ['direccion', 'Dirección', 'Ej.: Chaneton 780, Neuquén', true],
  ];
  const abrirEditar = () => {
    setAvisoDatos(null);
    setErrorDatos(null);
    accDatos.limpiarError();
    setEditDatos({
      nombre: p.nombre,
      apellido: p.apellido,
      documento: p.documento,
      legajo: p.legajo ?? '',
      telefono: p.telefono ?? '',
      cargo: p.cargo_asociado ?? '',
      correo: p.correo_electronico ?? '',
      direccion: p.direccion ?? '',
    });
  };
  const guardarDatos = async () => {
    if (!editDatos) return;
    const t = (x: string) => x.trim();
    const n = editDatos;
    if (!t(n.nombre) || !t(n.apellido) || !t(n.documento) || !t(n.correo)) {
      setErrorDatos('Completá nombre, apellido, documento y correo electrónico.');
      return;
    }
    const r = await accDatos.ejecutar(p.id_profesor, {
      nombre: t(n.nombre),
      apellido: t(n.apellido),
      documento: t(n.documento),
      correo_electronico: t(n.correo),
      telefono: t(n.telefono),
      direccion: t(n.direccion),
      legajo: t(n.legajo) || null,
      cargo_asociado: t(n.cargo) || null,
    });
    if (r) {
      setEditDatos(null);
      setAvisoDatos('Se guardaron los datos del profesor.');
    }
  };
  const errDatos = errorDatos ?? accDatos.error;

  // ---- usuario ----
  const usuarios = qUsuarios.data ?? [];
  const u = p.id_usuario != null ? usuarios.find((x) => x.id_usuario === p.id_usuario) ?? null : null;
  const tieneUsuario = p.id_usuario != null;
  const [usrModo, setUsrModo] = useState<'editar' | 'cambiar' | null>(null);
  const modo = !tieneUsuario ? 'asignar' : usrModo ?? 'ver';
  const [eNombre, setENombre] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [usrSel, setUsrSel] = useState('');
  const [errorUsr, setErrorUsr] = useState<string | null>(null);
  const [avisoUsr, setAvisoUsr] = useState<string | null>(null);
  const accEditUsr = useAccion(usuario.editar_usuario, ['usuario']);
  const accAsigUsr = useAccion(profesorSuplencias.asignar_usuario_profesor, ['profesor_suplencias']);
  // Si el usuario ya es de otro profesor, la API lo rechaza (409) y se muestra su mensaje.
  const libres = usuarios.filter((x) => x.id_usuario !== p.id_usuario);
  const errUsr = errorUsr ?? accEditUsr.error ?? accAsigUsr.error;
  const limpiarErrUsr = () => {
    setErrorUsr(null);
    accEditUsr.limpiarError();
    accAsigUsr.limpiarError();
  };
  const asignarUsr = async () => {
    if (!usrSel) {
      setErrorUsr('Elegí un usuario.');
      return;
    }
    const nuevo = usuarios.find((x) => x.id_usuario === Number(usrSel));
    const r = await accAsigUsr.ejecutar(p.id_profesor, { id_usuario: Number(usrSel) });
    if (r) {
      setUsrModo(null);
      setUsrSel('');
      setAvisoUsr('Se asignó el usuario ' + (nuevo?.nombre_user ?? '') + '.');
    }
  };
  const guardarUsr = async () => {
    if (!u) return;
    const nombre = eNombre.trim();
    const email = eEmail.trim();
    if (!nombre || !email) {
      setErrorUsr('Completá el nombre de usuario y el email.');
      return;
    }
    const r = await accEditUsr.ejecutar(u.id_usuario, { nombre_user: nombre, email });
    if (r) {
      setUsrModo(null);
      setAvisoUsr('Se guardaron los cambios del usuario.');
    }
  };

  const errorCarga = qPlan.error ?? qTurnos.error ?? qUsuarios.error;
  const grupos = gruposDelPlan(qPlan.data);

  return (
    <>
      <div className="r-margen" style={css('padding: 22px 28px 22px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482; margin-bottom: 15px;')}>
          <span onClick={() => ir(rutas.profesores())} style={css('display: flex; align-items: center; gap: 6px; color: #2f5fd0; cursor: pointer;')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6"></path>
            </svg>
            Volver al listado
          </span>
          <span style={css('color: #c3cad4;')}>/</span>
          <span>Profesores</span>
          <span style={css('color: #c3cad4;')}>/</span>
          <span style={css('color: #14181f; font-weight: 500;')}>
            {p.nombre} {p.apellido}
          </span>
        </div>

        <div className="r-envolver" style={css('display: flex; align-items: center; gap: 20px;')}>
          <span
            style={css(
              'width: 58px; height: 58px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 19px; font-weight: 600; background: ' +
                ACCENT +
                '; color: #fff;',
            )}
          >
            {iniciales(p.nombre, p.apellido)}
          </span>
          <div style={css('display: flex; flex-direction: column; gap: 9px;')}>
            <div className="r-titulo" style={css('font-size: 28px; font-weight: 600; letter-spacing: -0.025em;')}>
              {p.apellido}, {p.nombre}
            </div>
            <div className="r-envolver" style={css('display: flex; align-items: center; gap: 8px;')}>
              <span className="mono" style={css('font-size: 11.5px; font-weight: 600; padding: 4px 11px; border-radius: 13px; background: #f2f4f7; color: #4a5462;')}>
                {p.legajo || 'Sin legajo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {errorCarga && (
        <div className="r-margen" style={css('padding: 16px 28px 0;')}>
          <MensajeError mensaje={errorCarga.message} />
        </div>
      )}

      <div className="r-margen r-apilar" style={css('display: flex; gap: 18px; padding: 20px 28px 28px; align-items: flex-start;')}>
        {/* ---------------- columna izquierda ---------------- */}
        <div style={css('width: 468px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;')}>
          <div style={css(TARJETA)}>
            <div style={css('padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Datos personales</div>
            </div>
            {avisoDatos && <div style={css(AVISO_OK)}>{avisoDatos}</div>}
            {!editDatos && (
              <div className="r-una-columna-movil a7-campos" style={css('padding: 18px 20px 20px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 17px;')}>
                <Dato etiqueta="Documento" valor={p.documento} mono />
                <Dato etiqueta="Legajo" valor={p.legajo || '—'} mono />
                <Dato etiqueta="Teléfono" valor={p.telefono || '—'} mono />
                <Dato etiqueta="Correo electrónico" valor={p.correo_electronico || '—'} ancho />
                <Dato etiqueta="Dirección" valor={p.direccion || '—'} ancho />
                <Dato etiqueta="Cargo" valor={p.cargo_asociado || 'Sin cargo'} ancho />
              </div>
            )}

            {/* editar_profesor: un solo formulario con todos los datos */}
            {editDatos && (
              <div style={css('padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 12px; background: #fafbfc;')}>
                <div style={css('font-size: 12px; color: #7a8393;')}>Los campos marcados con * son obligatorios.</div>
                <div className="r-una-columna-movil a7-campos" style={css('display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;')}>
                  {CAMPOS.map(([k, label, ayuda, ancho]) => (
                    <label key={k} style={css('display: flex; flex-direction: column; gap: 6px;' + (ancho ? ' grid-column: span 2;' : ''))}>
                      <span style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>{label}</span>
                      <input
                        value={editDatos[k]}
                        onChange={(e) => {
                          setEditDatos({ ...editDatos, [k]: e.target.value });
                          setErrorDatos(null);
                          accDatos.limpiarError();
                        }}
                        placeholder={ayuda}
                        style={css(CAMPO)}
                      />
                    </label>
                  ))}
                </div>
                {errDatos && <div style={css(ERROR_TXT)}>{errDatos}</div>}
                <div className="r-envolver" style={css('display: flex; gap: 8px; justify-content: flex-end;')}>
                  <button
                    onClick={() => {
                      setEditDatos(null);
                      setErrorDatos(null);
                      accDatos.limpiarError();
                    }}
                    style={css('height: 36px; padding: 0 14px; border-radius: 8px; border: 1px solid #d3d9e2; background: #fff; color: #4a5462; font-size: 12.5px; font-weight: 500;')}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarDatos}
                    disabled={accDatos.enCurso}
                    style={css(`height: 36px; padding: 0 16px; border-radius: 8px; border: none; background: ${ACCENT}; color: #fff; font-size: 12.5px; font-weight: 600;`)}
                  >
                    {accDatos.enCurso ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Usuario del profesor: asignar_usuario_profesor y usuario.editar_usuario */}
          <div style={css(TARJETA)}>
            <div className="r-envolver" style={css('display: flex; align-items: center; gap: 12px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Usuario</div>
              <div style={css('flex-grow: 1;')}></div>
              <span style={css(PILL + (tieneUsuario ? ' background: #e9f2ec; color: #2f6b45;' : ' background: #fdf4e7; color: #7a5310;'))}>
                {tieneUsuario ? 'Asignado' : 'Sin usuario'}
              </span>
            </div>

            {avisoUsr && <div style={css(AVISO_OK)}>{avisoUsr}</div>}

            {modo === 'ver' && (
              <div style={css('padding: 16px 20px 18px; display: flex; flex-direction: column; gap: 14px;')}>
                <div className="r-una-columna-movil a7-campos" style={css('display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px;')}>
                  <Dato etiqueta="Nombre de usuario" valor={u?.nombre_user ?? (qUsuarios.isLoading ? '…' : '—')} mono />
                  <Dato etiqueta="Rol" valor={u ? u.rol?.nombre_rol ?? 'Sin rol' : '—'} />
                  <Dato etiqueta="Email" valor={u?.email ?? '—'} ancho />
                </div>
                <div className="r-envolver" style={css('display: flex; gap: 8px;')}>
                  <button
                    disabled={!u}
                    onClick={() => {
                      if (!u) return;
                      setUsrModo('editar');
                      setENombre(u.nombre_user);
                      setEEmail(u.email);
                      limpiarErrUsr();
                      setAvisoUsr(null);
                    }}
                    style={css('height: 32px; padding: 0 12px; border-radius: 7px; border: 1px solid #d3d9e2; background: #fff; color: #14181f; font-size: 12px; font-weight: 500;')}
                  >
                    Editar usuario
                  </button>
                  <button
                    onClick={() => {
                      setUsrModo('cambiar');
                      setUsrSel('');
                      limpiarErrUsr();
                      setAvisoUsr(null);
                    }}
                    style={css('height: 32px; padding: 0 12px; border-radius: 7px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 12px; font-weight: 500;')}
                  >
                    Cambiar usuario
                  </button>
                </div>
              </div>
            )}

            {modo === 'editar' && (
              <div style={css('padding: 16px 20px 18px; display: flex; flex-direction: column; gap: 12px; background: #fafbfc;')}>
                <label style={css('display: flex; flex-direction: column; gap: 6px;')}>
                  <span style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Nombre de usuario *</span>
                  <input
                    value={eNombre}
                    onChange={(e) => {
                      setENombre(e.target.value);
                      limpiarErrUsr();
                    }}
                    placeholder="Ej.: jramirez"
                    style={css(CAMPO)}
                  />
                </label>
                <label style={css('display: flex; flex-direction: column; gap: 6px;')}>
                  <span style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Email *</span>
                  <input
                    value={eEmail}
                    onChange={(e) => {
                      setEEmail(e.target.value);
                      limpiarErrUsr();
                    }}
                    placeholder="Ej.: jramirez@donbosco.edu.ar"
                    style={css(CAMPO)}
                  />
                </label>
                {errUsr && <div style={css(ERROR_TXT)}>{errUsr}</div>}
                <div className="r-envolver" style={css('display: flex; gap: 8px; justify-content: flex-end;')}>
                  <button
                    onClick={() => {
                      setUsrModo(null);
                      limpiarErrUsr();
                    }}
                    style={css('height: 34px; padding: 0 14px; border-radius: 8px; border: 1px solid #d3d9e2; background: #fff; color: #4a5462; font-size: 12.5px; font-weight: 500;')}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarUsr}
                    disabled={accEditUsr.enCurso}
                    style={css(`height: 34px; padding: 0 16px; border-radius: 8px; border: none; background: ${ACCENT}; color: #fff; font-size: 12.5px; font-weight: 600;`)}
                  >
                    {accEditUsr.enCurso ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              </div>
            )}

            {(modo === 'asignar' || modo === 'cambiar') && (
              <div style={css('padding: 16px 20px 18px; display: flex; flex-direction: column; gap: 12px;')}>
                {tieneUsuario && (
                  <div style={css('font-size: 12.5px; color: #4a5462; line-height: 1.5;')}>Reemplaza a {u?.nombre_user ?? 'el usuario actual'}.</div>
                )}
                {libres.length > 0 && (
                  <div style={css('display: flex; gap: 8px;')}>
                    <select
                      value={usrSel}
                      onChange={(e) => {
                        setUsrSel(e.target.value);
                        limpiarErrUsr();
                      }}
                      style={css(CAMPO + ' flex-grow: 1; min-width: 0;')}
                    >
                      <option value="">Elegí un usuario…</option>
                      {libres.map((x) => (
                        <option key={x.id_usuario} value={String(x.id_usuario)}>
                          {x.nombre_user + ' · ' + x.email + (x.rol ? ' · ' + x.rol.nombre_rol : '')}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={asignarUsr}
                      disabled={accAsigUsr.enCurso}
                      style={css(`height: 38px; padding: 0 16px; border-radius: 8px; border: none; background: ${ACCENT}; color: #fff; font-size: 12.5px; font-weight: 600;`)}
                    >
                      Asignar
                    </button>
                  </div>
                )}
                {!qUsuarios.isLoading && libres.length === 0 && (
                  <div style={css('font-size: 12.5px; color: #a56a10; background: #fdf6ec; border: 1px solid #f1dfc0; border-radius: 8px; padding: 10px 12px; line-height: 1.45;')}>
                    No hay usuarios para asignar.
                  </div>
                )}
                {errUsr && <div style={css(ERROR_TXT)}>{errUsr}</div>}
                {modo === 'cambiar' && (
                  <button
                    onClick={() => {
                      setUsrModo(null);
                      limpiarErrUsr();
                    }}
                    style={css('align-self: flex-start; height: 30px; padding: 0 12px; border-radius: 7px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 12px; font-weight: 500;')}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Materias habilitadas: asignar_materias_habilitadas reemplaza la lista */}
          <div style={css(TARJETA)}>
            <div className="r-envolver" style={css('display: flex; align-items: center; gap: 12px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Materias habilitadas</div>
              <div style={css('flex-grow: 1;')}></div>
              <div style={css('font-size: 12px; color: #6b7482;')}>{habilitadas.length === 1 ? '1 materia' : habilitadas.length + ' materias'}</div>
              <button
                onClick={() => setEditandoHab(!editandoHab)}
                style={css('height: 28px; padding: 0 11px; border-radius: 7px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 11.5px; font-weight: 500; margin-left: 10px;')}
              >
                {editandoHab ? 'Listo' : 'Editar'}
              </button>
            </div>
            <div style={css('padding: 16px 20px 18px; display: flex; flex-wrap: wrap; gap: 7px;')}>
              {habilitadas.length === 0 && <span style={css('font-size: 12.5px; color: #8b95a5;')}>Ninguna materia habilitada.</span>}
              {habilitadas.map((h) => (
                <span key={h.id} style={css('font-size: 12px; font-weight: 500; padding: 6px 12px; border-radius: 15px; background: ' + h.color.fondo + '; color: ' + h.color.texto + ';')}>
                  {h.label}
                </span>
              ))}
            </div>
            {editandoHab && (
              <div style={css('padding: 14px 20px 18px; border-top: 1px solid #eef1f5; background: #fafbfc; display: flex; flex-direction: column; gap: 12px;')}>
                {accHab.error && <div style={css(ERROR_TXT)}>{accHab.error}</div>}
                {grupos.map((g) => (
                  <div key={g.nombre} style={css('display: flex; flex-direction: column; gap: 7px;')}>
                    <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>{g.nombre}</div>
                    <div style={css('display: flex; flex-wrap: wrap; gap: 6px;')}>
                      {g.materias.map((m) => {
                        const activa = idsHab.has(m.id_materia);
                        return (
                          <button
                            key={m.id_materia}
                            disabled={accHab.enCurso}
                            onClick={() => toggleMateria(m.id_materia)}
                            style={css(
                              'height: 30px; padding: 0 12px; border-radius: 15px; font-size: 12px; font-weight: 500;' +
                                (activa ? ' border: 1.5px solid ' + ACCENT + '; background: #eef3fc; color: #1e3f80;' : ' border: 1px solid #dfe4ea; background: #fff; color: #6b7482;'),
                            )}
                          >
                            {m.nombre_materia}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="r-envolver" style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 16px; display: flex; gap: 10px;')}>
            <button
              onClick={abrirEditar}
              style={css('flex-grow: 1; height: 40px; border-radius: 8px; border: 1px solid #d3d9e2; background: #fff; color: #14181f; font-size: 13px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 9px;')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h4L19 9l-4-4L4 16v4z"></path>
              </svg>
              Editar datos
            </button>
          </div>
        </div>

        {/* ---------------- columna derecha ---------------- */}
        <div style={css('flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px;')}>
          {/* Disponibilidad */}
          <div style={css(TARJETA)}>
            <div className="r-envolver" style={css('display: flex; align-items: center; gap: 12px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Disponibilidad declarada</div>
              <div style={css('flex-grow: 1;')}></div>
              <button
                onClick={() => ir(rutas.disponibilidad(p.id_profesor))}
                style={css('display: flex; align-items: center; gap: 7px; height: 34px; padding: 0 14px; border-radius: 7px; border: 1px solid #d3d9e2; background: #fff; color: #14181f; font-size: 12.5px; font-weight: 600;')}
              >
                Ver y editar
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6"></path>
                </svg>
              </button>
            </div>
            <div className="r-envolver" style={css('padding: 18px 20px 20px; display: flex; gap: 26px; align-items: center;')}>
              <div style={css('display: flex; flex-direction: column; gap: 5px;')}>
                <div style={css('display: grid; grid-template-columns: 34px repeat(5, 26px); gap: 4px;')}>
                  <div></div>
                  {DIAS_CORTOS.map((d) => (
                    <div key={d} style={css('font-size: 10px; color: #7a8393; text-align: center;')}>
                      {d}
                    </div>
                  ))}
                </div>
                {qTurnos.isLoading && <Cargando />}
                {filas.map((row) =>
                  row.es_recreo ? (
                    <div key={row.hora_inicio} style={css('display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 4px;')}>
                      <div></div>
                      <div style={css('height: 5px; border-radius: 3px; background: repeating-linear-gradient(135deg, #eef1f5 0 4px, #f8f9fb 4px 8px);')}></div>
                    </div>
                  ) : (
                    <div key={row.hora_inicio} style={css('display: grid; grid-template-columns: 34px repeat(5, 26px); gap: 4px;')}>
                      <div className="mono" style={css('font-size: 8.5px; color: #a8b0bb; display: flex; align-items: center;')}>
                        {row.hora_inicio}
                      </div>
                      {DIAS.map((dia) => {
                        const f = row.porDia.get(dia);
                        const libre = !!(f && !f.es_recreo && marcadas.has(f.id_franja_horaria));
                        return (
                          <div
                            key={dia}
                            style={css(
                              'width: 26px; height: 20px; border-radius: 4px;' +
                                (libre ? ' background: #e9f2ec; border: 1px solid #bfdcca;' : ' background: #fafbfc; border: 1px solid #e8ecf1;'),
                            )}
                          ></div>
                        );
                      })}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Dato({ etiqueta, valor, mono, ancho }: { etiqueta: string; valor: string; mono?: boolean; ancho?: boolean }) {
  return (
    <div style={css(ancho ? 'grid-column: span 2;' : '')}>
      <div style={css(ETIQUETA)}>{etiqueta}</div>
      <div className={mono ? 'mono' : undefined} style={css('font-size: 13.5px; font-weight: 500;')}>
        {valor}
      </div>
    </div>
  );
}
