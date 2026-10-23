// A12 · Planificaciones. Prototipo: <template id="tpl-planificaciones"> y DC.registrar("planificaciones") en prototipo/index.html.
// Propuestas del ciclo activo (get_propuestas) con su estado, su avance (horas ubicadas en sus clases
// contra las horas de los cursos del ciclo) y la vigente (la Validada). Desde acá se cambia el estado
// (asignar_estado_a_propuesta), se crea una nueva vacía o a partir de otra (crear_propuesta + copia de
// sus clases con crear_clase y asignar_clase_a_propuesta) y se abre cada una en A13.
import { useState } from 'react';
import type { Clase, Curso, EstadoPropuesta, Propuesta } from '@sahs/contratos';
import { planificacion } from '../api';
import { mensajeDeError } from '../api/http';
import { useNavegar } from '../app/navegar';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useAccion, useConsulta, useInvalidar } from '../estado/consultas';
import { css } from '../lib/css';
import { fecha } from '../lib/formato';

const ACCENT = '#2f5fd0';

const ESTADOS: Record<string, { nombre: string; fondo: string; texto: string; punto: string; desc: string }> = {
  BOR: { nombre: 'Borrador', fondo: '#fdf6ec', texto: '#a56a10', punto: '#c08430', desc: 'Se está armando. Es el único estado editable.' },
  REV: { nombre: 'En revisión', fondo: '#eef3fc', texto: '#1e4099', punto: '#3a6fd8', desc: 'Completa y esperando que Dirección la apruebe.' },
  VAL: { nombre: 'Validada', fondo: '#e9f2ec', texto: '#2f6b45', punto: '#2f6b45', desc: 'Aprobada por Dirección. La que está en uso es la vigente.' },
  CER: { nombre: 'Cerrada', fondo: '#f2f4f7', texto: '#7a8393', punto: '#8b95a5', desc: 'De un ciclo terminado. Queda como histórico.' },
};

/** Pasos posibles desde cada estado (los mismos que controla la API). */
const PASOS: Record<string, { destino: string; texto: string; titulo: string }[]> = {
  BOR: [{ destino: 'REV', texto: 'A revisión', titulo: 'Enviar a revisión: queda completa y esperando que Dirección la apruebe' }],
  REV: [
    { destino: 'BOR', texto: 'A borrador', titulo: 'Volver a borrador para seguir editándola' },
    { destino: 'VAL', texto: 'Validar', titulo: 'Validar: pasa a ser la vigente del ciclo' },
  ],
  VAL: [{ destino: 'CER', texto: 'Cerrar', titulo: 'Cerrar: queda como histórico' }],
  CER: [],
};

const COLS = 'display: grid; grid-template-columns: 1fr 120px 80px 230px 150px 300px; gap: 12px;';
const BOTON = 'height: 30px; padding: 0 11px; border-radius: 7px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 11.5px; font-weight: 500; white-space: nowrap;';

/** Horas ubicadas: franjas de cada clase, sin pasarse de las horas de la materia en su curso. */
function horasUbicadas(clases: Clase[], cursos: Curso[]): number {
  let n = 0;
  for (const c of clases) {
    const franjas = (c.ids_franjas_horarias ?? c.franjas_horarias?.map((f) => f.id_franja_horaria) ?? []).length;
    const curso = cursos.find((x) => x.id_curso === c.id_curso);
    const horas = curso?.materias?.find((m) => m.id_materia === c.id_materia)?.horas_semanales ?? franjas;
    n += Math.min(franjas, horas);
  }
  return n;
}

/** Siguiente código libre PLAN-<año>-NN. */
function siguienteCodigo(anio: number, propuestas: Propuesta[]): string {
  const re = new RegExp('^PLAN-' + anio + '-(\\d+)$');
  const max = propuestas.reduce((m, p) => {
    const r = re.exec(p.codigo);
    return r ? Math.max(m, Number(r[1])) : m;
  }, 0);
  return 'PLAN-' + anio + '-' + String(max + 1).padStart(2, '0');
}

/** Código de la clase copiada: "2026-01-1B-MAT" → "2026-03-1B-MAT" para PLAN-2026-03. */
function codigoClaseCopia(viejo: string, nuevoPlan: string): string {
  const base = nuevoPlan.replace(/^PLAN-/, '');
  const p = viejo.split('-');
  return p.length > 2 && /^\d{4}$/.test(p[0]) ? base + '-' + p.slice(2).join('-') : base + '-' + viejo;
}

interface Confirmacion {
  propuesta: Propuesta;
  destino: string;
  texto: string;
}

