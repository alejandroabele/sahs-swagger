// A11 · Alta y edición de curso. Prototipo: <template id="tpl-cursoform"> y DC.registrar("cursoform") en prototipo/index.html.
// Alta (?nuevo=1): crear_curso + asignar_curso_a_anio_academico + asignar_materia_a_curso por cada materia elegida.
// Edición (?id_curso=): año (asignar_curso_a_anio_academico), orientación (orientacion.asignar_curso_a_orientacion)
// y materias (asignar_materia_a_curso, cambiar_horas_materia_curso, quitar_materia_curso).
// División, turno y ciclo no se cambian en un curso existente: la API no tiene command para eso.
import { useEffect, useMemo, useState } from 'react';
import type { AnioAcademico, Curso, Materia, Turno } from '@sahs/contratos';
import { horarios, orientacion as apiOrientacion, planificacion } from '../api';
import { mensajeDeError } from '../api/http';
import { useNavegar, useParamNumero } from '../app/navegar';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useConsulta, useInvalidar } from '../estado/consultas';
import { css } from '../lib/css';

const ACCENT = '#2f5fd0';

const AREAS: Record<string, string> = {
  Exactas: '#3a6fd8',
  'Lengua y Literatura': '#1f8f7a',
  Sociales: '#7a54c4',
  Pastoral: '#c08430',
  Artes: '#c04f7a',
};

const CAMPO =
  'width: 100%; box-sizing: border-box; height: 42px; padding: 0 10px; border-radius: 8px;' +
  ' font-size: 13px; color: #14181f; background: #fcfdfe; border: 1px solid #dfe4ea;';
const CAMPO_FIJO = CAMPO + ' background: #f4f6f8; color: #6b7482;';

const DIVISIONES = ['A', 'B', 'C', 'D', 'E'];

/** "1° año" → 1. */
function numeroDeAnio(anios: AnioAcademico[] | undefined, id: number | null | undefined): number | null {
  const a = anios?.find((x) => x.id_anio_academico === id);
  if (!a) return null;
  const n = parseInt(a.anio_curricular, 10);
  return isNaN(n) ? null : n;
}

/** Horas cátedra (sin recreos) de un turno, agrupadas por día y ordenadas por hora. */
function horasDelTurno(t: Turno | undefined) {
  const porDia = new Map<string, { inicio: string; fin: string }[]>();
  for (const f of t?.franjas_horarias ?? []) {
    if (f.es_recreo) continue;
    const dia = f.dia_lectivo?.nombre_dia_lectivo ?? String(f.id_dia_lectivo);
    if (!porDia.has(dia)) porDia.set(dia, []);
    porDia.get(dia)!.push({ inicio: f.hora_inicio, fin: f.hora_fin });
  }
  const dias = [...porDia.values()].map((l) => l.sort((a, b) => a.inicio.localeCompare(b.inicio)));
  const total = dias.reduce((s, l) => s + l.length, 0);
  const primero = dias[0] ?? [];
  return { total, porDia: primero.length, inicio: primero[0]?.inicio ?? '', fin: primero[primero.length - 1]?.fin ?? '' };
}

interface Form {
  idAnio: number | null;
  division: string;
  idCiclo: number | null;
  idOrientacion: number | null;
  idTurno: number | null;
  /** id_materia → horas semanales en el curso. */
  elegidas: Record<number, number>;
}

