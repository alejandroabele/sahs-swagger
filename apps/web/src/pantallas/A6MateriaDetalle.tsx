// A6 · Ficha de la materia. Prototipo: <template id="tpl-materiadetalle"> y DC.registrar("materiadetalle") en prototipo/index.html.
// Lee ?id_materia=. Datos (orientacion.get_materia), docentes habilitados (profesor_suplencias.get_profesores
// + asignar_materias_habilitadas), cursos donde se dicta (planificacion.get_cursos / get_clases),
// cambio de año, orientación y área, y baja (orientacion.eliminar_materia).
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Materia, Profesor } from '@sahs/contratos';
import { orientacion, planificacion, profesorSuplencias } from '../api';
import { useNavegar, useParamNumero } from '../app/navegar';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useAccion, useConsulta } from '../estado/consultas';
import { useCiclo } from '../estado/ciclo';
import { css } from '../lib/css';
import { iniciales } from '../lib/formato';
import { colorArea, habilitadosEn, nombreCurso, numeroAnio } from './a5/comun';

const ACCENT = '#2f5fd0';
const CAMPO = 'width: 100%; box-sizing: border-box; height: 36px; padding: 0 10px; border-radius: 7px; border: 1px solid #dfe4ea; font-size: 13px; color: #14181f; background: #fcfdfe;';
const NO_API = 'No disponible en la API: no hay un command para cambiar el nombre, las horas ni la descripción de una materia.';

interface Cambios {
  id: number;
  idAnio: number | null;
  idOrientacion: number | null;
  /** Área actual y nueva (null = sin área). */
  areaAntes: number | null;
  areaDespues: number | null | undefined;
}