export default function A12Planificaciones() {
  const ciclo = useCiclo();
  const ir = useNavegar();
  const invalidar = useInvalidar();
  const idCiclo = ciclo.activo?.id_ciclo_lectivo ?? null;
  const anio = ciclo.activo?.anio_calendario ?? null;

  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<Confirmacion | null>(null);
  const [progreso, setProgreso] = useState<string | null>(null);

  const qProp = useConsulta(['planificacion', 'get_propuestas', idCiclo], () => planificacion.get_propuestas({ id_ciclo_lectivo: idCiclo! }), {
    enabled: !!idCiclo,
  });
  const qTodas = useConsulta(['planificacion', 'get_propuestas'], () => planificacion.get_propuestas());
  const qCursos = useConsulta(['planificacion', 'get_cursos', idCiclo], () => planificacion.get_cursos({ id_ciclo_lectivo: idCiclo! }), {
    enabled: !!idCiclo,
  });
  const qEstados = useConsulta(['planificacion', 'get_posibles_estados_de_propuestas'], () => planificacion.get_posibles_estados_de_propuestas());

  const cambiarEstado = useAccion((id: number, idEstado: number) => planificacion.asignar_estado_a_propuesta(id, { id_estado: idEstado }), ['planificacion']);

  const visibles = [...(qProp.data ?? [])].sort((a, b) => b.codigo.localeCompare(a.codigo));
  const cursos = qCursos.data ?? [];
  const totalHoras = cursos.reduce((s, c) => s + (c.materias ?? []).reduce((t, m) => t + m.horas_semanales, 0), 0);
  const vigente = visibles.find((p) => p.estado?.codigo === 'VAL') ?? null;
  const ocupado = cambiarEstado.enCurso || progreso != null;

  const limpiar = () => {
    setAviso(null);
    setError(null);
    setConfirmar(null);
    cambiarEstado.limpiarError();
  };

  async function aplicarEstado(p: Propuesta, destino: string) {
    const est = (qEstados.data ?? []).find((e: EstadoPropuesta) => e.codigo === destino);
    setConfirmar(null);
    if (!est) {
      setError('No se encontró el estado ' + destino + ' en la API.');
      return;
    }
    const r = await cambiarEstado.ejecutar(p.id_propuesta, est.id_estado);
    if (r) {
      setAviso(
        p.codigo +
          ' pasó a ' +
          est.nombre +
          '.' +
          (destino === 'VAL' && vigente && vigente.id_propuesta !== p.id_propuesta ? ' ' + vigente.codigo + ' quedó cerrada y ' + p.codigo + ' es la vigente.' : ''),
      );
    }
  }

  function pedirEstado(p: Propuesta, destino: string) {
    limpiar();
    if (destino === 'VAL' && vigente && vigente.id_propuesta !== p.id_propuesta) {
      setConfirmar({ propuesta: p, destino, texto: 'Al validar ' + p.codigo + ', ' + vigente.codigo + ' (la vigente) pasa a Cerrada. ¿Validarla?' });
    } else if (destino === 'CER') {
      setConfirmar({ propuesta: p, destino, texto: 'Cerrar ' + p.codigo + ' la deja como histórico y el ciclo se queda sin planificación vigente. ¿Cerrarla?' });
    } else {
      void aplicarEstado(p, destino);
    }
  }

  /** Crea una propuesta en Borrador; si hay origen, copia sus clases una por una. */
  async function nueva(origen: Propuesta | null) {
    if (!idCiclo || anio == null) return;
    limpiar();
    const codigo = siguienteCodigo(anio, qTodas.data ?? visibles);
    setProgreso(origen ? 'Creando ' + codigo + ' a partir de ' + origen.codigo + '…' : 'Creando ' + codigo + '…');
    try {
      const p = await planificacion.crear_propuesta({
        nombre: origen ? 'Planificación ' + anio + ' (a partir de ' + origen.codigo + ')' : 'Planificación ' + anio,
        descripcion_propuesta: origen ? 'Creada a partir de ' + origen.codigo : 'Creada desde cero',
        codigo,
        id_ciclo_lectivo: idCiclo,
      });
      if (!origen) {
        setAviso(p.codigo + ' se creó vacía. Hay que armar la grilla de cada curso desde cero.');
        return;
      }
      const clases = await planificacion.get_clases({ id_propuesta: origen.id_propuesta });
      const fallas: string[] = [];
      for (let i = 0; i < clases.length; i++) {
        const c = clases[i];
        setProgreso('Copiando la clase ' + (i + 1) + ' de ' + clases.length + ' a ' + p.codigo + '…');
        let nuevaClase: Clase | null = null;
        try {
          nuevaClase = await planificacion.crear_clase({
            codigo: codigoClaseCopia(c.codigo, p.codigo),
            descripcion: c.descripcion,
            id_curso: c.id_curso,
            id_materia: c.id_materia,
            ids_franjas_horarias: c.ids_franjas_horarias ?? (c.franjas_horarias ?? []).map((f) => f.id_franja_horaria).filter((x): x is number => x != null),
            ids_profesores: c.ids_profesores ?? (c.profesores ?? []).map((x) => x.id_profesor).filter((x): x is number => x != null),
          });
          await planificacion.asignar_clase_a_propuesta(p.id_propuesta, { id_clase: nuevaClase.id_clase });
        } catch (e) {
          fallas.push((c.descripcion || c.codigo) + ': ' + mensajeDeError(e));
          // Si la clase se creó pero no entró en la propuesta, no se deja suelta.
          if (nuevaClase) await planificacion.eliminar_clase(nuevaClase.id_clase).catch(() => undefined);
        }
      }
      const copiadas = clases.length - fallas.length;
      setAviso(
        p.codigo +
          ' se creó a partir de ' +
          origen.codigo +
          ', copiando ' +
          copiadas +
          ' de sus ' +
          clases.length +
          ' clases. Queda en borrador: los cambios que hagas ahí no afectan a ' +
          origen.codigo +
          '.',
      );
      if (fallas.length) {
        setError(
          (fallas.length === 1 ? '1 clase no se copió' : fallas.length + ' clases no se copiaron') +
            ' (por ejemplo, porque cambió la disponibilidad de un docente). ' +
            fallas.slice(0, 4).join(' · ') +
            (fallas.length > 4 ? ' · …' : ''),
        );
      }
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setProgreso(null);
      await invalidar('planificacion', 'orientacion');
    }
  }

  const cargando = !ciclo.activo || qProp.isLoading || qCursos.isLoading;
  const errorCarga = qProp.error ?? qCursos.error ?? qEstados.error;

  return (
    <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir('A1')} style={css('cursor: pointer;')}>
              Inicio
            </span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span style={css('color: #14181f; font-weight: 500;')}>Planificación anual</span>
          </div>
          <div style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Planificaciones</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <button
          onClick={() => nueva(null)}
          disabled={ocupado || !idCiclo}
          title={'Crea ' + (anio != null ? siguienteCodigo(anio, qTodas.data ?? visibles) : 'una planificación') + ' vacía, en borrador'}
          style={css(
            'display: flex; align-items: center; gap: 9px; height: 40px; padding: 0 17px; border-radius: 8px; border: none; background: ' +
              ACCENT +
              '; color: #fff; font-size: 13px; font-weight: 600;' +
              (ocupado ? ' opacity: 0.6;' : ''),
          )}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          Nueva planificación
        </button>
      </div>

      <div style={css('padding: 20px 28px 28px; display: flex; flex-direction: column; gap: 16px;')}>
        {errorCarga && <MensajeError mensaje={errorCarga.message} />}
        <MensajeError mensaje={error ?? cambiarEstado.error} alCerrar={() => {
            setError(null);
            cambiarEstado.limpiarError();
          }} />

        {progreso && (
          <div style={css('display: flex; align-items: center; gap: 11px; padding: 14px 16px; border-radius: 10px; background: #f3f6fc; border: 1px solid #cfdcf5;')}>
            <span style={css('font-size: 12.5px; color: #2c4570; line-height: 1.55;')}>{progreso}</span>
          </div>
        )}

        {confirmar && (
          <div style={css('display: flex; align-items: center; gap: 11px; padding: 12px 16px; border-radius: 10px; background: #fdf6ec; border: 1px solid #f1dfc0;')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a56a10" strokeWidth="2" strokeLinecap="round" style={css('flex-shrink: 0;')}>
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 7.5v5.5M12 16v.5"></path>
            </svg>
            <span style={css('font-size: 12.5px; color: #7a4f0c; line-height: 1.55; flex-grow: 1;')}>{confirmar.texto}</span>
            <button onClick={() => setConfirmar(null)} style={css(BOTON)}>
              Cancelar
            </button>
            <button
              onClick={() => aplicarEstado(confirmar.propuesta, confirmar.destino)}
              style={css('height: 30px; padding: 0 13px; border-radius: 7px; font-size: 11.5px; font-weight: 600; border: none; background: ' + ACCENT + '; color: #fff;')}
            >
              {confirmar.destino === 'VAL' ? 'Validar' : 'Cerrar'}
            </button>
          </div>
        )}

        {aviso && (
          <div style={css('display: flex; align-items: flex-start; gap: 11px; padding: 14px 16px; border-radius: 10px; background: #ecf5ef; border: 1px solid #c2e0cd;')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2f6b45" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0; margin-top: 1px;')}>
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
            <span style={css('font-size: 12.5px; color: #2f6b45; line-height: 1.55;')}>{aviso}</span>
          </div>
        )}

        <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
          <div style={css('display: flex; align-items: center; gap: 14px; padding: 15px 20px; border-bottom: 1px solid #eef1f5;')}>
            <span style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Ciclo lectivo</span>
            <div style={css('display: flex; gap: 2px;')}>
              {ciclo.ciclos.map((c, i) => {
                const activo = anio === c.anio_calendario;
                const n = ciclo.ciclos.length;
                return (
                  <button
                    key={c.id_ciclo_lectivo}
                    onClick={() => {
                      ciclo.fijar(c.anio_calendario);
                      limpiar();
                    }}
                    style={css(
                      'height: 30px; padding: 0 14px; font-size: 12px; font-weight: 500;' +
                        ' border: 1px solid ' +
                        (activo ? '#14181f' : '#e2e6ec') +
                        ';' +
                        ' background: ' +
                        (activo ? '#14181f' : '#fff') +
                        '; color: ' +
                        (activo ? '#fff' : '#4a5462') +
                        ';' +
                        ' border-radius: ' +
                        (n === 1 ? '7px' : i === 0 ? '7px 0 0 7px' : i === n - 1 ? '0 7px 7px 0' : '0') +
                        ';' +
                        (i > 0 ? ' margin-left: -1px;' : ''),
                    )}
                  >
                    {c.anio_calendario}
                  </button>
                );
              })}
            </div>
            <div style={css('flex-grow: 1;')}></div>
            <span style={css('font-size: 12px; color: #6b7482;')}>
              {cargando
                ? '…'
                : visibles.length === 0
                  ? 'Todavía no hay planificaciones en ' + (anio ?? '')
                  : visibles.length === 1
                    ? '1 planificación'
                    : visibles.length + ' planificaciones'}
            </span>
          </div>

          <div style={css(COLS + ' padding: 10px 20px; background: #fafbfc; border-bottom: 1px solid #eef1f5;')}>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Planificación</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Estado</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393; text-align: right;')}>Cursos</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Avance</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Última modificación</div>
            <div></div>
          </div>

          {cargando && <Cargando />}
          {!cargando &&
            visibles.map((p, i) => (
              <FilaPropuesta
                key={p.id_propuesta}
                p={p}
                primera={i === 0}
                cursos={cursos}
                totalHoras={totalHoras}
                ocupado={ocupado}
                alAbrir={() => ir('A13', { id_propuesta: p.id_propuesta })}
                alDuplicar={() => nueva(p)}
                alCambiar={(destino) => pedirEstado(p, destino)}
              />
            ))}
        </div>

        <div style={css('display: flex; gap: 16px;')}>
          <div style={css('flex-grow: 1; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 18px 20px;')}>
            <div style={css('font-size: 13px; font-weight: 600; margin-bottom: 12px;')}>Qué incluye una planificación</div>
            <div style={css('font-size: 12.5px; color: #6b7482; line-height: 1.65; max-width: 620px;')}>
              Una planificación agrupa la grilla de <b style={css('color: #14181f;')}>todos los cursos del ciclo</b> en un solo documento con su número y su estado. Se arma
              entera en borrador, se envía a revisión completa y Dirección la valida como una unidad: no se aprueba curso por curso, porque un cambio en uno puede dejar sin
              profesor a otro.
            </div>
          </div>
          <div style={css('width: 320px; flex-shrink: 0; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 18px 20px;')}>
            <div style={css('font-size: 13px; font-weight: 600; margin-bottom: 12px;')}>Estados</div>
            <div style={css('display: flex; flex-direction: column; gap: 10px;')}>
              {['BOR', 'REV', 'VAL', 'CER'].map((k) => {
                const e = ESTADOS[k];
                return (
                  <div key={k} style={css('display: flex; align-items: flex-start; gap: 9px;')}>
                    <span style={css('width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; margin-top: 4px;' + ' background: ' + e.punto + ';')}></span>
                    <span style={css('display: flex; flex-direction: column; gap: 1px;')}>
                      <span style={css('font-size: 12px; font-weight: 600;')}>{e.nombre}</span>
                      <span style={css('font-size: 11.5px; color: #8b95a5; line-height: 1.45;')}>{e.desc}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Una fila del listado: trae las clases de la propuesta para calcular cursos y avance. */
function FilaPropuesta(props: {
  p: Propuesta;
  primera: boolean;
  cursos: Curso[];
  totalHoras: number;
  ocupado: boolean;
  alAbrir: () => void;
  alDuplicar: () => void;
  alCambiar: (destino: string) => void;
}) {
  const { p, cursos, totalHoras } = props;
  const q = useConsulta(['planificacion', 'get_clases', { id_propuesta: p.id_propuesta }], () => planificacion.get_clases({ id_propuesta: p.id_propuesta }));
  const clases = q.data ?? [];
  const codigo = p.estado?.codigo ?? 'BOR';
  const e = ESTADOS[codigo] ?? ESTADOS.CER;
  const hechas = horasUbicadas(clases, cursos);
  const pct = totalHoras ? Math.min(100, Math.round((hechas / totalHoras) * 100)) : 0;
  const nCursos = new Set(clases.map((c) => c.id_curso)).size;
  const editable = codigo === 'BOR';
  const origen = p.descripcion_propuesta ? p.nombre + ' · ' + p.descripcion_propuesta : p.nombre;

  return (
    <div style={css(COLS + ' padding: 14px 20px;' + (props.primera ? '' : ' border-top: 1px solid #f2f4f7;'))}>
      <div style={css('display: flex; flex-direction: column; gap: 3px; min-width: 0; padding-right: 12px;')}>
        <div style={css('display: flex; align-items: center; gap: 8px;')}>
          <span className="mono" style={css('font-size: 13.5px; font-weight: 600;')}>
            {p.codigo}
          </span>
          {codigo === 'VAL' && (
            <span style={css('font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 9px; background: #14181f; color: #fff; letter-spacing: 0.03em;')}>VIGENTE</span>
          )}
        </div>
        <div style={css('font-size: 11.5px; color: #8b95a5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')} title={origen}>
          {origen}
        </div>
      </div>
      <div style={css('align-self: center;')}>
        <span style={css('font-size: 11.5px; font-weight: 600; padding: 4px 11px; border-radius: 13px;' + ' background: ' + e.fondo + '; color: ' + e.texto + ';')}>
          {p.estado?.nombre ?? e.nombre}
        </span>
      </div>
      <div className="mono" style={css('font-size: 12.5px; color: #4a5462; align-self: center; text-align: right;')}>
        {q.isLoading ? '…' : nCursos}
      </div>
      <div style={css('align-self: center; display: flex; align-items: center; gap: 10px; padding-right: 14px;')}>
        <span style={css('flex-grow: 1; height: 6px; border-radius: 3px; background: #eef1f5; overflow: hidden;')}>
          <span style={css('display: block; height: 6px; width: ' + pct + '%;' + ' background: ' + (pct === 100 ? '#2f6b45' : ACCENT) + ';')}></span>
        </span>
        <span className="mono" style={css('font-size: 11.5px; color: #6b7482; flex-shrink: 0;')}>
          {q.isLoading ? '…' : hechas + '/' + totalHoras + ' h'}
        </span>
      </div>
      <div style={css('align-self: center; font-size: 12px; color: #6b7482;')}>{fecha(p.fecha_modificacion ?? p.fecha_creacion)}</div>
      <div style={css('align-self: center; display: flex; gap: 7px; justify-content: flex-end;')}>
        {(PASOS[codigo] ?? []).map((paso) => (
          <button key={paso.destino} onClick={() => props.alCambiar(paso.destino)} disabled={props.ocupado} title={paso.titulo} style={css(BOTON)}>
            {paso.texto}
          </button>
        ))}
        <button onClick={props.alDuplicar} disabled={props.ocupado} title={'Nueva planificación en borrador, a partir de ' + p.codigo} style={css(BOTON)}>
          Duplicar
        </button>
        <button
          onClick={props.alAbrir}
          style={css(
            'height: 30px; padding: 0 13px; border-radius: 7px; font-size: 11.5px; font-weight: 600;' +
              (editable ? ' border: none; background: ' + ACCENT + '; color: #fff;' : ' border: 1px solid #dfe4ea; background: #fff; color: #4a5462;'),
          )}
        >
          {editable ? 'Abrir' : 'Ver'}
        </button>
      </div>
    </div>
  );
}
