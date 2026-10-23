// A14 · Orientaciones. Prototipo: <template id="tpl-orientaciones"> y DC.registrar("orientaciones") en prototipo/index.html.
// Cuadro año académico × orientación, plan de estudios de cada año (materias de la orientación)
// y datos/alta/baja de la orientación, todo contra los servicios Orientación y Planificación.
//
// En la API una orientación no guarda "años asociados": se derivan de los años de sus materias
// (get_materias / get_materias_orientacion) y de los años de sus cursos (ids_cursos → get_cursos).
import { useMemo, useState } from 'react';
import type { Area, Materia, Orientacion } from '@sahs/contratos';
import { orientacion, planificacion, profesorSuplencias } from '../api';
import { useNavegar } from '../app/navegar';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
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
const CICLOS: Record<number, string> = { 1: 'Ciclo básico', 2: 'Ciclo básico', 3: 'Ciclo intermedio', 4: 'Ciclo orientado', 5: 'Ciclo orientado' };
const CAMPO = 'height: 38px; padding: 0 12px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; background: #fcfdfe; color: #14181f;';

const NO_API_EDITAR = 'No disponible en la API: no hay un command para cambiar el nombre, el código o la descripción de una orientación.';
const NO_API_HORAS = 'No disponible en la API: no hay un command para cambiar las horas de una materia (solo las de una materia en un curso, desde el curso).';
const NO_API_ASOCIAR = 'No disponible en la API: una orientación no guarda sus años. Un año queda asociado cuando se carga su primera materia (o un curso de ese año usa la orientación).';
const NO_API_DESASOCIAR = 'No disponible en la API: el año se deja de aplicar cuando se quitan todas sus materias y ningún curso de ese año usa la orientación.';

type Vista = 'cuadro' | 'materias' | 'orientacion';

/** Número del año académico ("4° año" → 4). */
const numAnio = (txt: string | undefined) => parseInt(txt ?? '', 10) || 0;

