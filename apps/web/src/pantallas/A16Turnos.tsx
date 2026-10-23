// A16 · Turnos y franjas horarias. Prototipo: <template id="tpl-turnos"> y DC.registrar("turnos") en prototipo/index.html.
// Lee los turnos con sus franjas (horarios.get_turnos) y los días lectivos (get_dias_lectivos).
// En la API cada franja es de un día y los recreos también son franjas (es_recreo). El editor trabaja,
// como el prototipo, con las horas cátedra de un día; los huecos entre dos horas son recreos. Al guardar se
// arman los bloques (horas y recreos) para cada día lectivo: se quitan del turno las franjas que ya no van
// (eliminar_franja_horaria_turno) y se crean y asignan las nuevas (crear_franja_horaria + asignar_franja_a_turno).
// Las franjas que no cambian se conservan, así no se pierden las clases que las usan.
import { useState, type ReactNode } from 'react';
import type { FranjaHoraria, Turno } from '@sahs/contratos';
import { horarios, planificacion } from '../api';
import { useNavegar } from '../app/navegar';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useAccion, useConsulta } from '../estado/consultas';
import { css } from '../lib/css';

const ACCENT = '#2f5fd0';
const DESDE = 7 * 60; // la línea de tiempo va de 07:00 a 24:00
const HASTA = 24 * 60;

const CAMPO = 'height: 38px; padding: 0 10px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; background: #fcfdfe; color: #14181f;';
const CAMPO_CHICO =
  'height: 32px; padding: 0 8px; border-radius: 7px; border: 1px solid #dfe4ea; font-size: 12.5px; background: #fcfdfe; color: #14181f; font-family: "IBM Plex Mono", monospace;';
const FILA = 'display: grid; grid-template-columns: 56px 130px 130px 1fr 80px; gap: 12px;';

type Par = [string, string];
interface Borrador {
  nombre: string;
  inicio: string;
  fin: string;
  dur: number | string;
  /** Horas cátedra de un día (inicio, fin). Los recreos salen de los huecos. */
  franjas: Par[];
}
interface Bloque {
  inicio: string;
  fin: string;
  es_recreo: boolean;
  hora: number | null;
}

const min = (s: string) => {
  const p = String(s || '').split(':');
  return Number(p[0]) * 60 + Number(p[1]);
};
const txt = (m: number) => ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2);
const pct = (m: number) => (((m - DESDE) / (HASTA - DESDE)) * 100).toFixed(2) + '%';
const ancho = (a: number, b: number) => (((b - a) / (HASTA - DESDE)) * 100).toFixed(2) + '%';

/** Horas cátedra seguidas de `dur` minutos entre `ini` y `fin` (Catalogo.generarFranjas sin recreos). */
function generarFranjas(ini: string, fin: string, dur: number): Par[] {
  let t = min(ini);
  const tope = min(fin);
  const out: Par[] = [];
  if (!(dur > 0)) return out;
  while (t + dur <= tope && out.length < 16) {
    out.push([txt(t), txt(t + dur)]);
    t += dur;
  }
  return out;
}

/** Bloques de un día: las horas cátedra y, entre dos que no vienen seguidas, un recreo. */
function bloquesDe(franjas: Par[]): Bloque[] {
  const out: Bloque[] = [];
  let n = 0;
  franjas.forEach((f, k) => {
    if (k > 0 && franjas[k - 1][1] !== f[0]) out.push({ inicio: franjas[k - 1][1], fin: f[0], es_recreo: true, hora: null });
    out.push({ inicio: f[0], fin: f[1], es_recreo: false, hora: ++n });
  });
  return out;
}

/** Franjas de un día del turno (el primer día lectivo que tenga), ordenadas por hora. */
function diaTipo(t: Turno): FranjaHoraria[] {
  const fr = t.franjas_horarias ?? [];
  if (!fr.length) return [];
  const dia = Math.min(...fr.map((f) => f.id_dia_lectivo));
  return fr.filter((f) => f.id_dia_lectivo === dia).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
}

/** Parámetros del editor deducidos de las franjas del turno. */
function deTurno(t: Turno): Borrador {
  const dia = diaTipo(t);
  const horas = dia.filter((f) => !f.es_recreo);
  return {
    nombre: t.nombre,
    inicio: dia[0]?.hora_inicio ?? '08:00',
    fin: dia[dia.length - 1]?.hora_fin ?? '12:00',
    dur: horas.length ? min(horas[0].hora_fin) - min(horas[0].hora_inicio) : 40,
    franjas: horas.map((f) => [f.hora_inicio, f.hora_fin] as Par),
  };
}

