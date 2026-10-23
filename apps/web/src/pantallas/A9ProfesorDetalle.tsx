// A9 · Ficha del profesor. Prototipo: <template id="tpl-profesordetalle"> y DC.registrar("profesordetalle") en prototipo/index.html.
// Lee ?id_profesor= (sin parámetro muestra el primero). Datos (editar_profesor), usuario (usuario.editar_usuario
// y asignar_usuario_profesor), materias habilitadas (asignar_materias_habilitadas), disponibilidad declarada
// (grilla del turno con más franjas declaradas) y clases asignadas en la propuesta vigente del ciclo activo.
import { useMemo, useState } from 'react';
import type { Materia, Profesor } from '@sahs/contratos';
import { horarios, orientacion, planificacion, profesorSuplencias, usuario } from '../api';
import { useNavegar, useParamNumero } from '../app/navegar';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useAccion, useConsulta } from '../estado/consultas';
import { css } from '../lib/css';
import { DIAS, iniciales } from '../lib/formato';
import {
  ACCENT,
  areaDeProfesor,
  colorArea,
  filasDelTurno,
  franjasDeclaradas,
  gruposDeMaterias,
  horasDelTurno,
  nombreCurso,
  numeroAnio,
  propuestaVigente,
  turnoPrincipal,
} from './a7/comun';

const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const CAMPO = 'height: 38px; padding: 0 12px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; background: #fcfdfe; color: #14181f;';
const PILL = 'font-size: 11.5px; font-weight: 600; padding: 4px 11px; border-radius: 13px;';
const AVISO_OK = 'margin: 14px 20px 0; font-size: 12.5px; color: #245239; background: #eef6f0; border: 1px solid #cfe5d6; border-radius: 8px; padding: 10px 12px; line-height: 1.45;';
const ERROR_TXT = 'font-size: 12px; color: #a63244; line-height: 1.45;';
const TARJETA = 'background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;';
const ETIQUETA = 'font-size: 11.5px; color: #7a8393; margin-bottom: 5px;';

export default function A9ProfesorDetalle() {
  const idParam = useParamNumero('id_profesor');
  const qLista = useConsulta(['profesor_suplencias', 'get_profesores'], () => profesorSuplencias.get_profesores());
  const id = idParam ?? qLista.data?.[0]?.id_profesor ?? null;
  const qProf = useConsulta(['profesor_suplencias', 'get_profesor', id], () => profesorSuplencias.get_profesor(id!), { enabled: id != null });

  return (
    <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />
      {(qLista.isLoading || qProf.isLoading) && <Cargando />}
      {(qProf.error || qLista.error) && (
        <div style={css('padding: 20px 28px;')}>
          <MensajeError mensaje={(qProf.error ?? qLista.error)?.message} />
        </div>
      )}
      {!qLista.isLoading && id == null && <div style={css('padding: 24px 28px; font-size: 13px; color: #6b7482;')}>No hay profesores cargados.</div>}
      {qProf.data && <Ficha key={qProf.data.id_profesor} p={qProf.data} profesores={qLista.data ?? []} />}
    </div>
  );
}

