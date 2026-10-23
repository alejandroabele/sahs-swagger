// A5 · Materias. Prototipo: <template id="tpl-materias"> y DC.registrar("materias") en prototipo/index.html.
// Listado del plan de estudios (orientacion.get_materias) con filtro por año y búsqueda,
// alta de materia (orientacion.crear_materia) y acceso a la ficha de cada una (A6).
import { useMemo, useState } from 'react';
import { orientacion, planificacion, profesorSuplencias } from '../api';
import { useNavegar } from '../app/navegar';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useAccion, useConsulta } from '../estado/consultas';
import { css } from '../lib/css';
import { colorArea, habilitadosEn, numeroAnio, orientacionesParaAnio } from './a5/comun';
import type { CrearMateriaBody } from '@sahs/contratos';

const ACCENT = '#2f5fd0';
const COLS = 'display: grid; grid-template-columns: 1fr 62px 128px 150px 56px 116px 28px; gap: 12px;';
const CAMPO = 'width: 100%; box-sizing: border-box; height: 42px; padding: 0 12px; border-radius: 8px; font-size: 13px; color: #14181f; background: #fcfdfe;';

type Filtro = 'todos' | number;

export default function A5Materias() {
  const ir = useNavegar();
  const qMaterias = useConsulta(['orientacion', 'get_materias'], () => orientacion.get_materias());
  const qOrientaciones = useConsulta(['orientacion', 'get_orientaciones'], () => orientacion.get_orientaciones());
  const qAreas = useConsulta(['orientacion', 'get_areas'], () => orientacion.get_areas());
  const qAnios = useConsulta(['planificacion', 'get_anios_academicos'], () => planificacion.get_anios_academicos());
  const qCursos = useConsulta(['planificacion', 'get_cursos'], () => planificacion.get_cursos());
  const qProfesores = useConsulta(['profesor_suplencias', 'get_profesores'], () => profesorSuplencias.get_profesores());
  const crear = useAccion((b: CrearMateriaBody) => orientacion.crear_materia(b), ['orientacion']);

  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [sel, setSel] = useState<number | null>(null);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [nuevas, setNuevas] = useState<Record<number, boolean>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // formulario de alta
  const [nombre, setNombre] = useState('');
  const [anio, setAnio] = useState(''); // id_anio_academico
  const [orient, setOrient] = useState(''); // id_orientacion
  const [horas, setHoras] = useState('');
  const [area, setArea] = useState(''); // id_area
  const [desc, setDesc] = useState('');

  const anios = qAnios.data;
  const mats = useMemo(() => {
    return [...(qMaterias.data ?? [])]
      .map((m) => ({
        m,
        a: numeroAnio(m.id_anio_academico, anios),
        o: m.orientacion?.nombre_orientacion ?? '—',
        p: habilitadosEn(m.id_materia, qProfesores.data).length,
      }))
      .sort((x, y) => x.a - y.a || x.o.localeCompare(y.o) || x.m.nombre_materia.localeCompare(y.m.nombre_materia));
  }, [qMaterias.data, anios, qProfesores.data]);

  if (qMaterias.isLoading || qAnios.isLoading) {
    return (
      <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
        <Cabecera />
        <Cargando />
      </div>
    );
  }

  const nums = (anios ?? []).map((a) => numeroAnio(a.id_anio_academico, anios)).filter(Boolean);
  const filtrosDef: { id: Filtro; label: string }[] = [{ id: 'todos', label: 'Todas' }, ...nums.map((n) => ({ id: n as Filtro, label: n + '°' }))];
  const ultimo = filtrosDef.length - 1;

  const texto = busqueda.trim().toLowerCase();
  const visibles = mats.filter((x) => (filtro === 'todos' || x.a === filtro) && (texto === '' || x.m.nombre_materia.toLowerCase().includes(texto)));
  const seleccionada = mats.find((x) => x.m.id_materia === sel) ?? null;

  // formulario
  const horasNum = Number(horas);
  const horasOk = horas !== '' && horasNum >= 1 && horasNum <= 10 && Math.round(horasNum) === horasNum;
  const listo = nombre.trim() !== '' && anio !== '' && orient !== '' && horasOk;
  const anioN = anio === '' ? 0 : numeroAnio(Number(anio), anios);
  const paraAnio = anio === '' ? [] : orientacionesParaAnio(Number(anio), qOrientaciones.data, qMaterias.data, qCursos.data);
  const unica = paraAnio.length === 1;
  const opcionesOr =
    anio === ''
      ? [{ valor: '', label: 'Primero elegí el año' }]
      : paraAnio.length === 0
        ? [{ valor: '', label: 'Ninguna asociada a ' + anioN + '° año' }]
        : [...(unica ? [] : [{ valor: '', label: 'Seleccioná una orientación' }]), ...paraAnio.map((o) => ({ valor: String(o.id_orientacion), label: o.nombre_orientacion }))];
  const orientacionAyuda =
    anio === ''
      ? 'Las orientaciones disponibles dependen del año académico.'
      : paraAnio.length === 0
        ? 'No hay orientaciones asociadas a ' + anioN + '° año. Se asocian desde la pantalla Orientaciones.'
        : 'Orientaciones asociadas a ' + anioN + '° año: ' + paraAnio.map((o) => o.nombre_orientacion).join(', ') + '. La materia solo se ofrece a los cursos de esa orientación.';

  const limpiar = () => {
    setNombre('');
    setAnio('');
    setOrient('');
    setHoras('');
    setArea('');
    setDesc('');
    setError(null);
  };

  const cambiarAnio = (v: string) => {
    const ps = v === '' ? [] : orientacionesParaAnio(Number(v), qOrientaciones.data, qMaterias.data, qCursos.data);
    setAnio(v);
    setOrient(ps.length === 1 ? String(ps[0].id_orientacion) : '');
    setError(null);
    setAviso(null);
  };

  const alta = async () => {
    const n = nombre.trim();
    if (!listo) {
      if (n !== '' && anio !== '' && orient !== '' && !horasOk) setError('Las horas semanales tienen que ser un número entero entre 1 y 10.');
      return;
    }
    const nombreOr = paraAnio.find((o) => String(o.id_orientacion) === orient)?.nombre_orientacion ?? '';
    const r = await crear.ejecutar({
      nombre_materia: n,
      descripcion_materia: desc.trim() || undefined,
      horas_semanales: horasNum,
      id_area: area === '' ? null : Number(area),
      id_orientacion: Number(orient),
      id_anio_academico: Number(anio),
    });
    if (!r) return; // el mensaje de la API queda en crear.error
    setNuevas((x) => ({ ...x, [r.id_materia]: true }));
    setFiltro(anioN || 'todos');
    setBusqueda('');
    setSel(null);
    limpiar();
    setAviso(n + ' se agregó al plan de ' + anioN + '° año (' + nombreOr + '), con ' + horasNum + ' h semanales. Los docentes que pueden dictarla se habilitan desde su ficha.');
  };

  const errorNombre = error ?? crear.error;

  return (
    <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir('A1')} style={css('cursor: pointer;')}>Inicio</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span style={css('color: #14181f; font-weight: 500;')}>Materias</span>
          </div>
          <div style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Materias del plan de estudios</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <button
          onClick={() => {
            setMostrarAlta(!mostrarAlta);
            setAviso(null);
            setError(null);
            crear.limpiarError();
          }}
          style={css(
            'display: flex; align-items: center; gap: 9px; height: 40px; padding: 0 17px; border-radius: 8px; font-size: 13px; font-weight: 600;' +
              (mostrarAlta ? ' border: 1px solid #d3d9e2; background: #fff; color: #4a5462;' : ' border: none; background: ' + ACCENT + '; color: #fff;'),
          )}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={css('flex-shrink: 0;')}>
            <path d={mostrarAlta ? 'M6 6l12 12M18 6L6 18' : 'M12 5v14M5 12h14'}></path>
          </svg>
          {mostrarAlta ? 'Cerrar el formulario' : 'Nueva materia'}
        </button>
      </div>

      <div style={css('display: flex; gap: 18px; padding: 20px 28px 28px; align-items: flex-start;')}>
        <div style={css('flex-grow: 1; min-width: 0; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
          <div style={css('display: flex; align-items: center; gap: 14px; padding: 15px 20px; border-bottom: 1px solid #eef1f5;')}>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setSel(null);
              }}
              placeholder="Buscar por nombre"
              style={css('width: 250px; box-sizing: border-box; height: 34px; padding: 0 12px; border-radius: 7px; border: 1px solid #dfe4ea; font-size: 12.5px; background: #fcfdfe;')}
            />
            <div style={css('flex-grow: 1;')}></div>
            <span style={css('font-size: 12px; color: #6b7482;')}>
              {visibles.length === mats.length ? mats.length + ' materias' : visibles.length + ' de ' + mats.length + ' materias'}
            </span>
            <div style={css('display: flex; gap: 2px;')}>
              {filtrosDef.map((o, i) => {
                const activo = filtro === o.id;
                return (
                  <button
                    key={String(o.id)}
                    onClick={() => {
                      setFiltro(o.id);
                      setSel(null);
                    }}
                    style={css(
                      'height: 30px; padding: 0 12px; font-size: 12px; font-weight: 500;' +
                        ' border: 1px solid ' + (activo ? '#14181f' : '#e2e6ec') + ';' +
                        ' background: ' + (activo ? '#14181f' : '#fff') + '; color: ' + (activo ? '#fff' : '#4a5462') + ';' +
                        ' border-radius: ' + (i === 0 ? '7px 0 0 7px' : i === ultimo ? '0 7px 7px 0' : '0') + ';' +
                        (i > 0 ? ' margin-left: -1px;' : ''),
                    )}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {qMaterias.error && (
            <div style={css('padding: 12px 20px;')}>
              <MensajeError mensaje={qMaterias.error.message} />
            </div>
          )}

          <div style={css(COLS + ' padding: 10px 20px; background: #fafbfc; border-bottom: 1px solid #eef1f5;')}>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Materia</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Año</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Orientación</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Área</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393; text-align: right;')}>Horas</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Docentes</div>
            <div></div>
          </div>

          <div style={css('max-height: 636px; overflow-y: auto;')}>
            {visibles.map(({ m, a, o, p }) => {
              const ar = colorArea(m.area?.nombre_area);
              const esNueva = !!nuevas[m.id_materia];
              const activa = sel === m.id_materia;
              return (
                <button
                  key={m.id_materia}
                  onClick={() => ir('A6', { id_materia: m.id_materia })}
                  onMouseEnter={() => setSel(m.id_materia)}
                  onMouseLeave={() => setSel(null)}
                  style={css(
                    COLS +
                      ' width: 100%; padding: 12px 20px; border: none; border-top: 1px solid #f2f4f7; text-align: left;' +
                      ' background: ' + (activa ? '#f3f6fc' : esNueva ? '#f2f8f4' : '#fff') + ';' +
                      (activa ? ' box-shadow: inset 3px 0 0 ' + ACCENT + ';' : esNueva ? ' box-shadow: inset 3px 0 0 #2f6b45;' : ''),
                  )}
                >
                  <span style={css('display: flex; flex-direction: column; gap: 3px; min-width: 0; padding-right: 14px; text-align: left;')}>
                    <span style={css('font-size: 13.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>{m.nombre_materia}</span>
                    <span style={css('font-size: 11.5px; color: #8b95a5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>{m.descripcion_materia || 'Sin descripción'}</span>
                  </span>
                  <span className="mono" style={css('font-size: 12.5px; color: #4a5462; align-self: center; text-align: left;')}>{a ? a + '°' : '—'}</span>
                  <span style={css('font-size: 12.5px; color: #4a5462; align-self: center; text-align: left;')}>{o}</span>
                  <span style={css('align-self: center; text-align: left;')}>
                    <span style={css('font-size: 11.5px; font-weight: 500; padding: 4px 10px; border-radius: 13px; background: ' + ar.fondo + '; color: ' + ar.texto + ';')}>
                      {m.area?.nombre_area || 'Sin área'}
                    </span>
                  </span>
                  <span className="mono" style={css('font-size: 12.5px; color: #4a5462; align-self: center; text-align: right;')}>{m.horas_semanales + ' h'}</span>
                  <span
                    style={css(
                      'font-size: 12px; align-self: center; text-align: left; color: ' + (p === 0 ? '#b03a2e' : '#6b7482') + ';' + (p === 0 ? ' font-weight: 500;' : ''),
                    )}
                  >
                    {p === 0 ? 'Sin docente' : p === 1 ? '1 habilitado' : p + ' habilitados'}
                  </span>
                  <span style={css('align-self: center; display: flex; justify-content: flex-end;')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={activa ? '#14181f' : '#c3cad4'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6"></path>
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            style={css(
              'display: flex; align-items: center; gap: 10px; padding: 13px 20px; border-top: 1px solid #eef1f5; background: ' + (seleccionada ? '#f3f6fc' : '#fafbfc') + ';',
            )}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={seleccionada ? ACCENT : '#8b95a5'} strokeWidth="2" strokeLinecap="round" style={css('flex-shrink: 0;')}>
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 11.5v5M12 8v.5"></path>
            </svg>
            <span style={css('font-size: 12.5px; color: ' + (seleccionada ? '#2c4570' : '#6b7482') + '; line-height: 1.5;')}>
              {seleccionada
                ? seleccionada.m.nombre_materia + ' (' + (seleccionada.a ? seleccionada.a + '° año' : 'sin año') + ', ' + seleccionada.o + ') — se abre en la pantalla A6, con sus docentes habilitados y las acciones de edición y baja.'
                : 'Hacé clic en cualquier materia para abrir su ficha.'}
            </span>
          </div>
        </div>

        {/* ===== alta ===== */}
        {mostrarAlta && (
          <div style={css('width: 420px; flex-shrink: 0; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('padding: 16px 20px 14px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Nueva materia</div>
              <div style={css('font-size: 12px; color: #6b7482; margin-top: 3px;')}>Los campos marcados con * son obligatorios</div>
            </div>

            <div style={css('padding: 20px; display: flex; flex-direction: column; gap: 18px;')}>
              <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Nombre *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    setError(null);
                    setAviso(null);
                    crear.limpiarError();
                  }}
                  placeholder="Por ejemplo: Biología"
                  style={css(CAMPO + ' border: 1px solid ' + (errorNombre ? '#e0a9a2' : '#dfe4ea') + ';')}
                />
                {errorNombre && <span style={css('font-size: 11.5px; color: #b03a2e; line-height: 1.45;')}>{errorNombre}</span>}
              </div>

              <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Año académico en que se dicta *</label>
                <select value={anio} onChange={(e) => cambiarAnio(e.target.value)} style={css(CAMPO + ' border: 1px solid #dfe4ea;')}>
                  <option value="">Seleccioná un año</option>
                  {(anios ?? []).map((a) => (
                    <option key={a.id_anio_academico} value={String(a.id_anio_academico)}>
                      {a.anio_curricular}
                    </option>
                  ))}
                </select>
              </div>

              <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Orientación *</label>
                <select
                  value={orient}
                  onChange={(e) => {
                    setOrient(e.target.value);
                    setError(null);
                    setAviso(null);
                  }}
                  style={css(CAMPO + ' border: 1px solid #dfe4ea;' + (unica || anio === '' ? ' background: #f4f6f8; color: #6b7482;' : ''))}
                >
                  {opcionesOr.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span style={css('font-size: 11.5px; color: #7a8393; line-height: 1.45;')}>{orientacionAyuda}</span>
              </div>

              <div style={css('display: grid; grid-template-columns: 130px 1fr; gap: 12px;')}>
                <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                  <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Horas semanales *</label>
                  <input
                    type="text"
                    value={horas}
                    onChange={(e) => {
                      setHoras(e.target.value);
                      setError(null);
                      setAviso(null);
                    }}
                    placeholder="Ej.: 4"
                    style={css(CAMPO + ' border: 1px solid #dfe4ea;')}
                  />
                </div>
                <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                  <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Área</label>
                  <select
                    value={area}
                    onChange={(e) => {
                      setArea(e.target.value);
                      setAviso(null);
                    }}
                    style={css(CAMPO + ' border: 1px solid #dfe4ea;')}
                  >
                    <option value="">Sin área</option>
                    {(qAreas.data ?? []).map((a) => (
                      <option key={a.id_area} value={String(a.id_area)}>
                        {a.nombre_area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Descripción</label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Contenidos generales de la materia. Opcional."
                  style={css('width: 100%; box-sizing: border-box; height: 84px; resize: none; padding: 10px 12px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; color: #14181f; line-height: 1.5; background: #fcfdfe;')}
                ></textarea>
              </div>

              <div style={css('display: flex; align-items: center; gap: 10px; padding-top: 2px;')}>
                <button
                  onClick={alta}
                  disabled={crear.enCurso}
                  style={css(
                    'height: 42px; padding: 0 20px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600;' +
                      ' background: ' + (listo ? ACCENT : '#e2e6ec') + '; color: ' + (listo ? '#fff' : '#a8b0bb') + ';',
                  )}
                >
                  {crear.enCurso ? 'Guardando…' : 'Dar de alta'}
                </button>
                <button
                  onClick={() => {
                    limpiar();
                    setAviso(null);
                    crear.limpiarError();
                  }}
                  style={css('height: 42px; padding: 0 16px; border-radius: 8px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 13px; font-weight: 500;')}
                >
                  Limpiar
                </button>
              </div>

              {aviso && (
                <div style={css('display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 9px; background: #ecf5ef; border: 1px solid #c2e0cd;')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2f6b45" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0; margin-top: 1px;')}>
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  <span style={css('font-size: 12.5px; color: #2f6b45; line-height: 1.5;')}>{aviso}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
