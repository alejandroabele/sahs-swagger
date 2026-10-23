// P2 · Mi grilla horaria. Prototipo: <template id="tpl-mihorario"> y DC.registrar("mihorario") en prototipo/index.html.
// Clases del profesor de la sesión en la propuesta vigente (VAL) del ciclo del año actual
// (planificacion.get_clases con id_profesor e id_propuesta), una grilla por turno, y las
// suplencias que cubre en la semana (profesor_suplencias.get_suplencias).
import type { Clase, Curso, FranjaHoraria, Turno } from '@sahs/contratos';
import { horarios, planificacion, profesorSuplencias } from '../api';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useConsulta } from '../estado/consultas';
import { useSesion } from '../estado/sesion';
import { css } from '../lib/css';
import { DIAS, fecha } from '../lib/formato';

const ALTO = 54;

/** Colores de cada curso (los tres primeros son los del diseño). */
const PALETA = [
  { color: '#3a6fd8', fondo: '#eaf0fb', borde: '#cfdcf5', texto: '#1e3f80' },
  { color: '#1f8f7a', fondo: '#e8f5f2', borde: '#c6e6df', texto: '#155e50' },
  { color: '#7a54c4', fondo: '#f3edfa', borde: '#ddd0ef', texto: '#4a2f80' },
  { color: '#c0612b', fondo: '#fbf0e8', borde: '#efd5c2', texto: '#7a3812' },
  { color: '#b0386a', fondo: '#fbecf2', borde: '#efcbda', texto: '#6f1d41' },
  { color: '#5b7a1f', fondo: '#f1f6e6', borde: '#d8e6bd', texto: '#3a5010' },
];
/** Estilo de las horas que cubre como suplente. */
const SUPLENCIA = { fondo: '#fdf1e3', borde: '#f0d3ae', texto: '#8a4b12' };

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Lunes y viernes de la semana actual (el sábado y el domingo muestran la semana siguiente). */
function semanaActual() {
  const d = new Date();
  const dow = d.getDay(); // 0 domingo
  const lunes = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (dow === 0 ? 1 : dow === 6 ? 2 : 1 - dow));
  const viernes = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 4);
  const texto =
    lunes.getMonth() === viernes.getMonth()
      ? `semana del ${lunes.getDate()} al ${viernes.getDate()} de ${MESES[viernes.getMonth()]}`
      : `semana del ${lunes.getDate()} de ${MESES[lunes.getMonth()]} al ${viernes.getDate()} de ${MESES[viernes.getMonth()]}`;
  return { desde: iso(lunes), hasta: iso(viernes), texto };
}


interface Celda {
  clase: Clase;
  suplencia: boolean;
  detalle: string;
}