function Ficha({ p, profesores }: { p: Profesor; profesores: Profesor[] }) {
  const ir = useNavegar();
  const { activo } = useCiclo();
  const idCiclo = activo?.id_ciclo_lectivo;

  const qMat = useConsulta(['orientacion', 'get_materias'], () => orientacion.get_materias());
  const qAnios = useConsulta(['planificacion', 'get_anios_academicos'], () => planificacion.get_anios_academicos());
  const qTurnos = useConsulta(['horarios', 'get_turnos'], () => horarios.get_turnos());
  const qUsuarios = useConsulta(['usuario', 'get_usuarios'], () => usuario.get_usuarios());
  const qProp = useConsulta(['planificacion', 'get_propuestas', idCiclo], () => planificacion.get_propuestas({ id_ciclo_lectivo: idCiclo }), { enabled: !!idCiclo });
  const qCursos = useConsulta(['planificacion', 'get_cursos', idCiclo], () => planificacion.get_cursos({ id_ciclo_lectivo: idCiclo }), { enabled: !!idCiclo });
  const vigente = propuestaVigente(qProp.data);
  const qClases = useConsulta(
    ['planificacion', 'get_clases', 'profesor', p.id_profesor, vigente?.id_propuesta],
    () => planificacion.get_clases({ id_profesor: p.id_profesor, id_propuesta: vigente!.id_propuesta }),
    { enabled: !!vigente },
  );

  const materias = useMemo(() => new Map<number, Materia>((qMat.data ?? []).map((m) => [m.id_materia, m])), [qMat.data]);
  const area = areaDeProfesor(p, materias);
  const ar = colorArea(area);

  // ---- disponibilidad declarada ----
  const franjas = franjasDeclaradas(p);
  const turno = turnoPrincipal(p, qTurnos.data);
  const marcadas = new Set((p.disponibilidad ?? []).map((f) => f.id_franja_horaria));
  const filas = filasDelTurno(turno);

  // ---- clases asignadas en la propuesta vigente ----
  const cursos = new Map((qCursos.data ?? []).map((c) => [c.id_curso, c]));
  const asignadas = (qClases.data ?? []).map((c) => ({
    id: c.id_clase,
    materia: c.materia?.nombre_materia ?? materias.get(c.id_materia)?.nombre_materia ?? '—',
    curso: nombreCurso(cursos.get(c.id_curso), qAnios.data),
    horas: c.ids_franjas_horarias?.length ?? c.franjas_horarias?.length ?? 0,
  }));
  const totalHoras = asignadas.reduce((s, a) => s + a.horas, 0);
  const sinMargen = franjas - totalHoras < 4;

  // ---- materias habilitadas ----
  const idsHab = new Set((p.lista_materias_habilitadas ?? []).map((m) => m.id_materia!));
  const etiqueta = (m: Materia) => {
    const n = numeroAnio(m.id_anio_academico, qAnios.data);
    const o = m.orientacion?.nombre_orientacion ?? '';
    return m.nombre_materia + (n ? ' ' + n + '°' : '') + (o && o !== 'Básica' ? ' · ' + o : '');
  };
  const habilitadas = (p.lista_materias_habilitadas ?? []).map((mr) => {
    const m = materias.get(mr.id_materia ?? -1);
    return { id: mr.id_materia!, label: m ? etiqueta(m) : mr.nombre_materia ?? '', color: colorArea(m?.area?.nombre_area) };
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
    if (t(n.correo).indexOf('@') < 1) {
      setErrorDatos('El correo electrónico no es válido.');
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
  const tomados = new Set(profesores.filter((x) => x.id_profesor !== p.id_profesor && x.id_usuario != null).map((x) => x.id_usuario));
  const libres = usuarios.filter((x) => !tomados.has(x.id_usuario) && x.id_usuario !== p.id_usuario);
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
    if (email.indexOf('@') < 1) {
      setErrorUsr('El email no es válido.');
      return;
    }
    if (usuarios.some((x) => x.id_usuario !== u.id_usuario && x.nombre_user === nombre)) {
      setErrorUsr('Ya existe otro usuario con ese nombre.');
      return;
    }
    const r = await accEditUsr.ejecutar(u.id_usuario, { nombre_user: nombre, email });
    if (r) {
      setUsrModo(null);
      setAvisoUsr('Se guardaron los cambios del usuario.');
    }
  };

  const errorCarga = qMat.error ?? qAnios.error ?? qTurnos.error ?? qUsuarios.error ?? qProp.error ?? qCursos.error ?? qClases.error;
  const grupos = gruposDeMaterias(qMat.data, qAnios.data);

  return (
    <>
      <div style={css('padding: 22px 28px 22px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482; margin-bottom: 15px;')}>
          <span onClick={() => ir('A7')} style={css('display: flex; align-items: center; gap: 6px; color: #2f5fd0; cursor: pointer;')}>
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

        <div style={css('display: flex; align-items: center; gap: 20px;')}>
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
            <div style={css('font-size: 28px; font-weight: 600; letter-spacing: -0.025em;')}>
              {p.apellido}, {p.nombre}
            </div>
            <div style={css('display: flex; align-items: center; gap: 8px;')}>
              <span className="mono" style={css('font-size: 11.5px; font-weight: 600; padding: 4px 11px; border-radius: 13px; background: #f2f4f7; color: #4a5462;')}>
                {p.legajo || 'Sin legajo'}
              </span>
              <span style={css('font-size: 11.5px; font-weight: 600; padding: 4px 11px; border-radius: 13px; background: #e9f2ec; color: #2f6b45;')}>Activo</span>
              <span style={css(PILL + ' background: ' + ar.fondo + '; color: ' + ar.texto + ';')}>{area ?? 'Sin área'}</span>
            </div>
          </div>
          <div style={css('flex-grow: 1;')}></div>
          <div style={css('display: flex; align-items: center; gap: 10px;')}>
            <span style={css('font-size: 12px; color: #6b7482;')}>Ver otro profesor</span>
            <select
              value={String(p.id_profesor)}
              onChange={(e) => ir('A9', { id_profesor: Number(e.target.value) })}
              style={css('height: 38px; min-width: 230px; padding: 0 12px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; background: #fcfdfe; color: #14181f;')}
            >
              {profesores.map((x) => (
                <option key={x.id_profesor} value={String(x.id_profesor)}>
                  {x.apellido}, {x.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {errorCarga && (
        <div style={css('padding: 16px 28px 0;')}>
          <MensajeError mensaje={errorCarga.message} />
        </div>
      )}

      <div style={css('display: flex; gap: 18px; padding: 20px 28px 28px; align-items: flex-start;')}>
        {/* ---------------- columna izquierda ---------------- */}
        <div style={css('width: 468px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;')}>
          <div style={css(TARJETA)}>
            <div style={css('padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Datos personales</div>
            </div>
            {avisoDatos && <div style={css(AVISO_OK)}>{avisoDatos}</div>}
            {!editDatos && (
              <div style={css('padding: 18px 20px 20px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 17px;')}>
                <Dato etiqueta="Documento" valor={p.documento} mono />
                <Dato etiqueta="Legajo" valor={p.legajo || '—'} mono />
                <Dato etiqueta="Teléfono" valor={p.telefono || '—'} mono />
                <Dato etiqueta="Fecha de ingreso" valor="—" mono />
                <Dato etiqueta="Correo electrónico" valor={p.correo_electronico || '—'} ancho />
                <Dato etiqueta="Dirección" valor={p.direccion || '—'} ancho />
                <Dato etiqueta="Cargo" valor={p.cargo_asociado || 'Sin cargo'} ancho />
              </div>
            )}

            {/* editar_profesor: un solo formulario con todos los datos */}
            {editDatos && (
              <div style={css('padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 12px; background: #fafbfc;')}>
                <div style={css('font-size: 12px; color: #7a8393;')}>Los campos marcados con * son obligatorios. Legajo y cargo se pueden dejar vacíos.</div>
                <div style={css('display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;')}>
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
                <div style={css('display: flex; gap: 8px; justify-content: flex-end;')}>
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
            <div style={css('display: flex; align-items: center; gap: 12px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
                <div style={css('font-size: 13px; font-weight: 600;')}>Usuario</div>
                <div style={css('font-size: 12px; color: #6b7482;')}>Con este usuario el profesor ingresa al sistema</div>
              </div>
              <div style={css('flex-grow: 1;')}></div>
              <span style={css(PILL + (tieneUsuario ? ' background: #e9f2ec; color: #2f6b45;' : ' background: #fdf4e7; color: #7a5310;'))}>
                {tieneUsuario ? 'Asignado' : 'Sin usuario'}
              </span>
            </div>

            {avisoUsr && <div style={css(AVISO_OK)}>{avisoUsr}</div>}

            {modo === 'ver' && (
              <div style={css('padding: 16px 20px 18px; display: flex; flex-direction: column; gap: 14px;')}>
                <div style={css('display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px;')}>
                  <Dato etiqueta="Nombre de usuario" valor={u?.nombre_user ?? (qUsuarios.isLoading ? '…' : '—')} mono />
                  <Dato etiqueta="Rol" valor={u ? u.rol?.nombre_rol ?? 'Sin rol' : '—'} />
                  <Dato etiqueta="Email" valor={u?.email ?? '—'} ancho />
                </div>
                <div style={css('display: flex; gap: 8px;')}>
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
                <div style={css('font-size: 12px; color: #7a8393; line-height: 1.45;')}>La contraseña y el rol se cambian desde Usuarios.</div>
                {errUsr && <div style={css(ERROR_TXT)}>{errUsr}</div>}
                <div style={css('display: flex; gap: 8px; justify-content: flex-end;')}>
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
                <div style={css('font-size: 12.5px; color: #4a5462; line-height: 1.5;')}>
                  {tieneUsuario
                    ? 'Elegí el usuario que pasa a ser de este profesor. Reemplaza a ' + (u?.nombre_user ?? 'el actual') + '.'
                    : 'Sin usuario asignado: el profesor todavía no puede ingresar al sistema. Elegí uno de los usuarios que no están vinculados a otro profesor.'}
                </div>
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
                    No hay usuarios libres. Crealo en Usuarios y volvé a la ficha.
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
            <div style={css('display: flex; align-items: center; gap: 12px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
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
                <div style={css('font-size: 12px; color: #6b7482;')}>
                  Tocá una materia para habilitarla o quitarla. El cambio se ve en la ficha de la materia y en la planificación.
                </div>
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

          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 16px; display: flex; gap: 10px;')}>
            <button
              onClick={abrirEditar}
              style={css('flex-grow: 1; height: 40px; border-radius: 8px; border: 1px solid #d3d9e2; background: #fff; color: #14181f; font-size: 13px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 9px;')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h4L19 9l-4-4L4 16v4z"></path>
              </svg>
              Editar datos
            </button>
            <button
              disabled
              title="No disponible en la API: no hay un command para dar de baja a un profesor."
              style={css('flex-grow: 1; height: 40px; border-radius: 8px; border: 1px solid #edc9c4; background: #fff; color: #b03a2e; font-size: 13px; font-weight: 500; opacity: 0.55; cursor: not-allowed;')}
            >
              Dar de baja
            </button>
          </div>
        </div>

        {/* ---------------- columna derecha ---------------- */}
        <div style={css('flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px;')}>
          {/* enlace 1: disponibilidad */}
          <div style={css(TARJETA)}>
            <div style={css('display: flex; align-items: center; gap: 12px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
                <div style={css('font-size: 13px; font-weight: 600;')}>Disponibilidad declarada</div>
                <div style={css('font-size: 12px; color: #6b7482;')}>La cargó el propio profesor desde su cuenta</div>
              </div>
              <div style={css('flex-grow: 1;')}></div>
              <button
                onClick={() => ir('A2', { id_profesor: p.id_profesor })}
                style={css('display: flex; align-items: center; gap: 7px; height: 34px; padding: 0 14px; border-radius: 7px; border: 1px solid #d3d9e2; background: #fff; color: #14181f; font-size: 12.5px; font-weight: 600;')}
              >
                Ver y editar
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6"></path>
                </svg>
              </button>
            </div>
            <div style={css('padding: 18px 20px 20px; display: flex; gap: 26px; align-items: center;')}>
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
              <div style={css('display: flex; flex-direction: column; gap: 10px;')}>
                <div style={css('display: flex; align-items: baseline; gap: 8px;')}>
                  <span className="mono" style={css(`font-size: 26px; font-weight: 600; color: ${ACCENT};`)}>
                    {franjas}
                  </span>
                  <span style={css('font-size: 12.5px; color: #6b7482;')}>
                    de {horasDelTurno(turno)} franjas declaradas · turno {turno?.nombre ?? '—'}
                  </span>
                </div>
                <div style={css('display: flex; align-items: center; gap: 14px; font-size: 11.5px; color: #6b7482;')}>
                  <span style={css('display: flex; align-items: center; gap: 6px;')}>
                    <span style={css('width: 11px; height: 11px; border-radius: 3px; background: #e9f2ec; border: 1px solid #bfdcca;')}></span>Disponible
                  </span>
                  <span style={css('display: flex; align-items: center; gap: 6px;')}>
                    <span style={css('width: 11px; height: 11px; border-radius: 3px; background: #fafbfc; border: 1px solid #e8ecf1;')}></span>No disponible
                  </span>
                </div>
                <div style={css('font-size: 12px; color: #7a8393; line-height: 1.5; max-width: 300px;')}>
                  Es lo que el generador usa para ubicarlo en la grilla: no se le puede asignar una materia en una franja que no declaró.
                </div>
              </div>
            </div>
          </div>

          {/* enlace 2: materias asignadas */}
          <div style={css(TARJETA)}>
            <div style={css('display: flex; align-items: center; gap: 12px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
                <div style={css('font-size: 13px; font-weight: 600;')}>Materias asignadas</div>
                <div style={css('font-size: 12px; color: #6b7482;')}>Lo que dicta este ciclo, según la planilla validada</div>
              </div>
              <div style={css('flex-grow: 1;')}></div>
              <button
                onClick={() => ir('A12')}
                style={css(`display: flex; align-items: center; gap: 7px; height: 34px; padding: 0 14px; border-radius: 7px; border: none; background: ${ACCENT}; color: #fff; font-size: 12.5px; font-weight: 600;`)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
                Asignar materias
              </button>
            </div>

            <div style={css('display: grid; grid-template-columns: 1fr 120px 90px; gap: 12px; padding: 10px 20px; background: #fafbfc; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Materia</div>
              <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Curso</div>
              <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393; text-align: right;')}>Horas</div>
            </div>
            {qClases.isLoading && <Cargando />}
            {idCiclo && qProp.data && !vigente && (
              <div style={css('padding: 12px 20px; border-bottom: 1px solid #f4f6f8; font-size: 12.5px; color: #6b7482;')}>
                El ciclo {activo?.anio_calendario} todavía no tiene una planificación validada.
              </div>
            )}
            {vigente && qClases.data && asignadas.length === 0 && (
              <div style={css('padding: 12px 20px; border-bottom: 1px solid #f4f6f8; font-size: 12.5px; color: #6b7482;')}>
                No tiene clases en {vigente.codigo}.
              </div>
            )}
            {asignadas.map((a) => (
              <div key={a.id} style={css('display: grid; grid-template-columns: 1fr 120px 90px; gap: 12px; padding: 12px 20px; border-bottom: 1px solid #f4f6f8;')}>
                <div style={css('font-size: 13px; font-weight: 500;')}>{a.materia}</div>
                <div style={css('font-size: 13px; color: #4a5462;')}>{a.curso}</div>
                <div className="mono" style={css('font-size: 12.5px; color: #4a5462; text-align: right;')}>
                  {a.horas} h
                </div>
              </div>
            ))}

            <div style={css('display: flex; align-items: center; gap: 16px; padding: 15px 20px;')}>
              <div style={css('display: flex; align-items: baseline; gap: 7px;')}>
                <span className="mono" style={css('font-size: 20px; font-weight: 600;')}>
                  {totalHoras}
                </span>
                <span style={css('font-size: 12.5px; color: #6b7482;')}>horas cátedra semanales</span>
              </div>
              <div style={css('flex-grow: 1; max-width: 300px;')}>
                <div style={css('height: 6px; border-radius: 3px; background: #eef1f5; overflow: hidden;')}>
                  <div style={css('height: 6px; width: ' + Math.min(100, Math.round((totalHoras / 36) * 100)) + '%; background: ' + (totalHoras > 36 ? '#b03a2e' : ACCENT) + ';')}></div>
                </div>
              </div>
              <span style={css('font-size: 12px; color: #6b7482;')}>Tope provincial 36 h</span>
            </div>
          </div>

          {sinMargen && (
            <div style={css('border-radius: 10px; padding: 14px 16px; background: #f3f6fc; border: 1px solid #cfdcf5; display: flex; gap: 11px; align-items: flex-start;')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" style={css('flex-shrink: 0; margin-top: 1px;')}>
                <path d="M12 11.5v5M12 8v.5"></path>
                <circle cx="12" cy="12" r="9"></circle>
              </svg>
              <span style={css('font-size: 12.5px; color: #2c4570; line-height: 1.55;')}>
                Declaró {franjas} franjas y ya tiene {totalHoras} horas asignadas: queda poco margen para darle más materias o para que cubra una suplencia.
              </span>
            </div>
          )}
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
