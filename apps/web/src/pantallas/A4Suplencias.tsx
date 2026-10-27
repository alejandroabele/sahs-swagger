// A4 · Suplencias del período. Prototipo: <template id="tpl-suplencias"> y DC.registrar("suplencias") en prototipo/index.html.
// Se elige el docente ausente, el período y el motivo; se listan sus clases en la propuesta vigente (VAL)
// del ciclo (planificacion.get_clases), con la grilla del curso; para cada clase se elige un suplente
// entre los habilitados en la materia, disponibles en todas sus franjas y sin otra clase en esas horas.
// Registrar = profesor_suplencias.crear_suplencia (POST /profesores/{suplente}/suplencias), una por suplente. Cada clase se cubre entera.
import { useMemo, useState } from 'react';
import type { Clase, Curso, FranjaHorariaResumen, Profesor, Suplencia } from '@sahs/contratos';
import { planificacion, profesorSuplencias } from '../api';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useAccion, useConsulta } from '../estado/consultas';
import { css } from '../lib/css';
import { DIAS, fecha, iniciales } from '../lib/formato';
import './a4/responsive.css';

const ACCENT = '#2f5fd0';
const ALTO_CELDA = 48;
const MOTIVOS = ['Licencia médica', 'Capacitación', 'Trámite personal', 'Otro'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const CAMPO =
  'height: 32px; padding: 0 9px; border-radius: 6px; border: 1px solid #d5dbe3; background: #fff;' +
  ' font-family: inherit; font-size: 12.5px; color: #14181f; width: 100%; box-sizing: border-box;';
const chip = (activo: boolean) =>
  'height: 28px; padding: 0 11px; border-radius: 14px; font-size: 12px; font-weight: 500;' +
  ' border: 1px solid ' +
  (activo ? ACCENT : '#e2e6ec') +
  ';' +
  ' background: ' +
  (activo ? ACCENT : '#fff') +
  '; color: ' +
  (activo ? '#fff' : '#4a5462') +
  ';';
const avatar = (fondo: string, color: string) =>
  'width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0; display: flex;' +
  ' align-items: center; justify-content: center; font-size: 11px; font-weight: 600;' +
  ' background: ' +
  fondo +
  '; color: ' +
  color +
  ';';

// ---- fechas ('AAAA-MM-DD', siempre en hora local)
const aFecha = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const corta = (s: string) => (aFecha(s) ? fecha(s).slice(0, 5) : '—');
const masDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const lunesDe = (d: Date) => masDias(d, -((d.getDay() + 6) % 7));

/** Días hábiles del período: d = 0 (lunes) … 4 (viernes). Vacío si el rango no es válido. */
function diasHabiles(desde: string, hasta: string): { iso: string; d: number }[] {
  const a = aFecha(desde);
  const b = aFecha(hasta);
  const out: { iso: string; d: number }[] = [];
  if (!a || !b || b < a) return out;
  for (let dt = a, n = 0; dt <= b && n < 120; dt = masDias(dt, 1), n++) {
    const w = dt.getDay();
    if (w >= 1 && w <= 5) out.push({ iso: iso(dt), d: w - 1 });
  }
  return out;
}

/** Cuatro semanas sugeridas: la anterior, la actual y las dos siguientes (o mediados de marzo si el ciclo no es el del año en curso). */
function semanasSugeridas(anioCiclo: number | null) {
  const hoyD = new Date();
  let base = hoyD.getDay() === 0 || hoyD.getDay() === 6 ? masDias(lunesDe(hoyD), 7) : lunesDe(hoyD);
  if (anioCiclo && anioCiclo !== hoyD.getFullYear()) base = lunesDe(new Date(anioCiclo, 2, 15));
  return [-1, 0, 1, 2].map((k) => {
    const l = masDias(base, 7 * k);
    const v = masDias(l, 4);
    const label =
      l.getMonth() === v.getMonth() ? `${l.getDate()} al ${v.getDate()} de ${MESES[v.getMonth()]}` : `${l.getDate()} de ${MESES[l.getMonth()]} al ${v.getDate()} de ${MESES[v.getMonth()]}`;
    return { label, desde: iso(l), hasta: iso(v) };
  });
}

const diaDe = (f: FranjaHorariaResumen) => DIAS.indexOf(f.nombre_dia_lectivo ?? '');
const seCruzan = (a: FranjaHorariaResumen, b: FranjaHorariaResumen) =>
  a.nombre_dia_lectivo === b.nombre_dia_lectivo && (a.hora_inicio ?? '') < (b.hora_fin ?? '') && (b.hora_inicio ?? '') < (a.hora_fin ?? '');
const nombreProf = (p: { nombre?: string; apellido?: string } | undefined) => (p ? `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim() : '');

interface Estado {
  ausente: number | null;
  desde: string;
  hasta: string;
  motivo: string | null;
  motivoOtro: string;
  sel: number | null;
  cursoVista: number | null;
  /** id_clase → id_profesor suplente (todavía sin registrar). */
  asign: Record<number, number>;
  errores: string[];
  registro: { titulo: string; lineas: string[] } | null;
}

export default function A4Suplencias() {
  const { activo } = useCiclo();
  const idCiclo = activo?.id_ciclo_lectivo;
  const semanas = useMemo(() => semanasSugeridas(activo?.anio_calendario ?? null), [activo?.anio_calendario]);
  const inicial = (): Estado => ({
    ausente: null,
    desde: semanas[1].desde,
    hasta: semanas[1].hasta,
    motivo: null,
    motivoOtro: '',
    sel: null,
    cursoVista: null,
    asign: {},
    errores: [],
    registro: null,
  });
  const [st, setSt] = useState<Estado>(inicial);
  const set = (p: Partial<Estado>) => setSt((s) => ({ ...s, ...p }));

  // ---- datos
  const qProp = useConsulta(['planificacion', 'get_propuestas', { id_ciclo_lectivo: idCiclo }], () => planificacion.get_propuestas({ id_ciclo_lectivo: idCiclo }), {
    enabled: idCiclo != null,
  });
  const vigente = (qProp.data ?? []).find((p) => p.estado?.codigo === 'VAL') ?? null;
  const idProp = vigente?.id_propuesta;
  const qProfes = useConsulta(['profesor_suplencias', 'get_profesores'], () => profesorSuplencias.get_profesores());
  const qCursos = useConsulta(['planificacion', 'get_cursos', { id_ciclo_lectivo: idCiclo }], () => planificacion.get_cursos({ id_ciclo_lectivo: idCiclo }), {
    enabled: idCiclo != null,
  });
  const qAnios = useConsulta(['planificacion', 'get_anios_academicos'], () => planificacion.get_anios_academicos());
  // Todas las clases de la propuesta: para la carga de cada docente y los choques de los candidatos.
  const qTodas = useConsulta(['planificacion', 'get_clases', { id_propuesta: idProp }], () => planificacion.get_clases({ id_propuesta: idProp }), {
    enabled: idProp != null,
  });
  const qAusente = useConsulta(
    ['planificacion', 'get_clases', { id_profesor: st.ausente, id_propuesta: idProp }],
    () => planificacion.get_clases({ id_profesor: st.ausente!, id_propuesta: idProp }),
    { enabled: idProp != null && st.ausente != null },
  );
  const periodoOk = diasHabiles(st.desde, st.hasta).length > 0;
  const qSup = useConsulta(
    ['profesor_suplencias', 'get_suplencias', { fecha_desde: st.desde, fecha_hasta: st.hasta }],
    () => profesorSuplencias.get_suplencias({ fecha_desde: st.desde, fecha_hasta: st.hasta }),
    { enabled: periodoOk },
  );

  // ---- curso que se ve en la grilla
  const clasesAus = qAusente.data ?? [];
  const cursosAusIds = [...new Set(clasesAus.map((k) => k.id_curso))];
  const cursoVista = st.cursoVista != null && cursosAusIds.includes(st.cursoVista) ? st.cursoVista : (cursosAusIds[0] ?? null);
  const qGrilla = useConsulta(
    ['planificacion', 'get_clases', { id_curso: cursoVista, id_propuesta: idProp }],
    () => planificacion.get_clases({ id_curso: cursoVista!, id_propuesta: idProp }),
    { enabled: idProp != null && cursoVista != null },
  );

  const crear = useAccion(
    (idSuplente: number, body: Parameters<typeof profesorSuplencias.crear_suplencia>[1]) => profesorSuplencias.crear_suplencia(idSuplente, body),
    ['profesor_suplencias', 'planificacion'],
  );

  const profes = useMemo(
    () => [...(qProfes.data ?? [])].sort((a, b) => (a.apellido + a.nombre).localeCompare(b.apellido + b.nombre)),
    [qProfes.data],
  );
  const profe = new Map<number, Profesor>(profes.map((p) => [p.id_profesor, p]));
  const nombreDe = (id: number | null | undefined) => (id != null ? nombreProf(profe.get(id)) : '');
  const anios = new Map((qAnios.data ?? []).map((a) => [a.id_anio_academico, parseInt(a.anio_curricular, 10)]));
  const cursos = new Map<number, Curso>((qCursos.data ?? []).map((c) => [c.id_curso, c]));
  const nombreCurso = (id: number) => {
    const c = cursos.get(id);
    return c ? `${anios.get(c.id_anio_academico ?? -1) ?? '?'}° ${c.division}` : `Curso ${id}`;
  };
  const todas = qTodas.data ?? [];
  const claseDe = new Map<number, Clase>(todas.map((k) => [k.id_clase, k]));
  const materiaDe = (k: Clase) => k.materia?.nombre_materia ?? k.codigo;

  // Número de hora cátedra ("Nª") de una franja: su posición entre las franjas no recreo del día en el turno del curso.
  const horaNum = (idCurso: number, f: FranjaHorariaResumen) => {
    const del = (cursos.get(idCurso)?.franjas_horarias ?? [])
      .filter((x) => x.nombre_dia_lectivo === f.nombre_dia_lectivo && !x.es_recreo)
      .sort((a, b) => (a.hora_inicio ?? '').localeCompare(b.hora_inicio ?? ''));
    const i = del.findIndex((x) => x.hora_inicio === f.hora_inicio);
    return i >= 0 ? i + 1 : 0;
  };
  const cuando = (idCurso: number, f: FranjaHorariaResumen) => `${f.nombre_dia_lectivo} ${horaNum(idCurso, f)}ª hora`;
  const cargaSemanal = (idp: number) => todas.filter((k) => k.ids_profesores?.includes(idp)).reduce((n, k) => n + (k.ids_franjas_horarias?.length ?? 0), 0);

  // ---- período
  const dias = diasHabiles(st.desde, st.hasta);
  const presentes = new Set(dias.map((x) => x.d));
  const enPeriodo = (k: Clase, desde = st.desde, hasta = st.hasta) => {
    const ds = diasHabiles(desde, hasta);
    const pres = new Set(ds.map((x) => x.d));
    const franjas = (k.franjas_horarias ?? []).filter((f) => pres.has(diaDe(f))).sort((a, b) => diaDe(a) - diaDe(b) || (a.hora_inicio ?? '').localeCompare(b.hora_inicio ?? ''));
    let horas = 0;
    ds.forEach((x) => (k.franjas_horarias ?? []).forEach((f) => diaDe(f) === x.d && horas++));
    return { franjas, horas };
  };
  const textoFranjas = (k: Clase, franjas: FranjaHorariaResumen[]) => {
    const porDia = new Map<number, string[]>();
    franjas.forEach((f) => porDia.set(diaDe(f), [...(porDia.get(diaDe(f)) ?? []), horaNum(k.id_curso, f) + 'ª']));
    return [...porDia.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([d, hs]) => DIAS[d].slice(0, 3) + ' ' + (hs.length > 1 ? hs.slice(0, -1).join(', ') + ' y ' + hs[hs.length - 1] : hs[0]))
      .join(' · ');
  };

  // Suplencias registradas que se superponen con el período, y la que cubre cada clase.
  const registradas: Suplencia[] = periodoOk ? (qSup.data ?? []) : [];
  const registradaDe = (idClase: number) => registradas.find((s) => s.ids_clases.includes(idClase)) ?? null;

  /** Por qué un profesor no puede cubrir la clase entera en el período (null si puede). */
  const impedimento = (idp: number, k: Clase, asign: Record<number, number>, desde = st.desde, hasta = st.hasta): string | null => {
    const p = profe.get(idp);
    const libres = new Set((p?.disponibilidad ?? []).map((f) => f.id_franja_horaria));
    const propias = todas.filter((x) => x.id_clase !== k.id_clase && x.ids_profesores?.includes(idp));
    const otrasAsign = clasesAus.filter((x) => x.id_clase !== k.id_clase && asign[x.id_clase] === idp);
    const ds = diasHabiles(desde, hasta);
    for (const f of enPeriodo(k, desde, hasta).franjas) {
      const c = cuando(k.id_curso, f);
      if (!libres.has(f.id_franja_horaria)) return `No declaró disponibilidad el ${c}.`;
      for (const x of propias) {
        if ((x.franjas_horarias ?? []).some((g) => seCruzan(f, g))) return `Tiene ${materiaDe(x)} en ${nombreCurso(x.id_curso)} el ${c}.`;
      }
      for (const x of otrasAsign) {
        if (enPeriodo(x, desde, hasta).franjas.some((g) => seCruzan(f, g))) return `Ya cubre ${materiaDe(x)} en ${nombreCurso(x.id_curso)} el ${c}.`;
      }
      // Suplencias ya registradas del candidato en días del período que caen dentro de su rango.
      for (const s of registradas.filter((s) => s.id_profesor === idp)) {
        const diaEnComun = ds.some((x) => x.d === diaDe(f) && x.iso >= s.fecha_inicio.slice(0, 10) && x.iso <= s.fecha_fin.slice(0, 10));
        if (!diaEnComun) continue;
        for (const idc of s.ids_clases) {
          const x = claseDe.get(idc);
          if (x && (x.franjas_horarias ?? []).some((g) => seCruzan(f, g))) return `Ya cubre ${materiaDe(x)} en ${nombreCurso(x.id_curso)} el ${c} (suplencia registrada).`;
        }
      }
    }
    return null;
  };

  // Al cambiar el período se quitan las asignaciones que ya no sirven.
  const conPeriodo = (desde: string, hasta: string) => {
    const quedan: Record<number, number> = {};
    for (const [id, idp] of Object.entries(st.asign)) {
      const k = clasesAus.find((x) => x.id_clase === Number(id));
      if (!k || enPeriodo(k, desde, hasta).horas === 0) continue;
      if (!impedimento(idp, k, quedan, desde, hasta)) quedan[Number(id)] = idp;
    }
    const selK = st.sel != null ? clasesAus.find((x) => x.id_clase === st.sel) : null;
    set({ desde, hasta, asign: quedan, sel: selK && enPeriodo(selK, desde, hasta).horas > 0 ? st.sel : null, errores: [], registro: null });
  };

  // ---- clases afectadas
  const afectadas = clasesAus
    .map((k) => ({ k, ...enPeriodo(k), reg: registradaDe(k.id_clase) }))
    .filter((x) => x.horas > 0)
    .sort((a, b) => nombreCurso(a.k.id_curso).localeCompare(nombreCurso(b.k.id_curso)) || materiaDe(a.k).localeCompare(materiaDe(b.k)));
  const afectadaDe = new Map(afectadas.map((x) => [x.k.id_clase, x]));
  let cubiertas = 0;
  let horasAfect = 0;
  let horasCub = 0;
  afectadas.forEach((x) => {
    horasAfect += x.horas;
    if (st.asign[x.k.id_clase] || x.reg) {
      cubiertas++;
      horasCub += x.horas;
    }
  });
  const notaDe = (k: Clase) => {
    if ((k.ids_profesores?.length ?? 0) < 2 || st.ausente == null) return '';
    const otros = (k.profesores ?? []).filter((p) => p.id_profesor !== st.ausente).map(nombreProf).join(' y ');
    return `Clase compartida con ${otros}.`;
  };

  // ---- panel de candidatos
  const selX = st.sel != null ? (afectadaDe.get(st.sel) ?? null) : null;
  let panelTitulo = 'Candidatos para cubrir';
  let panelSubtitulo = st.ausente != null && !afectadas.length ? 'No hay clases para cubrir en el período.' : '';
  const candidatos: { id: number; nombre: string; motivo: string; carga: string }[] = [];
  const noSirven: { id: number; nombre: string; motivo: string }[] = [];
  let textoVacio = '';
  let notaCompartida = '';
  if (selX) {
    const k = selX.k;
    panelTitulo = `${materiaDe(k)} · ${nombreCurso(k.id_curso)}`;
    panelSubtitulo = `${textoFranjas(k, selX.franjas)} · ${selX.horas} h del ${corta(st.desde)} al ${corta(st.hasta)}`;
    notaCompartida = notaDe(k);
    if (!selX.reg && !st.asign[k.id_clase]) {
      const posibles = profes.filter(
        (p) => p.id_profesor !== st.ausente && !k.ids_profesores?.includes(p.id_profesor) && (p.lista_materias_habilitadas ?? []).some((m) => m.id_materia === k.id_materia),
      );
      for (const p of posibles) {
        const imp = impedimento(p.id_profesor, k, st.asign);
        if (imp) noSirven.push({ id: p.id_profesor, nombre: nombreProf(p), motivo: imp });
        else
          candidatos.push({
            id: p.id_profesor,
            nombre: nombreProf(p),
            motivo: `Disponible y libre en las ${selX.franjas.length} franjas`,
            carga: `${cargaSemanal(p.id_profesor)} h semanales · habilitado en ${materiaDe(k)}`,
          });
      }
      if (!candidatos.length)
        textoVacio = posibles.length
          ? 'Nadie puede cubrir la clase entera en el período.'
          : `${materiaDe(k)} no tiene otro docente habilitado.`;
    }
  }

  // ---- registrar: una suplencia por suplente, con sus clases
  const registrar = async () => {
    const err: string[] = [];
    if (st.ausente == null) err.push('Elegí el docente ausente.');
    if (!periodoOk) err.push('El período no es válido: revisá las fechas desde y hasta.');
    if (!st.motivo) err.push('Elegí el motivo de la ausencia.');
    else if (st.motivo === 'Otro' && !st.motivoOtro.trim()) err.push('Contá el motivo en el campo de texto.');
    const conSuplente = afectadas.filter((x) => st.asign[x.k.id_clase]);
    if (st.ausente != null && !conSuplente.length) err.push('Asigná un suplente al menos a una clase.');
    if (err.length) return set({ errores: err, registro: null });
    const porSuplente = new Map<number, Clase[]>();
    conSuplente.forEach((x) => porSuplente.set(st.asign[x.k.id_clase], [...(porSuplente.get(st.asign[x.k.id_clase]) ?? []), x.k]));
    const motivo = (st.motivo === 'Otro' ? st.motivoOtro.trim() : st.motivo!) + ' de ' + nombreDe(st.ausente);
    const lineas: string[] = [];
    const asign = { ...st.asign };
    for (const [idp, ks] of porSuplente) {
      const r = await crear.ejecutar(idp, { fecha_inicio: st.desde, fecha_fin: st.hasta, motivo, ids_clases: ks.map((k) => k.id_clase) });
      if (!r) break;
      ks.forEach((k) => delete asign[k.id_clase]);
      lineas.push(`${nombreDe(idp)} cubre ${ks.map((k) => `${materiaDe(k)} (${nombreCurso(k.id_curso)})`).join(', ')} · ${motivo}`);
    }
    const sinCubrir = afectadas.length - afectadas.filter((x) => x.reg).length - conSuplente.length;
    if (lineas.length && sinCubrir > 0) lineas.push(sinCubrir + (sinCubrir === 1 ? ' clase queda' : ' clases quedan') + ' sin suplente.');
    set({
      asign,
      errores: [],
      registro: lineas.length ? { titulo: `Suplencia registrada · ${nombreDe(st.ausente)} · del ${corta(st.desde)} al ${corta(st.hasta)}`, lineas } : null,
    });
  };

  // ---- grilla del curso
  const franjasCurso = cursoVista != null ? (cursos.get(cursoVista)?.franjas_horarias ?? []) : [];
  const filasGrilla = (() => {
    const porDia = new Map<string, FranjaHorariaResumen[]>();
    franjasCurso.forEach((f) => porDia.set(f.nombre_dia_lectivo ?? '', [...(porDia.get(f.nombre_dia_lectivo ?? '') ?? []), f]));
    const base = [...porDia.values()].sort((a, b) => b.length - a.length)[0] ?? [];
    return [...base].sort((a, b) => (a.hora_inicio ?? '').localeCompare(b.hora_inicio ?? ''));
  })();
  const clasesGrilla = qGrilla.data ?? [];
  let nHora = 0;
  const filas = filasGrilla.map((b) => {
    const horario = `${b.hora_inicio}–${b.hora_fin}`;
    if (b.es_recreo) return { id: b.id_franja_horaria, recreo: true, horario, hora: '', celdas: [] };
    nHora++;
    const celdas = DIAS.map((dia, d) => {
      const cell = clasesGrilla.find((k) => (k.franjas_horarias ?? []).some((f) => f.nombre_dia_lectivo === dia && f.hora_inicio === b.hora_inicio)) ?? null;
      const id = cell?.id_clase ?? null;
      const afect = id != null && afectadaDe.has(id) && presentes.has(d) ? afectadaDe.get(id)! : null;
      const supl = afect ? (st.asign[afect.k.id_clase] ?? afect.reg?.id_profesor ?? null) : null;
      const seleccionada = afect != null && st.sel === id;
      let fondo = '#fcfdfe';
      let borde = '#e8ecf1';
      let color = '#6b7482';
      let titulo = '';
      let sub = '';
      let peso = '500';
      if (cell) {
        titulo = materiaDe(cell);
        sub = (cell.profesores ?? []).map(nombreProf).join(' + ');
        if (supl) {
          fondo = '#ecf5ef';
          borde = '#c2e0cd';
          color = '#245239';
          peso = '600';
          sub = (cell.profesores ?? []).map((p) => (p.id_profesor === st.ausente ? 'Supl. ' + nombreDe(supl) : nombreProf(p))).join(' + ');
        } else if (afect) {
          fondo = '#fdf1e3';
          borde = '#f0d3ae';
          color = '#8a4b12';
          peso = '600';
        } else {
          fondo = '#f6f8fa';
          borde = '#e2e6ec';
          color = '#4a5462';
        }
      }
      return {
        titulo,
        sub,
        afect: afect != null,
        id,
        estilo:
          'height: ' +
          ALTO_CELDA +
          'px; border-radius: 7px; display: flex; flex-direction: column;' +
          ' justify-content: center; align-items: flex-start; gap: 2px; padding: 0 9px; overflow: hidden;' +
          ' width: 100%; text-align: left;' +
          ' background: ' +
          fondo +
          ';' +
          ' border: 1px ' +
          (cell ? 'solid' : 'dashed') +
          ' ' +
          (seleccionada ? '#14181f' : borde) +
          ';' +
          (seleccionada ? ' box-shadow: 0 0 0 2px rgba(20,24,31,0.12);' : '') +
          (afect ? ' cursor: pointer;' : ' cursor: default;'),
        tituloEstilo:
          'font-size: 12px; font-weight: ' + peso + '; color: ' + color + '; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; line-height: 1.2;',
        subEstilo: 'font-size: 10px; color: ' + color + '; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;',
      };
    });
    return { id: b.id_franja_horaria, recreo: false, horario, hora: `${nHora}ª hora`, celdas };
  });

  // ---- textos
  const base = aFecha(st.desde) ?? aFecha(semanas[1].desde)!;
  const lunes = lunesDe(base);
  const diasAtajo = DIAS.map((nombre, d) => {
    const s = iso(masDias(lunes, d));
    return { label: nombre.slice(0, 3) + ' ' + corta(s), activo: st.desde === s && st.hasta === s, iso: s };
  });
  const periodoTexto = periodoOk
    ? `Del ${corta(st.desde)} al ${corta(st.hasta)} · ${dias.length}${dias.length === 1 ? ' día hábil' : ' días hábiles'}`
    : 'Revisá las fechas: "hasta" tiene que ser igual o posterior a "desde".';
  const clasesTitulo = st.ausente != null ? `Clases de ${nombreDe(st.ausente)} en el período` : 'Clases a cubrir';
  const clasesSubtitulo =
    st.ausente == null ? '' : !periodoOk ? 'El período no es válido.' : afectadas.length ? '' : 'No tiene clases dentro del período elegido.';
  const coberturaColor = afectadas.length && cubiertas === afectadas.length ? '#2f6b45' : '#c2621f';
  const coberturaTexto =
    afectadas.length === 0
      ? 'Sin clases afectadas en el período elegido.'
      : cubiertas === afectadas.length
        ? 'Todas las clases del período tienen suplente.'
        : `${afectadas.length - cubiertas} clase(s) todavía sin suplente.`;

  const cargando = qProp.isLoading || qProfes.isLoading || qCursos.isLoading || qTodas.isLoading;
  const errorCarga = qProp.error ?? qProfes.error ?? qCursos.error ?? qAnios.error ?? qTodas.error ?? qAusente.error ?? qSup.error ?? qGrilla.error;
  const avisoPlanilla = !activo
    ? 'No hay un ciclo lectivo elegido.'
    : !qProp.isLoading && !vigente
      ? `El ciclo lectivo ${activo.anio_calendario} no tiene una planificación validada: no hay clases para cubrir.`
      : null;

  const cursoNombreVista = cursoVista != null ? nombreCurso(cursoVista) : '—';
  const turnoVista = cursoVista != null ? (cursos.get(cursoVista)?.turno?.nombre ?? '') : '';

  return (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div className="r-margen r-envolver" style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 0; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px; padding-bottom: 14px;')}>
          <div className="r-envolver" style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span>Ciclo lectivo {activo?.anio_calendario ?? '—'}</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span style={css('color: #14181f; font-weight: 500;')}>Novedades del personal</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span>{vigente ? `Planilla validada el ${fecha(vigente.fecha_modificacion)}` : 'Sin planilla validada'}</span>
          </div>
          <div className="r-titulo" style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Suplencias del período</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <div className="a4-atajos" style={css('display: flex; flex-direction: column; align-items: flex-end; gap: 6px; padding-bottom: 14px;')}>
          <span style={css('font-size: 11px; color: #8b95a5;')}>Atajos de período</span>
          <div className="r-desplazar" style={css('display: flex; gap: 2px;')}>
            {semanas.map((s, i) => {
              const activa = st.desde === s.desde && st.hasta === s.hasta;
              return (
                <button
                  key={s.desde}
                  onClick={() => conPeriodo(s.desde, s.hasta)}
                  style={css(
                    'height: 32px; padding: 0 13px; border: 1px solid ' +
                      (activa ? '#14181f' : '#e2e6ec') +
                      '; background: ' +
                      (activa ? '#14181f' : '#fff') +
                      '; color: ' +
                      (activa ? '#fff' : '#4a5462') +
                      '; font-size: 12px; font-weight: 500;' +
                      ' border-radius: ' +
                      (i === 0 ? '7px 0 0 7px' : i === 3 ? '0 7px 7px 0' : '0') +
                      ';' +
                      (i > 0 ? ' margin-left: -1px;' : ''),
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="r-margen r-apilar" style={css('display: flex; gap: 18px; padding: 20px 28px 28px; align-items: flex-start;')}>
        {/* ---- panel: ausencia ---- */}
        <div style={css('width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;')}>
          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('padding: 14px 16px 11px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Docente ausente</div>
            </div>
            <div style={css('max-height: 280px; overflow-y: auto;')}>
              {qProfes.isLoading && <Cargando />}
              {profes.map((p) => {
                const activo2 = st.ausente === p.id_profesor;
                const cursosP = [...new Set(todas.filter((k) => k.ids_profesores?.includes(p.id_profesor)).map((k) => nombreCurso(k.id_curso)))].sort();
                return (
                  <button
                    key={p.id_profesor}
                    onClick={() => {
                      // Cambiar de docente ausente descarta las suplencias cargadas: son de otra novedad.
                      set({ ausente: activo2 ? null : p.id_profesor, sel: null, asign: {}, errores: [], registro: null, cursoVista: null });
                      crear.limpiarError();
                    }}
                    style={css(
                      'display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 16px; border: none;' +
                        ' border-left: 3px solid ' +
                        (activo2 ? '#c2621f' : 'transparent') +
                        ';' +
                        ' background: ' +
                        (activo2 ? '#fdf1e3' : '#fff') +
                        '; text-align: left;',
                    )}
                  >
                    <span
                      style={css(
                        'width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; display: flex;' +
                          ' align-items: center; justify-content: center; font-size: 10.5px; font-weight: 600;' +
                          ' background: ' +
                          (activo2 ? '#c2621f' : '#eef1f5') +
                          '; color: ' +
                          (activo2 ? '#fff' : '#5b6471') +
                          ';',
                      )}
                    >
                      {iniciales(p.nombre, p.apellido)}
                    </span>
                    <span style={css('display: flex; flex-direction: column; gap: 1px; text-align: left; min-width: 0; flex-grow: 1;')}>
                      <span style={css('font-size: 12.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>{nombreProf(p)}</span>
                      <span className="mono" style={css('font-size: 10.5px; color: #7a8393;')}>
                        {cargaSemanal(p.id_profesor)} h semanales{cursosP.length ? ' · ' + cursosP.join(', ') : ''}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;')}>
            <div style={css('font-size: 13px; font-weight: 600;')}>Período de la ausencia</div>
            <div style={css('display: grid; grid-template-columns: 1fr 1fr; gap: 8px;')}>
              <label style={css('display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; color: #6b7482;')}>
                Desde
                <input type="date" value={st.desde} onChange={(e) => conPeriodo(e.target.value, st.hasta)} style={css(CAMPO)} />
              </label>
              <label style={css('display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; color: #6b7482;')}>
                Hasta
                <input type="date" value={st.hasta} onChange={(e) => conPeriodo(st.desde, e.target.value)} style={css(CAMPO)} />
              </label>
            </div>
            <div style={css('font-size: 11.5px; color: #6b7482;')}>Un solo día de esa semana:</div>
            <div style={css('display: flex; flex-wrap: wrap; gap: 6px;')}>
              {diasAtajo.map((a) => (
                <button key={a.iso} onClick={() => conPeriodo(a.iso, a.iso)} style={css(chip(a.activo))}>
                  {a.label}
                </button>
              ))}
            </div>
            <div style={css('font-size: 11.5px; line-height: 1.45; color: ' + (periodoOk ? '#4a5462' : '#8f2d22') + ';')}>{periodoTexto}</div>
          </div>

          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;')}>
            <div style={css('font-size: 13px; font-weight: 600;')}>Motivo</div>
            <div style={css('display: flex; flex-wrap: wrap; gap: 6px;')}>
              {MOTIVOS.map((m) => (
                <button key={m} onClick={() => set({ motivo: m, errores: [], registro: null })} style={css(chip(st.motivo === m))}>
                  {m}
                </button>
              ))}
            </div>
            {st.motivo === 'Otro' && (
              <input
                type="text"
                value={st.motivoOtro}
                onChange={(e) => set({ motivoOtro: e.target.value, errores: [], registro: null })}
                placeholder="Contá brevemente el motivo"
                style={css(CAMPO)}
              />
            )}
          </div>

          {st.ausente != null && (
            <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 15px 16px; display: flex; flex-direction: column; gap: 12px;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Cobertura</div>
              <div style={css('display: flex; align-items: baseline; gap: 7px;')}>
                <span className="mono" style={css(`font-size: 27px; font-weight: 600; color: ${coberturaColor};`)}>
                  {cubiertas}
                </span>
                <span style={css('font-size: 13px; color: #6b7482;')}>de {afectadas.length} clases cubiertas</span>
              </div>
              <div style={css('height: 6px; border-radius: 3px; background: #eef1f5; overflow: hidden;')}>
                <div
                  style={css(`height: 6px; width: ${afectadas.length ? Math.round((cubiertas / afectadas.length) * 100) : 0}%; background: ${coberturaColor};`)}
                ></div>
              </div>
              <div className="mono" style={css('font-size: 11px; color: #4a5462;')}>
                {horasCub} de {horasAfect} horas del período con suplente
              </div>
              <div style={css('font-size: 11.5px; color: #7a8393; line-height: 1.5;')}>{coberturaTexto}</div>
            </div>
          )}

          <div style={css('display: flex; flex-direction: column; gap: 10px;')}>
            <button
              onClick={registrar}
              disabled={crear.enCurso}
              style={css(`height: 38px; border-radius: 8px; border: none; background: ${ACCENT}; color: #fff; font-size: 13px; font-weight: 600;` + (crear.enCurso ? ' opacity: 0.7;' : ''))}
            >
              {crear.enCurso ? 'Registrando…' : 'Registrar suplencia'}
            </button>
            {st.errores.length > 0 && (
              <div style={css('padding: 11px 13px; border-radius: 8px; background: #fbeceb; border: 1px solid #edc9c4; display: flex; flex-direction: column; gap: 5px;')}>
                {st.errores.map((e) => (
                  <div key={e} style={css('font-size: 11.5px; color: #8f2d22; line-height: 1.45;')}>
                    {e}
                  </div>
                ))}
              </div>
            )}
            <MensajeError mensaje={crear.error} alCerrar={crear.limpiarError} />
            {st.registro && (
              <div style={css('padding: 12px 13px; border-radius: 8px; background: #ecf5ef; border: 1px solid #c2e0cd; display: flex; flex-direction: column; gap: 7px;')}>
                <div style={css('font-size: 12.5px; font-weight: 600; color: #245239;')}>{st.registro.titulo}</div>
                {st.registro.lineas.map((r, i) => (
                  <div key={i} style={css('font-size: 11.5px; color: #3d6b4f; line-height: 1.45;')}>
                    {r}
                  </div>
                ))}
                <button
                  onClick={() => {
                    setSt(inicial());
                    crear.limpiarError();
                  }}
                  style={css('align-self: flex-start; height: 28px; padding: 0 11px; border-radius: 6px; border: 1px solid #c2e0cd; background: #fff; color: #2f6b45; font-size: 11.5px; font-weight: 500;')}
                >
                  Cargar otra suplencia
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ---- centro: clases afectadas y grilla ---- */}
        <div style={css('flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px;')}>
          {errorCarga && <MensajeError mensaje={errorCarga.message} />}
          {avisoPlanilla && (
            <div style={css('font-size: 12.5px; color: #a56a10; background: #fdf6ec; border: 1px solid #f1dfc0; border-radius: 8px; padding: 12px 14px;')}>{avisoPlanilla}</div>
          )}

          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('padding: 14px 18px 11px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>{clasesTitulo}</div>
              {clasesSubtitulo && <div style={css('font-size: 12px; color: #6b7482; margin-top: 3px;')}>{clasesSubtitulo}</div>}
            </div>
            {(cargando || qAusente.isLoading) && st.ausente != null && <Cargando />}
            {afectadas.map((x) => {
              const k = x.k;
              const sup = st.asign[k.id_clase];
              const sel = st.sel === k.id_clase;
              const nota = notaDe(k);
              const estado = x.reg ? 'Registrada · Supl. ' + nombreProf(x.reg.profesor) : sup ? 'Supl. ' + nombreDe(sup) : 'Sin suplente';
              return (
                <button
                  key={k.id_clase}
                  className="r-envolver"
                  onClick={() => set({ sel: sel ? null : k.id_clase, cursoVista: k.id_curso })}
                  style={css(
                    'display: flex; align-items: center; gap: 14px; width: 100%; padding: 11px 18px; border: none;' +
                      ' border-bottom: 1px solid #f4f6f8; border-left: 3px solid ' +
                      (sel ? '#14181f' : 'transparent') +
                      ';' +
                      ' background: ' +
                      (sel ? '#f6f8fa' : '#fff') +
                      '; text-align: left;',
                  )}
                >
                  <span style={css('display: flex; flex-direction: column; gap: 3px; min-width: 0; flex-grow: 1; text-align: left;')}>
                    <span style={css('font-size: 13px; font-weight: 600; color: #14181f;')}>
                      {materiaDe(k)} · {nombreCurso(k.id_curso)}
                    </span>
                    <span className="mono" style={css('font-size: 11px; color: #6b7482;')}>
                      {textoFranjas(k, x.franjas)} · {x.horas} h en el período
                    </span>
                    {nota && <span style={css('font-size: 11px; color: #4a3f8f; line-height: 1.4;')}>{nota}</span>}
                  </span>
                  <span
                    style={css(
                      'flex-shrink: 0; font-size: 11.5px; font-weight: 600; padding: 4px 10px; border-radius: 12px;' +
                        (sup || x.reg ? ' background: #ecf5ef; color: #245239;' : ' background: #fdf1e3; color: #8a4b12;'),
                    )}
                  >
                    {estado}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div className="r-envolver" style={css('display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>
                Planilla vigente · {cursoNombreVista}
                {turnoVista ? ' · ' + turnoVista : ''}
              </div>
              {cursosAusIds.length > 1 && (
                <div className="r-envolver" style={css('display: flex; gap: 6px;')}>
                  {cursosAusIds.map((c) => (
                    <button key={c} onClick={() => set({ cursoVista: c })} style={css(chip(c === cursoVista))}>
                      {nombreCurso(c)}
                    </button>
                  ))}
                </div>
              )}
              <div style={css('flex-grow: 1;')}></div>
              <div className="r-envolver" style={css('display: flex; align-items: center; gap: 13px; font-size: 11.5px; color: #6b7482;')}>
                <span style={css('display: flex; align-items: center; gap: 6px;')}>
                  <span style={css('width: 11px; height: 11px; border-radius: 3px; background: #f6f8fa; border: 1px solid #e2e6ec;')}></span>Sin cambios
                </span>
                <span style={css('display: flex; align-items: center; gap: 6px;')}>
                  <span style={css('width: 11px; height: 11px; border-radius: 3px; background: #fdf1e3; border: 1px solid #f0d3ae;')}></span>A cubrir
                </span>
                <span style={css('display: flex; align-items: center; gap: 6px;')}>
                  <span style={css('width: 11px; height: 11px; border-radius: 3px; background: #ecf5ef; border: 1px solid #c2e0cd;')}></span>Suplencia asignada
                </span>
              </div>
            </div>

            <div style={css('padding: 14px 18px 18px;')}>
              {cursoVista == null ? null : (
                <div className="r-desplazar">
                  <div className="r-min-600">
                  <div style={css('display: grid; grid-template-columns: 104px repeat(5, minmax(0, 1fr)); gap: 5px; margin-bottom: 5px;')}>
                    <div></div>
                    {DIAS.map((nombre, d) => (
                      <div
                        key={nombre}
                        style={css(
                          'font-size: 12px; text-align: center; padding-bottom: 3px; font-weight: 500; color: ' + (st.ausente == null || presentes.has(d) ? '#4a5462' : '#b4bcc7') + ';',
                        )}
                      >
                        {nombre}
                      </div>
                    ))}
                  </div>
                  {qGrilla.isLoading && <Cargando />}
                  {filas.map((row) =>
                    row.recreo ? (
                      <div key={row.id} style={css('display: grid; grid-template-columns: 104px minmax(0, 1fr); gap: 5px; margin-bottom: 5px;')}>
                        <div className="mono" style={css('display: flex; align-items: center; font-size: 10.5px; color: #9aa3af;')}>
                          {row.horario}
                        </div>
                        <div
                          style={css(
                            'height: 20px; border-radius: 6px; background: repeating-linear-gradient(135deg, #f2f4f7 0 6px, #f8f9fb 6px 12px); display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 600; color: #8b95a5; letter-spacing: 0.04em;',
                          )}
                        >
                          Recreo
                        </div>
                      </div>
                    ) : (
                      <div key={row.id} style={css('display: grid; grid-template-columns: 104px repeat(5, minmax(0, 1fr)); gap: 5px; margin-bottom: 5px;')}>
                        <div style={css('display: flex; flex-direction: column; justify-content: center; gap: 1px;')}>
                          <span style={css('font-size: 12px; font-weight: 500; color: #4a5462;')}>{row.hora}</span>
                          <span className="mono" style={css('font-size: 10.5px; color: #8b95a5;')}>
                            {row.horario}
                          </span>
                        </div>
                        {row.celdas.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              // Cualquier hora de una clase afectada abre la clase entera.
                              if (!c.afect || c.id == null) return;
                              set({ sel: st.sel === c.id ? null : c.id });
                            }}
                            style={css(c.estilo)}
                          >
                            <span style={css(c.tituloEstilo)}>{c.titulo}</span>
                            <span className="mono" style={css(c.subEstilo)}>
                              {c.sub}
                            </span>
                          </button>
                        ))}
                      </div>
                    ),
                  )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Suplencias ya registradas que se superponen con el período (no está en el diseño). */}
          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('padding: 14px 18px 11px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Suplencias registradas en el período</div>
              <div style={css('font-size: 12px; color: #6b7482; margin-top: 3px;')}>
                {periodoOk ? `Las que se superponen con el ${corta(st.desde)} al ${corta(st.hasta)}, de todos los docentes.` : 'El período no es válido.'}
              </div>
            </div>
            {qSup.isLoading && periodoOk && <Cargando />}
            {periodoOk && !qSup.isLoading && registradas.length === 0 && (
              <div style={css('padding: 14px 18px; font-size: 12.5px; color: #6b7482;')}>No hay suplencias registradas en el período.</div>
            )}
            {registradas.map((s) => (
              <div key={s.id_suplencia} className="r-envolver" style={css('display: flex; align-items: center; gap: 12px; padding: 11px 18px; border-bottom: 1px solid #f4f6f8;')}>
                <span style={css(avatar('#ecf5ef', '#245239'))}>{iniciales(s.profesor?.nombre ?? '', s.profesor?.apellido ?? '')}</span>
                <span style={css('display: flex; flex-direction: column; gap: 3px; min-width: 0; flex-grow: 1;')}>
                  <span style={css('font-size: 13px; font-weight: 600; color: #14181f;')}>
                    Supl. {nombreProf(s.profesor)} · {(s.clases ?? []).map((c) => { const k = c.id_clase != null ? claseDe.get(c.id_clase) : undefined; return k ? `${materiaDe(k)} (${nombreCurso(k.id_curso)})` : (c.descripcion ?? c.codigo); }).join(', ')}
                  </span>
                  <span className="mono" style={css('font-size: 11px; color: #6b7482;')}>
                    Del {fecha(s.fecha_inicio)} al {fecha(s.fecha_fin)} · {s.motivo}
                  </span>
                </span>
                <button
                  disabled
                  title="No disponible en la API: no hay un command para eliminar una suplencia registrada."
                  style={css('flex-shrink: 0; height: 28px; padding: 0 11px; border-radius: 6px; border: 1px solid #e2e6ec; background: #f6f8fa; color: #a0a8b4; font-size: 11.5px; font-weight: 500; cursor: not-allowed;')}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ---- panel: candidatos ---- */}
        <div style={css('width: 322px; flex-shrink: 0; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
          <div style={css('padding: 14px 16px 12px; border-bottom: 1px solid #eef1f5;')}>
            <div style={css('font-size: 13px; font-weight: 600;')}>{panelTitulo}</div>
            {panelSubtitulo && <div style={css('font-size: 12px; color: #6b7482; margin-top: 3px; line-height: 1.45;')}>{panelSubtitulo}</div>}
            {notaCompartida && (
              <div style={css('margin-top: 8px; padding: 8px 10px; border-radius: 7px; background: #f1effa; font-size: 11.5px; color: #4a3f8f; line-height: 1.45;')}>{notaCompartida}</div>
            )}
          </div>

          {candidatos.length > 0 && (
            <div style={css('padding: 6px 0;')}>
              {candidatos.map((c) => (
                <div key={c.id} style={css('display: flex; align-items: center; gap: 11px; padding: 11px 16px; border-bottom: 1px solid #f4f6f8;')}>
                  <span style={css(avatar('#eef1f5', '#5b6471'))}>{iniciales(c.nombre)}</span>
                  <div style={css('display: flex; flex-direction: column; gap: 3px; flex-grow: 1; min-width: 0;')}>
                    <div style={css('font-size: 12.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>{c.nombre}</div>
                    <div style={css('display: flex; align-items: center; gap: 5px;')}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2f6b45" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                      <span style={css('font-size: 11px; color: #55705f;')}>{c.motivo}</span>
                    </div>
                    <div className="mono" style={css('font-size: 10.5px; color: #8b95a5;')}>
                      {c.carga}
                    </div>
                  </div>
                  <button
                    onClick={() => selX && set({ asign: { ...st.asign, [selX.k.id_clase]: c.id }, errores: [], registro: null })}
                    style={css(`height: 30px; padding: 0 12px; border-radius: 6px; border: none; background: ${ACCENT}; color: #fff; font-size: 12px; font-weight: 600; flex-shrink: 0;`)}
                  >
                    Asignar
                  </button>
                </div>
              ))}
            </div>
          )}

          {selX && !selX.reg && !st.asign[selX.k.id_clase] && candidatos.length === 0 && (
            <div style={css('padding: 22px 20px 16px; display: flex; flex-direction: column; align-items: center; gap: 11px; text-align: center;')}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#b9c1cc" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M8.5 15.5c1-1 2-1.5 3.5-1.5s2.5.5 3.5 1.5M9 9.5v.5M15 9.5v.5"></path>
              </svg>
              <div style={css('font-size: 12.5px; color: #6b7482; line-height: 1.55; max-width: 250px;')}>{textoVacio}</div>
            </div>
          )}

          {noSirven.length > 0 && (
            <div style={css('padding: 10px 16px 14px;')}>
              <div style={css('font-size: 11px; font-weight: 600; color: #8b95a5; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 6px;')}>No pueden cubrirla</div>
              {noSirven.map((n) => (
                <div key={n.id} style={css('display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f4f6f8;')}>
                  <span style={css(avatar('#f4f6f8', '#9aa3af'))}>{iniciales(n.nombre)}</span>
                  <div style={css('display: flex; flex-direction: column; gap: 2px; min-width: 0;')}>
                    <div style={css('font-size: 12px; font-weight: 500; color: #6b7482;')}>{n.nombre}</div>
                    <div style={css('font-size: 11px; color: #a0522d; line-height: 1.4;')}>{n.motivo}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selX && (selX.reg || st.asign[selX.k.id_clase]) && (
            <div style={css('padding: 16px;')}>
              <div style={css('padding: 13px 14px; border-radius: 8px; background: #ecf5ef; display: flex; flex-direction: column; gap: 9px;')}>
                <div style={css('display: flex; align-items: center; gap: 8px;')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2f6b45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  <span style={css('font-size: 12.5px; font-weight: 600; color: #245239;')}>{selX.reg ? 'Suplencia registrada' : 'Suplencia asignada'}</span>
                </div>
                <div style={css('font-size: 12px; color: #3d6b4f; line-height: 1.5;')}>
                  {selX.reg
                    ? `${nombreProf(selX.reg.profesor)} cubre ${materiaDe(selX.k)} en ${nombreCurso(selX.k.id_curso)} del ${corta(selX.reg.fecha_inicio.slice(0, 10))} al ${corta(selX.reg.fecha_fin.slice(0, 10))} · ${selX.reg.motivo}.`
                    : `${nombreDe(st.asign[selX.k.id_clase])} cubre ${materiaDe(selX.k)} en ${nombreCurso(selX.k.id_curso)} del ${corta(st.desde)} al ${corta(st.hasta)} (${selX.horas} h). Se suma a su liquidación del mes al registrar la suplencia.`}
                </div>
                {selX.reg ? (
                  <button
                    disabled
                    title="No disponible en la API: no hay un command para eliminar una suplencia registrada."
                    style={css('align-self: flex-start; height: 28px; padding: 0 11px; border-radius: 6px; border: 1px solid #c2e0cd; background: #fff; color: #9fbfab; font-size: 11.5px; font-weight: 500; cursor: not-allowed;')}
                  >
                    Quitar suplencia
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const asign = { ...st.asign };
                      delete asign[selX.k.id_clase];
                      set({ asign, errores: [], registro: null });
                    }}
                    style={css('align-self: flex-start; height: 28px; padding: 0 11px; border-radius: 6px; border: 1px solid #c2e0cd; background: #fff; color: #2f6b45; font-size: 11.5px; font-weight: 500;')}
                  >
                    Quitar suplencia
                  </button>
                )}
                {selX.reg && <div style={css('font-size: 11px; color: #3d6b4f; line-height: 1.45;')}>Ya está registrada.</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
