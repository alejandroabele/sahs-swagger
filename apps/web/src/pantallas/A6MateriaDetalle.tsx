// A6 · Ficha de la materia. Prototipo: <template id="tpl-materiadetalle"> y DC.registrar("materiadetalle") en prototipo/index.html.
// Ruta /materias/:id. Datos (orientacion.get_materia), años académicos (planificacion.get_anios_academicos,
// nombre y selector de edición), orientaciones y áreas (selectores de edición), docentes habilitados
// (orientacion.get_profesores_materia), cambio de año, orientación y área, y baja (orientacion.eliminar_materia).
// Habilitar o quitar un docente: asignar_materias_habilitadas con su lista (profesor_suplencias.get_profesor);
// la lista de profesores (profesor_suplencias.get_profesores) se pide recién al abrir "Agregar".
import { useEffect, useState, type ReactNode } from 'react';
import type { Materia } from '@sahs/contratos';
import { orientacion, planificacion, profesorSuplencias } from '../api';
import { useIr, useParamRuta } from '../app/navegar';
import { rutas } from '../app/rutas';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useAccion, useConsulta } from '../estado/consultas';
import { css } from '../lib/css';
import { iniciales } from '../lib/formato';
import { colorArea, numeroAnio } from './a5/comun';

const ACCENT = '#2f5fd0';
const CAMPO = 'width: 100%; box-sizing: border-box; height: 36px; padding: 0 10px; border-radius: 7px; border: 1px solid #dfe4ea; font-size: 13px; color: #14181f; background: #fcfdfe;';

interface Cambios {
  id: number;
  idAnio: number | null;
  idOrientacion: number | null;
  /** Área actual y nueva (null = sin área). */
  areaAntes: number | null;
  areaDespues: number | null | undefined;
}