export default function A14Orientaciones() {
  const ir = useNavegar();
  const ciclo = useCiclo();

  const qOrs = useConsulta(['orientacion', 'get_orientaciones'], () => orientacion.get_orientaciones());
  const qMats = useConsulta(['orientacion', 'get_materias'], () => orientacion.get_materias());
  const qAreas = useConsulta(['orientacion', 'get_areas'], () => orientacion.get_areas());
  const qAnios = useConsulta(['planificacion', 'get_anios_academicos'], () => planificacion.get_anios_academicos());
  const qCursos = useConsulta(['planificacion', 'get_cursos'], () => planificacion.get_cursos());
  const qProfes = useConsulta(['profesor_suplencias', 'get_profesores'], () => profesorSuplencias.get_profesores());

  const [vista, setVista] = useState<Vista>('cuadro');
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
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [errorPanel, setErrorPanel] = useState<string | null>(null);
  const [avisoPanel, setAvisoPanel] = useState<string | null>(null);

  const ors = qOrs.data ?? [];
  const alta = modo === 'alta';

  // id del año académico → número (1..5), y a la inversa.
  const anios = useMemo(() => [...(qAnios.data ?? [])].sort((x, y) => numAnio(x.anio_curricular) - numAnio(y.anio_curricular)), [qAnios.data]);
  const numDe = (idAnio: number | undefined) => numAnio(anios.find((a) => a.id_anio_academico === idAnio)?.anio_curricular);
  const idDe = (n: number) => anios.find((a) => numAnio(a.anio_curricular) === n)?.id_anio_academico;

  const o: Orientacion | null = ors.find((x) => x.id_orientacion === celda.o) ?? ors[0] ?? null;
  const celdaA = celda.a;

  // Materias de la orientación elegida (plan de estudios).
  const qMatsO = useConsulta(['orientacion', 'get_materias_orientacion', o?.id_orientacion], () => orientacion.get_materias_orientacion(o!.id_orientacion), {
    enabled: !!o,
  });

  const mats = qMats.data ?? [];
  const cursos = qCursos.data ?? [];
  const de = (idO: number, a: number): Materia[] => {
    const fuente = o && idO === o.id_orientacion && qMatsO.data ? qMatsO.data : mats.filter((m) => m.id_orientacion === idO);
    return fuente.filter((m) => numDe(m.id_anio_academico) === a);
  };
  const horas = (l: Materia[]) => l.reduce((t, m) => t + (m.horas_semanales ?? 0), 0);

  /** Años en que se aplica cada orientación: los de sus materias y los de sus cursos. */
  const aniosDe = (x: Orientacion): number[] => {
    const s = new Set<number>();
    mats.filter((m) => m.id_orientacion === x.id_orientacion).forEach((m) => s.add(numDe(m.id_anio_academico)));
    cursos.filter((c) => (x.ids_cursos ?? []).includes(c.id_curso) || c.id_orientacion === x.id_orientacion).forEach((c) => s.add(numDe(c.id_anio_academico)));
    s.delete(0);
    return [...s].sort((p, q) => p - q);
  };

  /** Docentes habilitados en cada materia (lista_materias_habilitadas de los profesores). */
  const docentes = useMemo(() => {
    const m = new Map<number, number>();
    (qProfes.data ?? []).forEach((p) => (p.lista_materias_habilitadas ?? []).forEach((x) => x.id_materia != null && m.set(x.id_materia, (m.get(x.id_materia) ?? 0) + 1)));
    return m;
  }, [qProfes.data]);

  const crearOr = useAccion((b: { nombre_orientacion: string; codigo: string; descripcion_orientacion?: string }) => orientacion.crear_orientacion(b), ['orientacion']);
  const eliminarOr = useAccion(async (id: number) => (await orientacion.eliminar_orientacion(id), true), ['orientacion', 'planificacion']);
  const crearMat = useAccion((b: Parameters<typeof orientacion.crear_materia>[0]) => orientacion.crear_materia(b), ['orientacion']);
  const eliminarMat = useAccion(async (id: number) => (await orientacion.eliminar_materia(id), true), ['orientacion', 'profesor_suplencias']);

  const limpiar = () => {
    setError(null);
    setAviso(null);
    setErrorPanel(null);
    setAvisoPanel(null);
    setConfirmar(null);
    setConfirmarEliminar(false);
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

  const cargando = qOrs.isLoading || qMats.isLoading || qAnios.isLoading || qCursos.isLoading;
  const errorCarga = qOrs.error ?? qMats.error ?? qAnios.error ?? qCursos.error;

  if (cargando || errorCarga) {
    return (
      <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
        <Cabecera />
        <div style={css('padding: 20px 28px;')}>{errorCarga ? <MensajeError mensaje={errorCarga.message} /> : <Cargando />}</div>
      </div>
    );
  }

  const oAnios = o ? aniosDe(o) : [];
  const nombresAreas = new Map<number, Area>((qAreas.data ?? []).map((a) => [a.id_area, a]));

  // ---- cuadro año × orientación
  const filaGrid = 'display: grid; grid-template-columns: 140px repeat(' + ors.length + ', minmax(0, 1fr)); gap: 8px;';
  const columnas = ors.map((x) => {
    const xa = aniosDe(x);
    const activa = !alta && !!o && x.id_orientacion === o.id_orientacion;
    return {
      x,
      detalle: xa.length === 0 ? 'Sin años asociados' : xa.length === 1 ? xa[0] + '° año' : xa.map((a) => a + '°').join(', ') + ' año',
      chapaEstilo:
        'width: 40px; height: 28px; border-radius: 7px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;' +
        ' font-family: "IBM Plex Mono", monospace; font-size: 11px; font-weight: 600;' +
        ' background: ' + (activa ? ACCENT : '#eef1f5') + '; color: ' + (activa ? '#fff' : '#5b6471') + ';',
      estilo:
        'display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 8px; text-align: left; min-width: 0;' +
        ' border: 1px solid ' + (activa ? '#cfdcf5' : 'transparent') + '; background: ' + (activa ? '#f3f6fc' : '#fff') + ';',
      click: () => irA(x, xa[0] ?? null, 'orientacion'),
    };
  });
  const filas = anios.map((an) => {
    const a = numAnio(an.anio_curricular);
    return {
      key: an.id_anio_academico,
      anio: an.anio_curricular,
      ciclo: CICLOS[a] ?? '',
      celdas: ors.map((x) => {
        const asociada = aniosDe(x).includes(a);
        const lista = de(x.id_orientacion, a);
        const sel = !alta && !!o && x.id_orientacion === o.id_orientacion && celdaA === a && vista !== 'cuadro';
        const base =
          'height: 54px; width: 100%; border-radius: 8px; display: flex; flex-direction: column; justify-content: center;' +
          ' align-items: flex-start; gap: 2px; padding: 0 12px; text-align: left;';
        const estilo = !asociada
          ? base + ' background: #fff; border: 1.5px dashed #d3d9e2;'
          : sel
            ? base + ' background: ' + ACCENT + '; border: 1px solid ' + ACCENT + ';'
            : base + ' background: #eef3fc; border: 1px solid #cfdcf5;';
        return {
          key: x.id_orientacion,
          titulo: !asociada ? '+ Asociar' : lista.length === 0 ? 'Sin materias' : lista.length + (lista.length === 1 ? ' materia' : ' materias'),
          sub: !asociada ? '' : lista.length === 0 ? 'Cargá sus materias' : horas(lista) + ' h semanales',
          estilo,
          title: !asociada ? 'Abre el plan de ' + a + '° año. ' + NO_API_ASOCIAR : undefined,
          tituloEstilo: 'font-size: 12.5px; font-weight: 600; color: ' + (!asociada ? '#8b95a5' : sel ? '#fff' : '#1e3f80') + ';',
          subEstilo: 'font-size: 11px; color: ' + (sel ? 'rgba(255,255,255,0.85)' : lista.length === 0 && asociada ? '#a56a10' : '#6b7482') + ';',
          click: () => {
            irA(x, a, 'materias');
            // Asociar un año no se guarda: se abre su plan y queda asociado con la primera materia.
            if (!asociada) setAviso(x.nombre_orientacion + ' todavía no se aplica en ' + a + '° año: queda asociada cuando cargues su primera materia.');
          },
        };
      }),
    };
  });

  // ---- materias de la celda elegida
  const hayCelda = !alta && !!o && !!celdaA;
  const lista = hayCelda ? de(o!.id_orientacion, celdaA!) : [];
  const celdaTitulo = hayCelda ? celdaA + '° año · ' + o!.nombre_orientacion : '';
  const total = horas(lista);
  const presentes = lista.map((m) => m.nombre_materia.toLowerCase());
  const vistos = new Set<string>();
  const copiables = !hayCelda
    ? []
    : mats.filter((m) => {
        const k = m.nombre_materia.toLowerCase();
        if (numDe(m.id_anio_academico) !== celdaA || m.id_orientacion === o!.id_orientacion || presentes.includes(k) || vistos.has(k)) return false;
        vistos.add(k);
        return true;
      });

  let avisoAnioTexto = '';
  if (hayCelda && o!.codigo !== 'BAS' && celdaA! <= 3)
    avisoAnioTexto = 'Los cursos de 1° a 3° año usan la orientación Básica. Asociar ' + o!.nombre_orientacion + ' a ' + celdaA + '° año es una excepción al plan de estudios.';
  if (hayCelda && o!.codigo === 'BAS' && celdaA! >= 4)
    avisoAnioTexto = 'La orientación Básica corresponde a 1° a 3° año. En 4° y 5° cada curso tiene una orientación específica.';

  const agregar = async (b: { nombre_materia: string; horas_semanales: number; id_area?: number | null; descripcion_materia?: string }, okTexto: string) => {
    if (!o || !celdaA) return;
    const idAnio = idDe(celdaA);
    limpiar();
    const r = await crearMat.ejecutar({ ...b, id_orientacion: o.id_orientacion, id_anio_academico: idAnio });
    if (r) setAviso(okTexto);
    return r;
  };
  const agregarNueva = async () => {
    const nombre = nNombre.trim();
    const h = Number(nHoras);
    limpiar();
    if (!nombre) return setError('Escribí el nombre de la materia.');
    if (!(h >= 1 && h <= 10) || Math.round(h) !== h) return setError('Las horas semanales tienen que ser un número entero entre 1 y 10.');
    const r = await agregar(
      { nombre_materia: nombre, horas_semanales: h, id_area: nArea ? Number(nArea) : undefined },
      nombre + ' se agregó a ' + celdaTitulo + ' con ' + h + ' h. Falta habilitar sus docentes desde su ficha.',
    );
    if (r) {
      setNNombre('');
      setNArea('');
      setNHoras('');
    }
  };

  // ---- panel de datos / alta
  const cursosCiclo = o ? cursos.filter((c) => c.id_orientacion === o.id_orientacion && c.id_ciclo_lectivo === ciclo.activo?.id_ciclo_lectivo) : [];
  const nombreCurso = (c: (typeof cursos)[number]) => numDe(c.id_anio_academico) + '° ' + c.division;
  const aniosChips = anios.map((an) => {
    const a = numAnio(an.anio_curricular);
    const activo = !alta && oAnios.includes(a);
    const n = !alta && o ? de(o.id_orientacion, a).length : 0;
    return {
      key: an.id_anio_academico,
      label: a + '°',
      sub: alta ? (a <= 3 ? 'básico' : 'orientado') : activo ? (n === 1 ? '1 materia' : n + ' materias') : 'no',
      estilo:
        'height: 50px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;' +
        ' border: 1px solid ' + (activo ? ACCENT : '#dfe4ea') + '; background: ' + (activo ? ACCENT : '#fff') + ';' +
        ' color: ' + (activo ? '#fff' : '#4a5462') + '; cursor: default;',
      subEstilo: 'font-size: 10.5px; color: ' + (activo ? 'rgba(255,255,255,0.85)' : '#8b95a5') + ';',
      title: alta ? 'Los años se asocian después de crearla, al cargar las materias de cada año.' : activo ? NO_API_DESASOCIAR : NO_API_ASOCIAR,
    };
  });
  const puedeGuardar = alta;
  const guardarPanel = async () => {
    if (!alta) return;
    const nombre = fNombre.trim();
    const codigo = fCodigo.trim();
    setErrorPanel(null);
    setAvisoPanel(null);
    if (!nombre || !codigo) return setErrorPanel('Completá el nombre y el código.');
    const r = await crearOr.ejecutar({ nombre_orientacion: nombre, codigo, descripcion_orientacion: fDesc.trim() || undefined });
    if (!r) return;
    // Sin años guardados: se abre el plan de 4° año (ciclo orientado) para cargar la primera materia.
    irA(r, 4, 'materias');
    setAviso(nombre + ' se creó. Cargá sus materias: cada año queda asociado con su primera materia.');
  };
  const eliminar = async () => {
    if (!o) return;
    if (!confirmarEliminar) {
      limpiar();
      setConfirmarEliminar(true);
      setErrorPanel('Tocá de nuevo «Eliminar la orientación» para confirmar.');
      return;
    }
    setErrorPanel(null);
    const nombre = o.nombre_orientacion;
    const ok = await eliminarOr.ejecutar(o.id_orientacion);
    setConfirmarEliminar(false);
    if (!ok) return; // 409 si tiene materias o cursos: el mensaje queda en eliminarOr.error
    const resto = ors.filter((x) => x.id_orientacion !== o.id_orientacion);
    limpiar();
    setCelda({ o: resto[0]?.id_orientacion ?? null, a: null });
    setVista('cuadro');
    setAviso(nombre + ' se eliminó.');
  };

  const aniosLinks = (o && !alta ? oAnios : []).map((a) => {
    const activo = vista === 'materias' && celdaA === a;
    return {
      a,
      label: a + '° año',
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
    setVista('cuadro');
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
    vista === 'cuadro' ? 'Orientaciones y planes de estudio' : vista === 'materias' ? 'Materias de ' + celdaTitulo : alta ? 'Nueva orientación' : 'Orientación ' + (o?.nombre_orientacion ?? '');
  const miga = vista === 'materias' ? celdaTitulo : alta ? 'Nueva' : (o?.nombre_orientacion ?? '');
  const errorAccion = crearMat.error ?? eliminarMat.error;
  const errorTexto = error ?? errorAccion;
  const errorPanelTexto = errorPanel ?? crearOr.error ?? eliminarOr.error;

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
    <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir('A1')} style={css('cursor: pointer;')}>Inicio</span>
            <span style={css('color: #c3cad4;')}>/</span>
            {vista === 'cuadro' ? (
              <span style={css('color: #14181f; font-weight: 500;')}>Orientaciones</span>
            ) : (
              <>
                <button onClick={volver} style={css('border: none; background: none; padding: 0; font-size: 12px; color: #2f5fd0; cursor: pointer;')}>Orientaciones</button>
                <span style={css('color: #c3cad4;')}>/</span>
                <span style={css('color: #14181f; font-weight: 500;')}>{miga}</span>
              </>
            )}
          </div>
          <div style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>{tituloPagina}</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        {vista !== 'cuadro' && (
          <button onClick={volver} style={css('display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 15px; border-radius: 8px; border: 1px solid #d3d9e2; background: #fff; color: #14181f; font-size: 13px; font-weight: 500;')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"></path></svg>
            Volver al cuadro
          </button>
        )}
        {vista === 'cuadro' && (
          <button onClick={abrirNueva} style={css('display: flex; align-items: center; gap: 9px; height: 40px; padding: 0 17px; border-radius: 8px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 13px; font-weight: 600;')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"></path></svg>
            Nueva orientación
          </button>
        )}
      </div>

      <div style={css('padding: 20px 28px 28px; display: flex; flex-direction: column; gap: 18px;')}>
        {/* ===== cuadro año académico × orientación ===== */}
        {vista === 'cuadro' && (
          <>
            {aviso && <div style={css('font-size: 12px; color: #245239; background: #eef6f0; border: 1px solid #cfe5d6; border-radius: 8px; padding: 9px 11px;')}>{aviso}</div>}
            <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
              <div style={css('display: flex; align-items: flex-end; gap: 16px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
                <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
                  <div style={css('font-size: 13.5px; font-weight: 600;')}>Qué orientación se aplica en cada año académico</div>
                  <div style={css('font-size: 12px; color: #6b7482;')}>Tocá una celda asociada para ver y cargar sus materias, o una vacía para asociar la orientación a ese año. Tocá el nombre de una orientación para editar sus datos.</div>
                </div>
                <div style={css('flex-grow: 1;')}></div>
                <span style={css('display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: #4a5462;')}><span style={css('width: 18px; height: 12px; border-radius: 3px; background: #eef3fc; border: 1px solid #cfdcf5;')}></span>Asociada</span>
                <span style={css('display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: #4a5462;')}><span style={css('width: 18px; height: 12px; border-radius: 3px; background: #fff; border: 1.5px dashed #c3cad4;')}></span>Sin asociar</span>
              </div>
              <div style={css('padding: 14px 20px 18px; display: flex; flex-direction: column; gap: 8px;')}>
                <div style={css(filaGrid)}>
                  <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393; align-self: end; padding-bottom: 4px;')}>Año académico</div>
                  {columnas.map((c) => (
                    <button key={c.x.id_orientacion} onClick={c.click} style={css(c.estilo)}>
                      <span style={css(c.chapaEstilo)}>{c.x.codigo}</span>
                      <span style={css('display: flex; flex-direction: column; gap: 1px; min-width: 0; text-align: left;')}>
                        <span style={css('font-size: 13px; font-weight: 600; color: #14181f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>{c.x.nombre_orientacion}</span>
                        <span style={css('font-size: 11px; color: #7a8393;')}>{c.detalle}</span>
                      </span>
                    </button>
                  ))}
                </div>
                {filas.map((f) => (
                  <div key={f.key} style={css(filaGrid)}>
                    <div style={css('display: flex; flex-direction: column; justify-content: center; gap: 2px;')}>
                      <span style={css('font-size: 13px; font-weight: 600;')}>{f.anio}</span>
                      <span style={css('font-size: 11px; color: #8b95a5;')}>{f.ciclo}</span>
                    </div>
                    {f.celdas.map((c) => (
                      <button key={c.key} onClick={c.click} title={c.title} style={css(c.estilo)}>
                        <span style={css(c.tituloEstilo)}>{c.titulo}</span>
                        <span style={css(c.subEstilo)}>{c.sub}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ===== vista: materias de un año y una orientación ===== */}
        {vista === 'materias' && (
          <>
            <div style={css('display: flex; align-items: center; gap: 10px; flex-wrap: wrap;')}>
              <span style={css('font-size: 12px; color: #6b7482;')}>Años de {o?.nombre_orientacion ?? ''}</span>
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
                  <div style={css('display: flex; align-items: center; gap: 16px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
                    <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
                      <div style={css('font-size: 14px; font-weight: 600;')}>Plan de estudios</div>
                      <div style={css('font-size: 12px; color: #6b7482;')}>Son las que se ofrecen al crear un curso de este año y orientación, y al armar su grilla.</div>
                    </div>
                    <div style={css('flex-grow: 1;')}></div>
                    <div style={css('display: flex; flex-direction: column; align-items: flex-end; gap: 5px;')}>
                      <span style={css('font-size: 12px; color: #4a5462;')}>
                        <b className="mono" style={css('font-size: 15px;')}>{total}</b> horas cátedra por semana
                      </span>
                      <span style={css('font-size: 11px; color: #7a8393;')}>Tienen que entrar en el turno del curso</span>
                    </div>
                  </div>
                  {avisoAnioTexto && (
                    <div style={css('margin: 14px 20px 0; padding: 10px 12px; border-radius: 8px; background: #fdf6ec; border: 1px solid #f0dcb8; font-size: 12px; color: #8a4b12; line-height: 1.5;')}>{avisoAnioTexto}</div>
                  )}
                  <div style={css('display: grid; grid-template-columns: 1fr 150px 128px 116px 84px; gap: 12px; padding: 10px 20px; background: #fafbfc; border-bottom: 1px solid #eef1f5; margin-top: 12px; border-top: 1px solid #eef1f5;')}>
                    <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Materia</div>
                    <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Área</div>
                    <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Horas semanales</div>
                    <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Docentes</div>
                    <div></div>
                  </div>
                  {qMatsO.isLoading && <Cargando />}
                  {lista.map((m) => {
                    const areaNombre = m.area?.nombre_area ?? (m.id_area != null ? nombresAreas.get(m.id_area)?.nombre_area : undefined);
                    const ar = (areaNombre && AREAS[areaNombre]) || { fondo: '#f2f4f7', texto: '#6b7482' };
                    const p = docentes.get(m.id_materia) ?? 0;
                    const confirmando = confirmar === m.id_materia;
                    const botonHoras = 'width: 26px; height: 26px; border-radius: 6px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 14px; line-height: 1; opacity: 0.45; cursor: not-allowed;';
                    return (
                      <div key={m.id_materia} style={css('display: grid; grid-template-columns: 1fr 150px 128px 116px 84px; gap: 12px; padding: 11px 20px; border-bottom: 1px solid #f2f4f7; align-items: center;')}>
                        <div style={css('display: flex; flex-direction: column; gap: 2px; min-width: 0;')}>
                          <span onClick={() => ir('A6', { id_materia: m.id_materia })} style={css('font-size: 13.5px; font-weight: 500; cursor: pointer;')}>{m.nombre_materia}</span>
                          <span style={css('font-size: 11.5px; color: #8b95a5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>{m.descripcion_materia || 'Sin descripción'}</span>
                        </div>
                        <div>
                          <span style={css('font-size: 11.5px; font-weight: 500; padding: 3px 9px; border-radius: 11px; background: ' + ar.fondo + '; color: ' + ar.texto + ';')}>{areaNombre || 'Sin área'}</span>
                        </div>
                        <div style={css('display: flex; align-items: center; gap: 4px;')}>
                          <button disabled title={NO_API_HORAS} style={css(botonHoras)}>−</button>
                          <span className="mono" style={css('width: 38px; text-align: center; font-size: 13px; font-weight: 600;')}>{m.horas_semanales} h</span>
                          <button disabled title={NO_API_HORAS} style={css(botonHoras)}>+</button>
                        </div>
                        <span style={css('font-size: 12px; color: ' + (p === 0 ? '#b03a2e' : '#4a5462') + ';' + (p === 0 ? ' font-weight: 500;' : ''))}>
                          {p === 0 ? 'Sin docente' : p === 1 ? '1 habilitado' : p + ' habilitados'}
                        </span>
                        <div style={css('display: flex; justify-content: flex-end;')}>
                          <button
                            onClick={() => {
                              limpiar();
                              eliminarMat.limpiarError();
                              setConfirmar(confirmando ? null : m.id_materia);
                            }}
                            style={css('height: 28px; padding: 0 11px; border-radius: 7px; border: 1px solid #edc9c4; background: #fff; color: #b03a2e; font-size: 11.5px; font-weight: 500;')}
                          >
                            Quitar
                          </button>
                        </div>
                        {confirmando && (
                          <div style={css('grid-column: 1 / -1; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; background: #fbeceb; border: 1px solid #edc9c4;')}>
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
                  {!qMatsO.isLoading && lista.length === 0 && (
                    <div style={css('padding: 22px 20px; font-size: 12.5px; color: #6b7482; border-bottom: 1px solid #f2f4f7;')}>Todavía no tiene materias. Agregá una nueva o copiala de otra orientación del mismo año.</div>
                  )}

                  <div style={css('padding: 16px 20px 18px; background: #fafbfc; display: flex; flex-direction: column; gap: 13px;')}>
                    <div style={css('display: flex; align-items: center; gap: 12px;')}>
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
                      <div style={css('display: grid; grid-template-columns: 1fr 180px 110px auto; gap: 10px; align-items: end;')}>
                        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
                          <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Nombre *</label>
                          <input type="text" value={nNombre} onChange={(e) => { setNNombre(e.target.value); setError(null); setAviso(null); }} placeholder="Ej.: Microeconomía" style={css(CAMPO)} />
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
                          <input type="text" value={nHoras} onChange={(e) => { setNHoras(e.target.value); setError(null); setAviso(null); }} placeholder="3" style={css(CAMPO)} />
                        </div>
                        <button disabled={crearMat.enCurso} onClick={agregarNueva} style={css('height: 38px; padding: 0 16px; border-radius: 8px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 13px; font-weight: 600;')}>
                          Agregar
                        </button>
                      </div>
                    )}
                    {pest === 'copiar' && (
                      <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                        {copiables.map((c) => (
                          <div key={c.id_materia} style={css('display: flex; align-items: center; gap: 12px; padding: 9px 12px; border-radius: 8px; border: 1px solid #e2e6ec; background: #fff;')}>
                            <span style={css('font-size: 13px; font-weight: 500; flex-grow: 1;')}>{c.nombre_materia}</span>
                            <span style={css('font-size: 11.5px; color: #6b7482;')}>de {c.orientacion?.nombre_orientacion ?? ors.find((x) => x.id_orientacion === c.id_orientacion)?.nombre_orientacion ?? ''}</span>
                            <span className="mono" style={css('font-size: 12px; color: #4a5462; width: 40px; text-align: right;')}>{c.horas_semanales} h</span>
                            <button
                              disabled={crearMat.enCurso}
                              onClick={() =>
                                agregar(
                                  { nombre_materia: c.nombre_materia, horas_semanales: c.horas_semanales, id_area: c.id_area ?? undefined, descripcion_materia: c.descripcion_materia || undefined },
                                  c.nombre_materia + ' se copió de ' + (c.orientacion?.nombre_orientacion ?? 'otra orientación') + ' a ' + celdaTitulo + '. Falta habilitar sus docentes.',
                                )
                              }
                              style={css('height: 28px; padding: 0 12px; border-radius: 7px; border: 1px solid ' + ACCENT + '; background: #fff; color: ' + ACCENT + '; font-size: 11.5px; font-weight: 600;')}
                            >
                              Copiar
                            </button>
                          </div>
                        ))}
                        {copiables.length === 0 && <div style={css('font-size: 12px; color: #6b7482;')}>No hay materias de {celdaA}° año en otras orientaciones que falten acá.</div>}
                      </div>
                    )}
                    {errorTexto && <div style={css('font-size: 12px; color: #a63244; background: #fbf1f2; border: 1px solid #f1d3d8; border-radius: 8px; padding: 9px 11px;')}>{errorTexto}</div>}
                    {aviso && !errorTexto && <div style={css('font-size: 12px; color: #245239; background: #eef6f0; border: 1px solid #cfe5d6; border-radius: 8px; padding: 9px 11px;')}>{aviso}</div>}
                    <div style={css('font-size: 11.5px; color: #7a8393; line-height: 1.5;')}>Cada materia queda en el catálogo de Materias con su año y su orientación. Los docentes que pueden dictarla se habilitan desde su ficha.</div>
                  </div>
                </div>
              ) : (
                <div style={css('padding: 40px 28px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;')}>
                  <div style={css('font-size: 13.5px; font-weight: 600;')}>{o ? o.nombre_orientacion + ' no está asociada a ningún año' : 'No hay orientaciones'}</div>
                  <div style={css('font-size: 12.5px; color: #6b7482; line-height: 1.55; max-width: 420px;')}>Asociala a un año tocando una celda vacía de su columna en el cuadro y cargando su primera materia.</div>
                </div>
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
            <div style={css('display: grid; grid-template-columns: 1fr 100px; gap: 10px;')}>
              <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
                <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Nombre *</label>
                <input type="text" value={fNombre} readOnly={!alta} title={alta ? undefined : NO_API_EDITAR} onChange={(e) => { setFNombre(e.target.value); setErrorPanel(null); setAvisoPanel(null); }} placeholder="Ej.: Arte y Comunicación" style={css(CAMPO)} />
              </div>
              <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
                <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Código *</label>
                <input type="text" value={fCodigo} readOnly={!alta} title={alta ? undefined : NO_API_EDITAR} onChange={(e) => { setFCodigo(e.target.value.toUpperCase()); setErrorPanel(null); setAvisoPanel(null); }} placeholder="ART" style={css(CAMPO)} />
              </div>
            </div>
            <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
              <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Descripción</label>
              <textarea value={fDesc} readOnly={!alta} title={alta ? undefined : NO_API_EDITAR} onChange={(e) => { setFDesc(e.target.value); setAvisoPanel(null); }} style={css('height: 64px; resize: none; padding: 9px 12px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; background: #fcfdfe; color: #14181f; line-height: 1.45;')}></textarea>
            </div>
            <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
              <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Años académicos en que se aplica</label>
              <div style={css('display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px;')}>
                {aniosChips.map((a) => (
                  <button key={a.key} disabled title={a.title} style={css(a.estilo)}>
                    <span style={css('font-size: 13px; font-weight: 600;')}>{a.label}</span>
                    <span style={css(a.subEstilo)}>{a.sub}</span>
                  </button>
                ))}
              </div>
              <span style={css('font-size: 11.5px; color: #7a8393; line-height: 1.45;')}>
                De 1° a 3° año (ciclo básico e intermedio) se usa la orientación Básica. Las orientaciones específicas se aplican desde 4° año.
                {' '}Un año queda asociado cuando se carga su primera materia o un curso de ese año usa la orientación.
              </span>
            </div>
            {errorPanelTexto && <div style={css('font-size: 12px; color: #a63244; background: #fbf1f2; border: 1px solid #f1d3d8; border-radius: 8px; padding: 9px 11px; line-height: 1.45;')}>{errorPanelTexto}</div>}
            {avisoPanel && <div style={css('font-size: 12px; color: #245239; background: #eef6f0; border: 1px solid #cfe5d6; border-radius: 8px; padding: 9px 11px; line-height: 1.45;')}>{avisoPanel}</div>}
            <button
              onClick={guardarPanel}
              disabled={!puedeGuardar || crearOr.enCurso}
              title={alta ? undefined : NO_API_EDITAR}
              style={css(
                'height: 38px; border-radius: 8px; font-size: 13px; font-weight: 600;' +
                  (puedeGuardar ? ' border: none; background: ' + ACCENT + '; color: #fff;' : ' border: 1px solid #e2e6ec; background: #f4f6f8; color: #a8b0bb; cursor: default;'),
              )}
            >
              {alta ? 'Crear la orientación' : 'Guardar cambios'}
            </button>
            {!alta && o && (
              <div style={css('display: flex; flex-direction: column; gap: 12px; padding-top: 12px; border-top: 1px solid #eef1f5;')}>
                <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                  <span style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Cursos con esta orientación · {ciclo.activo?.anio_calendario ?? ''}</span>
                  <div style={css('display: flex; gap: 6px; flex-wrap: wrap;')}>
                    {cursosCiclo.map((c) => (
                      <span key={c.id_curso} style={css('padding: 5px 10px; border-radius: 7px; border: 1px solid #e2e6ec; background: #fafbfc; font-size: 12.5px; font-weight: 500;')}>{nombreCurso(c)}</span>
                    ))}
                    {cursosCiclo.length === 0 && <span style={css('font-size: 12px; color: #8b95a5;')}>Ninguno. Se asigna al crear o editar un curso.</span>}
                  </div>
                </div>
                <button disabled={eliminarOr.enCurso} onClick={eliminar} style={css('height: 34px; border-radius: 8px; border: 1px solid #edc9c4; background: #fff; color: #b03a2e; font-size: 12px; font-weight: 600;')}>
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
                      Ver materias de {a.label}
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
