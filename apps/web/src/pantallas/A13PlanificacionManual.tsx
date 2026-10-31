// A13 · Armado de la planificación. Prototipo: <template id="tpl-planificacionmanual"> y
// DC.registrar("planificacionmanual") en prototipo/index.html.
// Ruta: /planificaciones/:id y /planificaciones/:id/cursos/:idCurso. Sin curso en la ruta se abre
// el primero del ciclo.
// Carga por etapas: al entrar se pide la fachada get_armado_propuesta (propuesta, estados y cursos del
// ciclo con su año anidado, en una sola llamada) y las clases del curso visible (con su materia y sus
// profesores anidados). Al elegir otro curso se piden solo sus clases. Nada queda en caché: cada
// entrada y cada curso se piden de nuevo (SIN_CACHE). Recién con la primera
// interacción para editar (una materia o una franja) se traen los profesores (habilitaciones y
// disponibilidad) y todas las clases de la propuesta (choques con otros cursos). El área de cada
// materia viene anidada en el curso.
// "Generar automáticamente" no necesita esos datos: llama a generar_planilla (la API genera y
// guarda todos los cursos) y con los `cambios` que devuelve se puede deshacer.
// Cada clase (curso + materia) tiene los mismos docentes en todas sus franjas. Cada cambio en la
// grilla se guarda en el momento en la API (crear_clase + asignar_clase_a_propuesta, editar_clase,
// eliminar_clase); si la API lo rechaza (409), se muestra el mensaje y la grilla no cambia.
// Desde el encabezado se cambia el estado de la propuesta, se la duplica y se abre la generación.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CambioGeneracion, Clase, Curso, Profesor, ResultadoGeneracion } from '@sahs/contratos';
import { planificacion, profesorSuplencias } from '../api';
import { mensajeDeError } from '../api/http';
import { useIr, useParamRuta } from '../app/navegar';
import { rutas } from '../app/rutas';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useAccion, useConsulta, useInvalidar } from '../estado/consultas';
import { css } from '../lib/css';
import { DIAS } from '../lib/formato';
import { Grilla, type CeldaVista } from './a13/Grilla';
import {
  ACCENT,
  AREAS,
  areaDe,
  armarGrilla,
  codigoClase,
  codigoClaseCopia,
  combosDe,
  crearClaseEnPropuesta,
  dondeOcupa,
  esDeADos,
  habilitadosEn,
  nombreCurso,
  nombreProfesor,
  numeroAnio,
  ocupaciones,
  ordenarCursos,
  siguienteCodigo,
  type Bloque,
} from './a13/modelo';
import { PanelDerecho, type CeldaInfo } from './a13/PanelDerecho';
import { PanelMaterias, type OpcionMateria } from './a13/PanelMaterias';
import './a13/responsive.css';

const ALTO = 62;

const COLOR_ESTADO: Record<string, { punto: string; chip: string; texto: string; label: string }> = {
  BOR: { punto: '#c08430', chip: '#fdf6ec', texto: '#a56a10', label: 'Borrador' },
  REV: { punto: '#3a6fd8', chip: '#eef3fc', texto: '#1e4099', label: 'En revisión' },
  VIG: { punto: '#2f6b45', chip: '#e9f2ec', texto: '#2f6b45', label: 'Vigente' },
  FVG: { punto: '#8b95a5', chip: '#f2f4f7', texto: '#5b6471', label: 'Fue vigente' },
};

/**
 * Transiciones que acepta la API (asignar_estado_a_propuesta; TRANSICIONES de apps/planificacion).
 * Una Vigente pasa sola a Fue vigente cuando otra del ciclo pasa a Vigente.
 */
const TRANSICIONES: Record<string, string[]> = { BOR: ['REV'], REV: ['VIG', 'BOR'], VIG: [], FVG: [] };

interface Sel {
  mid: number;
  docs: number[];
}
interface Aviso {
  texto: string;
  tipo: 'auto' | 'info';
}

/** Esta pantalla no guarda nada en caché: siempre muestra lo último de la API. */
const SIN_CACHE = { staleTime: 0, gcTime: 0, refetchOnWindowFocus: false } as const;