export default function A6MateriaDetalle() {
  const ir = useIr();
  const id = useParamRuta('id');

  useEffect(() => {
    if (id == null) ir(rutas.materias());
  }, [id, ir]);

  const qMateria = useConsulta(['orientacion', 'get_materia', id], () => orientacion.get_materia(id!), { enabled: id != null });
  const qOrientaciones = useConsulta(['orientacion', 'get_orientaciones'], () => orientacion.get_orientaciones());
  const qAreas = useConsulta(['orientacion', 'get_areas'], () => orientacion.get_areas());
  const qAnios = useConsulta(['planificacion', 'get_anios_academicos'], () => planificacion.get_anios_academicos());
  const qHabilitados = useConsulta(['orientacion', 'get_profesores_materia', id], () => orientacion.get_profesores_materia(id!), {
    enabled: id != null,
  });

  const [agregando, setAgregando] = useState(false);
  // La lista de profesores solo la usa "Agregar": se pide al abrirlo.
  const qProfesores = useConsulta(['profesor_suplencias', 'get_profesores'], () => profesorSuplencias.get_profesores(), { enabled: agregando });

  // asignar_materias_habilitadas recibe la lista completa: se parte de la que tiene hoy el profesor.
  const habilitar = useAccion(
    async (idProfesor: number, idMateria: number, agregar: boolean) => {
      const p = await profesorSuplencias.get_profesor(idProfesor);
      const ids = (p.lista_materias_habilitadas ?? []).map((x) => x.id_materia).filter((x): x is number => x != null && x !== idMateria);
      return profesorSuplencias.asignar_materias_habilitadas(idProfesor, { ids_materias: agregar ? [...ids, idMateria] : ids });
    },
    ['profesor_suplencias', 'orientacion'],
  );
  const guardar = useAccion(async (c: Cambios) => {
    if (c.idAnio != null) await orientacion.asignar_anio_academico_a_materia(c.id, { id_anio_academico: c.idAnio });
    if (c.idOrientacion != null) await orientacion.asignar_materia_orientacion(c.id, { id_orientacion: c.idOrientacion });
    if (c.areaDespues !== undefined) {
      if (c.areaDespues == null) {
        if (c.areaAntes != null) await orientacion.quitar_materia_area(c.areaAntes, c.id);
      } else await orientacion.asignar_materia_area(c.areaDespues, { id_materia: c.id });
    }
    return true;
  }, ['orientacion']);
  const eliminar = useAccion((idM: number) => orientacion.eliminar_materia(idM).then(() => true), ['orientacion']);

  const [confirmando, setConfirmando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [fAnio, setFAnio] = useState('');
  const [fOr, setFOr] = useState('');
  const [fArea, setFArea] = useState('');

  // Al cambiar de materia se cierran los paneles abiertos.
  useEffect(() => {
    setAgregando(false);
    setConfirmando(false);
    setEditando(false);
    habilitar.limpiarError();
    guardar.limpiarError();
    eliminar.limpiarError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const raiz = (hijos: ReactNode) => (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />
      {hijos}
    </div>
  );

  if (id == null) return raiz(<Cargando />);
  if (qMateria.isLoading) return raiz(<Cargando />);
  if (qMateria.error || !qMateria.data) {
    return raiz(
      <div className="r-margen" style={css('padding: 28px; display: flex; flex-direction: column; gap: 14px; align-items: flex-start;')}>
        <MensajeError mensaje={qMateria.error?.message ?? 'No se encontró la materia.'} />
        <button onClick={() => ir(rutas.materias())} style={css('height: 36px; padding: 0 14px; border-radius: 8px; border: 1px solid #d3d9e2; background: #fff; font-size: 13px;')}>
          Volver al listado
        </button>
      </div>,
    );
  }

  const m: Materia = qMateria.data;
  const anios = qAnios.data;
  const anioN = numeroAnio(m.id_anio_academico, anios);
  const anioTxt = anioN ? anioN + '° año' : 'Sin año';
  const nombreOr = m.orientacion?.nombre_orientacion ?? '—';
  const nombreArea = m.area?.nombre_area ?? null;
  const ar = colorArea(nombreArea);

  // Docentes
  const habilitados = qHabilitados.data ?? [];
  const idsHabilitados = new Set(habilitados.map((p) => p.id_profesor));
  const candidatos = (qProfesores.data ?? []).filter((p) => !idsHabilitados.has(p.id_profesor));
  const nombreProf = (p: { nombre?: string; apellido?: string }) => (p.nombre ?? '') + ' ' + (p.apellido ?? '');
  const totalClases = (m.ids_clases ?? []).length;

  const abrirEdicion = () => {
    setFAnio(m.id_anio_academico != null ? String(m.id_anio_academico) : '');
    setFOr(String(m.id_orientacion));
    setFArea(m.id_area != null ? String(m.id_area) : '');
    guardar.limpiarError();
    setEditando(!editando);
  };

  const guardarCambios = async () => {
    const nuevoAnio = fAnio === '' ? null : Number(fAnio);
    const nuevaArea = fArea === '' ? null : Number(fArea);
    const ok = await guardar.ejecutar({
      id: m.id_materia,
      idAnio: nuevoAnio != null && nuevoAnio !== m.id_anio_academico ? nuevoAnio : null,
      idOrientacion: Number(fOr) !== m.id_orientacion ? Number(fOr) : null,
      areaAntes: m.id_area ?? null,
      areaDespues: nuevaArea !== (m.id_area ?? null) ? nuevaArea : undefined,
    });
    if (ok) setEditando(false);
  };

  const confirmarBaja = async () => {
    const ok = await eliminar.ejecutar(m.id_materia);
    if (ok) ir(rutas.materias());
  };

  const etiqueta = (t: string) => <div style={css('font-size: 11.5px; color: #7a8393; margin-bottom: 5px;')}>{t}</div>;

  return raiz(
    <>
      <div className="r-margen" style={css('padding: 22px 28px 22px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div className="r-envolver" style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482; margin-bottom: 14px;')}>
          <span onClick={() => ir(rutas.materias())} style={css('display: flex; align-items: center; gap: 6px; color: #2f5fd0; cursor: pointer;')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6"></path>
            </svg>
            Volver al listado
          </span>
          <span style={css('color: #c3cad4;')}>/</span>
          <span>Materias</span>
          <span style={css('color: #c3cad4;')}>/</span>
          <span style={css('color: #14181f; font-weight: 500;')}>{m.nombre_materia}</span>
        </div>

        <div className="r-envolver r-apilar-movil" style={css('display: flex; align-items: flex-end; gap: 20px;')}>
          <div style={css('display: flex; flex-direction: column; gap: 10px;')}>
            <div className="r-titulo" style={css('font-size: 30px; font-weight: 600; letter-spacing: -0.025em;')}>{m.nombre_materia}</div>
            <div className="r-envolver" style={css('display: flex; align-items: center; gap: 8px;')}>
              <span style={css('font-size: 11.5px; font-weight: 600; padding: 4px 11px; border-radius: 13px; background: #f2f4f7; color: #4a5462;')}>{anioTxt}</span>
              <span style={css('font-size: 11.5px; font-weight: 600; padding: 4px 11px; border-radius: 13px; background: ' + ar.fondo + '; color: ' + ar.texto + ';')}>
                {nombreArea ?? 'Sin área'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="r-margen r-apilar" style={css('display: flex; gap: 18px; padding: 20px 28px 28px; align-items: flex-start;')}>
        <div style={css('flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px;')}>
          {/* Datos de la materia */}
          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('display: flex; align-items: center; gap: 10px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Datos de la materia</div>
              {editando && <span style={css('font-size: 12px; color: #6b7482;')}>· Editando</span>}
            </div>
            <div style={css('padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 18px;')}>
              <div className="r-grilla" style={css('display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px;')}>
                <div>
                  {etiqueta('Año académico')}
                  {editando ? (
                    <select value={fAnio} onChange={(e) => setFAnio(e.target.value)} style={css(CAMPO)}>
                      {m.id_anio_academico == null && <option value="">Sin año</option>}
                      {(anios ?? []).map((a) => (
                        <option key={a.id_anio_academico} value={String(a.id_anio_academico)}>
                          {a.anio_curricular}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={css('font-size: 13.5px; font-weight: 500;')}>{anioTxt}</div>
                  )}
                </div>
                <div>
                  {etiqueta('Orientación')}
                  {editando ? (
                    <select value={fOr} onChange={(e) => setFOr(e.target.value)} style={css(CAMPO)}>
                      {(qOrientaciones.data ?? []).map((o) => (
                        <option key={o.id_orientacion} value={String(o.id_orientacion)}>
                          {o.nombre_orientacion}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={css('font-size: 13.5px; font-weight: 500;')}>{nombreOr}</div>
                  )}
                </div>
                <div>
                  {etiqueta('Área')}
                  {editando ? (
                    <select value={fArea} onChange={(e) => setFArea(e.target.value)} style={css(CAMPO)}>
                      <option value="">Sin área</option>
                      {(qAreas.data ?? []).map((a) => (
                        <option key={a.id_area} value={String(a.id_area)}>
                          {a.nombre_area}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={css('font-size: 13.5px; font-weight: 500;')}>{nombreArea ?? 'Sin área'}</div>
                  )}
                </div>
                <div>
                  {etiqueta('Horas cátedra semanales')}
                  {editando ? (
                    <input type="text" value={m.horas_semanales + ' h'} disabled style={css(CAMPO + ' background: #f4f6f8; color: #8b95a5;')} />
                  ) : (
                    <div className="mono" style={css('font-size: 13.5px; font-weight: 500;')}>{m.horas_semanales + ' h'}</div>
                  )}
                </div>
              </div>
              <div>
                <div style={css('font-size: 11.5px; color: #7a8393; margin-bottom: 6px;')}>Descripción</div>
                <div style={css('font-size: 13px; line-height: 1.6; color: #2c333d; max-width: 640px;')}>{m.descripcion_materia || 'Sin descripción'}</div>
              </div>
              {editando && (
                <div style={css('display: flex; flex-direction: column; gap: 12px;')}>
                  <MensajeError mensaje={guardar.error} alCerrar={guardar.limpiarError} />
                  <div className="r-envolver" style={css('display: flex; gap: 10px;')}>
                    <button
                      onClick={guardarCambios}
                      disabled={guardar.enCurso}
                      style={css('height: 36px; padding: 0 16px; border-radius: 8px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 13px; font-weight: 600;')}
                    >
                      {guardar.enCurso ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                    <button
                      onClick={() => setEditando(false)}
                      style={css('height: 36px; padding: 0 14px; border-radius: 8px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 13px; font-weight: 500;')}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={css('width: 350px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;')}>
          {/* Docentes habilitados */}
          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('display: flex; align-items: flex-start; gap: 12px; padding: 15px 16px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
                <div style={css('font-size: 13px; font-weight: 600;')}>Docentes habilitados</div>
                <div style={css('font-size: 12px; color: #6b7482;')}>
                  {habilitados.length === 0 ? 'Ninguno' : habilitados.length === 1 ? '1 docente puede dictarla' : habilitados.length + ' docentes pueden dictarla'}
                </div>
              </div>
              <div style={css('flex-grow: 1;')}></div>
              <button
                onClick={() => setAgregando(!agregando)}
                style={css(
                  'display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 11px; border-radius: 7px; font-size: 12px; font-weight: 600; flex-shrink: 0;' +
                    (agregando ? ' border: 1px solid #d3d9e2; background: #fff; color: #4a5462;' : ' border: none; background: ' + ACCENT + '; color: #fff;'),
                )}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" style={css('flex-shrink: 0;')}>
                  <path d={agregando ? 'M6 6l12 12M18 6L6 18' : 'M12 5v14M5 12h14'}></path>
                </svg>
                {agregando ? 'Cerrar' : 'Agregar'}
              </button>
            </div>

            {habilitar.error && (
              <div style={css('padding: 12px 16px 0;')}>
                <MensajeError mensaje={habilitar.error} alCerrar={habilitar.limpiarError} />
              </div>
            )}

            {qHabilitados.isLoading && <Cargando />}
            {qHabilitados.error && (
              <div style={css('padding: 12px 16px 0;')}>
                <MensajeError mensaje={qHabilitados.error.message} />
              </div>
            )}

            {habilitados.length > 0 && (
              <div>
                {habilitados.map((p) => {
                  return (
                    <div key={p.id_profesor} style={css('display: flex; align-items: center; gap: 11px; padding: 11px 16px; border-bottom: 1px solid #f4f6f8;')}>
                      <span
                        style={css('width: 30px; height: 30px; border-radius: 50%; background: #eef1f5; color: #5b6471; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0;')}
                      >
                        {iniciales(p.nombre ?? '', p.apellido ?? '')}
                      </span>
                      <span style={css('display: flex; flex-direction: column; gap: 2px; min-width: 0; flex-grow: 1;')}>
                        <span style={css('font-size: 12.5px; font-weight: 500;')}>{nombreProf(p)}</span>
                      </span>
                      <button
                        onClick={() => p.id_profesor != null && habilitar.ejecutar(p.id_profesor, m.id_materia, false)}
                        disabled={habilitar.enCurso}
                        title="Quitar"
                        style={css('width: 28px; height: 28px; border-radius: 7px; border: 1px solid #e2e6ec; background: #fff; color: #8b95a5; display: flex; align-items: center; justify-content: center; flex-shrink: 0;')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <path d="M6 6l12 12M18 6L6 18"></path>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {habilitados.length === 0 && !qHabilitados.isLoading && !qHabilitados.error && (
              <div style={css('margin: 16px; padding: 13px 14px; border-radius: 9px; background: #fdf1e3; border: 1px solid #f0d3ae;')}>
                <div style={css('font-size: 12px; color: #8a4b12; line-height: 1.55;')}>
                  Ningún docente está habilitado para dictarla.
                </div>
              </div>
            )}

            {agregando && (
              <div style={css('padding: 14px 16px 16px; background: #fafbfc; border-top: 1px solid #eef1f5;')}>
                <div style={css('font-size: 12px; font-weight: 600; color: #4a5462; margin-bottom: 11px;')}>Elegí quién más puede dictarla</div>
                {qProfesores.isLoading ? (
                  <Cargando />
                ) : qProfesores.error ? (
                  <MensajeError mensaje={qProfesores.error.message} />
                ) : candidatos.length > 0 ? (
                  <div style={css('display: flex; flex-direction: column; gap: 7px; max-height: 268px; overflow-y: auto;')}>
                    {candidatos.map((p) => {
                      return (
                        <button
                          key={p.id_profesor}
                          onClick={() => habilitar.ejecutar(p.id_profesor, m.id_materia, true)}
                          disabled={habilitar.enCurso}
                          style={css('display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 11px; border-radius: 8px; border: 1px solid #e2e6ec; background: #fff; text-align: left;')}
                        >
                          <span
                            style={css('width: 28px; height: 28px; border-radius: 50%; background: #eef1f5; color: #5b6471; display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 600; flex-shrink: 0;')}
                          >
                            {iniciales(p.nombre, p.apellido)}
                          </span>
                          <span style={css('display: flex; flex-direction: column; gap: 2px; min-width: 0; flex-grow: 1;')}>
                            <span style={css('font-size: 12.5px; font-weight: 500;')}>{nombreProf(p)}</span>
                          </span>
                          <span style={css('font-size: 11.5px; font-weight: 600; color: ' + ACCENT + '; flex-shrink: 0;')}>Agregar</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={css('font-size: 12px; color: #6b7482; line-height: 1.55;')}>Todos los docentes de la institución ya están habilitados en esta materia.</div>
                )}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 11px;')}>
            <div style={css('font-size: 13px; font-weight: 600;')}>Acciones</div>
            <button
              onClick={abrirEdicion}
              style={css(
                'height: 40px; border-radius: 8px; border: 1px solid #d3d9e2; background: ' + (editando ? '#f3f6fc' : '#fff') + '; color: #14181f; font-size: 13px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 9px;',
              )}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h4L19 9l-4-4L4 16v4z"></path>
              </svg>
              {editando ? 'Cerrar la edición' : 'Editar datos'}
            </button>
            <button
              onClick={() => {
                eliminar.limpiarError();
                setConfirmando(!confirmando);
              }}
              style={css('height: 40px; border-radius: 8px; font-size: 13px; font-weight: 500; border: 1px solid #edc9c4; background: #fff; color: #b03a2e;')}
            >
              Dar de baja
            </button>
            {confirmando && (
              <div style={css('padding: 13px 14px; border-radius: 9px; background: #fdf1e3; border: 1px solid #f0d3ae; display: flex; flex-direction: column; gap: 10px;')}>
                <div style={css('font-size: 12px; color: #8a4b12; line-height: 1.55;')}>
                  {'Se va a quitar ' + m.nombre_materia + ' del plan de ' + anioTxt + ' (' + nombreOr + '). Deja de ofrecerse al armar las próximas planificaciones.' +
                    (totalClases > 0 ? ' Tiene ' + totalClases + (totalClases === 1 ? ' clase' : ' clases') + ' en planificaciones: mientras las tenga no se puede eliminar.' : '')}
                </div>
                <MensajeError mensaje={eliminar.error} />
                <div className="r-envolver" style={css('display: flex; gap: 8px;')}>
                  <button
                    onClick={confirmarBaja}
                    disabled={eliminar.enCurso}
                    style={css('height: 32px; padding: 0 13px; border-radius: 7px; border: none; background: #b03a2e; color: #fff; font-size: 12px; font-weight: 600;')}
                  >
                    {eliminar.enCurso ? 'Eliminando…' : 'Sí, dar de baja'}
                  </button>
                  <button
                    onClick={() => setConfirmando(false)}
                    style={css('height: 32px; padding: 0 13px; border-radius: 7px; border: 1px solid #f0d3ae; background: #fff; color: #8a4b12; font-size: 12px; font-weight: 500;')}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
  );
}
