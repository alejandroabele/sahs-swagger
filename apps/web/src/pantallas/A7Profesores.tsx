// A7 · Profesores. Prototipo: <template id="tpl-profesoreslistado"> y DC.registrar("profesoreslistado") en prototipo/index.html.
// Listado de profesores (get_profesores) con su área (la de sus materias habilitadas), las horas que dicta
// en la propuesta vigente del ciclo activo y las franjas que declaró. Cada fila abre la ficha (A9).
import { useMemo, useState } from 'react';
import type { Materia } from '@sahs/contratos';
import { horarios, orientacion, planificacion, profesorSuplencias } from '../api';
import { useNavegar } from '../app/navegar';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useConsulta } from '../estado/consultas';
import { css } from '../lib/css';
import { iniciales } from '../lib/formato';
import { ACCENT, areaDeProfesor, colorArea, franjasDeclaradas, horasDelTurno, propuestaVigente, turnoPrincipal } from './a7/comun';

const COLS = 'display: grid; grid-template-columns: 1fr 100px 168px 200px 92px 96px 28px; gap: 12px;';

export default function A7Profesores() {
  const ir = useNavegar();
  const { activo } = useCiclo();
  const idCiclo = activo?.id_ciclo_lectivo;
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<string>('todas');
  const [sobre, setSobre] = useState<number | null>(null);

  const qProf = useConsulta(['profesor_suplencias', 'get_profesores'], () => profesorSuplencias.get_profesores());
  const qMat = useConsulta(['orientacion', 'get_materias'], () => orientacion.get_materias());
  const qAreas = useConsulta(['orientacion', 'get_areas'], () => orientacion.get_areas());
  const qTurnos = useConsulta(['horarios', 'get_turnos'], () => horarios.get_turnos());
  const qProp = useConsulta(['planificacion', 'get_propuestas', idCiclo], () => planificacion.get_propuestas({ id_ciclo_lectivo: idCiclo }), {
    enabled: !!idCiclo,
  });
  const vigente = propuestaVigente(qProp.data);
  const qClases = useConsulta(['planificacion', 'get_clases', 'propuesta', vigente?.id_propuesta], () => planificacion.get_clases({ id_propuesta: vigente!.id_propuesta }), {
    enabled: !!vigente,
  });

  const materias = useMemo(() => new Map<number, Materia>((qMat.data ?? []).map((m) => [m.id_materia, m])), [qMat.data]);

  // Horas asignadas: franjas de las clases de la propuesta vigente en las que figura cada profesor.
  const horasPorProfesor = useMemo(() => {
    const h = new Map<number, number>();
    for (const c of qClases.data ?? []) {
      const n = c.ids_franjas_horarias?.length ?? c.franjas_horarias?.length ?? 0;
      for (const id of c.ids_profesores ?? []) h.set(id, (h.get(id) ?? 0) + n);
    }
    return h;
  }, [qClases.data]);

  const profesores = useMemo(
    () =>
      (qProf.data ?? []).map((p) => {
        const turno = turnoPrincipal(p, qTurnos.data);
        const habilitadas: string[] = [];
        for (const m of p.lista_materias_habilitadas ?? []) if (m.nombre_materia && !habilitadas.includes(m.nombre_materia)) habilitadas.push(m.nombre_materia);
        return {
          p,
          area: areaDeProfesor(p, materias),
          habilitadas,
          horas: horasPorProfesor.get(p.id_profesor) ?? 0,
          franjas: franjasDeclaradas(p),
          totalTurno: horasDelTurno(turno),
        };
      }),
    [qProf.data, qTurnos.data, materias, horasPorProfesor],
  );

  const areas = qAreas.data ?? [];
  const filtros = [{ id: 'todas', label: 'Todas' }].concat(
    areas.map((a) => ({ id: a.nombre_area, label: a.nombre_area === 'Lengua y Literatura' ? 'Lengua' : a.nombre_area })),
  );

  const texto = busqueda.trim().toLowerCase();
  const visibles = profesores.filter(({ p, area }) => {
    const porArea = filtro === 'todas' || area === filtro;
    const porTexto =
      texto === '' ||
      p.apellido.toLowerCase().includes(texto) ||
      p.nombre.toLowerCase().includes(texto) ||
      (p.legajo ?? '').toLowerCase().includes(texto) ||
      p.documento.includes(texto) ||
      p.documento.replace(/\D/g, '').includes(texto);
    return porArea && porTexto;
  });

  const resumen = visibles.length === profesores.length ? `${profesores.length} profesores` : `${visibles.length} de ${profesores.length} profesores`;
  const seleccionado = profesores.find((x) => x.p.id_profesor === sobre)?.p ?? null;
  const error = qProf.error ?? qMat.error ?? qAreas.error ?? qTurnos.error ?? qProp.error ?? qClases.error;

  return (
    <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir('A1')} style={css('cursor: pointer;')}>Inicio</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span style={css('color: #14181f; font-weight: 500;')}>Profesores</span>
          </div>
          <div style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Profesores de la institución</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <button
          onClick={() => ir('A8')}
          style={css(`display: flex; align-items: center; gap: 9px; height: 40px; padding: 0 17px; border-radius: 8px; border: none; background: ${ACCENT}; color: #fff; font-size: 13px; font-weight: 600;`)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          Nuevo profesor
        </button>
      </div>

      <div style={css('padding: 20px 28px 28px;')}>
        {error && (
          <div style={css('margin-bottom: 14px;')}>
            <MensajeError mensaje={error.message} />
          </div>
        )}
        <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
          <div style={css('display: flex; align-items: center; gap: 14px; padding: 15px 20px; border-bottom: 1px solid #eef1f5;')}>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por apellido, legajo o documento"
              style={css('width: 310px; box-sizing: border-box; height: 34px; padding: 0 12px; border-radius: 7px; border: 1px solid #dfe4ea; font-size: 12.5px; background: #fcfdfe;')}
            />
            <div style={css('flex-grow: 1;')}></div>
            <span style={css('font-size: 12px; color: #6b7482;')}>{resumen}</span>
            <div style={css('display: flex; gap: 2px;')}>
              {filtros.map((o, i) => {
                const act = filtro === o.id;
                const estilo =
                  'height: 30px; padding: 0 12px; font-size: 12px; font-weight: 500;' +
                  ' border: 1px solid ' + (act ? '#14181f' : '#e2e6ec') + ';' +
                  ' background: ' + (act ? '#14181f' : '#fff') + '; color: ' + (act ? '#fff' : '#4a5462') + ';' +
                  ' border-radius: ' + (i === 0 ? '7px 0 0 7px' : i === filtros.length - 1 ? '0 7px 7px 0' : '0') + ';' +
                  (i > 0 ? ' margin-left: -1px;' : '');
                return (
                  <button key={o.id} onClick={() => setFiltro(o.id)} style={css(estilo)}>
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={css(COLS + ' padding: 10px 20px; background: #fafbfc; border-bottom: 1px solid #eef1f5;')}>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Profesor</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Legajo</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Área</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Habilitado en</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393; text-align: right;')}>Asignadas</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393; text-align: right;')}>Declaradas</div>
            <div></div>
          </div>

          <div>
            {qProf.isLoading && <Cargando />}
            {!qProf.isLoading && visibles.length === 0 && (
              <div style={css('padding: 22px 20px; font-size: 12.5px; color: #6b7482; border-top: 1px solid #f2f4f7;')}>
                {profesores.length === 0 ? 'No hay profesores cargados.' : 'Ningún profesor coincide con la búsqueda.'}
              </div>
            )}
            {visibles.map(({ p, area, habilitadas, horas, franjas, totalTurno }) => {
              const activa = sobre === p.id_profesor;
              const ar = colorArea(area);
              const margen = franjas - horas;
              return (
                <button
                  key={p.id_profesor}
                  onClick={() => ir('A9', { id_profesor: p.id_profesor })}
                  onMouseEnter={() => setSobre(p.id_profesor)}
                  onMouseLeave={() => setSobre(null)}
                  style={css(
                    COLS +
                      ' width: 100%; padding: 12px 20px; border: none; border-top: 1px solid #f2f4f7; text-align: left;' +
                      ' background: ' + (activa ? '#f3f6fc' : '#fff') + ';' +
                      (activa ? ' box-shadow: inset 3px 0 0 ' + ACCENT + ';' : ''),
                  )}
                >
                  <span style={css('display: flex; align-items: center; gap: 11px; min-width: 0; padding-right: 12px;')}>
                    <span
                      style={css(
                        'width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600;' +
                          ' background: ' + (activa ? ACCENT : '#eef1f5') + '; color: ' + (activa ? '#fff' : '#5b6471') + ';',
                      )}
                    >
                      {iniciales(p.nombre, p.apellido)}
                    </span>
                    <span style={css('display: flex; flex-direction: column; gap: 2px; min-width: 0; text-align: left;')}>
                      <span style={css('font-size: 13.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>
                        {p.apellido}, {p.nombre}
                      </span>
                      <span style={css('font-size: 11.5px; color: #8b95a5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>{p.correo_electronico ?? ''}</span>
                    </span>
                  </span>
                  <span className="mono" style={css('font-size: 12.5px; color: #4a5462; align-self: center; text-align: left;')}>
                    {p.legajo || '—'}
                  </span>
                  <span style={css('align-self: center; text-align: left;')}>
                    <span style={css('font-size: 11.5px; font-weight: 500; padding: 4px 10px; border-radius: 13px; background: ' + ar.fondo + '; color: ' + ar.texto + ';')}>
                      {area ? (area === 'Lengua y Literatura' ? 'Lengua y Lit.' : area) : 'Sin área'}
                    </span>
                  </span>
                  <span style={css('font-size: 12.5px; color: #6b7482; align-self: center; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 10px;')}>
                    {habilitadas.length ? habilitadas.join(', ') : 'Ninguna'}
                  </span>
                  <span
                    className="mono"
                    style={css('font-size: 12.5px; align-self: center; text-align: right; color: ' + (margen < 4 ? '#8a4b12' : '#4a5462') + ';' + (margen < 4 ? ' font-weight: 600;' : ''))}
                  >
                    {horas} h
                  </span>
                  <span className="mono" style={css('font-size: 12.5px; color: #6b7482; align-self: center; text-align: right;')}>
                    {franjas} / {totalTurno}
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

          <div style={css('display: flex; align-items: center; gap: 10px; padding: 13px 20px; border-top: 1px solid #eef1f5; background: ' + (seleccionado ? '#f3f6fc' : '#fafbfc') + ';')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={seleccionado ? ACCENT : '#8b95a5'} strokeWidth="2" strokeLinecap="round" style={css('flex-shrink: 0;')}>
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 11.5v5M12 8v.5"></path>
            </svg>
            <span style={css('font-size: 12.5px; color: ' + (seleccionado ? '#2c4570' : '#6b7482') + '; line-height: 1.5;')}>
              {seleccionado
                ? `${seleccionado.apellido}, ${seleccionado.nombre} — se abre en la ficha, con sus datos, su disponibilidad declarada y las materias que tiene asignadas.`
                : 'Hacé clic en cualquier profesor para abrir su ficha. Las horas en ámbar marcan a quienes tienen poco margen entre lo que declararon y lo que ya dictan.' +
                  (idCiclo && qProp.data && !vigente ? ' El ciclo elegido todavía no tiene una planificación validada: las horas asignadas figuran en 0.' : '')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