export default function A11CursoForm() {
  const ir = useNavegar();
  const ciclo = useCiclo();
  const invalidar = useInvalidar();
  const idCurso = useParamNumero('id_curso');
  const esNuevo = idCurso == null;

  const qCursos = useConsulta(['planificacion', 'get_cursos'], () => planificacion.get_cursos());
  const qAnios = useConsulta(['planificacion', 'get_anios_academicos'], () => planificacion.get_anios_academicos());
  const qOrient = useConsulta(['orientacion', 'get_orientaciones'], () => apiOrientacion.get_orientaciones());
  const qMaterias = useConsulta(['orientacion', 'get_materias'], () => apiOrientacion.get_materias());
  const qTurnos = useConsulta(['horarios', 'get_turnos'], () => horarios.get_turnos());
  const curso: Curso | null = (idCurso != null && qCursos.data?.find((c) => c.id_curso === idCurso)) || null;

  const [f, setF] = useState<Form>({ idAnio: null, division: 'A', idCiclo: null, idOrientacion: null, idTurno: null, elegidas: {} });
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const anios = useMemo(() => [...(qAnios.data ?? [])].sort((a, b) => a.id_anio_academico - b.id_anio_academico), [qAnios.data]);
  const materias = qMaterias.data ?? [];
  const turnos = qTurnos.data ?? [];

  // Orientaciones que tienen materias en el año elegido.
  const orientacionesPara = (idAnio: number | null) =>
    (qOrient.data ?? []).filter((o) => materias.some((m) => m.id_anio_academico === idAnio && m.id_orientacion === o.id_orientacion));

  // Carga del formulario: valores por defecto en el alta, o los del curso en la edición.
  const listo = !!qCursos.data && !!qAnios.data && !!qOrient.data && !!qMaterias.data && !!qTurnos.data;
  const claveCarga = esNuevo ? 'nuevo' : curso ? 'curso-' + curso.id_curso : null;
  useEffect(() => {
    if (!listo || !claveCarga) return;
    if (curso) {
      const e: Record<number, number> = {};
      (curso.materias ?? []).forEach((m) => (e[m.id_materia] = m.horas_semanales));
      setF({
        idAnio: curso.id_anio_academico ?? null,
        division: curso.division,
        idCiclo: curso.id_ciclo_lectivo,
        idOrientacion: curso.id_orientacion,
        idTurno: curso.id_turno,
        elegidas: e,
      });
    } else {
      const idAnio = anios[0]?.id_anio_academico ?? null;
      const ps = orientacionesPara(idAnio);
      setF({
        idAnio,
        division: 'A',
        idCiclo: ciclo.activo?.id_ciclo_lectivo ?? null,
        idOrientacion: ps.length === 1 ? ps[0].id_orientacion : null,
        idTurno: turnos.find((t) => t.nombre === 'Doble turno')?.id_turno ?? turnos[0]?.id_turno ?? null,
        elegidas: {},
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, claveCarga]);

  if (!listo) {
    return (
      <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
        <Cabecera />
        <div style={css('padding: 20px 28px;')}>
          <MensajeError mensaje={(qCursos.error ?? qAnios.error ?? qOrient.error ?? qMaterias.error ?? qTurnos.error)?.message} />
          <Cargando />
        </div>
      </div>
    );
  }

  const anioNum = numeroDeAnio(anios, f.idAnio);
  const anioTxt = anioNum != null ? anioNum + '°' : '?°';
  const basico = (anioNum ?? 0) <= 3;
  const paraAnio = orientacionesPara(f.idAnio);
  const or = qOrient.data!.find((o) => o.id_orientacion === f.idOrientacion) ?? null;
  const nombreOr = or?.nombre_orientacion ?? '';
  const cicloSel = ciclo.ciclos.find((c) => c.id_ciclo_lectivo === f.idCiclo) ?? null;
  const anioCal = cicloSel?.anio_calendario ?? '';

  // Plan: materias del año y la orientación; en la edición también las que el curso ya dicta fuera de ese plan.
  const plan: Materia[] = materias
    .filter((m) => f.idOrientacion != null && m.id_anio_academico === f.idAnio && m.id_orientacion === f.idOrientacion)
    .sort((a, b) => a.nombre_materia.localeCompare(b.nombre_materia));
  for (const id of Object.keys(f.elegidas).map(Number)) {
    if (!plan.some((m) => m.id_materia === id)) {
      const m = materias.find((x) => x.id_materia === id);
      if (m) plan.push(m);
    }
  }
  const elegidaHoras = (m: Materia) => f.elegidas[m.id_materia];
  const total = plan.reduce((s, m) => s + (elegidaHoras(m) ?? 0), 0);
  const cantidad = plan.filter((m) => elegidaHoras(m) != null).length;

  const turnoSel = turnos.find((t) => t.id_turno === f.idTurno);
  const ht = horasDelTurno(turnoSel);
  const capacidad = ht.total;
  const excede = total > capacidad;
  const turnoNombre = turnoSel?.nombre ?? '';

  const identificacion = anioTxt + ' ' + f.division + (basico || !nombreOr ? '' : ' · ' + nombreOr) + ' · ' + anioCal;
  const puedeGuardar = cantidad > 0 && !excede && !guardando && f.idAnio != null && f.idOrientacion != null && f.idTurno != null && f.idCiclo != null;

  const cambiar = (p: Partial<Form>) => {
    setF((x) => ({ ...x, ...p }));
    setError(null);
    setAviso(null);
  };

  const cursosOpciones = [...(qCursos.data ?? [])]
    .map((c) => ({ c, n: numeroDeAnio(anios, c.id_anio_academico), anio: ciclo.ciclos.find((x) => x.id_ciclo_lectivo === c.id_ciclo_lectivo)?.anio_calendario ?? 0 }))
    .sort((a, b) => b.anio - a.anio || (a.n ?? 99) - (b.n ?? 99) || a.c.division.localeCompare(b.c.division));

  async function guardar() {
    if (!puedeGuardar) return;
    setError(null);
    setAviso(null);
    if (esNuevo) {
      const repetido = (qCursos.data ?? []).some(
        (c) => c.id_ciclo_lectivo === f.idCiclo && c.id_anio_academico === f.idAnio && c.division.toUpperCase() === f.division.toUpperCase(),
      );
      if (repetido) {
        setError('Ya existe el curso ' + identificacion + '. No puede haber dos divisiones iguales en el mismo ciclo lectivo.');
        return;
      }
    }
    setGuardando(true);
    const elegidas = plan.filter((m) => elegidaHoras(m) != null);
    try {
      if (esNuevo) {
        const nuevo = await planificacion.crear_curso({ division: f.division, id_ciclo_lectivo: f.idCiclo!, id_turno: f.idTurno!, id_orientacion: f.idOrientacion! });
        await planificacion.asignar_curso_a_anio_academico(f.idAnio!, { id_curso: nuevo.id_curso });
        const fallas: string[] = [];
        for (const m of elegidas) {
          try {
            await planificacion.asignar_materia_a_curso(nuevo.id_curso, { id_materia: m.id_materia, horas_semanales: elegidaHoras(m) });
          } catch (e) {
            fallas.push(m.nombre_materia + ': ' + mensajeDeError(e));
          }
        }
        await invalidar('planificacion', 'orientacion');
        setAviso(
          identificacion +
            ' quedó creado con ' +
            (elegidas.length - fallas.length) +
            ' materias y ' +
            total +
            ' horas semanales. Ya se le puede armar la grilla.',
        );
        if (fallas.length) setError('No se pudieron agregar algunas materias. ' + fallas.join(' · '));
        ir('A11', { id_curso: nuevo.id_curso });
      } else {
        const c = curso!;
        if (f.idAnio !== (c.id_anio_academico ?? null)) await planificacion.asignar_curso_a_anio_academico(f.idAnio!, { id_curso: c.id_curso });
        if (f.idOrientacion !== c.id_orientacion) await apiOrientacion.asignar_curso_a_orientacion(f.idOrientacion!, { id_curso: c.id_curso });
        const antes = new Map((c.materias ?? []).map((m) => [m.id_materia, m.horas_semanales]));
        for (const [id] of antes) if (f.elegidas[id] == null) await planificacion.quitar_materia_curso(c.id_curso, id);
        for (const [idTxt, horas] of Object.entries(f.elegidas)) {
          const id = Number(idTxt);
          if (!antes.has(id)) await planificacion.asignar_materia_a_curso(c.id_curso, { id_materia: id, horas_semanales: horas });
          else if (antes.get(id) !== horas) await planificacion.cambiar_horas_materia_curso(c.id_curso, { id_materia: id, horas_semanales: horas });
        }
        await invalidar('planificacion', 'orientacion');
        setAviso('Los cambios de ' + identificacion + ' quedaron guardados. Si la grilla ya estaba validada, hay que volver a armarla en una planificación nueva.');
      }
    } catch (e) {
      await invalidar('planificacion', 'orientacion');
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div style={css('padding: 22px 28px 20px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482; margin-bottom: 14px;')}>
          <span onClick={() => ir('A10')} style={css('display: flex; align-items: center; gap: 6px; color: #2f5fd0; cursor: pointer;')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6"></path>
            </svg>
            Volver al listado
          </span>
          <span style={css('color: #c3cad4;')}>/</span>
          <span>Cursos</span>
          <span style={css('color: #c3cad4;')}>/</span>
          <span style={css('color: #14181f; font-weight: 500;')}>{esNuevo ? 'Nuevo' : identificacion}</span>
        </div>

        <div style={css('display: flex; align-items: flex-end; gap: 20px;')}>
          <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <div style={css('font-size: 26px; font-weight: 600; letter-spacing: -0.025em;')}>{esNuevo ? 'Nuevo curso' : identificacion}</div>
            <div style={css('font-size: 12.5px; color: #6b7482;')}>
              {esNuevo
                ? 'Definí el año, la división, el ciclo lectivo, la orientación y qué materias se dictan'
                : 'Modificá el año, la orientación o las materias que se dictan en este curso'}
            </div>
          </div>
          <div style={css('flex-grow: 1;')}></div>
          <div style={css('display: flex; align-items: center; gap: 10px;')}>
            <span style={css('font-size: 12px; color: #6b7482;')}>Crear uno nuevo o modificar</span>
            <select
              value={esNuevo ? 'nuevo' : String(idCurso)}
              onChange={(e) => {
                setAviso(null);
                setError(null);
                if (e.target.value === 'nuevo') ir('A11', { nuevo: 1 });
                else ir('A11', { id_curso: Number(e.target.value) });
              }}
              style={css('height: 38px; min-width: 210px; padding: 0 12px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; background: #fcfdfe; color: #14181f;')}
            >
              <option value="nuevo">+ Nuevo curso</option>
              {cursosOpciones.map(({ c, n, anio }) => (
                <option key={c.id_curso} value={String(c.id_curso)}>
                  {(n ?? '?') + '° ' + c.division + ((n ?? 0) >= 4 ? ' · ' + (c.orientacion?.nombre_orientacion ?? '') : '') + ' · ' + anio}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!esNuevo && !curso ? (
        <div style={css('padding: 20px 28px;')}>
          <MensajeError mensaje={'No existe el curso ' + idCurso + '.'} />
        </div>
      ) : (
        <div style={css('display: flex; gap: 18px; padding: 20px 28px 28px; align-items: flex-start;')}>
          <div style={css('width: 440px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;')}>
            <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
              <div style={css('padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
                <div style={css('font-size: 13px; font-weight: 600;')}>Identificación del curso</div>
              </div>
              <div style={css('padding: 20px; display: flex; flex-direction: column; gap: 18px;')}>
                <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                  <div style={css('display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;')}>
                    <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                      <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Año curricular *</label>
                      <select
                        value={f.idAnio ?? ''}
                        onChange={(e) => {
                          // Cambiar de año cambia el plan de estudios: las materias se vuelven a elegir.
                          const idAnio = Number(e.target.value);
                          const ps = orientacionesPara(idAnio);
                          cambiar({ idAnio, idOrientacion: ps.length === 1 ? ps[0].id_orientacion : null, elegidas: {} });
                        }}
                        style={css(CAMPO)}
                      >
                        {anios.map((a) => (
                          <option key={a.id_anio_academico} value={a.id_anio_academico}>
                            {a.anio_curricular}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                      <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>División *</label>
                      <select
                        value={f.division}
                        disabled={!esNuevo}
                        title={esNuevo ? undefined : 'No disponible en la API: la división de un curso existente no se puede cambiar'}
                        onChange={(e) => cambiar({ division: e.target.value })}
                        style={css(esNuevo ? CAMPO : CAMPO_FIJO)}
                      >
                        {(DIVISIONES.includes(f.division) ? DIVISIONES : [...DIVISIONES, f.division]).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                      <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Ciclo *</label>
                      <select
                        value={f.idCiclo ?? ''}
                        disabled={!esNuevo}
                        title={esNuevo ? undefined : 'No disponible en la API: el ciclo de un curso existente no se puede cambiar'}
                        onChange={(e) => cambiar({ idCiclo: Number(e.target.value) })}
                        style={css(esNuevo ? CAMPO : CAMPO_FIJO)}
                      >
                        {[...ciclo.ciclos]
                          .sort((a, b) => a.anio_calendario - b.anio_calendario)
                          .map((c) => (
                            <option key={c.id_ciclo_lectivo} value={c.id_ciclo_lectivo}>
                              {c.anio_calendario}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  {!esNuevo && (
                    <span style={css('font-size: 11.5px; color: #7a8393; line-height: 1.45;')}>
                      La división y el ciclo no se cambian en un curso existente (la API no lo permite). Si hacen falta otros, creá un curso nuevo.
                    </span>
                  )}
                </div>

                <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                  <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Orientación *</label>
                  <select
                    value={f.idOrientacion ?? ''}
                    onChange={(e) => cambiar({ idOrientacion: e.target.value ? Number(e.target.value) : null, elegidas: {} })}
                    style={css(paraAnio.length === 1 && f.idOrientacion === paraAnio[0].id_orientacion ? CAMPO_FIJO : CAMPO)}
                  >
                    {!(paraAnio.length === 1 && f.idOrientacion === paraAnio[0].id_orientacion) && (
                      <option value="">{paraAnio.length ? 'Seleccioná una orientación' : 'Ninguna asociada a este año'}</option>
                    )}
                    {paraAnio.map((o) => (
                      <option key={o.id_orientacion} value={o.id_orientacion}>
                        {o.nombre_orientacion}
                      </option>
                    ))}
                    {or && !paraAnio.some((o) => o.id_orientacion === or.id_orientacion) && <option value={or.id_orientacion}>{or.nombre_orientacion}</option>}
                  </select>
                  <span style={css('font-size: 11.5px; color: #7a8393; line-height: 1.45;')}>
                    {paraAnio.length === 0
                      ? 'Ninguna orientación tiene materias de ' + anioTxt + ' año. Se cargan desde las pantallas Materias y Orientaciones.'
                      : 'Solo se ofrecen las materias de ' + anioTxt + ' año de esta orientación, y lo mismo pasa al planificar su grilla.'}
                  </span>
                </div>

                <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
                  <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Turno *</label>
                  <select
                    value={f.idTurno ?? ''}
                    disabled={!esNuevo}
                    title={esNuevo ? undefined : 'No disponible en la API: el turno de un curso existente no se puede cambiar'}
                    onChange={(e) => cambiar({ idTurno: Number(e.target.value) })}
                    style={css(esNuevo ? CAMPO : CAMPO_FIJO)}
                  >
                    {turnos.map((t) => {
                      const h = horasDelTurno(t);
                      return (
                        <option key={t.id_turno} value={t.id_turno}>
                          {t.nombre + ' · ' + h.inicio + ' a ' + h.fin + ' · ' + h.total + ' franjas'}
                        </option>
                      );
                    })}
                  </select>
                  <span style={css('font-size: 11.5px; color: #7a8393; line-height: 1.45;')}>
                    {turnoSel
                      ? ht.porDia + ' horas cátedra por día, de ' + ht.inicio + ' a ' + ht.fin + '. La grilla del curso se arma con estas franjas.' +
                        (esNuevo ? '' : ' El turno de un curso existente no se puede cambiar.')
                      : 'Elegí un turno.'}
                  </span>
                </div>

                <div style={css('display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 9px; background: #fafbfc; border: 1px solid #eef1f5;')}>
                  <span
                    style={css(
                      'width: 42px; height: 42px; border-radius: 10px; background: ' +
                        ACCENT +
                        '; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; flex-shrink: 0;',
                    )}
                  >
                    {anioTxt + ' ' + f.division}
                  </span>
                  <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
                    <div style={css('font-size: 11.5px; color: #7a8393;')}>Así queda identificado</div>
                    <div style={css('font-size: 17px; font-weight: 600; letter-spacing: -0.01em;')}>{identificacion}</div>
                  </div>
                </div>

                {error && (
                  <div style={css('display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 9px; background: #fbeceb; border: 1px solid #edc9c4;')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b03a2e" strokeWidth="2.2" strokeLinecap="round" style={css('flex-shrink: 0; margin-top: 1px;')}>
                      <path d="M12 8v5M12 16.5v.5"></path>
                      <circle cx="12" cy="12" r="9"></circle>
                    </svg>
                    <span style={css('font-size: 12.5px; color: #b03a2e; line-height: 1.5;')}>{error}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; gap: 14px;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Carga horaria semanal</div>
              <div style={css('display: flex; align-items: baseline; gap: 9px;')}>
                <span className="mono" style={css('font-size: 30px; font-weight: 600; color: ' + (excede ? '#b03a2e' : ACCENT) + ';')}>
                  {total}
                </span>
                <span style={css('font-size: 12.5px; color: #6b7482;')}>de {capacidad} franjas semanales del turno</span>
              </div>
              <div style={css('height: 7px; border-radius: 4px; background: #eef1f5; overflow: hidden;')}>
                <div style={css('height: 7px; width: ' + Math.min(100, Math.round((total / (capacidad || 1)) * 100)) + '%; background: ' + (excede ? '#b03a2e' : ACCENT) + ';')}></div>
              </div>
              <div style={css('font-size: 12px; color: ' + (excede ? '#b03a2e' : '#6b7482') + '; line-height: 1.55;')}>
                {excede
                  ? 'No entra en el turno ' + turnoNombre + ': tiene ' + capacidad + ' franjas por semana. Bajá horas' + (esNuevo ? ' o elegí un turno más largo.' : '.')
                  : total === 0
                    ? 'Elegí las materias que se dictan en este curso.'
                    : 'Quedan ' + (capacidad - total) + ' franjas libres en la semana del turno ' + turnoNombre + '.'}
              </div>
              <button
                onClick={guardar}
                disabled={!puedeGuardar}
                style={css(
                  'height: 44px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600;' +
                    ' background: ' +
                    (puedeGuardar ? ACCENT : '#e2e6ec') +
                    ';' +
                    ' color: ' +
                    (puedeGuardar ? '#fff' : '#a8b0bb') +
                    ';',
                )}
              >
                {guardando ? 'Guardando…' : esNuevo ? 'Crear el curso' : 'Guardar cambios'}
              </button>
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

          <div style={css('flex-grow: 1; min-width: 0; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('display: flex; align-items: center; gap: 12px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
                <div style={css('font-size: 13px; font-weight: 600;')}>Materias a dictar</div>
                <div style={css('font-size: 12px; color: #6b7482;')}>
                  Del plan de estudios de {anioTxt + ' año' + (nombreOr ? ', orientación ' + nombreOr : '')}. Ajustá las horas de cada una
                </div>
              </div>
              <div style={css('flex-grow: 1;')}></div>
              <div
                style={css(
                  'font-size: 11.5px; font-weight: 600; padding: 5px 11px; border-radius: 13px;' +
                    (cantidad > 0 ? ' background: #e9f2ec; color: #2f6b45;' : ' background: #f2f4f7; color: #7a8393;'),
                )}
              >
                {cantidad === 0 ? 'Ninguna elegida' : cantidad === 1 ? '1 materia · ' + total + ' h' : cantidad + ' materias · ' + total + ' h'}
              </div>
            </div>

            {plan.length > 0 ? (
              <div>
                {plan.map((m, i) => {
                  const horasEl = elegidaHoras(m);
                  const elegida = horasEl != null;
                  const horas = horasEl ?? m.horas_semanales;
                  const area = m.area?.nombre_area ?? '';
                  const fueraDelPlan = !(m.id_anio_academico === f.idAnio && m.id_orientacion === f.idOrientacion);
                  const toggle = () => {
                    const e = { ...f.elegidas };
                    if (elegida) delete e[m.id_materia];
                    else e[m.id_materia] = m.horas_semanales;
                    cambiar({ elegidas: e });
                  };
                  const sumar = (d: number) => {
                    if (!elegida) return;
                    cambiar({ elegidas: { ...f.elegidas, [m.id_materia]: Math.max(1, Math.min(8, horas + d)) } });
                  };
                  const botonEstilo =
                    'width: 26px; height: 26px; border-radius: 6px; font-size: 15px; line-height: 1;' +
                    ' display: flex; align-items: center; justify-content: center;' +
                    ' border: 1px solid ' +
                    (elegida ? '#dfe4ea' : '#eef1f5') +
                    ';' +
                    ' background: #fff; color: ' +
                    (elegida ? '#4a5462' : '#cdd4dd') +
                    ';';
                  return (
                    <div
                      key={m.id_materia}
                      style={css(
                        'display: flex; align-items: center; gap: 12px;' + ' padding: 11px 20px;' + (i === 0 ? '' : ' border-top: 1px solid #f2f4f7;') + (elegida ? '' : ' background: #fdfdfe;'),
                      )}
                    >
                      <button
                        onClick={toggle}
                        aria-label={elegida ? 'Quitar ' + m.nombre_materia : 'Agregar ' + m.nombre_materia}
                        style={css(
                          'width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0; display: flex;' +
                            ' align-items: center; justify-content: center; padding: 0;' +
                            ' border: 1.5px solid ' +
                            (elegida ? ACCENT : '#cdd4dd') +
                            ';' +
                            ' background: ' +
                            (elegida ? ACCENT : '#fff') +
                            ';',
                        )}
                      >
                        {elegida && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5"></path>
                          </svg>
                        )}
                      </button>
                      <div style={css('width: 4px; height: 28px; border-radius: 3px; background: ' + (AREAS[area] ?? '#c3cad4') + '; flex-shrink: 0;')}></div>
                      <div style={css('display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0;')}>
                        <div style={css('font-size: 13.5px; font-weight: 500;' + ' color: ' + (elegida ? '#14181f' : '#8b95a5') + ';')}>{m.nombre_materia}</div>
                        <div style={css('font-size: 11.5px; color: #8b95a5;')}>
                          {(area || 'Sin área') + (fueraDelPlan ? ' · fuera del plan de este año y orientación' : '')}
                        </div>
                      </div>
                      <div style={css('display: flex; align-items: center; gap: 3px; flex-shrink: 0;')}>
                        <button onClick={() => sumar(-1)} style={css(botonEstilo)}>
                          −
                        </button>
                        <div className="mono" style={css('width: 40px; text-align: center; font-size: 13px; font-weight: 500;' + ' color: ' + (elegida ? '#14181f' : '#b9c1cc') + ';')}>
                          {horas + ' h'}
                        </div>
                        <button onClick={() => sumar(1)} style={css(botonEstilo)}>
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={css('padding: 40px 28px; display: flex; flex-direction: column; align-items: center; gap: 13px; text-align: center;')}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b9c1cc" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4.5A1.5 1.5 0 015.5 3H19v18H5.5A1.5 1.5 0 014 19.5v-15z"></path>
                  <path d="M8 3v18"></path>
                </svg>
                <div style={css('font-size: 13px; color: #6b7482; line-height: 1.6; max-width: 330px;')}>
                  {!or
                    ? 'Elegí la orientación del curso: las materias de ' + anioTxt + ' año cambian según la orientación.'
                    : 'El plan de estudios de ' + anioTxt + ' año (' + nombreOr + ') todavía no tiene materias cargadas. Cargalas primero desde Materias y después volvé a armar el curso.'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
