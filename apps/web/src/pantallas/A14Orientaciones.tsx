// A14 · Orientaciones. Prototipo: <template id="tpl-orientaciones"> y DC.registrar("orientaciones") en prototipo/index.html.
// Listado de orientaciones (get_orientaciones), plan de estudios de la orientación elegida por año académico
// (get_plan_de_estudios({ id_orientacion }): trae todos los años, aunque no tengan materias, con el área de cada
// materia) y alta/baja de orientaciones y de sus materias. El selector de área del alta de materia usa get_areas
// (se pide al abrir las materias de un año) y "Copiar de otra orientación" usa get_plan_de_estudios({ id_anio_academico })
// (se pide al abrir esa pestaña).
import { useState } from 'react';
import type { Orientacion, PlanDeEstudiosMateria } from '@sahs/contratos';
import { orientacion } from '../api';
import { useIr } from '../app/navegar';
import { rutas } from '../app/rutas';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useAccion, useConsulta } from '../estado/consultas';
import { css } from '../lib/css';

const ACCENT = '#2f5fd0';

/** Colores de cada área (AREAS del prototipo). */
const AREAS: Record<string, { fondo: string; texto: string }> = {
  Exactas: { fondo: '#eaf0fb', texto: '#1e3f80' },
  'Lengua y Literatura': { fondo: '#e8f5f2', texto: '#155e50' },
  Sociales: { fondo: '#f3edfa', texto: '#4a2f80' },
  Pastoral: { fondo: '#fdf4e7', texto: '#7a5310' },
  Artes: { fondo: '#fbedf2', texto: '#8a2e52' },
};
const CAMPO = 'height: 38px; padding: 0 12px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; background: #fcfdfe; color: #14181f;';

type Vista = 'lista' | 'materias' | 'orientacion';