export default function A13PlanificacionManual() {
  const ir = useIr();
  const ciclo = useCiclo();
  const idPropParam = useParamRuta('id');
  const idCursoParam = useParamRuta('idCurso');

  // ---- datos
  // Fachada: propuesta + estados + cursos del ciclo (con año, turno, orientación, materias y franjas).
  const qArmado = useConsulta(
    ['planificacion', 'get_armado_propuesta', idPropParam],
    () => planificacion.get_armado_propuesta(idPropParam!),
    { enabled: !!idPropParam, ...SIN_CACHE },
  );
  const propuesta = idPropParam ? qArmado.data?.propuesta : undefined;
  const idProp = propuesta?.id_propuesta;

  // Etapa 1: las clases del curso visible.
  const qClasesCurso = useConsulta(
    ['planificacion', 'get_clases', { id_propuesta: idProp, id_curso: idCursoParam }],
    () => planificacion.get_clases({ id_propuesta: idProp!, id_curso: idCursoParam! }),
    { enabled: !!idProp && !!idCursoParam, ...SIN_CACHE },
  );

  // Etapa 2: se activa con la primera interacción para editar y queda activa.
  const [edicionActiva, setEdicionActiva] = useState(false);
  const qClasesTodas = useConsulta(['planificacion', 'get_clases', { id_propuesta: idProp }], () => planificacion.get_clases({ id_propuesta: idProp! }), {
    enabled: !!idProp && edicionActiva,
    ...SIN_CACHE,
  });
  const qProfes = useConsulta(['profesor_suplencias', 'get_profesores'], () => profesorSuplencias.get_profesores(), { enabled: edicionActiva, ...SIN_CACHE });
  /** Ya están los datos para editar (docentes habilitados, disponibilidad y choques). */
  const listo = edicionActiva && !!qClasesTodas.data && !!qProfes.data;

  const acc = useAccion((fn: () => Promise<unknown>) => fn(), ['planificacion']);
  const invalidar = useInvalidar();

  // ---- estado de la pantalla
  const [sel, setSel] = useState<Sel | null>(null);
  const [celda, setCelda] = useState<number | null>(null); // id de franja tocada
  const [vaciando, setVaciando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  /** Lo necesario para deshacer la última generación automática (los `cambios` de generar_planilla). */
  const [previas, setPrevias] = useState<CambioGeneracion[] | null>(null);
  const [generando, setGenerando] = useState(false);
  const [duplicando, setDuplicando] = useState<string | null>(null);
  /** Aviso para mostrar al llegar a otra propuesta (la duplicada). */
  const avisoAlLlegar = useRef<Aviso | null>(null);

  const cursos = useMemo(() => ordenarCursos(qArmado.data?.cursos ?? []), [qArmado.data]);
  const clasesCurso = useMemo(() => qClasesCurso.data ?? [], [qClasesCurso.data]);
  const clasesTodas = useMemo(() => qClasesTodas.data ?? [], [qClasesTodas.data]);
  const profesores = useMemo(() => qProfes.data ?? [], [qProfes.data]);
  /** Para elegir docentes: un profesor dado de baja no está disponible para ninguna materia. */
  const activos = useMemo(() => profesores.filter((p) => p.activo !== false), [profesores]);

  const curso = (idCursoParam && cursos.find((c) => c.id_curso === idCursoParam)) || null;

  // Sin curso en la ruta: se abre el primero del ciclo (reemplaza la URL, no suma un paso al historial).
  const primerCurso = cursos[0]?.id_curso;
  useEffect(() => {
    if (idProp && !idCursoParam && primerCurso) ir(rutas.armado(idProp, primerCurso), { replace: true });
  }, [idProp, idCursoParam, primerCurso, ir]);

  useEffect(() => {
    setSel(null);
    setCelda(null);
    setVaciando(false);
    setAviso(avisoAlLlegar.current);
    avisoAlLlegar.current = null;
  }, [idCursoParam, idPropParam]);

  // Una materia elegida antes de tener los docentes: al llegar, si hay un solo docente (o un solo
  // grupo, en las EPA) queda elegido; si hay varios, se elige en la lista.
  useEffect(() => {
    if (!listo || !sel || sel.docs.length || !curso) return;
    const m = (curso.materias ?? []).find((x) => x.id_materia === sel.mid);
    const combos = m ? combosDe(m.id_materia, m.nombre_materia, activos) : [];
    setSel(combos.length === 1 ? { mid: sel.mid, docs: combos[0] } : null);
  }, [listo, sel, curso, activos]);

  const ocs = useMemo(() => ocupaciones(clasesTodas), [clasesTodas]);
  const profPorId = useMemo(() => new Map(profesores.map((p) => [p.id_profesor, p])), [profesores]);
  const dispPorProf = useMemo(
    () => new Map(profesores.map((p) => [p.id_profesor, new Set((p.disponibilidad ?? []).map((f) => f.id_franja_horaria))])),
    [profesores],
  );
  const disponible = (pid: number, fid: number) => !!dispPorProf.get(pid)?.has(fid);
  const grillas = useMemo(() => new Map(cursos.map((c) => [c.id_curso, armarGrilla(c.franjas_horarias)])), [cursos]);

  const cargando = qArmado.isLoading;

  const errorCarga = qArmado.error;
  const errorEdicion = qClasesTodas.error ?? qProfes.error;

  if (!propuesta || cargando) {
    return (
      <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
        <Cabecera />
        {cargando ? (
          <Cargando />
        ) : (
          <div className="r-margen" style={css('padding: 26px 28px;')}>
            <MensajeError
              mensaje={errorCarga ? mensajeDeError(errorCarga) : 'No se encontró la planificación.'}
            />
          </div>
        )}
      </div>
    );
  }

  // ======== cálculo de la vista (como renderVals() del prototipo) ========
  const codigoEstado = propuesta.estado?.codigo ?? 'BOR';
  const estadoVista = COLOR_ESTADO[codigoEstado] ?? COLOR_ESTADO.BOR;
  const nombreDe = (c: Curso) => nombreCurso(c);
  const anioCiclo = ciclo.ciclos.find((c) => c.id_ciclo_lectivo === propuesta.id_ciclo_lectivo)?.anio_calendario;
  const enBorrador = codigoEstado === 'BOR';

  /** Crea una propuesta nueva en Borrador con una copia de cada clase de esta y la abre. */
  const duplicar = async () => {
    if (duplicando || acc.enCurso) return;
    setAviso(null);
    setVaciando(false);
    acc.limpiarError();
    setDuplicando('Creando la copia de ' + propuesta.codigo + '…');
    let nuevaId: number | null = null;
    try {
      const anio = anioCiclo ?? new Date().getFullYear();
      const codigo = siguienteCodigo(anio, await planificacion.get_propuestas());
      const p = await planificacion.crear_propuesta({
        nombre: 'Planificación ' + anio + ' (a partir de ' + propuesta.codigo + ')',
        descripcion_propuesta: 'Creada a partir de ' + propuesta.codigo,
        codigo,
        id_ciclo_lectivo: propuesta.id_ciclo_lectivo,
      });
      nuevaId = p.id_propuesta;
      const origen = await planificacion.get_clases({ id_propuesta: propuesta.id_propuesta });
      const fallas: string[] = [];
      for (let i = 0; i < origen.length; i++) {
        const c = origen[i];
        setDuplicando('Copiando la clase ' + (i + 1) + ' de ' + origen.length + ' a ' + p.codigo + '…');
        try {
          await crearClaseEnPropuesta(p.id_propuesta, {
            codigo: codigoClaseCopia(c.codigo, p.codigo),
            descripcion: c.descripcion ?? '',
            id_curso: c.id_curso,
            id_materia: c.id_materia,
            ids_franjas_horarias: c.ids_franjas_horarias ?? (c.franjas_horarias ?? []).map((f) => f.id_franja_horaria).filter((x): x is number => x != null),
            ids_profesores: c.ids_profesores ?? (c.profesores ?? []).map((x) => x.id_profesor).filter((x): x is number => x != null),
          });
        } catch (e) {
          fallas.push((c.descripcion || c.codigo) + ': ' + mensajeDeError(e));
        }
      }
      let texto = p.codigo + ' se creó a partir de ' + propuesta.codigo + ', con ' + (origen.length - fallas.length) + ' de sus ' + origen.length + ' clases.';
      if (fallas.length) texto += ' No se copiaron: ' + fallas.slice(0, 4).join(' · ') + (fallas.length > 4 ? ' · …' : '') + '.';
      avisoAlLlegar.current = { texto, tipo: 'info' };
    } catch (e) {
      setAviso({ texto: 'No se pudo duplicar: ' + mensajeDeError(e), tipo: 'info' });
    } finally {
      setDuplicando(null);
      await invalidar('planificacion');
    }
    if (nuevaId != null) ir(rutas.armado(nuevaId, curso?.id_curso));
  };

  // ---- cursos (pestañas)
  const botonesCursos = cursos.map((c, i) => {
    const activo = c.id_curso === curso?.id_curso;
    return {
      id: c.id_curso,
      label: nombreDe(c),
      estilo:
        'display: flex; align-items: center; height: 34px; padding: 0 13px; font-size: 12.5px; font-weight: 500;' +
        ' border: 1px solid ' + (activo ? '#14181f' : '#e2e6ec') + ';' +
        ' background: ' + (activo ? '#14181f' : '#fff') + '; color: ' + (activo ? '#fff' : '#4a5462') + ';' +
        ' border-radius: ' + (cursos.length === 1 ? '7px' : i === 0 ? '7px 0 0 7px' : i === cursos.length - 1 ? '0 7px 7px 0' : '0') + ';' +
        (i > 0 ? ' margin-left: -1px;' : ''),
      click: () => ir(rutas.armado(propuesta.id_propuesta, c.id_curso)),
    };
  });

  const botonEncabezado =
    'display: flex; align-items: center; gap: 7px; height: 32px; padding: 0 12px; border-radius: 7px; font-size: 12px; font-weight: 500;' +
    ' border: 1px solid #dfe4ea; background: #fff; color: #4a5462; white-space: nowrap;';
  const ocupadoEncabezado = acc.enCurso || !!duplicando;

  const encabezado = (
    <div className="r-margen r-envolver" style={css('display: flex; align-items: flex-end; gap: 24px; padding: 20px 28px 0; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
      <div style={css('display: flex; flex-direction: column; gap: 6px; padding-bottom: 14px;')}>
        <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
          <span onClick={() => ir(rutas.planificaciones())} style={css('display: flex; align-items: center; gap: 6px; color: #2f5fd0; cursor: pointer;')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6"></path>
            </svg>
            Planificaciones
          </span>
          <span style={css('color: #c3cad4;')}>/</span>
          <span>Ciclo lectivo {anioCiclo ?? ''}</span>
        </div>
        <div className="r-envolver" style={css('display: flex; align-items: center; gap: 12px;')}>
          <span className="mono" style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')} title={propuesta.nombre}>
            {propuesta.codigo}
          </span>
          <span
            style={css(
              'font-size: 11.5px; font-weight: 600; padding: 4px 11px; border-radius: 13px; background: ' + estadoVista.chip + '; color: ' + estadoVista.texto + ';',
            )}
          >
            {estadoVista.label}
          </span>
          <button onClick={() => void duplicar()} disabled={ocupadoEncabezado} style={css(botonEncabezado + (ocupadoEncabezado ? ' opacity: 0.6;' : ''))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0;')}>
              <path d="M9 9h11v11H9zM5 15H4V4h11v1"></path>
            </svg>
            {duplicando ? 'Duplicando…' : 'Duplicar'}
          </button>
          {enBorrador && (
            <button
              onClick={() => ir(rutas.generacion(propuesta.id_propuesta, curso?.id_curso))}
              style={css('display: flex; align-items: center; height: 32px; padding: 0 13px; border-radius: 7px; font-size: 12px; font-weight: 600; white-space: nowrap; border: none; background: ' + ACCENT + '; color: #fff;')}
            >
              Generar planilla
            </button>
          )}
        </div>
      </div>
      <div style={css('flex-grow: 1;')}></div>
      <div className="a13-avance" style={css('display: flex; align-items: center; gap: 16px; padding-bottom: 14px;')}>
        <div className="r-desplazar a13-pestanias" style={css('display: flex; gap: 2px;')}>
          {botonesCursos.map((c) => (
            <button key={c.id} onClick={c.click} style={css(c.estilo)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Sin curso en la ruta se abre el primero (useEffect de arriba); mientras tanto, el encabezado.
  if (!curso) {
    return (
      <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
        <Cabecera />
        {encabezado}
        {cursos.length === 0 && (
          <div className="r-margen" style={css('padding: 26px 28px;')}>
            <MensajeError mensaje="El ciclo lectivo de esta planificación no tiene cursos." />
          </div>
        )}
      </div>
    );
  }

  // Al cambiar de curso, el encabezado queda y la planilla espera sus clases.
  if (!qClasesCurso.data) {
    return (
      <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
        <Cabecera />
        {encabezado}
        {qClasesCurso.error ? (
          <div className="r-margen" style={css('padding: 26px 28px;')}>
            <MensajeError mensaje={mensajeDeError(qClasesCurso.error)} />
          </div>
        ) : (
          <Cargando />
        )}
      </div>
    );
  }

  const editable = enBorrador;
  const ocupado = acc.enCurso || !!duplicando;
  const grilla = grillas.get(curso.id_curso)!;
  const nombreCursoActual = nombreDe(curso);
  const anioCurso = numeroAnio(curso);
  const plan = curso.materias ?? [];
  // Nombres de materias y docentes: los anidados en las clases del curso; si ya llegaron, los catálogos.
  const nombreMateriaClase = new Map<number, string>();
  const nombreProfClase = new Map<number, string>();
  for (const c of clasesCurso) {
    if (c.materia?.nombre_materia) nombreMateriaClase.set(c.id_materia, c.materia.nombre_materia);
    for (const x of c.profesores ?? []) if (x.id_profesor != null) nombreProfClase.set(x.id_profesor, nombreProfesor(x));
  }
  const nombreMateria = (mid: number) =>
    plan.find((m) => m.id_materia === mid)?.nombre_materia ??
    nombreMateriaClase.get(mid) ??
    'Materia';
  const horasMateria = (mid: number) => plan.find((m) => m.id_materia === mid)?.horas_semanales ?? 0;
  // El área viene anidada en la materia del curso (o de la clase).
  const color = (mid: number) =>
    AREAS[areaDe(plan.find((m) => m.id_materia === mid)?.nombre_area ?? clasesCurso.find((c) => c.id_materia === mid)?.materia?.nombre_area)];
  const nombreDocente = (id: number) => nombreProfClase.get(id) || nombreProfesor(profPorId.get(id)) || 'Profesor ' + id;
  const nombresDocs = (ids: number[]) => ids.map(nombreDocente).join(' + ');
  const cursoPorId = new Map(cursos.map((c) => [c.id_curso, c]));

  /** Primera interacción para editar: trae los datos de la etapa 2. */
  const activarEdicion = () => {
    if (!edicionActiva) setEdicionActiva(true);
  };

  const clasePorMateria = new Map<number, Clase>();
  const clasePorFranja = new Map<number, Clase>();
  for (const c of clasesCurso) {
    if (!clasePorMateria.has(c.id_materia)) clasePorMateria.set(c.id_materia, c);
    for (const f of c.ids_franjas_horarias ?? []) clasePorFranja.set(f, c);
  }
  const horasPuestas = (mid: number) => (clasePorMateria.get(mid)?.ids_franjas_horarias ?? []).length;

  const ubicadas = clasesCurso.reduce((n, x) => n + (x.ids_franjas_horarias ?? []).length, 0);
  const totalPlan = plan.reduce((n, m) => n + m.horas_semanales, 0);
  const completo = ubicadas >= totalPlan && totalPlan > 0;

  // ---- persistencia
  const ejecutar = async (fn: () => Promise<unknown>) => {
    setAviso(null);
    setVaciando(false);
    return acc.ejecutar(fn);
  };
  const descripcion = (mid: number) => `${nombreMateria(mid)} · ${nombreCursoActual}`;

  /** Ubica una hora de la materia elegida en la franja. */
  const ubicar = async (b: Bloque) => {
    if (!sel) return;
    const existente = clasePorMateria.get(sel.mid);
    const ok = await ejecutar(() =>
      existente
        ? planificacion.editar_clase(existente.id_clase, {
            ids_franjas_horarias: [...(existente.ids_franjas_horarias ?? []), b.id],
            ids_profesores: existente.ids_profesores ?? [],
          })
        : crearClaseEnPropuesta(propuesta.id_propuesta, {
            codigo: codigoClase(propuesta.codigo, nombreCursoActual, nombreMateria(sel.mid)),
            descripcion: descripcion(sel.mid),
            id_curso: curso.id_curso,
            id_materia: sel.mid,
            ids_franjas_horarias: [b.id],
            ids_profesores: sel.docs,
          }),
    );
    if (ok !== undefined && horasPuestas(sel.mid) + 1 >= horasMateria(sel.mid)) setSel(null);
  };

  /** Cambia los profesores de toda la clase (vale para todas sus horas). */
  const cambiarDocentes = (c: Clase, docs: number[]) =>
    ejecutar(() => planificacion.editar_clase(c.id_clase, { ids_franjas_horarias: c.ids_franjas_horarias ?? [], ids_profesores: docs }));

  /** Saca una hora: si era la última de la clase, se elimina la clase. */
  const sacarHora = async (c: Clase, fid: number) => {
    const resto = (c.ids_franjas_horarias ?? []).filter((x) => x !== fid);
    const ok = await ejecutar(() =>
      resto.length
        ? planificacion.editar_clase(c.id_clase, { ids_franjas_horarias: resto, ids_profesores: c.ids_profesores ?? [] })
        : planificacion.eliminar_clase(c.id_clase).then(() => true),
    );
    if (ok !== undefined) setCelda(null);
  };

  const vaciarCurso = async () => {
    const ok = await ejecutar(async () => {
      for (const c of clasesCurso) await planificacion.eliminar_clase(c.id_clase);
      return true;
    });
    if (ok !== undefined) {
      setSel(null);
      setCelda(null);
    }
  };

  const cambiarEstado = async (codigo: string, mensaje?: string) => {
    const e = (qArmado.data?.estados ?? []).find((x) => x.codigo === codigo);
    if (!e) return;
    const ok = await ejecutar(() => planificacion.asignar_estado_a_propuesta(propuesta.id_propuesta, { id_estado: e.id_estado }));
    if (ok !== undefined) {
      setSel(null);
      setCelda(null);
      if (mensaje) setAviso({ texto: mensaje, tipo: 'info' });
    }
  };

  /** Ubica las horas que faltan en todos los cursos: la API genera y guarda (generar_planilla). */
  const generarAutomatico = async () => {
    setGenerando(true);
    const r = (await ejecutar(() => planificacion.generar_planilla(propuesta.id_propuesta, {}))) as ResultadoGeneracion | undefined;
    setGenerando(false);
    if (r === undefined) return;
    let msg =
      r.horas_ubicadas === 0 && !r.sin_ubicar.length && !r.errores.length
        ? 'No quedó ninguna hora por ubicar.'
        : `Se ubicaron ${r.horas_ubicadas} horas en los ${cursos.length} cursos, respetando la disponibilidad de cada docente y sin superponerlos entre cursos.`;
    if (r.sin_ubicar.length) msg += ' No se pudo ubicar: ' + r.sin_ubicar.map((x) => `${x.materia} en ${x.curso} (${x.horas} h)`).join(', ') + '.';
    if (r.errores.length) msg += ' La API rechazó: ' + r.errores.join('; ') + '.';
    setPrevias(r.cambios.length ? r.cambios : null);
    setSel(null);
    setCelda(null);
    setAviso({ texto: msg, tipo: 'auto' });
  };

  /** Deshace la última generación: borra las clases creadas y restaura las editadas. */
  const deshacer = async () => {
    if (!previas) return;
    const ok = await ejecutar(async () => {
      for (const c of previas) {
        if (c.creada) await planificacion.eliminar_clase(c.id_clase);
        else await planificacion.editar_clase(c.id_clase, { ids_franjas_horarias: c.ids_franjas_horarias_previas, ids_profesores: c.ids_profesores_previos });
      }
      return true;
    });
    if (ok !== undefined) setPrevias(null);
  };

  // ---- evaluación de una franja para la materia elegida
  const docsDeSel = (s: Sel) => clasePorMateria.get(s.mid)?.ids_profesores ?? s.docs;
  type Eval = { ok: true } | { ok: false; tipo: 'sinDocente' | 'tope' | 'noDeclaro' | 'otroCurso' | 'completa'; donde?: string };
  const evaluar = (s: Sel, b: Bloque): Eval => {
    const docs = docsDeSel(s);
    if (!docs.length) return { ok: false, tipo: 'sinDocente' };
    if (horasPuestas(s.mid) >= horasMateria(s.mid)) return { ok: false, tipo: 'completa' };
    const enDia = (clasePorMateria.get(s.mid)?.franjas_horarias ?? []).filter((f) => f.nombre_dia_lectivo === b.dia).length;
    if (enDia >= 2) return { ok: false, tipo: 'tope' };
    if (docs.some((t) => !disponible(t, b.id))) return { ok: false, tipo: 'noDeclaro' };
    for (const t of docs) {
      const o = dondeOcupa(ocs, t, b);
      if (o) return { ok: false, tipo: 'otroCurso', donde: cursoPorId.get(o.id_curso) ? nombreDe(cursoPorId.get(o.id_curso)!) : 'otro curso' };
    }
    return { ok: true };
  };

  // ---- una fila por materia × docente habilitado (con los docentes de la etapa 2);
  // antes, una fila por materia con los docentes de su clase.
  const opcionesLista: OpcionMateria[] = [];
  plan.forEach((m, mi) => {
    const mid = m.id_materia;
    const col = color(mid);
    const clase = clasePorMateria.get(mid);
    const docsClase = clase?.ids_profesores ?? [];
    if (!listo) {
      const puestas = horasPuestas(mid);
      const completa = puestas >= m.horas_semanales;
      const activa = !!sel && sel.mid === mid;
      opcionesLista.push({
        key: mid + '|',
        clase: editable ? '' : 'fila-off',
        nombre: m.nombre_materia,
        docente: docsClase.length ? nombresDocs(docsClase) : 'Sin docente asignado',
        marcaEstilo: 'width: 4px; height: 30px; border-radius: 3px; flex-shrink: 0; background: ' + (completa ? '#cdd4dd' : col.punto) + ';',
        nombreEstilo: 'font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ' + (completa ? '#8b95a5' : '#14181f') + ';',
        docenteEstilo: 'font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #8b95a5;',
        progreso: completa ? '✓ ' + m.horas_semanales + ' h' : puestas + '/' + m.horas_semanales + ' h',
        progresoEstilo:
          'font-size: 11.5px; font-weight: 600; padding: 3px 9px; border-radius: 11px; flex-shrink: 0;' +
          (completa ? ' background: #e9f2ec; color: #2f6b45;' : activa ? ' background: #14181f; color: #fff;' : ' background: #f2f4f7; color: #7a8393;'),
        filaEstilo:
          'display: flex; align-items: center; gap: 11px; width: 100%; padding: 10px 16px; border: none; text-align: left;' +
          (mi === 0 ? '' : ' border-top: 2px solid #eef1f5;') +
          ' background: ' + (activa ? '#f3f6fc' : '#fff') + ';' +
          (activa ? ' box-shadow: inset 3px 0 0 ' + ACCENT + ';' : '') +
          (editable ? '' : ' opacity: 0.55;'),
        click: () => {
          if (!editable) return;
          activarEdicion();
          setSel(activa ? null : { mid, docs: docsClase });
          setCelda(null);
        },
      });
      return;
    }
    const combos = combosDe(mid, m.nombre_materia, activos);
    let elegida: string | null = null;
    if (clase && docsClase.length) {
      const c = combos.find((x) => x[0] === docsClase[0] && x.every((t) => docsClase.includes(t)));
      elegida = mid + '|' + (c ?? docsClase).join('+');
    }
    const puestas = horasPuestas(mid);
    const completa = puestas >= m.horas_semanales;

    if (combos.length === 0) {
      opcionesLista.push({
        key: mid + '|',
        clase: 'fila-off',
        nombre: m.nombre_materia,
        docente: clase ? 'La dicta ' + nombresDocs(docsClase) : 'Sin docente habilitado',
        marcaEstilo: 'width: 4px; height: 30px; border-radius: 3px; flex-shrink: 0; background: #dfe4ea;',
        nombreEstilo: 'font-size: 13px; font-weight: 500; color: #a8b0bb;',
        docenteEstilo: 'font-size: 11px; color: #b03a2e;',
        progreso: puestas + '/' + m.horas_semanales + ' h',
        progresoEstilo: 'font-size: 11.5px; font-weight: 600; padding: 3px 9px; border-radius: 11px; flex-shrink: 0; background: #fbeceb; color: #b03a2e;',
        filaEstilo: 'display: flex; align-items: center; gap: 11px; width: 100%; padding: 10px 16px; border: none; text-align: left; background: #fff;' + (mi === 0 ? '' : ' border-top: 2px solid #eef1f5;'),
        click: () => undefined,
      });
      return;
    }

    combos.forEach((docs, ci) => {
      const clave = mid + '|' + docs.join('+');
      const esElegida = elegida === clave;
      // Si otra combinación de esta materia ya está en la planilla, esta queda deshabilitada.
      const bloqueada = !!elegida && !esElegida;
      const activa = !!sel && sel.mid === mid && sel.docs.join('+') === docs.join('+');
      const puedeTocar = editable && !bloqueada && !(completa && !esElegida);
      opcionesLista.push({
        key: clave,
        clase: puedeTocar ? '' : 'fila-off',
        nombre: m.nombre_materia,
        docente: bloqueada ? 'La dicta ' + nombresDocs(docsClase) : nombresDocs(docs),
        marcaEstilo:
          'width: 4px; height: 30px; border-radius: 3px; flex-shrink: 0; background: ' +
          (bloqueada ? '#e8ecf1' : completa && esElegida ? '#cdd4dd' : col.punto) + ';',
        nombreEstilo:
          'font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ' +
          (bloqueada ? '#b9c1cc' : completa && esElegida ? '#8b95a5' : '#14181f') + ';',
        docenteEstilo:
          'font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ' +
          (bloqueada ? '#c3cad4' : '#8b95a5') + ';' + (bloqueada ? ' font-style: italic;' : ''),
        progreso: bloqueada ? '—' : completa && esElegida ? '✓ ' + m.horas_semanales + ' h' : (esElegida ? puestas : 0) + '/' + m.horas_semanales + ' h',
        progresoEstilo:
          'font-size: 11.5px; font-weight: 600; padding: 3px 9px; border-radius: 11px; flex-shrink: 0;' +
          (bloqueada
            ? ' background: #f7f8fa; color: #c3cad4;'
            : completa && esElegida
              ? ' background: #e9f2ec; color: #2f6b45;'
              : activa
                ? ' background: #14181f; color: #fff;'
                : ' background: #f2f4f7; color: #7a8393;'),
        filaEstilo:
          'display: flex; align-items: center; gap: 11px; width: 100%; padding: 10px 16px; border: none; text-align: left;' +
          (mi === 0 && ci === 0 ? '' : ci === 0 ? ' border-top: 2px solid #eef1f5;' : ' border-top: 1px solid #f4f6f8;') +
          ' background: ' + (activa ? '#f3f6fc' : bloqueada ? '#fcfdfe' : '#fff') + ';' +
          (activa ? ' box-shadow: inset 3px 0 0 ' + ACCENT + ';' : '') +
          (editable ? '' : ' opacity: 0.55;'),
        click: () => {
          if (!puedeTocar) return;
          setSel(activa ? null : { mid, docs });
          setCelda(null);
        },
      });
    });
  });

  // ---- grilla
  const base =
    'height: ' + ALTO + 'px; width: 100%; border-radius: 8px; display: flex; flex-direction: column; justify-content: center;' +
    ' align-items: flex-start; gap: 2px; padding: 0 10px; overflow: hidden; text-align: left;';
  const celdaRecreo = (b: Bloque, key: string): CeldaVista => ({
    key,
    clase: 'slot slot-bloq',
    titulo: 'Recreo',
    sub: b.inicio + ' a ' + b.fin,
    estilo:
      'height: ' + ALTO + 'px; width: 100%; border-radius: 6px; border: none; padding: 0; display: flex; align-items: center; justify-content: center;' +
      ' overflow: hidden; background: repeating-linear-gradient(135deg, #e8ecf1 0 3px, #f5f7fa 3px 6px); cursor: default;',
    tituloEstilo: 'writing-mode: vertical-rl; transform: rotate(180deg); font-size: 10px; font-weight: 600; letter-spacing: 0.04em; color: #8b95a5;',
    subEstilo: 'display: none;',
    click: () => undefined,
  });
  const vacia = (key: string): CeldaVista => ({
    key,
    clase: 'slot slot-bloq',
    titulo: '',
    sub: '',
    estilo: base + ' background: #fbfcfd; border: 1px solid #f0f2f5;',
    tituloEstilo: 'font-size: 12px;',
    subEstilo: 'font-size: 10px;',
    click: () => undefined,
  });
  const motivo: Record<string, string> = { noDeclaro: 'no declaró', tope: '2 h ese día', sinDocente: 'sin docente', completa: 'completa' };

  const filas = DIAS.map((dia, d) => ({
    dia,
    celdas: grilla.columnas.map((_, k): CeldaVista => {
      const b = grilla.dias[d][k];
      const key = d + '-' + k;
      if (!b) return vacia(key);
      if (b.es_recreo) return celdaRecreo(b, key);
      const puesta = clasePorFranja.get(b.id);
      if (puesta) {
        const esSel = celda === b.id;
        return {
          key,
          clase: editable ? 'slot slot-puesta' : 'slot',
          titulo: nombreMateria(puesta.id_materia),
          sub: nombresDocs(puesta.ids_profesores ?? []),
          estilo:
            base + ' background: ' + color(puesta.id_materia).solido + '; border: none;' +
            (esSel ? ' box-shadow: 0 0 0 2.5px #14181f;' : ' box-shadow: 0 1px 2px rgba(20,24,31,0.12);') +
            (editable ? '' : ' opacity: 0.8;'),
          tituloEstilo: 'font-size: 12.5px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;',
          subEstilo: 'font-size: 10.5px; color: rgba(255,255,255,0.88); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;',
          click: () => {
            if (!editable) return;
            activarEdicion();
            setCelda(esSel ? null : b.id);
            setSel(null);
            setAviso(null);
          },
        };
      }
      if (!sel || !editable || !listo) return vacia(key);
      const ev = evaluar(sel, b);
      if (ev.ok) {
        return {
          key,
          clase: 'slot slot-libre',
          titulo: '+',
          sub: '',
          estilo: base + ' background: #eaf6ee; border: 1.5px dashed #6aab84; align-items: center; justify-content: center;' + (ocupado ? ' opacity: 0.6;' : ''),
          tituloEstilo: 'font-size: 19px; font-weight: 400; color: #3f8f63; line-height: 1;',
          subEstilo: 'display: none;',
          click: () => {
            if (!ocupado) void ubicar(b);
          },
        };
      }
      return {
        key,
        clase: 'slot slot-bloq',
        titulo: ev.tipo === 'otroCurso' ? ev.donde ?? '' : motivo[ev.tipo] ?? '',
        sub: '',
        estilo: base + ' background: #f7f8fa; border: 1px solid #edf0f3; align-items: center; justify-content: center;',
        tituloEstilo:
          'font-size: 10.5px; color: #a8b0bb; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;' +
          (ev.tipo === 'otroCurso' ? ' font-weight: 600;' : ''),
        subEstilo: 'display: none;',
        click: () => undefined,
      };
    }),
  }));

  // ---- panel de la clase tocada en la grilla: sus profesores son los de la CLASE (curso + materia)
  let celdaInfo: CeldaInfo | null = null;
  const claseCelda = celda != null && editable ? clasePorFranja.get(celda) : undefined;
  const bloqueCelda = celda != null ? grilla.porId.get(celda) : undefined;
  if (claseCelda && bloqueCelda) {
    const mid = claseCelda.id_materia;
    const cDocs = claseCelda.ids_profesores ?? [];
    const cHoras = (claseCelda.ids_franjas_horarias ?? []).map((f) => grilla.porId.get(f)).filter((b): b is Bloque => !!b);
    const nHoras = cHoras.length + (cHoras.length === 1 ? ' hora' : ' horas');
    const cuandoEs = (b: Bloque) => b.dia + ' ' + b.inicio;
    const nom = nombreMateria(mid);
    const deADos = esDeADos(nom);
    celdaInfo = {
      materia: nom + ' · ' + nombreCursoActual,
      franja: bloqueCelda.dia + ' ' + bloqueCelda.inicio + ' a ' + bloqueCelda.fin + ' · ' + nHoras + ' en la semana',
      color: color(mid).solido,
      enCurso: ocupado,
      cargando: !listo,
      // Una materia que se dicta de a dos (EPA) no puede quedar con un solo profesor.
      docentes: cDocs.map((tid) => {
        const puede = cDocs.length > (deADos ? 2 : 1);
        return {
          id: tid,
          nombre: nombreDocente(tid),
          quitarEstilo:
            'height: 26px; padding: 0 10px; border-radius: 6px; font-size: 11px; font-weight: 500;' +
            (puede ? ' border: 1px solid #edc9c4; background: #fff; color: #b03a2e;' : ' border: 1px solid #e2e6ec; background: #f7f8fa; color: #c3cad4; cursor: default;'),
          quitar: () => {
            if (puede) void cambiarDocentes(claseCelda, cDocs.filter((x) => x !== tid));
          },
        };
      }),
      // Para sumarse a la clase, el profesor tiene que estar libre en TODAS sus horas.
      candidatos: habilitadosEn(mid, activos)
        .filter((p: Profesor) => !cDocs.includes(p.id_profesor))
        .map((p) => {
          let problema: string | null = null;
          for (const h of cHoras) {
            const o = dondeOcupa(ocs, p.id_profesor, h, claseCelda.id_clase);
            if (o) {
              const c = cursoPorId.get(o.id_curso);
              problema = 'Da clase en ' + (c ? nombreDe(c) : 'otro curso') + ' el ' + cuandoEs(h);
            } else if (!disponible(p.id_profesor, h.id)) problema = 'No declaró disponible el ' + cuandoEs(h);
            if (problema) break;
          }
          const libre = !problema;
          return {
            id: p.id_profesor,
            nombre: nombreProfesor(p),
            detalle: libre ? 'Habilitado y libre en las ' + nHoras + ' de la clase' : problema!,
            detalleEstilo: 'font-size: 11px; color: ' + (libre ? '#2f6b45' : '#8a4b12') + ';',
            accion: libre ? 'Sumar' : '—',
            accionEstilo: 'font-size: 11.5px; font-weight: 600; flex-shrink: 0; color: ' + (libre ? ACCENT : '#c3cad4') + ';',
            estilo:
              'display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 11px; border-radius: 8px; border: 1px solid #e2e6ec; background: ' +
              (libre ? '#fff' : '#fafbfc') + ';' + (libre ? '' : ' cursor: default;'),
            sumar: () => {
              if (libre) void cambiarDocentes(claseCelda, [...cDocs, p.id_profesor]);
            },
          };
        }),
      sacar: () => void sacarHora(claseCelda, bloqueCelda.id),
    };
  }

  // ---- encabezado, estados y banners
  const banners: Record<string, { titulo: string; color: string; fondo: string; borde: string; icono: string; texto: string }> = {
    REV: {
      titulo: 'Enviada a revisión',
      color: '#1e4099',
      fondo: '#eef3fc',
      borde: '#cfdcf5',
      icono: 'M12 8v5M12 16.5v.5M12 21a9 9 0 100-18 9 9 0 000 18z',
      texto: '',
    },
    VIG: {
      titulo: 'Planificación vigente',
      color: '#2f6b45',
      fondo: '#ecf5ef',
      borde: '#c2e0cd',
      icono: 'M20 6L9 17l-5-5',
      texto: propuesta.codigo + ' es la vigente del ciclo. Pasa a Fue vigente cuando otra del ciclo pase a Vigente.',
    },
    FVG: {
      titulo: 'Fue vigente',
      color: '#5b6471',
      fondo: '#f5f6f8',
      borde: '#e2e6ec',
      icono: 'M5 11h14v10H5zM8 11V8a4 4 0 018 0v3',
      texto: 'Fue la vigente del ciclo hasta que otra planificación pasó a Vigente.',
    },
  };
  const banner = banners[codigoEstado];

  // Si la planificación está incompleta, la API rechaza el paso a revisión o a Vigente (409) con
  // el curso, la materia y las horas de cada diferencia, y el mensaje se muestra en la pantalla (acc.error).
  const ORDEN_ESTADOS = ['BOR', 'REV', 'VIG', 'FVG'];
  const estadosBotones = ORDEN_ESTADOS.map((id, i) => {
    const e = COLOR_ESTADO[id];
    const activo = codigoEstado === id;
    const permitido = (TRANSICIONES[codigoEstado] ?? []).includes(id);
    return {
      id,
      label: e.label,
      puntoEstilo:
        'width: 6px; height: 6px; border-radius: 50%; margin-right: 7px; flex-shrink: 0; background: ' +
        (activo ? '#fff' : permitido ? e.punto : '#cdd4dd') + ';',
      estilo:
        'display: flex; align-items: center; height: 32px; padding: 0 12px; font-size: 12px; font-weight: 500;' +
        ' border: 1px solid ' + (activo ? '#14181f' : '#e2e6ec') + ';' +
        ' background: ' + (activo ? '#14181f' : '#fff') + ';' +
        ' color: ' + (activo ? '#fff' : permitido ? '#4a5462' : '#b9c1cc') + ';' +
        ' border-radius: ' + (i === 0 ? '7px 0 0 7px' : i === ORDEN_ESTADOS.length - 1 ? '0 7px 7px 0' : '0') + ';' +
        (i > 0 ? ' margin-left: -1px;' : '') +
        (permitido ? '' : ' cursor: default;'),
      click: () => {
        if (activo || ocupado) return;
        if (!permitido) {
          setVaciando(false);
          setAviso({
            texto:
              codigoEstado === 'BOR' && id === 'VIG'
                ? 'Primero hay que enviarla a revisión: Dirección la aprueba como vigente desde ahí.'
                : id === 'FVG'
                  ? 'Una planificación pasa a Fue vigente sola, cuando otra del ciclo pasa a Vigente.'
                  : codigoEstado === 'VIG'
                    ? 'La planificación vigente no cambia de estado: deja de serlo cuando otra del ciclo pasa a Vigente.'
                    : `Una planificación ${estadoVista.label.toLowerCase()} no puede pasar a ${e.label.toLowerCase()}.`,
            tipo: 'info',
          });
          return;
        }
        void cambiarEstado(id);
      },
    };
  });

  const generarHabilitado = editable && !ocupado;
  const vaciarHabilitado = editable && ubicadas > 0 && !ocupado;
  const hayDeshacer = !!previas && aviso?.tipo === 'auto';
  const confirmando = vaciando;
  const hayAccion = confirmando || !!duplicando || !!aviso;
  const accionColor = confirmando ? '#b03a2e' : aviso?.tipo === 'auto' ? '#2f6b45' : '#a56a10';
  const accionTexto = vaciando
    ? 'Se van a quitar las ' + ubicadas + ' horas ya ubicadas en ' + nombreCursoActual + '. Los otros cursos no se tocan.'
    : duplicando ?? aviso?.texto ?? '';

  const columnasHoras = grilla.columnas.filter((b) => !b.es_recreo);
  const tituloGrilla =
    'Planilla de ' + nombreCursoActual +
    (anioCurso >= 4 ? ' · ' + (curso.orientacion?.nombre_orientacion ?? '') : '') +
    ' · ' + (curso.turno?.nombre ?? '') +
    (columnasHoras.length ? ' (' + columnasHoras[0].inicio + ' a ' + columnasHoras[columnasHoras.length - 1].fin + ')' : '');

  const guardarTexto = ocupado ? 'Guardando…' : 'Guardado';
  const guardarEstilo =
    'display: flex; align-items: center; gap: 7px; height: 32px; padding: 0 13px; border-radius: 7px; font-size: 12px; font-weight: 600;' +
    (!editable ? ' border: 1px solid #eef1f5; background: #fff; color: #c3cad4; cursor: default;' : ' border: 1px solid #c2e0cd; background: #ecf5ef; color: #2f6b45; cursor: default;');

  return (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      {encabezado}

      <div className="r-margen r-apilar" style={css('display: flex; gap: 16px; padding: 18px 28px 26px; align-items: flex-start;')}>
        <PanelMaterias
          filtroAnio={anioCurso + '° año'}
          filtroOrientacion={'Orientación ' + (curso.orientacion?.nombre_orientacion ?? '')}
          opciones={opcionesLista}
          ubicadas={ubicadas}
          totalPlan={totalPlan}
          progresoAncho={(totalPlan ? Math.min(100, Math.round((ubicadas / totalPlan) * 100)) : 0) + '%'}
          progresoColor={completo ? '#2f6b45' : ACCENT}
          cargando={edicionActiva && !listo}
        />

        {/* ===== grilla ===== */}
        <div style={css('flex: 1; min-width: 0; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
          <div style={css('display: flex; align-items: center; flex-wrap: wrap; gap: 10px 12px; padding: 13px 18px; border-bottom: 1px solid #eef1f5;')}>
            <div style={css('display: flex; flex-direction: column; gap: 3px; min-width: 240px; flex-grow: 1;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>{tituloGrilla}</div>
            </div>
            <div style={css('flex-grow: 1;')}></div>

            <span style={css('display: flex; flex-direction: column; gap: 1px; align-items: flex-end;')}>
              <span style={css('font-size: 11.5px; color: #4a5462; font-weight: 600;')}>Estado de la planificación</span>
            </span>
            <div className="r-desplazar" style={css('display: flex; gap: 2px;')}>
              {estadosBotones.map((e) => (
                <button key={e.id} onClick={e.click} style={css(e.estilo)}>
                  <span style={css(e.puntoEstilo)}></span>
                  {e.label}
                </button>
              ))}
            </div>

            <div className="r-ocultar-movil" style={css('width: 1px; height: 24px; background: #e2e6ec;')}></div>

            <button
              onClick={() => {
                if (generarHabilitado) void generarAutomatico();
              }}
              style={css(
                'display: flex; align-items: center; gap: 7px; height: 32px; padding: 0 13px; border-radius: 7px; font-size: 12px; font-weight: 600;' +
                  (generarHabilitado ? ' border: none; background: #14181f; color: #fff;' : ' border: 1px solid #eef1f5; background: #fff; color: #c3cad4; cursor: default;'),
              )}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0;')}>
                <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5L13 3z"></path>
              </svg>
              {generando ? 'Generando…' : 'Generar automáticamente'}
            </button>
            <button
              onClick={() => {
                if (!vaciarHabilitado) return;
                setAviso(null);
                setVaciando(true);
              }}
              style={css(
                'display: flex; align-items: center; gap: 7px; height: 32px; padding: 0 12px; border-radius: 7px; font-size: 12px; font-weight: 500;' +
                  ' border: 1px solid ' + (vaciarHabilitado ? '#edc9c4' : '#eef1f5') + ';' +
                  ' background: #fff; color: ' + (vaciarHabilitado ? '#b03a2e' : '#c3cad4') + ';' +
                  (vaciarHabilitado ? '' : ' cursor: default;'),
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0;')}>
                <path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13"></path>
              </svg>
              Vaciar
            </button>
            <button style={css(guardarEstilo)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0;')}>
                <path d={ocupado ? 'M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6' : 'M20 6L9 17l-5-5'}></path>
              </svg>
              {guardarTexto}
            </button>
          </div>

          {(acc.error || errorEdicion) && (
            <div style={css('display: flex; flex-direction: column; gap: 8px; padding: 12px 18px; border-bottom: 1px solid #eef1f5;')}>
              <MensajeError mensaje={acc.error} alCerrar={acc.limpiarError} />
              <MensajeError mensaje={errorEdicion ? mensajeDeError(errorEdicion) : null} />
            </div>
          )}

          {hayAccion && (
            <div
              className="r-envolver"
              style={css(
                'display: flex; align-items: center; gap: 11px; padding: 12px 18px; border-bottom: 1px solid #eef1f5; background: ' +
                  (confirmando ? '#fbeceb' : aviso?.tipo === 'auto' ? '#ecf5ef' : '#fdf6ec') + ';',
              )}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accionColor} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0;')}>
                <path d="M12 8v5M12 16.5v.5"></path>
                <circle cx="12" cy="12" r="9"></circle>
              </svg>
              <span style={css('font-size: 12.5px; color: ' + accionColor + '; line-height: 1.5;')}>{accionTexto}</span>
              <span style={css('flex-grow: 1;')}></span>
              {hayDeshacer && !confirmando && !duplicando && (
                <button
                  onClick={() => void deshacer()}
                  disabled={ocupado}
                  style={css('height: 30px; padding: 0 13px; border-radius: 7px; border: 1px solid #c2e0cd; background: #fff; color: #2f6b45; font-size: 12px; font-weight: 500; flex-shrink: 0;')}
                >
                  Deshacer
                </button>
              )}
              {vaciando && (
                <span style={css('display: flex; gap: 8px; flex-shrink: 0;')}>
                  <button
                    onClick={() => void vaciarCurso()}
                    disabled={ocupado}
                    style={css('height: 30px; padding: 0 13px; border-radius: 7px; border: none; background: #b03a2e; color: #fff; font-size: 12px; font-weight: 600;')}
                  >
                    Sí, vaciar
                  </button>
                  <button
                    onClick={() => setVaciando(false)}
                    style={css('height: 30px; padding: 0 13px; border-radius: 7px; border: 1px solid #edc9c4; background: #fff; color: #b03a2e; font-size: 12px; font-weight: 500;')}
                  >
                    Cancelar
                  </button>
                </span>
              )}
            </div>
          )}

          {banner && (
            <div className="r-envolver" style={css('display: flex; align-items: center; gap: 12px; padding: 13px 18px; border-bottom: 1px solid #eef1f5; background: ' + banner.fondo + ';')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={banner.color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0;')}>
                <path d={banner.icono}></path>
              </svg>
              <span style={css('display: flex; flex-direction: column; gap: 2px;')}>
                <span style={css('font-size: 12.5px; font-weight: 600; color: ' + banner.color + ';')}>{banner.titulo}</span>
                {banner.texto && <span style={css('font-size: 11.5px; color: ' + banner.color + '; opacity: 0.85;')}>{banner.texto}</span>}
              </span>
              <span style={css('flex-grow: 1;')}></span>
              {codigoEstado === 'REV' && (
                <span style={css('display: flex; gap: 8px; flex-shrink: 0;')}>
                  <button
                    onClick={() => void cambiarEstado('BOR', 'Dirección rechazó la planificación y volvió a borrador.')}
                    disabled={ocupado}
                    style={css('height: 30px; padding: 0 13px; border-radius: 7px; border: 1px solid ' + banner.borde + '; background: #fff; color: ' + banner.color + '; font-size: 12px; font-weight: 500;')}
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => void cambiarEstado('VIG')}
                    disabled={ocupado}
                    style={css('height: 30px; padding: 0 13px; border-radius: 7px; border: none; background: #2f6b45; color: #fff; font-size: 12px; font-weight: 600;')}
                  >
                    Aprobar como vigente
                  </button>
                </span>
              )}
            </div>
          )}

          <Grilla
            gridCols={'84px ' + grilla.columnas.map((b) => (b.es_recreo ? '26px' : 'minmax(0, 1fr)')).join(' ')}
            franjas={grilla.columnas.map((b) =>
              b.es_recreo
                ? { key: 'r' + b.id, hora: '', estilo: 'padding-bottom: 4px;' }
                : { key: 'h' + b.id, hora: b.inicio, estilo: 'font-size: 11px; color: #8b95a5; text-align: center; padding-bottom: 4px; font-weight: 500;' },
            )}
            filas={filas}
          />
        </div>

        {/* Solo con una clase tocada; si no, la planilla ocupa todo el ancho. */}
        {celdaInfo && <PanelDerecho celda={celdaInfo} />}
      </div>
    </div>
  );
}