const VACIO: Borrador = { nombre: '', inicio: '14:00', fin: '18:00', dur: 40, franjas: generarFranjas('14:00', '18:00', 40) };

/** El código no existe en la API: se deriva del nombre (Mañana → TM, Doble turno → DT). */
function codigoDe(nombre: string): string {
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '';
  if (p.length === 1) return ('T' + p[0][0]).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}

/** Lo que está mal en un turno: franjas que se pisan, al revés o fuera de su horario. */
function revisar(b: Borrador): string[] {
  const out: string[] = [];
  const ini = min(b.inicio);
  const fin = min(b.fin);
  if (!b.inicio || !b.fin || fin <= ini) out.push('El turno tiene que terminar después de empezar.');
  if (b.franjas.length === 0) out.push('El turno no tiene horas cátedra.');
  b.franjas.forEach((f, i) => {
    const a = min(f[0]);
    const z = min(f[1]);
    if (!(z > a)) out.push('La hora cátedra ' + (i + 1) + ' termina antes de empezar.');
    else if (a < ini || z > fin) out.push('La hora cátedra ' + (i + 1) + ' (' + f[0] + ' a ' + f[1] + ') queda fuera del horario del turno.');
    if (i > 0 && a < min(b.franjas[i - 1][1])) out.push('La hora cátedra ' + (i + 1) + ' se superpone con la anterior.');
  });
  return out;
}