export default function P2MiHorario() {
  const { profesor } = useSesion();
  const { ciclos } = useCiclo();
  const anio = new Date().getFullYear();
  const ciclo = ciclos.find((c) => c.anio_calendario === anio) ?? null;
  const idCiclo = ciclo?.id_ciclo_lectivo;
  const idProfesor = profesor?.id_profesor;
  const semana = semanaActual();

  const qProp = useConsulta(['planificacion', 'get_propuestas', { id_ciclo_lectivo: idCiclo }], () => planificacion.get_propuestas({ id_ciclo_lectivo: idCiclo }), {
    enabled: idCiclo != null,
  });
  const vigente = (qProp.data ?? []).find((p) => p.estado?.codigo === 'VAL') ?? null;
  const idProp = vigente?.id_propuesta;

  const qMias = useConsulta(['planificacion', 'get_clases', { id_profesor: idProfesor, id_propuesta: idProp }], () => planificacion.get_clases({ id_profesor: idProfesor, id_propuesta: idProp }), {
    enabled: idProfesor != null && idProp != null,
  });
  const qSup = useConsulta(
    ['profesor_suplencias', 'get_suplencias', { id_profesor: idProfesor, fecha_desde: semana.desde, fecha_hasta: semana.hasta }],
    () => profesorSuplencias.get_suplencias({ id_profesor: idProfesor, fecha_desde: semana.desde, fecha_hasta: semana.hasta }),
    { enabled: idProfesor != null },
  );
  const suplencias = qSup.data ?? [];
  // Las clases que cubre: se buscan en la propuesta vigente (la suplencia solo trae el resumen).
  const qTodas = useConsulta(['planificacion', 'get_clases', { id_propuesta: idProp }], () => planificacion.get_clases({ id_propuesta: idProp }), {
    enabled: idProp != null && suplencias.length > 0,
  });
  const qCursos = useConsulta(['planificacion', 'get_cursos', { id_ciclo_lectivo: idCiclo }], () => planificacion.get_cursos({ id_ciclo_lectivo: idCiclo }), {
    enabled: idCiclo != null,
  });
  const qTurnos = useConsulta(['horarios', 'get_turnos'], () => horarios.get_turnos());
  const qAnios = useConsulta(['planificacion', 'get_anios_academicos'], () => planificacion.get_anios_academicos());

  const cargando = qProp.isLoading || qMias.isLoading || qSup.isLoading || qCursos.isLoading || qAnios.isLoading || qTurnos.isLoading || qTodas.isLoading;
  const error = qProp.error ?? qMias.error ?? qSup.error ?? qCursos.error ?? qAnios.error ?? qTurnos.error ?? qTodas.error;

  const anios = new Map((qAnios.data ?? []).map((a) => [a.id_anio_academico, parseInt(a.anio_curricular, 10)]));
  /** Nombre del curso: "<n>° <división>", con n del año académico. */
  const nombreCurso = (c: Curso | undefined) => (c ? `${anios.get(c.id_anio_academico ?? -1) ?? '?'}° ${c.division}` : 'Curso');
  const cursos = new Map((qCursos.data ?? []).map((c) => [c.id_curso, c]));
  const mias = qMias.data ?? [];
  const idsMias = new Set(mias.map((c) => c.id_clase));
  const cubiertas: { clase: Clase; hasta: string }[] = [];
  for (const s of suplencias) {
    for (const id of s.ids_clases) {
      const cl = (qTodas.data ?? []).find((x) => x.id_clase === id);
      if (cl && !idsMias.has(id) && !cubiertas.some((x) => x.clase.id_clase === id)) cubiertas.push({ clase: cl, hasta: s.fecha_fin });
    }
  }

  // Colores por curso, en el orden en que aparecen.
  const idsCursos = [...new Set(mias.map((c) => c.id_curso))].sort((a, b) => nombreCurso(cursos.get(a)).localeCompare(nombreCurso(cursos.get(b))));
  const colorDe = (idCurso: number) => PALETA[Math.max(0, idsCursos.indexOf(idCurso)) % PALETA.length];
  const resumen = idsCursos.map((id) => ({
    id,
    nombre: nombreCurso(cursos.get(id)),
    horas: mias.filter((c) => c.id_curso === id).reduce((n, c) => n + (c.ids_franjas_horarias?.length ?? 0), 0),
    color: colorDe(id).color,
  }));

  // Una grilla por turno en el que da clase (o cubre una suplencia), del que empieza más temprano al más tarde.
  const todas = [...mias.map((c) => ({ clase: c, hasta: null as string | null })), ...cubiertas];
  const idsTurnos = new Set(todas.map((x) => cursos.get(x.clase.id_curso)?.id_turno).filter((x): x is number => x != null));
  const filasDe = (t: Turno): FranjaHoraria[] => {
    // Las filas salen del día con más franjas; las horas se comparan por la hora de inicio.
    const porDia = new Map<string, FranjaHoraria[]>();
    for (const f of t.franjas_horarias ?? []) {
      const d = f.dia_lectivo?.nombre_dia_lectivo ?? '';
      porDia.set(d, [...(porDia.get(d) ?? []), f]);
    }
    const base = [...porDia.values()].sort((a, b) => b.length - a.length)[0] ?? [];
    return [...base].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  };
  const grillas = (qTurnos.data ?? [])
    .filter((t) => idsTurnos.has(t.id_turno))
    .map((t) => ({ t, filas: filasDe(t) }))
    .filter((g) => g.filas.length > 0)
    .sort((a, b) => a.filas[0].hora_inicio.localeCompare(b.filas[0].hora_inicio))
    .map(({ t, filas }) => {
      const enTurno = todas.filter((x) => cursos.get(x.clase.id_curso)?.id_turno === t.id_turno);
      const nombres = [...new Set(enTurno.filter((x) => !x.hasta).map((x) => nombreCurso(cursos.get(x.clase.id_curso))))].sort();
      const horas = enTurno.filter((x) => !x.hasta).reduce((n, x) => n + (x.clase.ids_franjas_horarias?.length ?? 0), 0);
      const celda = (dia: string, inicio: string): Celda | null => {
        for (const x of enTurno) {
          if ((x.clase.franjas_horarias ?? []).some((f) => f.nombre_dia_lectivo === dia && f.hora_inicio === inicio)) {
            const curso = nombreCurso(cursos.get(x.clase.id_curso));
            if (x.hasta) return { clase: x.clase, suplencia: true, detalle: `${curso} · suplencia hasta ${fecha(x.hasta).slice(0, 5)}` };
            const otros = (x.clase.profesores ?? []).filter((p) => p.id_profesor !== idProfesor).map((p) => `${p.nombre} ${p.apellido}`);
            return { clase: x.clase, suplencia: false, detalle: curso + (otros.length ? ' · con ' + otros.join(', ') : '') };
          }
        }
        return null;
      };
      let n = 0;
      const filasVista = filas.map((f) => {
        const horario = `${f.hora_inicio} – ${f.hora_fin}`;
        if (f.es_recreo) return { id: f.id_franja_horaria, recreo: true, horario, hora: '', celdas: [] as (Celda | null)[] };
        n++;
        return { id: f.id_franja_horaria, recreo: false, horario, hora: `${n}ª hora`, celdas: DIAS.map((d) => celda(d, f.hora_inicio)) };
      });
      const cubre = enTurno.some((x) => x.hasta);
      return {
        id: t.id_turno,
        titulo: `Turno ${t.nombre} · ${filas[0].hora_inicio} a ${filas[filas.length - 1].hora_fin}`,
        sub: (nombres.length ? nombres.join(', ') + ' · ' : '') + `${horas} h cátedra · ${semana.texto}`,
        cubre,
        filas: filasVista,
      };
    });

  const aviso = (texto: string) => (
    <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 24px; font-size: 13px; color: #6b7482;')}>{texto}</div>
  );

  return (
    <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera conCiclo={false} />

      <div style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span>Ciclo lectivo {anio}</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span>{vigente ? `Grilla validada el ${fecha(vigente.fecha_modificacion)}` : 'Sin grilla validada'}</span>
          </div>
          <div style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Mi grilla horaria</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <div style={css('display: flex; align-items: center; gap: 16px; font-size: 12px; color: #6b7482;')}>
          {resumen.map((c) => (
            <span key={c.id} style={css('display: flex; align-items: center; gap: 7px;')}>
              <span style={css('width: 9px; height: 9px; border-radius: 3px; background: ' + c.color + ';')}></span>
              <span style={css('font-weight: 500; color: #4a5462;')}>{c.nombre}</span>
              <span className="mono">{c.horas} h</span>
            </span>
          ))}
        </div>
      </div>

      <div style={css('padding: 20px 28px 28px; display: flex; flex-direction: column; gap: 18px;')}>
        {!profesor ? (
          <div style={css('font-size: 12.5px; color: #a56a10; background: #fdf6ec; border: 1px solid #f1dfc0; border-radius: 8px; padding: 12px 14px;')}>
            Tu usuario no está vinculado a ningún profesor, así que no hay grilla para mostrar. El vínculo se asigna desde la ficha del profesor.
          </div>
        ) : !ciclos.length || cargando ? (
          <Cargando />
        ) : error ? (
          <MensajeError mensaje={error.message} />
        ) : !ciclo ? (
          aviso(`No hay un ciclo lectivo ${anio} cargado.`)
        ) : !vigente ? (
          aviso(`El ciclo lectivo ${anio} todavía no tiene una planificación validada.`)
        ) : grillas.length === 0 ? (
          aviso('No tenés clases asignadas en este ciclo.')
        ) : (
          grillas.map((g) => (
            <div key={g.id} style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
              <div style={css('display: flex; align-items: center; gap: 14px; padding: 14px 20px; border-bottom: 1px solid #eef1f5;')}>
                <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
                  <div style={css('font-size: 13px; font-weight: 600;')}>{g.titulo}</div>
                  <div style={css('font-size: 11.5px; color: #6b7482;')}>{g.sub}</div>
                </div>
                <div style={css('flex-grow: 1;')}></div>
                <div style={css('display: flex; align-items: center; gap: 16px; font-size: 11.5px; color: #6b7482;')}>
                  <span style={css('display: flex; align-items: center; gap: 6px;')}>
                    <span style={css('width: 12px; height: 12px; border-radius: 4px; background: #eaf0fb; border: 1px solid #cfdcf5;')}></span>Clase asignada
                  </span>
                  {g.cubre && (
                    <span style={css('display: flex; align-items: center; gap: 6px;')}>
                      <span style={css(`width: 12px; height: 12px; border-radius: 4px; background: ${SUPLENCIA.fondo}; border: 1px solid ${SUPLENCIA.borde};`)}></span>Suplencia
                    </span>
                  )}
                  <span style={css('display: flex; align-items: center; gap: 6px;')}>
                    <span style={css('width: 12px; height: 12px; border-radius: 4px; background: #fcfdfe; border: 1px dashed #d6dce4;')}></span>Hora libre
                  </span>
                  <span style={css('display: flex; align-items: center; gap: 6px;')}>
                    <span style={css('width: 12px; height: 12px; border-radius: 4px; background: #f4f1ea; border: 1px solid #ebe4d4;')}></span>Recreo
                  </span>
                </div>
              </div>

              <div style={css('padding: 18px 20px 24px;')}>
                <div style={css('display: grid; grid-template-columns: 120px repeat(5, minmax(0, 1fr)); gap: 6px; margin-bottom: 8px;')}>
                  <div></div>
                  {DIAS.map((d) => (
                    <div key={d} style={css('font-size: 12.5px; font-weight: 500; color: #4a5462; text-align: center;')}>
                      {d}
                    </div>
                  ))}
                </div>
                {g.filas.map((row) =>
                  row.recreo ? (
                    <div key={row.id} style={css('display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 6px; margin-bottom: 6px;')}>
                      <div className="mono" style={css('font-size: 11px; color: #a8b0bb;')}>
                        {row.horario}
                      </div>
                      <div style={css('height: 22px; border-radius: 6px; background: #f4f1ea; border: 1px solid #ebe4d4; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 500; color: #8a7a5a;')}>
                        Recreo
                      </div>
                    </div>
                  ) : (
                    <div key={row.id} style={css('display: grid; grid-template-columns: 120px repeat(5, minmax(0, 1fr)); gap: 6px; margin-bottom: 6px;')}>
                      <div style={css('display: flex; flex-direction: column; justify-content: center; gap: 2px;')}>
                        <span style={css('font-size: 12px; font-weight: 500; color: #4a5462;')}>{row.hora}</span>
                        <span className="mono" style={css('font-size: 11px; color: #7a8393;')}>
                          {row.horario}
                        </span>
                      </div>
                      {row.celdas.map((c, i) => {
                        if (!c)
                          return (
                            <div
                              key={i}
                              style={css(
                                'height: ' + ALTO + 'px; border-radius: 7px; border: 1px dashed #d6dce4; background: #fcfdfe; display: flex; flex-direction: column; justify-content: center; padding: 0 10px; overflow: hidden;',
                              )}
                            ></div>
                          );
                        const cu = c.suplencia ? SUPLENCIA : colorDe(c.clase.id_curso);
                        return (
                          <div
                            key={i}
                            title={c.clase.descripcion ?? undefined}
                            style={css(
                              'height: ' +
                                ALTO +
                                'px; border-radius: 7px; display: flex; flex-direction: column; justify-content: center; gap: 3px; padding: 0 10px; overflow: hidden;' +
                                ' background: ' +
                                cu.fondo +
                                '; border: 1px solid ' +
                                cu.borde +
                                ';',
                            )}
                          >
                            <span style={css('font-size: 12.5px; font-weight: 600; color: ' + cu.texto + '; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;')}>
                              {c.clase.materia?.nombre_materia ?? c.clase.codigo}
                            </span>
                            <span style={css('font-size: 11px; color: ' + cu.texto + '; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>{c.detalle}</span>
                          </div>
                        );
                      })}
                    </div>
                  ),
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