export default function A6MateriaDetalle() {
  const ir = useNavegar();
  const id = useParamNumero('id_materia');
  const ciclo = useCiclo();

  useEffect(() => {
    if (id == null) ir('A5');
  }, [id, ir]);

  const qMateria = useConsulta(['orientacion', 'get_materia', id], () => orientacion.get_materia(id!), { enabled: id != null });
  const qMaterias = useConsulta(['orientacion', 'get_materias'], () => orientacion.get_materias());
  const qOrientaciones = useConsulta(['orientacion', 'get_orientaciones'], () => orientacion.get_orientaciones());
  const qAreas = useConsulta(['orientacion', 'get_areas'], () => orientacion.get_areas());
  const qAnios = useConsulta(['planificacion', 'get_anios_academicos'], () => planificacion.get_anios_academicos());
  const qCursos = useConsulta(['planificacion', 'get_cursos'], () => planificacion.get_cursos());
  const qClases = useConsulta(['planificacion', 'get_clases'], () => planificacion.get_clases());
  const qProfesores = useConsulta(['profesor_suplencias', 'get_profesores'], () => profesorSuplencias.get_profesores());

  const habilitar = useAccion(
    (idProfesor: number, ids: number[]) => profesorSuplencias.asignar_materias_habilitadas(idProfesor, { ids_materias: ids }),
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

  const [agregando, setAgregando] = useState(false);
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

  const materiasPorId = useMemo(() => new Map((qMaterias.data ?? []).map((m) => [m.id_materia, m] as const)), [qMaterias.data]);

  /** Área principal de un profesor: la más repetida entre sus materias habilitadas (el Profesor no tiene área propia). */
  const areaDe = (p: Profesor): string | null => {
    const cuenta = new Map<string, number>();
    for (const mh of p.lista_materias_habilitadas ?? []) {
      const n = materiasPorId.get(mh.id_materia ?? -1)?.area?.nombre_area;
      if (n) cuenta.set(n, (cuenta.get(n) ?? 0) + 1);
    }
    let mejor: string | null = null;
    let max = 0;
    cuenta.forEach((v, k) => {
      if (v > max) {
        max = v;
        mejor = k;
      }
    });
    return mejor;
  };

  const raiz = (hijos: ReactNode) => (
    <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />
      {hijos}
    </div>
  );

  if (id == null) return raiz(<Cargando />);
  if (qMateria.isLoading) return raiz(<Cargando />);
  if (qMateria.error || !qMateria.data) {
    return raiz(
      <div style={css('padding: 28px; display: flex; flex-direction: column; gap: 14px; align-items: flex-start;')}>
        <MensajeError mensaje={qMateria.error?.message ?? 'No se encontró la materia.'} />
        <button onClick={() => ir('A5')} style={css('height: 36px; padding: 0 14px; border-radius: 8px; border: 1px solid #d3d9e2; background: #fff; font-size: 13px;')}>
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

  // "Ver otra materia"
  const opciones = [...(qMaterias.data ?? [])]
    .map((x) => ({ x, a: numeroAnio(x.id_anio_academico, anios), o: x.orientacion?.nombre_orientacion ?? '' }))
    .sort((p, q) => p.a - q.a || p.o.localeCompare(q.o) || p.x.nombre_materia.localeCompare(q.x.nombre_materia))
    .map(({ x, a, o }) => ({ valor: String(x.id_materia), label: x.nombre_materia + ' · ' + a + '° año' + (o && o !== 'Básica' ? ' · ' + o : '') }));

  // Docentes
  const profesores = qProfesores.data ?? [];
  const habilitados = habilitadosEn(m.id_materia, profesores);
  const idsDe = (p: Profesor) => (p.lista_materias_habilitadas ?? []).map((x) => x.id_materia).filter((x): x is number => x != null);
  const candidatos = profesores.filter((p) => !habilitados.includes(p));
  const nombreProf = (p: Profesor) => p.nombre + ' ' + p.apellido;

  // Cursos donde se dicta (en el ciclo elegido en la cabecera)
  const idCiclo = ciclo.activo?.id_ciclo_lectivo ?? null;
  const cursos = (qCursos.data ?? [])
    .filter((c) => (idCiclo == null || c.id_ciclo_lectivo === idCiclo) && (c.materias ?? []).some((x) => x.id_materia === m.id_materia))
    .sort((a, b) => nombreCurso(a, anios).localeCompare(nombreCurso(b, anios)));
  const clases = (qClases.data ?? []).filter((c) => c.id_materia === m.id_materia);
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
    if (ok) ir('A5');
  };

  const etiqueta = (t: string) => <div style={css('font-size: 11.5px; color: #7a8393; margin-bottom: 5px;')}>{t}</div>;

  return raiz(
    <>
      <div style={css('padding: 22px 28px 22px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482; margin-bottom: 14px;')}>
          <span onClick={() => ir('A5')} style={css('display: flex; align-items: center; gap: 6px; color: #2f5fd0; cursor: pointer;')}>
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

        <div style={css('display: flex; align-items: flex-end; gap: 20px;')}>
          <div style={css('display: flex; flex-direction: column; gap: 10px;')}>
            <div style={css('font-size: 30px; font-weight: 600; letter-spacing: -0.025em;')}>{m.nombre_materia}</div>
            <div style={css('display: flex; align-items: center; gap: 8px;')}>
              <span style={css('font-size: 11.5px; font-weight: 600; padding: 4px 11px; border-radius: 13px; background: #f2f4f7; color: #4a5462;')}>{anioTxt}</span>
              <span style={css('font-size: 11.5px; font-weight: 600; padding: 4px 11px; border-radius: 13px; background: ' + ar.fondo + '; color: ' + ar.texto + ';')}>
                {nombreArea ?? 'Sin área'}
              </span>
              <span style={css('font-size: 11.5px; font-weight: 600; padding: 4px 11px; border-radius: 13px; background: #e9f2ec; color: #2f6b45;')}>Activa en el plan</span>
            </div>
          </div>
          <div style={css('flex-grow: 1;')}></div>
          <div style={css('display: flex; align-items: center; gap: 10px;')}>
            <span style={css('font-size: 12px; color: #6b7482;')}>Ver otra materia</span>
            <select
              value={String(m.id_materia)}
              onChange={(e) => ir('A6', { id_materia: Number(e.target.value) })}
              style={css('height: 38px; min-width: 240px; padding: 0 12px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; background: #fcfdfe; color: #14181f;')}
            >
              {opciones.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={css('display: flex; gap: 18px; padding: 20px 28px 28px; align-items: flex-start;')}>
        <div style={css('flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px;')}>
          {/* Datos de la materia */}
          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('display: flex; align-items: center; gap: 10px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Datos de la materia</div>
              {editando && <span style={css('font-size: 12px; color: #6b7482;')}>· Editando</span>}
            </div>
            <div style={css('padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 18px;')}>
              <div style={css('display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px;')}>
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
                    <input type="text" value={m.horas_semanales + ' h'} disabled title={NO_API} style={css(CAMPO + ' background: #f4f6f8; color: #8b95a5;')} />
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
                  <div style={css('font-size: 11.5px; color: #7a8393; line-height: 1.5;')}>
                    Se pueden cambiar el año, la orientación y el área. El nombre, las horas y la descripción no: la API no tiene un command para eso.
                  </div>
                  <MensajeError mensaje={guardar.error} alCerrar={guardar.limpiarError} />
                  <div style={css('display: flex; gap: 10px;')}>
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

          {/* Cursos donde se dicta (no está en el diseño: la API lo informa) */}
          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('display: flex; align-items: flex-start; gap: 12px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
                <div style={css('font-size: 13px; font-weight: 600;')}>Cursos donde se dicta</div>
                <div style={css('font-size: 12px; color: #6b7482;')}>
                  {(ciclo.activo ? 'Ciclo ' + ciclo.activo.anio_calendario + ' · ' : '') +
                    (cursos.length === 0 ? 'Ninguno' : cursos.length === 1 ? '1 curso' : cursos.length + ' cursos') +
                    ' · ' +
                    (totalClases === 1 ? '1 clase en planificaciones' : totalClases + ' clases en planificaciones')}
                </div>
              </div>
            </div>
            {cursos.length === 0 ? (
              <div style={css('padding: 14px 20px; font-size: 12.5px; color: #6b7482;')}>
                Ningún curso del ciclo tiene esta materia en su plan. Se agrega desde el formulario del curso (A11).
              </div>
            ) : (
              <div>
                <div style={css('display: grid; grid-template-columns: 1fr 140px 120px 110px; gap: 12px; padding: 10px 20px; background: #fafbfc; border-bottom: 1px solid #eef1f5;')}>
                  {['Curso', 'Turno', 'Horas en el curso', 'Clases'].map((t) => (
                    <div key={t} style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>
                      {t}
                    </div>
                  ))}
                </div>
                {cursos.map((c) => {
                  const hs = (c.materias ?? []).find((x) => x.id_materia === m.id_materia)?.horas_semanales ?? m.horas_semanales;
                  const n = clases.filter((x) => x.id_curso === c.id_curso);
                  return (
                    <button
                      key={c.id_curso}
                      onClick={() => ir('A11', { id_curso: c.id_curso })}
                      title="Abrir el curso"
                      style={css('display: grid; grid-template-columns: 1fr 140px 120px 110px; gap: 12px; width: 100%; padding: 11px 20px; border: none; border-top: 1px solid #f2f4f7; background: #fff; text-align: left;')}
                    >
                      <span style={css('font-size: 13px; font-weight: 500;')}>{nombreCurso(c, anios) + (c.orientacion?.nombre_orientacion ? ' · ' + c.orientacion.nombre_orientacion : '')}</span>
                      <span style={css('font-size: 12.5px; color: #4a5462;')}>{c.turno?.nombre ?? '—'}</span>
                      <span className="mono" style={css('font-size: 12.5px; color: #4a5462;')}>{hs + ' h'}</span>
                      <span style={css('font-size: 12.5px; color: ' + (n.length ? '#4a5462' : '#a56a10') + ';')}>
                        {n.length === 0 ? 'Sin clases' : n.map((x) => x.codigo).join(', ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={css('display: flex; align-items: flex-start; gap: 11px; padding: 14px 16px; border-radius: 10px; border: 1px solid #e2e6ec; background: #fafbfc;')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8b95a5" strokeWidth="2" strokeLinecap="round" style={css('flex-shrink: 0; margin-top: 1px;')}>
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 11.5v5M12 8v.5"></path>
            </svg>
            <span style={css('font-size: 12.5px; color: #6b7482; line-height: 1.55;')}>
              Esta ficha es parte de la parametrización: define la materia y qué docentes pueden dictarla. En qué cursos se dicta, quién la da y en qué horario se decide después, al armar la planificación del ciclo.
            </span>
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

            {qProfesores.isLoading && <Cargando />}

            {habilitados.length > 0 && (
              <div>
                {habilitados.map((p) => {
                  const a = areaDe(p);
                  const otraArea = a != null && a !== nombreArea;
                  return (
                    <div key={p.id_profesor} style={css('display: flex; align-items: center; gap: 11px; padding: 11px 16px; border-bottom: 1px solid #f4f6f8;')}>
                      <span
                        style={css('width: 30px; height: 30px; border-radius: 50%; background: #eef1f5; color: #5b6471; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0;')}
                      >
                        {iniciales(p.nombre, p.apellido)}
                      </span>
                      <span style={css('display: flex; flex-direction: column; gap: 2px; min-width: 0; flex-grow: 1;')}>
                        <span style={css('font-size: 12.5px; font-weight: 500;')}>{nombreProf(p)}</span>
                        <span style={css('font-size: 11px; ' + (otraArea ? 'color: #a56a10;' : 'color: #8b95a5;'))}>
                          {otraArea ? 'De otra área: ' + a : 'Área ' + (a ?? '—')}
                        </span>
                      </span>
                      <button
                        onClick={() => habilitar.ejecutar(p.id_profesor, idsDe(p).filter((x) => x !== m.id_materia))}
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

            {habilitados.length === 0 && !qProfesores.isLoading && (
              <div style={css('margin: 16px; padding: 13px 14px; border-radius: 9px; background: #fdf1e3; border: 1px solid #f0d3ae;')}>
                <div style={css('font-size: 12px; color: #8a4b12; line-height: 1.55;')}>
                  Ningún docente está habilitado para dictarla. Mientras siga así, el generador no puede ubicarla en ninguna grilla.
                </div>
              </div>
            )}

            {agregando && (
              <div style={css('padding: 14px 16px 16px; background: #fafbfc; border-top: 1px solid #eef1f5;')}>
                <div style={css('font-size: 12px; font-weight: 600; color: #4a5462; margin-bottom: 11px;')}>Elegí quién más puede dictarla</div>
                {candidatos.length > 0 ? (
                  <div style={css('display: flex; flex-direction: column; gap: 7px; max-height: 268px; overflow-y: auto;')}>
                    {candidatos.map((p) => {
                      const a = areaDe(p);
                      const otraArea = a !== nombreArea;
                      return (
                        <button
                          key={p.id_profesor}
                          onClick={() => habilitar.ejecutar(p.id_profesor, [...idsDe(p), m.id_materia])}
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
                            <span style={css('font-size: 11px; ' + (otraArea ? 'color: #a56a10;' : 'color: #2f6b45;'))}>
                              {otraArea ? (a ? 'De otra área: ' + a : 'Sin materias habilitadas') : 'Misma área'}
                            </span>
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
                <div style={css('display: flex; gap: 8px;')}>
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