export default function A14Orientaciones() {
  const ir = useIr();

  const qOrs = useConsulta(['orientacion', 'get_orientaciones'], () => orientacion.get_orientaciones());

  const [vista, setVista] = useState<Vista>('lista');
  const [celda, setCelda] = useState<{ o: number | null; a: number | null }>({ o: null, a: null });
  const [modo, setModo] = useState<'ver' | 'alta'>('ver');
  const [fNombre, setFNombre] = useState('');
  const [fCodigo, setFCodigo] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [pest, setPest] = useState<'nueva' | 'copiar'>('nueva');
  const [nNombre, setNNombre] = useState('');
  const [nArea, setNArea] = useState('');
  const [nHoras, setNHoras] = useState('');
  const [confirmar, setConfirmar] = useState<number | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const ors = qOrs.data ?? [];
  const alta = modo === 'alta';

  const o: Orientacion | null = ors.find((x) => x.id_orientacion === celda.o) ?? ors[0] ?? null;

  // Plan de estudios de la orientación elegida: un elemento por año académico (todos, aunque no tengan materias), ya ordenados.
  const qPlanO = useConsulta(['orientacion', 'get_plan_de_estudios', { id_orientacion: o?.id_orientacion }], () => orientacion.get_plan_de_estudios({ id_orientacion: o!.id_orientacion }), {
    enabled: !!o,
  });
  const anios = qPlanO.data ?? [];
  const nombreAnio = (idAnio: number | null | undefined) => anios.find((a) => a.id_anio_academico === idAnio)?.anio_curricular ?? '';
  // Año elegido del plan de estudios (id del año académico); por defecto, el primero.
  const celdaA = celda.a ?? anios[0]?.id_anio_academico ?? null;
  const horas = (l: PlanDeEstudiosMateria[]) => l.reduce((t, m) => t + (m.horas_semanales ?? 0), 0);

  // Áreas para el selector de "Nueva materia": recién al abrir las materias de un año.
  const qAreas = useConsulta(['orientacion', 'get_areas'], () => orientacion.get_areas(), { enabled: vista === 'materias' });
  // Materias del mismo año en otras orientaciones, para "Copiar de otra orientación": recién al abrir esa pestaña.
  const qPlanAnio = useConsulta(['orientacion', 'get_plan_de_estudios', { id_anio_academico: celdaA }], () => orientacion.get_plan_de_estudios({ id_anio_academico: celdaA! }), {
    enabled: vista === 'materias' && pest === 'copiar' && celdaA != null,
  });

  const crearOr = useAccion((b: { nombre_orientacion: string; codigo: string; descripcion_orientacion?: string }) => orientacion.crear_orientacion(b), ['orientacion']);
  const eliminarOr = useAccion(async (id: number) => (await orientacion.eliminar_orientacion(id), true), ['orientacion', 'planificacion']);
  const crearMat = useAccion((b: Parameters<typeof orientacion.crear_materia>[0]) => orientacion.crear_materia(b), ['orientacion']);
  const eliminarMat = useAccion(async (id: number) => (await orientacion.eliminar_materia(id), true), ['orientacion', 'profesor_suplencias']);

  const limpiar = () => {
    setAviso(null);
    setConfirmar(null);
    setConfirmarEliminar(false);
    crearOr.limpiarError();
    eliminarOr.limpiarError();
    crearMat.limpiarError();
    eliminarMat.limpiarError();
  };
  const cargarDatos = (x: Orientacion | null) => {
    setFNombre(x?.nombre_orientacion ?? '');
    setFCodigo(x?.codigo ?? '');
    setFDesc(x?.descripcion_orientacion ?? '');
  };
  const irA = (x: Orientacion, a: number | null, v: Vista) => {
    limpiar();
    setModo('ver');
    setCelda({ o: x.id_orientacion, a });
    cargarDatos(x);
    setVista(v);
  };

  const cargando = qOrs.isLoading;
  const errorCarga = qOrs.error ?? qPlanO.error;

  if (cargando || errorCarga) {
    return (
      <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
        <Cabecera />
        <div className="r-margen" style={css('padding: 20px 28px;')}>{errorCarga ? <MensajeError mensaje={errorCarga.message} /> : <Cargando />}</div>
      </div>
    );
  }

  // ---- listado de orientaciones
  const filasOr = ors.map((x) => {
    const activa = !alta && !!o && x.id_orientacion === o.id_orientacion;
    return {
      x,
      chapaEstilo:
        'width: 40px; height: 28px; border-radius: 7px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;' +
        ' font-family: "IBM Plex Mono", monospace; font-size: 11px; font-weight: 600;' +
        ' background: ' + (activa ? ACCENT : '#eef1f5') + '; color: ' + (activa ? '#fff' : '#5b6471') + ';',
      click: () => irA(x, null, 'orientacion'),
    };
  });

  // ---- materias de la celda elegida
  const hayCelda = !alta && !!o && !!celdaA;
  const lista = hayCelda ? (anios.find((a) => a.id_anio_academico === celdaA)?.orientaciones[0]?.materias ?? []) : [];
  const celdaTitulo = hayCelda ? nombreAnio(celdaA) + ' · ' + o!.nombre_orientacion : '';
  const total = horas(lista);
  const presentes = lista.map((m) => m.nombre_materia.toLowerCase());
  const vistos = new Set<string>();
  const copiables = !hayCelda
    ? []
    : (qPlanAnio.data ?? [])
        .flatMap((pa) => pa.orientaciones)
        .filter((po) => po.id_orientacion !== o!.id_orientacion)
        .flatMap((po) => po.materias.map((m) => ({ ...m, nombre_orientacion: po.nombre_orientacion })))
        .filter((m) => {
          const k = m.nombre_materia.toLowerCase();
          if (presentes.includes(k) || vistos.has(k)) return false;
          vistos.add(k);
          return true;
        });

  const agregar = async (b: { nombre_materia: string; horas_semanales: number; id_area?: number | null; descripcion_materia?: string }, okTexto: string) => {
    if (!o || !celdaA) return;
    limpiar();
    const r = await crearMat.ejecutar({ ...b, id_orientacion: o.id_orientacion, id_anio_academico: celdaA });
    if (r) setAviso(okTexto);
    return r;
  };
  const agregarNueva = async () => {
    const nombre = nNombre.trim();
    const h = Number(nHoras);
    const r = await agregar(
      { nombre_materia: nombre, horas_semanales: h, id_area: nArea ? Number(nArea) : undefined },
      nombre + ' se agregó a ' + celdaTitulo + ' con ' + h + ' h.',
    );
    if (r) {
      setNNombre('');
      setNArea('');
      setNHoras('');
    }
  };

  // ---- panel de datos / alta
  const guardarPanel = async () => {
    if (!alta) return;
    const nombre = fNombre.trim();
    const r = await crearOr.ejecutar({ nombre_orientacion: nombre, codigo: fCodigo.trim(), descripcion_orientacion: fDesc.trim() || undefined });
    if (!r) return;
    irA(r, null, 'materias');
    setAviso(nombre + ' se creó.');
  };
  const eliminar = async () => {
    if (!o) return;
    const nombre = o.nombre_orientacion;
    const ok = await eliminarOr.ejecutar(o.id_orientacion);
    setConfirmarEliminar(false);
    if (!ok) return; // 409 si tiene materias o cursos: el mensaje queda en eliminarOr.error
    const resto = ors.filter((x) => x.id_orientacion !== o.id_orientacion);
    limpiar();
    setCelda({ o: resto[0]?.id_orientacion ?? null, a: null });
    setVista('lista');
    setAviso(nombre + ' se eliminó.');
  };

  const aniosLinks = (o && !alta ? anios : []).map((an) => {
    const a = an.id_anio_academico;
    const activo = vista === 'materias' && celdaA === a;
    return {
      a,
      label: an.anio_curricular,
      estilo:
        'height: 32px; padding: 0 13px; border-radius: 8px; font-size: 12.5px; font-weight: 600;' +
        (activo ? ' border: 1px solid ' + ACCENT + '; background: ' + ACCENT + '; color: #fff;' : ' border: 1px solid #dfe4ea; background: #fff; color: #4a5462;'),
      click: () => {
        limpiar();
        setCelda({ o: o!.id_orientacion, a });
        setVista('materias');
      },
    };
  });

  const volver = () => {
    limpiar();
    setModo('ver');
    setVista('lista');
  };
  const abrirNueva = () => {
    limpiar();
    setModo('alta');
    setVista('orientacion');
    setFNombre('');
    setFCodigo('');
    setFDesc('');
  };

  const tituloPagina =
    vista === 'lista' ? 'Orientaciones y planes de estudio' : vista === 'materias' ? 'Materias de ' + celdaTitulo : alta ? 'Nueva orientación' : 'Orientación ' + (o?.nombre_orientacion ?? '');
  const miga = vista === 'materias' ? celdaTitulo : alta ? 'Nueva' : (o?.nombre_orientacion ?? '');
  const errorTexto = crearMat.error ?? eliminarMat.error;
  const errorPanelTexto = crearOr.error ?? eliminarOr.error;

  const pestanias = [
    { id: 'nueva' as const, label: 'Nueva materia' },
    { id: 'copiar' as const, label: 'Copiar de otra orientación' },
  ].map((p, i) => {
    const activo = pest === p.id;
    return {
      ...p,
      estilo:
        'height: 30px; padding: 0 12px; font-size: 12px; font-weight: 500;' +
        ' border: 1px solid ' + (activo ? '#14181f' : '#e2e6ec') + ';' +
        ' background: ' + (activo ? '#14181f' : '#fff') + '; color: ' + (activo ? '#fff' : '#4a5462') + ';' +
        ' border-radius: ' + (i === 0 ? '7px 0 0 7px' : '0 7px 7px 0') + ';' + (i > 0 ? ' margin-left: -1px;' : ''),
    };
  });

  return (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div className="r-margen r-envolver" style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir(rutas.inicio())} style={css('cursor: pointer;')}>Inicio</span>
            <span style={css('color: #c3cad4;')}>/</span>
            {vista === 'lista' ? (
              <span style={css('color: #14181f; font-weight: 500;')}>Orientaciones</span>
            ) : (
              <>
                <button onClick={volver} style={css('border: none; background: none; padding: 0; font-size: 12px; color: #2f5fd0; cursor: pointer;')}>Orientaciones</button>
                <span style={css('color: #c3cad4;')}>/</span>
                <span style={css('color: #14181f; font-weight: 500;')}>{miga}</span>
              </>
            )}
          </div>
          <div className="r-titulo" style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>{tituloPagina}</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        {vista !== 'lista' && (
          <button onClick={volver} style={css('display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 15px; border-radius: 8px; border: 1px solid #d3d9e2; background: #fff; color: #14181f; font-size: 13px; font-weight: 500;')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"></path></svg>
            Volver al listado
          </button>
        )}
        {vista === 'lista' && (
          <button onClick={abrirNueva} style={css('display: flex; align-items: center; gap: 9px; height: 40px; padding: 0 17px; border-radius: 8px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 13px; font-weight: 600;')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"></path></svg>
            Nueva orientación
          </button>
        )}
      </div>

      <div className="r-margen" style={css('padding: 20px 28px 28px; display: flex; flex-direction: column; gap: 18px;')}>
        {/* ===== listado de orientaciones ===== */}
        {vista === 'lista' && (
          <>
            {aviso && <div style={css('font-size: 12px; color: #245239; background: #eef6f0; border: 1px solid #cfe5d6; border-radius: 8px; padding: 9px 11px;')}>{aviso}</div>}
            <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
              <div className="r-envolver" style={css('display: flex; align-items: center; gap: 16px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
                <div style={css('font-size: 13.5px; font-weight: 600;')}>Orientaciones</div>
                <div style={css('flex-grow: 1;')}></div>
                <span style={css('font-size: 12px; color: #6b7482;')}>{ors.length === 0 ? 'Todavía no hay orientaciones' : ors.length === 1 ? '1 orientación' : ors.length + ' orientaciones'}</span>
              </div>
              <div style={css('padding: 14px 20px 18px; display: flex; flex-direction: column; gap: 8px;')}>
                {filasOr.map((c) => (
                  <button key={c.x.id_orientacion} onClick={c.click} style={css('display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 8px; text-align: left; min-width: 0; border: 1px solid transparent; background: #fff;')}>
                    <span style={css(c.chapaEstilo)}>{c.x.codigo}</span>
                    <span style={css('display: flex; flex-direction: column; gap: 1px; min-width: 0; text-align: left;')}>
                      <span style={css('font-size: 13px; font-weight: 600; color: #14181f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>{c.x.nombre_orientacion}</span>
                      <span style={css('font-size: 11px; color: #7a8393;')}>{c.x.descripcion_orientacion || 'Sin descripción'}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ===== vista: materias de un año y una orientación ===== */}
        {vista === 'materias' && (
          <>
            <div style={css('display: flex; align-items: center; gap: 10px; flex-wrap: wrap;')}>
              <span style={css('font-size: 12px; color: #6b7482;')}>Plan de estudios de {o?.nombre_orientacion ?? ''}</span>
              {aniosLinks.map((a) => (
                <button key={a.a} onClick={a.click} style={css(a.estilo)}>{a.label}</button>
              ))}
              <div style={css('flex-grow: 1;')}></div>
              <button
                onClick={() => {
                  limpiar();
                  setModo('ver');
                  cargarDatos(o);
                  setVista('orientacion');
                }}
                style={css('height: 32px; padding: 0 12px; border-radius: 8px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 12px; font-weight: 500;')}
              >
                Datos de la orientación
              </button>
            </div>
            <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
              {hayCelda ? (
                <div>
                  <div className="r-envolver" style={css('display: flex; align-items: center; gap: 16px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
                    <div style={css('font-size: 14px; font-weight: 600;')}>Plan de estudios</div>
                    <div style={css('flex-grow: 1;')}></div>
                    <span style={css('font-size: 12px; color: #4a5462;')}>
                      <b className="mono" style={css('font-size: 15px;')}>{total}</b> horas cátedra por semana
                    </span>
                  </div>
                  {/* Tabla de materias: en angosto se desplaza horizontalmente dentro de la tarjeta. */}
                  <div className="r-desplazar"><div className="r-min-600">
                  <div style={css('display: grid; grid-template-columns: 1fr 150px 128px 84px; gap: 12px; padding: 10px 20px; background: #fafbfc; border-bottom: 1px solid #eef1f5; margin-top: 12px; border-top: 1px solid #eef1f5;')}>
                    <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Materia</div>
                    <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Área</div>
                    <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Horas semanales</div>
                    <div></div>
                  </div>
                  {lista.map((m) => {
                    const areaNombre = m.nombre_area ?? undefined;
                    const ar = (areaNombre && AREAS[areaNombre]) || { fondo: '#f2f4f7', texto: '#6b7482' };
                    const confirmando = confirmar === m.id_materia;
                    return (
                      <div key={m.id_materia} style={css('display: grid; grid-template-columns: 1fr 150px 128px 84px; gap: 12px; padding: 11px 20px; border-bottom: 1px solid #f2f4f7; align-items: center;')}>
                        <div style={css('display: flex; flex-direction: column; gap: 2px; min-width: 0;')}>
                          <span onClick={() => ir(rutas.materia(m.id_materia))} style={css('font-size: 13.5px; font-weight: 500; cursor: pointer;')}>{m.nombre_materia}</span>
                          <span style={css('font-size: 11.5px; color: #8b95a5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>{m.descripcion_materia || 'Sin descripción'}</span>
                        </div>
                        <div>
                          <span style={css('font-size: 11.5px; font-weight: 500; padding: 3px 9px; border-radius: 11px; background: ' + ar.fondo + '; color: ' + ar.texto + ';')}>{areaNombre || 'Sin área'}</span>
                        </div>
                        <span className="mono" style={css('font-size: 13px; font-weight: 600;')}>{m.horas_semanales} h</span>
                        <div style={css('display: flex; justify-content: flex-end;')}>
                          <button
                            onClick={() => {
                              limpiar();
                              setConfirmar(confirmando ? null : m.id_materia);
                            }}
                            style={css('height: 28px; padding: 0 11px; border-radius: 7px; border: 1px solid #edc9c4; background: #fff; color: #b03a2e; font-size: 11.5px; font-weight: 500;')}
                          >
                            Quitar
                          </button>
                        </div>
                        {confirmando && (
                          <div className="r-envolver" style={css('grid-column: 1 / -1; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; background: #fbeceb; border: 1px solid #edc9c4;')}>
                            <span style={css('font-size: 12px; color: #8a2e24; flex-grow: 1; line-height: 1.45;')}>
                              Se quita {m.nombre_materia} de {celdaTitulo} y se borra del catálogo de materias.
                            </span>
                            <button
                              disabled={eliminarMat.enCurso}
                              onClick={async () => {
                                limpiar();
                                // 409 si la materia tiene clases: el mensaje queda en eliminarMat.error.
                                if (await eliminarMat.ejecutar(m.id_materia)) setAviso(m.nombre_materia + ' se quitó de ' + celdaTitulo + '.');
                              }}
                              style={css('height: 28px; padding: 0 12px; border-radius: 7px; border: none; background: #b03a2e; color: #fff; font-size: 11.5px; font-weight: 600;')}
                            >
                              Sí, quitar
                            </button>
                            <button onClick={() => setConfirmar(null)} style={css('height: 28px; padding: 0 12px; border-radius: 7px; border: 1px solid #edc9c4; background: #fff; color: #b03a2e; font-size: 11.5px; font-weight: 500;')}>
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div></div>
                  {lista.length === 0 && (
                    <div style={css('padding: 22px 20px; font-size: 12.5px; color: #6b7482; border-bottom: 1px solid #f2f4f7;')}>Todavía no tiene materias.</div>
                  )}

                  <div style={css('padding: 16px 20px 18px; background: #fafbfc; display: flex; flex-direction: column; gap: 13px;')}>
                    <div className="r-envolver" style={css('display: flex; align-items: center; gap: 12px;')}>
                      <span style={css('font-size: 13px; font-weight: 600;')}>Agregar materia a {celdaTitulo}</span>
                      <div style={css('flex-grow: 1;')}></div>
                      <div style={css('display: flex; gap: 2px;')}>
                        {pestanias.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              limpiar();
                              setPest(p.id);
                            }}
                            style={css(p.estilo)}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {pest === 'nueva' && (
                      <div className="r-una-columna-movil" style={css('display: grid; grid-template-columns: 1fr 180px 110px auto; gap: 10px; align-items: end;')}>
                        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
                          <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Nombre *</label>
                          <input type="text" value={nNombre} onChange={(e) => { setNNombre(e.target.value); setAviso(null); }} placeholder="Ej.: Microeconomía" style={css(CAMPO)} />
                        </div>
                        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
                          <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Área</label>
                          <select value={nArea} onChange={(e) => setNArea(e.target.value)} style={css(CAMPO)}>
                            <option value="">Sin área</option>
                            {(qAreas.data ?? []).map((a) => (
                              <option key={a.id_area} value={a.id_area}>{a.nombre_area}</option>
                            ))}
                          </select>
                        </div>
                        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
                          <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Horas *</label>
                          <input type="text" value={nHoras} onChange={(e) => { setNHoras(e.target.value); setAviso(null); }} placeholder="3" style={css(CAMPO)} />
                        </div>
                        <button disabled={crearMat.enCurso} onClick={agregarNueva} style={css('height: 38px; padding: 0 16px; border-radius: 8px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 13px; font-weight: 600;')}>
                          Agregar
                        </button>
                      </div>
                    )}
                    {pest === 'copiar' && (
                      <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                        {copiables.map((c) => (
                          <div key={c.id_materia} className="r-envolver" style={css('display: flex; align-items: center; gap: 12px; padding: 9px 12px; border-radius: 8px; border: 1px solid #e2e6ec; background: #fff;')}>
                            <span style={css('font-size: 13px; font-weight: 500; flex-grow: 1;')}>{c.nombre_materia}</span>
                            <span style={css('font-size: 11.5px; color: #6b7482;')}>de {c.nombre_orientacion}</span>
                            <span className="mono" style={css('font-size: 12px; color: #4a5462; width: 40px; text-align: right;')}>{c.horas_semanales} h</span>
                            <button
                              disabled={crearMat.enCurso}
                              onClick={() =>
                                agregar(
                                  { nombre_materia: c.nombre_materia, horas_semanales: c.horas_semanales, id_area: c.id_area ?? undefined, descripcion_materia: c.descripcion_materia || undefined },
                                  c.nombre_materia + ' se copió de ' + c.nombre_orientacion + ' a ' + celdaTitulo + '.',
                                )
                              }
                              style={css('height: 28px; padding: 0 12px; border-radius: 7px; border: 1px solid ' + ACCENT + '; background: #fff; color: ' + ACCENT + '; font-size: 11.5px; font-weight: 600;')}
                            >
                              Copiar
                            </button>
                          </div>
                        ))}
                        {qPlanAnio.isLoading && <Cargando />}
                        {!qPlanAnio.isLoading && copiables.length === 0 && <div style={css('font-size: 12px; color: #6b7482;')}>No hay materias de {nombreAnio(celdaA)} en otras orientaciones que falten acá.</div>}
                      </div>
                    )}
                    {errorTexto && <div style={css('font-size: 12px; color: #a63244; background: #fbf1f2; border: 1px solid #f1d3d8; border-radius: 8px; padding: 9px 11px;')}>{errorTexto}</div>}
                    {aviso && !errorTexto && <div style={css('font-size: 12px; color: #245239; background: #eef6f0; border: 1px solid #cfe5d6; border-radius: 8px; padding: 9px 11px;')}>{aviso}</div>}
                  </div>
                </div>
              ) : (
                qPlanO.isLoading ? (
                  <Cargando />
                ) : (
                <div style={css('padding: 40px 28px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;')}>
                  <div style={css('font-size: 13.5px; font-weight: 600;')}>{o ? 'No hay años académicos' : 'No hay orientaciones'}</div>
                </div>
                )
              )}
            </div>
          </>
        )}

        {/* ===== vista: datos de la orientación / alta ===== */}
        {vista === 'orientacion' && (
          <div style={css('max-width: 640px; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 14px;')}>
            <div style={css('display: flex; align-items: center; gap: 10px;')}>
              <span style={css('font-size: 14px; font-weight: 600; flex-grow: 1;')}>{alta ? 'Nueva orientación' : o ? 'Orientación ' + o.nombre_orientacion : ''}</span>
              {alta && (
                <button onClick={volver} style={css('height: 28px; padding: 0 11px; border-radius: 7px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 11.5px;')}>Cancelar</button>
              )}
            </div>
            <div className="r-una-columna-movil" style={css('display: grid; grid-template-columns: 1fr 100px; gap: 10px;')}>
              <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
                <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Nombre *</label>
                <input type="text" value={fNombre} readOnly={!alta} onChange={(e) => { setFNombre(e.target.value); }} placeholder="Ej.: Arte y Comunicación" style={css(CAMPO)} />
              </div>
              <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
                <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Código *</label>
                <input type="text" value={fCodigo} readOnly={!alta} onChange={(e) => { setFCodigo(e.target.value.toUpperCase()); }} placeholder="ART" style={css(CAMPO)} />
              </div>
            </div>
            <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
              <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Descripción</label>
              <textarea value={fDesc} readOnly={!alta} onChange={(e) => { setFDesc(e.target.value); }} style={css('height: 64px; resize: none; padding: 9px 12px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; background: #fcfdfe; color: #14181f; line-height: 1.45;')}></textarea>
            </div>
            {errorPanelTexto && <div style={css('font-size: 12px; color: #a63244; background: #fbf1f2; border: 1px solid #f1d3d8; border-radius: 8px; padding: 9px 11px; line-height: 1.45;')}>{errorPanelTexto}</div>}
            {alta && (
              <button
                onClick={guardarPanel}
                disabled={crearOr.enCurso}
                style={css('height: 38px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; background: ' + ACCENT + '; color: #fff;')}
              >
                Crear la orientación
              </button>
            )}
            {!alta && o && (
              <div style={css('display: flex; flex-direction: column; gap: 12px; padding-top: 12px; border-top: 1px solid #eef1f5;')}>
                {confirmarEliminar && (
                  <div className="r-envolver" style={css('display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; background: #fbeceb; border: 1px solid #edc9c4;')}>
                    <span style={css('font-size: 12px; color: #8a2e24; flex-grow: 1; line-height: 1.45;')}>Se elimina la orientación {o.nombre_orientacion}.</span>
                    <button
                      disabled={eliminarOr.enCurso}
                      onClick={eliminar}
                      style={css('height: 28px; padding: 0 12px; border-radius: 7px; border: none; background: #b03a2e; color: #fff; font-size: 11.5px; font-weight: 600;')}
                    >
                      Sí, eliminar
                    </button>
                    <button onClick={() => setConfirmarEliminar(false)} style={css('height: 28px; padding: 0 12px; border-radius: 7px; border: 1px solid #edc9c4; background: #fff; color: #b03a2e; font-size: 11.5px; font-weight: 500;')}>
                      Cancelar
                    </button>
                  </div>
                )}
                <button
                  disabled={eliminarOr.enCurso}
                  onClick={() => {
                    limpiar();
                    setConfirmarEliminar(true);
                  }}
                  style={css('height: 34px; border-radius: 8px; border: 1px solid #edc9c4; background: #fff; color: #b03a2e; font-size: 12px; font-weight: 600;')}
                >
                  Eliminar la orientación
                </button>
              </div>
            )}
            {!alta && aniosLinks.length > 0 && (
              <div style={css('display: flex; flex-direction: column; gap: 7px; padding-top: 12px; border-top: 1px solid #eef1f5;')}>
                <span style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Plan de estudios por año</span>
                <div style={css('display: flex; gap: 6px; flex-wrap: wrap;')}>
                  {aniosLinks.map((a) => (
                    <button key={a.a} onClick={a.click} style={css('height: 30px; padding: 0 12px; border-radius: 8px; border: 1px solid #cfdcf5; background: #f3f6fc; color: #1e3f80; font-size: 12px; font-weight: 500;')}>
                      Materias de {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