export default function A16Turnos() {
  const ir = useNavegar();
  const ciclo = useCiclo();
  const qTurnos = useConsulta(['horarios', 'get_turnos'], () => horarios.get_turnos());
  const qDias = useConsulta(['horarios', 'get_dias_lectivos'], () => horarios.get_dias_lectivos());
  const qCursos = useConsulta(['planificacion', 'get_cursos'], () => planificacion.get_cursos());
  const qAnios = useConsulta(['planificacion', 'get_anios_academicos'], () => planificacion.get_anios_academicos());

  const [sel, setSel] = useState<number | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const dias = [...(qDias.data ?? [])].sort((a, b) => a.id_dia_lectivo - b.id_dia_lectivo);

  /** Guarda el turno: crea el turno si es nuevo y deja en él exactamente los bloques de cada día. */
  const guardarAccion = useAccion(
    async (turno: Turno | null, b: Borrador) => {
      const bloques = bloquesDe(b.franjas);
      const t = turno ?? (await horarios.crear_turno({ nombre: b.nombre, cantidad_franjas_total: b.franjas.length * dias.length }));
      const existentes = [...(t.franjas_horarias ?? [])];
      const usadas = new Set<number>();
      const faltan: { dia: number; bl: Bloque }[] = [];
      for (const d of dias) {
        for (const bl of bloques) {
          const igual = existentes.find(
            (f) => !usadas.has(f.id_franja_horaria) && f.id_dia_lectivo === d.id_dia_lectivo && f.hora_inicio === bl.inicio && f.hora_fin === bl.fin && f.es_recreo === bl.es_recreo,
          );
          if (igual) usadas.add(igual.id_franja_horaria);
          else faltan.push({ dia: d.id_dia_lectivo, bl });
        }
      }
      for (const f of existentes) {
        if (!usadas.has(f.id_franja_horaria)) await horarios.eliminar_franja_horaria_turno(t.id_turno, f.id_franja_horaria);
      }
      for (const { dia, bl } of faltan) {
        const f = await horarios.crear_franja_horaria({
          hora_inicio: bl.inicio,
          hora_fin: bl.fin,
          es_recreo: bl.es_recreo,
          id_dia_lectivo: dia,
          descripcion: (bl.es_recreo ? 'Recreo' : bl.hora + 'ª hora') + ' · ' + b.nombre,
        });
        await horarios.asignar_franja_a_turno(t.id_turno, { id_franja_horaria: f.id_franja_horaria });
      }
      return t;
    },
    ['horarios', 'planificacion'],
  );
  const eliminarAccion = useAccion(
    async (id: number) => {
      await horarios.eliminar_turno(id);
      return true;
    },
    ['horarios', 'planificacion'],
  );

  if (qTurnos.isLoading || qDias.isLoading || qCursos.isLoading) {
    return (
      <div style={css('width: 1440px; min-height: 1600px; display: flex; flex-direction: column; background: #f4f6f8;')}>
        <Cabecera />
        <Cargando />
      </div>
    );
  }

  const turnos = qTurnos.data ?? [];
  let actual: Turno | null = turnos.find((t) => t.id_turno === sel) ?? null;
  if (!actual && !nuevo && turnos.length) actual = turnos[0];
  const original = actual && !nuevo ? deTurno(actual) : null;
  const b: Borrador = borrador ?? original ?? VACIO;
  const sinGuardar = nuevo || !actual || JSON.stringify(b) !== JSON.stringify(original);

  const cambiar = (nb: Borrador) => {
    setBorrador(nb);
    setAviso(null);
    setErrores([]);
    guardarAccion.limpiarError();
  };
  const cambiarFranja = (i: number, lado: 0 | 1, valor: string) => {
    const fr = b.franjas.map((f) => [...f] as Par);
    fr[i][lado] = valor;
    cambiar({ ...b, franjas: fr });
  };
  const elegir = (id: number | null, esNuevo: boolean) => {
    setSel(id);
    setNuevo(esNuevo);
    setBorrador(null);
    setAviso(null);
    setErrores([]);
    setConfirmarEliminar(false);
    setErrorEliminar(null);
    guardarAccion.limpiarError();
    eliminarAccion.limpiarError();
  };

  // ---- línea de tiempo
  const marcas: number[] = [];
  for (let h = 7; h <= 24; h++) marcas.push(h);
  const lineas = turnos.map((t) => {
    const activa = !nuevo && actual?.id_turno === t.id_turno;
    const base = deTurno(t);
    const fuente = activa ? b : base;
    const recreos = diaTipo(t).filter((f) => f.es_recreo).length;
    return { t, activa, base, fuente, recreos };
  });

  // ---- tabla de franjas de un día
  let recreosDia = 0;
  const filas: ReactNode[] = [];
  b.franjas.forEach((f, i) => {
    const a = min(f[0]);
    const z = min(f[1]);
    const hueco = i > 0 ? a - min(b.franjas[i - 1][1]) : 0;
    const ok = z > a;
    if (hueco > 0) {
      recreosDia++;
      filas.push(
        <div key={'r' + i} style={css(FILA + ' padding: 6px 20px; align-items: center; background: #fbf8f1; border-bottom: 1px solid #f2f4f7;')}>
          <span style={css('justify-self: start; font-size: 10.5px; font-weight: 600; padding: 2px 7px; border-radius: 10px; background: #f6ecd6; color: #8a5a10;')}>Recreo</span>
          <span className="mono" style={css('font-size: 12.5px; color: #7a8393; padding-left: 9px;')}>{b.franjas[i - 1][1]}</span>
          <span className="mono" style={css('font-size: 12.5px; color: #7a8393; padding-left: 9px;')}>{f[0]}</span>
          <span style={css('font-size: 12.5px; color: #8a5a10;')}>{hueco + ' min'}</span>
          <span style={css('font-size: 11px; color: #a8b0bb; text-align: right;')}>no se ocupa</span>
        </div>,
      );
    }
    filas.push(
      <div key={'h' + i} style={css(FILA + ' padding: 7px 20px; align-items: center; border-bottom: 1px solid #f2f4f7;')}>
        <span className="mono" style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>{i + 1}</span>
        <input type="time" value={f[0]} onChange={(e) => cambiarFranja(i, 0, e.target.value)} style={css(CAMPO_CHICO)} />
        <input type="time" value={f[1]} onChange={(e) => cambiarFranja(i, 1, e.target.value)} style={css(CAMPO_CHICO)} />
        <span style={css('font-size: 12.5px; align-self: center; color: ' + (ok ? '#4a5462' : '#b03a2e') + ';')}>{ok ? z - a + ' min' : 'revisar'}</span>
        <span style={css('display: flex; justify-content: flex-end;')}>
          <button
            onClick={() => cambiar({ ...b, franjas: b.franjas.filter((_, k) => k !== i) })}
            style={css('height: 28px; padding: 0 10px; border-radius: 7px; border: 1px solid #edc9c4; background: #fff; color: #b03a2e; font-size: 11.5px;')}
          >
            Quitar
          </button>
        </span>
      </div>,
    );
  });

  // ---- cursos del turno en el ciclo en uso (y en cualquier ciclo, para no eliminar un turno en uso)
  const nAnio = (id?: number) => {
    const a = (qAnios.data ?? []).find((x) => x.id_anio_academico === id);
    return a ? parseInt(a.anio_curricular, 10) : null;
  };
  const nombreCurso = (c: { id_anio_academico?: number; division: string }) => {
    const n = nAnio(c.id_anio_academico);
    return (n ? n + '° ' : '') + c.division;
  };
  const delTurno = actual && !nuevo ? (qCursos.data ?? []).filter((c) => c.id_turno === actual!.id_turno) : [];
  const cursos = delTurno
    .filter((c) => c.id_ciclo_lectivo === ciclo.activo?.id_ciclo_lectivo)
    .sort((x, y) => (nAnio(x.id_anio_academico) ?? 0) - (nAnio(y.id_anio_academico) ?? 0) || x.division.localeCompare(y.division));
  const porDia = b.franjas.length;
  const nDias = dias.length || 5;

  const generar = () => {
    if (!(Number(b.dur) >= 20 && Number(b.dur) <= 120)) {
      setErrores(['La hora cátedra tiene que durar entre 20 y 120 minutos.']);
      return;
    }
    const fr = generarFranjas(b.inicio, b.fin, Number(b.dur));
    setBorrador({ ...b, franjas: fr });
    setErrores([]);
    setAviso(
      'Se generaron ' + fr.length + ' horas cátedra seguidas de ' + b.dur + ' minutos entre ' + b.inicio + ' y ' + b.fin + ', sin recreos. Para dejar un recreo corré el inicio de una hora cátedra, y guardá.',
    );
  };

  const agregarFranja = () => {
    const ult = b.franjas.length ? min(b.franjas[b.franjas.length - 1][1]) : min(b.inicio);
    const dur = Number(b.dur) || 40;
    cambiar({ ...b, franjas: [...b.franjas, [txt(ult), txt(ult + dur)]] });
  };

  const guardar = async () => {
    if (!sinGuardar || guardarAccion.enCurso) return;
    const nombre = b.nombre.trim();
    const errs = revisar(b);
    if (!nombre) errs.unshift('Completá el nombre del turno.');
    else if ((nuevo || !actual) && turnos.some((t) => t.nombre.toLowerCase() === nombre.toLowerCase())) errs.unshift('Ya existe un turno con ese nombre.');
    if (!dias.length) errs.push('No hay días lectivos cargados en la API.');
    if (errs.length) {
      setErrores(errs);
      setAviso(null);
      return;
    }
    const r = await guardarAccion.ejecutar(nuevo || !actual ? null : actual, { ...b, nombre });
    if (!r) return;
    setSel(r.id_turno);
    setNuevo(false);
    setBorrador(null);
    setErrores([]);
    setAviso('El turno ' + nombre + ' quedó guardado con ' + b.franjas.length + ' horas cátedra por día, de lunes a viernes.');
  };

  const eliminar = async () => {
    if (!actual) return;
    if (delTurno.length) {
      const porCiclo = new Map<number, string[]>();
      delTurno.forEach((c) => porCiclo.set(c.id_ciclo_lectivo, [...(porCiclo.get(c.id_ciclo_lectivo) ?? []), nombreCurso(c)]));
      const txtCiclos = [...porCiclo.entries()]
        .map(([id, l]) => l.join(', ') + ' en ' + (ciclo.ciclos.find((x) => x.id_ciclo_lectivo === id)?.anio_calendario ?? 'otro ciclo'))
        .join('; ');
      setErrorEliminar('Lo usan ' + txtCiclos + ': primero hay que pasarlos a otro turno.');
      return;
    }
    if (!confirmarEliminar) {
      setConfirmarEliminar(true);
      setErrorEliminar(null);
      return;
    }
    const nombre = actual.nombre;
    const ok = await eliminarAccion.ejecutar(actual.id_turno);
    if (!ok) return;
    elegir(null, false);
    setAviso('Se eliminó el turno ' + nombre + '.');
  };

  const problemas = [...errores, ...(guardarAccion.error ? [guardarAccion.error] : [])];

  return (
    <div style={css('width: 1440px; min-height: 1600px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir('A1')} style={css('cursor: pointer;')}>Inicio</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span style={css('color: #14181f; font-weight: 500;')}>Turnos</span>
          </div>
          <div style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Turnos y franjas horarias</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <button
          onClick={() => elegir(null, true)}
          style={css('display: flex; align-items: center; gap: 9px; height: 40px; padding: 0 17px; border-radius: 8px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 13px; font-weight: 600;')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          Nuevo turno
        </button>
      </div>

      <div style={css('padding: 20px 28px 28px; display: flex; flex-direction: column; gap: 18px;')}>
        <MensajeError mensaje={qTurnos.error?.message} />

        {/* ===== línea de tiempo del día ===== */}
        <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
          <div style={css('display: flex; align-items: flex-end; gap: 16px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
            <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
              <div style={css('font-size: 13.5px; font-weight: 600;')}>El día escolar, turno por turno</div>
              <div style={css('font-size: 12px; color: #6b7482;')}>
                Cada bloque es una hora cátedra. Los huecos entre bloques son los recreos, que también son franjas. Cada día de lunes a viernes tiene sus franjas, con los mismos horarios.
              </div>
            </div>
          </div>
          <div style={css('padding: 12px 20px 16px; display: flex; flex-direction: column; gap: 8px;')}>
            <div style={css('display: grid; grid-template-columns: 200px 1fr; gap: 14px;')}>
              <div></div>
              <div style={css('position: relative; height: 16px;')}>
                {marcas.map((h) => (
                  <span key={h} className="mono" style={css('position: absolute; top: 0; left: ' + pct(h * 60) + '; transform: translateX(-50%); font-size: 10.5px; color: #a8b0bb;')}>
                    {('0' + h).slice(-2)}
                  </span>
                ))}
              </div>
            </div>
            {lineas.map(({ t, activa, base, fuente, recreos }) => (
              <button
                key={t.id_turno}
                onClick={() => elegir(t.id_turno, false)}
                style={css(
                  'display: grid; grid-template-columns: 200px 1fr; gap: 14px; align-items: center; width: 100%; padding: 7px 10px;' +
                    ' border-radius: 8px; border: 1px solid ' + (activa ? '#cfdcf5' : 'transparent') + '; background: ' + (activa ? '#f3f6fc' : '#fff') + ';',
                )}
              >
                <span style={css('display: flex; flex-direction: column; gap: 2px; text-align: left;')}>
                  <span style={css('font-size: 13px; font-weight: 600; color: #14181f;')}>{t.nombre}</span>
                  <span className="mono" style={css('font-size: 11px; color: #7a8393;')}>
                    {base.inicio + ' a ' + base.fin} · {base.franjas.length + ' h cátedra · ' + recreos + (recreos === 1 ? ' recreo' : ' recreos')}
                  </span>
                </span>
                <span style={css('position: relative; height: 30px; border-radius: 6px; background: #f5f7fa;')}>
                  <span
                    style={css(
                      'position: absolute; top: 0; bottom: 0; left: ' + pct(min(fuente.inicio)) + '; width: ' + ancho(min(fuente.inicio), min(fuente.fin)) +
                        '; border-radius: 6px; background: ' + (activa ? '#dbe6fa' : '#e8ecf1') + ';',
                    )}
                  ></span>
                  {fuente.franjas.map((f, k) => {
                    const a = min(f[0]);
                    const z = min(f[1]);
                    return (
                      <span
                        key={k}
                        style={css(
                          'position: absolute; top: 4px; bottom: 4px; left: ' + pct(a) + '; width: ' + ancho(a, z) + '; border-radius: 3px; background: ' +
                            (activa ? ACCENT : '#8b95a5') + '; box-shadow: inset -1px 0 0 #fff;',
                        )}
                      ></span>
                    );
                  })}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={css('display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; align-items: start;')}>
          {/* ===== editor del turno ===== */}
          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('display: flex; align-items: center; gap: 12px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <span style={css('font-size: 14px; font-weight: 600;')}>{nuevo || !actual ? 'Nuevo turno' : 'Turno ' + actual.nombre}</span>
              {sinGuardar && !nuevo && actual && (
                <span style={css('font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 11px; background: #fdf6ec; color: #a56a10;')}>Cambios sin guardar</span>
              )}
            </div>
            <div style={css('padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('display: grid; grid-template-columns: 1fr 100px 120px 120px; gap: 10px;')}>
                <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
                  <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Nombre *</label>
                  <input
                    type="text"
                    value={b.nombre}
                    onChange={(e) => cambiar({ ...b, nombre: e.target.value })}
                    disabled={!nuevo && !!actual}
                    title={!nuevo && actual ? 'No disponible en la API: el nombre de un turno no se puede cambiar.' : undefined}
                    placeholder="Ej.: Vespertino"
                    style={css(CAMPO + (!nuevo && actual ? ' color: #4a5462; background: #f4f6f8;' : ''))}
                  />
                </div>
                <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
                  <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Código</label>
                  <input
                    type="text"
                    value={codigoDe(b.nombre)}
                    readOnly
                    disabled
                    title="La API no guarda el código del turno: se deriva del nombre."
                    placeholder="TV"
                    style={css(CAMPO + ' color: #4a5462; background: #f4f6f8;')}
                  />
                </div>
                <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
                  <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Empieza *</label>
                  <input type="time" value={b.inicio} onChange={(e) => cambiar({ ...b, inicio: e.target.value })} style={css(CAMPO)} />
                </div>
                <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
                  <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Termina *</label>
                  <input type="time" value={b.fin} onChange={(e) => cambiar({ ...b, fin: e.target.value })} style={css(CAMPO)} />
                </div>
              </div>
              <div style={css('display: flex; align-items: flex-end; gap: 10px; padding: 12px 14px; border-radius: 9px; background: #fafbfc; border: 1px solid #eef1f5;')}>
                <div style={css('display: flex; flex-direction: column; gap: 6px; width: 130px;')}>
                  <label style={css('font-size: 12px; font-weight: 600; color: #4a5462;')}>Hora cátedra (min)</label>
                  <input type="text" value={String(b.dur)} onChange={(e) => cambiar({ ...b, dur: Number(e.target.value) || e.target.value })} style={css(CAMPO)} />
                </div>
                <button
                  onClick={generar}
                  style={css('height: 38px; padding: 0 14px; border-radius: 8px; border: 1px solid ' + ACCENT + '; background: #fff; color: ' + ACCENT + '; font-size: 12.5px; font-weight: 600; white-space: nowrap;')}
                >
                  Generar las franjas
                </button>
                <span style={css('font-size: 11.5px; color: #7a8393; line-height: 1.45; flex-grow: 1;')}>
                  Arma horas cátedra seguidas entre el inicio y el fin. Las franjas se crean para cada día, de lunes a viernes, con estos horarios. Los recreos también son franjas, marcadas como recreo: no se ocupan con clases. Para dejar uno, corré el inicio de la hora cátedra que va después y el hueco queda como recreo.
                </span>
              </div>
            </div>

            <div style={css(FILA + ' padding: 10px 20px; background: #fafbfc; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Franja</div>
              <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Inicio</div>
              <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Fin</div>
              <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Duración</div>
              <div></div>
            </div>
            {filas}
            <div style={css('padding: 14px 20px 18px; display: flex; flex-direction: column; gap: 12px;')}>
              <button
                onClick={agregarFranja}
                style={css('align-self: flex-start; height: 32px; padding: 0 12px; border-radius: 8px; border: 1px dashed #b9c1cc; background: #fff; color: #4a5462; font-size: 12px; font-weight: 500;')}
              >
                + Agregar una hora cátedra al final
              </button>
              <div style={css('font-size: 11.5px; color: #7a8393; line-height: 1.45;')}>
                Los recreos no se quitan desde acá: se mueven o desaparecen al cambiar las horas cátedra de al lado o al volver a generar las franjas.
              </div>
              {problemas.map((p, i) => (
                <div key={i} style={css('font-size: 12px; color: #a63244; background: #fbf1f2; border: 1px solid #f1d3d8; border-radius: 8px; padding: 9px 11px;')}>
                  {p}
                </div>
              ))}
              {aviso && (
                <div style={css('font-size: 12px; color: #245239; background: #eef6f0; border: 1px solid #cfe5d6; border-radius: 8px; padding: 9px 11px;')}>{aviso}</div>
              )}
              <div style={css('display: flex; gap: 10px;')}>
                <button
                  onClick={guardar}
                  disabled={guardarAccion.enCurso}
                  style={css(
                    'height: 40px; padding: 0 18px; border-radius: 8px; font-size: 13px; font-weight: 600;' +
                      (sinGuardar ? ' border: none; background: ' + ACCENT + '; color: #fff;' : ' border: 1px solid #e2e6ec; background: #f4f6f8; color: #a8b0bb; cursor: default;'),
                  )}
                >
                  {guardarAccion.enCurso ? 'Guardando…' : nuevo || !actual ? 'Crear el turno' : 'Guardar cambios'}
                </button>
                <button
                  onClick={() => {
                    setBorrador(null);
                    setNuevo(false);
                    setErrores([]);
                    setAviso(null);
                    guardarAccion.limpiarError();
                  }}
                  style={css('height: 40px; padding: 0 16px; border-radius: 8px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 13px; font-weight: 500;')}
                >
                  Descartar cambios
                </button>
              </div>
            </div>
          </div>

          {/* ===== resumen ===== */}
          <div style={css('display: flex; flex-direction: column; gap: 14px;')}>
            <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; gap: 14px;')}>
              <div style={css('font-size: 13.5px; font-weight: 600;')}>Capacidad del turno</div>
              <div style={css('display: grid; grid-template-columns: 1fr 1fr; gap: 10px;')}>
                <div style={css('padding: 11px 12px; border-radius: 8px; background: #f5f7fa;')}>
                  <div className="mono" style={css('font-size: 20px; font-weight: 600;')}>{porDia}</div>
                  <div style={css('font-size: 11.5px; color: #6b7482;')}>horas cátedra por día</div>
                  <div style={css('font-size: 11px; color: #8a5a10; margin-top: 3px;')}>+ {recreosDia === 1 ? '1 recreo' : recreosDia + ' recreos'} por día</div>
                </div>
                <div style={css('padding: 11px 12px; border-radius: 8px; background: #eef3fc;')}>
                  <div className="mono" style={css('font-size: 20px; font-weight: 600; color: #1e3f80;')}>{porDia * nDias}</div>
                  <div style={css('font-size: 11.5px; color: #4a5f86;')}>horas cátedra por semana</div>
                  <div style={css('font-size: 11px; color: #8a5a10; margin-top: 3px;')}>+ {recreosDia * nDias === 1 ? '1 recreo' : recreosDia * nDias + ' recreos'} por semana</div>
                </div>
              </div>
              <div style={css('font-size: 12px; color: #6b7482; line-height: 1.5;')}>
                En total son {porDia + recreosDia} franjas por día y {(porDia + recreosDia) * nDias} por semana, contando los recreos. Un curso de este turno puede tener hasta {porDia * nDias} horas cátedra semanales. Si su plan tiene más, no entra en el turno.
              </div>
            </div>
            <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; gap: 10px;')}>
              <div style={css('font-size: 13.5px; font-weight: 600;')}>Cursos en este turno · {ciclo.activo?.anio_calendario ?? '—'}</div>
              <div style={css('display: flex; gap: 6px; flex-wrap: wrap;')}>
                {cursos.map((c) => (
                  <span key={c.id_curso} style={css('padding: 5px 10px; border-radius: 7px; border: 1px solid #e2e6ec; background: #fafbfc; font-size: 12.5px; font-weight: 500;')}>
                    {nombreCurso(c)}
                  </span>
                ))}
                {cursos.length === 0 && <span style={css('font-size: 12px; color: #8b95a5;')}>Ninguno. El turno se elige al crear o editar un curso.</span>}
              </div>
              <div style={css('font-size: 11.5px; color: #7a8393; line-height: 1.5;')}>Si cambian las franjas, la grilla de esos cursos se arma con las franjas nuevas en la planificación.</div>
              {(errorEliminar || eliminarAccion.error) && (
                <div style={css('font-size: 12px; color: #a63244; background: #fbf1f2; border: 1px solid #f1d3d8; border-radius: 8px; padding: 9px 11px; line-height: 1.45;')}>
                  {errorEliminar ?? eliminarAccion.error}
                </div>
              )}
              {!nuevo && actual && (
                <button
                  onClick={eliminar}
                  disabled={eliminarAccion.enCurso}
                  style={css('height: 34px; border-radius: 8px; border: 1px solid #edc9c4; background: #fff; color: #b03a2e; font-size: 12px; font-weight: 600;')}
                >
                  {confirmarEliminar ? 'Confirmar: eliminar el turno ' + actual.nombre : 'Eliminar el turno'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
