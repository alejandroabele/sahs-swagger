// A15 · Ciclos lectivos. Prototipo: <template id="tpl-cicloslectivos"> y DC.registrar("cicloslectivos") en prototipo/index.html.
// Lista los ciclos (get_ciclos_lectivos) con sus cursos (get_cursos) y su planificación vigente (get_propuestas),
// da de alta un ciclo (crear_ciclo_lectivo) y elige el ciclo que usa toda la aplicación (useCiclo().fijar).
// La API no guarda fechas ni estado del ciclo: el estado sale de useCiclo().estado(anio) y el período de
// clases se muestra como referencia (primer lunes de marzo al segundo viernes de diciembre).
import { useState } from 'react';
import type { Curso, Propuesta } from '@sahs/contratos';
import { planificacion } from '../api';
import { useNavegar } from '../app/navegar';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando } from '../componentes/Estados';
import { useCiclo } from '../estado/ciclo';
import { useAccion, useConsulta } from '../estado/consultas';
import { css } from '../lib/css';

const ACCENT = '#2f5fd0';

const ESTADOS: Record<string, { fondo: string; texto: string }> = {
  'En preparación': { fondo: '#fdf6ec', texto: '#a56a10' },
  Próximo: { fondo: '#fdf6ec', texto: '#a56a10' },
  'En curso': { fondo: '#e9f2ec', texto: '#2f6b45' },
  Cerrado: { fondo: '#f2f4f7', texto: '#7a8393' },
};

const COLS = 'display: grid; grid-template-columns: 150px 1fr 130px 70px 150px 170px; gap: 12px;';
const CAMPO = 'height: 38px; padding: 0 12px; border-radius: 8px; border: 1px solid #dfe4ea; font-size: 13px; background: #fcfdfe; color: #14181f;';

const dos = (n: number) => ('0' + n).slice(-2);
const iso = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
const dma = (d: Date) => `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}`;

/** Período de referencia: primer lunes de marzo y segundo viernes de diciembre (la API no guarda fechas). */
function periodo(anio: number): { inicio: Date; fin: Date } {
  const inicio = new Date(anio, 2, 1);
  while (inicio.getDay() !== 1) inicio.setDate(inicio.getDate() + 1);
  const fin = new Date(anio, 11, 1);
  while (fin.getDay() !== 5) fin.setDate(fin.getDate() + 1);
  fin.setDate(fin.getDate() + 7);
  return { inicio, fin };
}

/** Planificación vigente del ciclo: la validada; si no hay, la última cerrada. */
function vigente(props: Propuesta[]): string {
  const val = props.find((p) => p.estado?.codigo === 'VAL');
  if (val) return val.codigo;
  const cer = props.filter((p) => p.estado?.codigo === 'CER').sort((a, b) => b.codigo.localeCompare(a.codigo));
  return cer[0]?.codigo ?? '—';
}

function caja(marcada: boolean): string {
  return (
    'width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0; margin-top: 1px; display: flex;' +
    ' align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff;' +
    ' border: 1.5px solid ' + (marcada ? ACCENT : '#c3cad4') + ';' +
    ' background: ' + (marcada ? ACCENT : '#fff') + ';'
  );
}

export default function A15CiclosLectivos() {
  const ciclo = useCiclo();
  const ir = useNavegar();
  const qCursos = useConsulta(['planificacion', 'get_cursos'], () => planificacion.get_cursos());
  const qProps = useConsulta(['planificacion', 'get_propuestas'], () => planificacion.get_propuestas());

  const [anio, setAnio] = useState('');
  const [copiar, setCopiar] = useState(true);
  const [usar, setUsar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const ciclos = ciclo.ciclos;
  const cursos = qCursos.data ?? [];
  const propuestas = qProps.data ?? [];
  const enUso = ciclo.activo?.anio_calendario ?? null;

  // Ciclo desde el que se copian los cursos: el más nuevo anterior al año escrito (o el más nuevo, sin año).
  const anioEscrito = /^\d{4}$/.test(anio.trim()) ? Number(anio.trim()) : null;
  const base = anioEscrito != null ? ciclos.find((c) => c.anio_calendario < anioEscrito) ?? null : ciclos[0] ?? null;
  const ref = anioEscrito != null ? periodo(anioEscrito) : null;

  const alta = useAccion(
    async (nuevo: number, copiarDe: Curso[]) => {
      const c = await planificacion.crear_ciclo_lectivo({ anio_calendario: nuevo });
      // Copia de cursos: misma división, turno, orientación, año y materias (sin clases ni grilla).
      for (const x of copiarDe) {
        const n = await planificacion.crear_curso({ division: x.division, id_ciclo_lectivo: c.id_ciclo_lectivo, id_turno: x.id_turno, id_orientacion: x.id_orientacion });
        if (x.id_anio_academico) await planificacion.asignar_curso_a_anio_academico(x.id_anio_academico, { id_curso: n.id_curso });
        for (const m of x.materias ?? []) {
          await planificacion.asignar_materia_a_curso(n.id_curso, { id_materia: m.id_materia, horas_semanales: m.horas_semanales });
        }
      }
      return c;
    },
    ['planificacion', 'orientacion'],
  );

  if (qCursos.isLoading || qProps.isLoading) {
    return (
      <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
        <Cabecera />
        <Cargando />
      </div>
    );
  }

  const estadoActivo = enUso != null ? ciclo.estado(enUso) : '';
  const eActivo = ESTADOS[estadoActivo] ?? ESTADOS['En curso'];

  const limpiar = () => {
    setAnio('');
    setCopiar(true);
    setUsar(false);
    setError(null);
    setAviso(null);
    alta.limpiarError();
  };

  const crear = async () => {
    const txt = anio.trim();
    if (!/^\d{4}$/.test(txt)) return setError('Escribí el año calendario con cuatro cifras, por ejemplo 2027.');
    const nuevo = Number(txt);
    if (ciclos.some((c) => c.anio_calendario === nuevo)) return setError('El ciclo ' + nuevo + ' ya está dado de alta.');
    const copiarDe = copiar && base ? cursos.filter((c) => c.id_ciclo_lectivo === base.id_ciclo_lectivo) : [];
    setError(null);
    const r = await alta.ejecutar(nuevo, copiarDe);
    if (!r) return;
    if (usar) ciclo.fijar(nuevo);
    setAnio('');
    setCopiar(true);
    setUsar(false);
    setAviso(
      'Se dio de alta el ciclo ' + nuevo +
        (copiarDe.length ? ' con ' + copiarDe.length + ' cursos copiados de ' + base!.anio_calendario : ' sin cursos') +
        (usar ? '. La aplicación ya muestra ' + nuevo + '.' : '. Para trabajar en él, tocá «Usar en la aplicación».'),
    );
  };

  const errorTexto = error ?? alta.error;

  return (
    <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir('A1')} style={css('cursor: pointer;')}>Inicio</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span style={css('color: #14181f; font-weight: 500;')}>Ciclos lectivos</span>
          </div>
          <div style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Ciclos lectivos</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <div style={css('display: flex; flex-direction: column; align-items: flex-end; gap: 3px;')}>
          <span style={css('font-size: 11.5px; color: #7a8393;')}>La aplicación muestra los datos del ciclo</span>
          <span style={css('display: flex; align-items: center; gap: 8px;')}>
            <span className="mono" style={css('font-size: 20px; font-weight: 600;')}>{enUso ?? '—'}</span>
            <span style={css('font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 11px; background: ' + eActivo.fondo + '; color: ' + eActivo.texto + ';')}>{estadoActivo}</span>
          </span>
        </div>
      </div>

      <div style={css('padding: 20px 28px 28px; display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 20px; align-items: start;')}>
        <div style={css('display: flex; flex-direction: column; gap: 16px;')}>
          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('display: flex; align-items: center; gap: 14px; padding: 15px 20px; border-bottom: 1px solid #eef1f5;')}>
              <span style={css('font-size: 13px; font-weight: 600;')}>Ciclos registrados</span>
              <div style={css('flex-grow: 1;')}></div>
              <span style={css('font-size: 12px; color: #6b7482;')}>{ciclos.length === 1 ? '1 ciclo' : ciclos.length + ' ciclos'}</span>
            </div>
            <div style={css(COLS + ' padding: 10px 20px; background: #fafbfc; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Ciclo</div>
              <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')} title="La API no guarda fechas: es el período de referencia (primer lunes de marzo al segundo viernes de diciembre).">
                Período de clases
              </div>
              <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Estado</div>
              <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393; text-align: right;')}>Cursos</div>
              <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Planificación vigente</div>
              <div></div>
            </div>
            {ciclos.map((c, i) => {
              const est = ciclo.estado(c.anio_calendario);
              const e = ESTADOS[est] ?? ESTADOS['En preparación'];
              const usa = c.anio_calendario === enUso;
              const p = periodo(c.anio_calendario);
              const nCursos = cursos.filter((x) => x.id_ciclo_lectivo === c.id_ciclo_lectivo).length;
              const plan = vigente(propuestas.filter((x) => x.id_ciclo_lectivo === c.id_ciclo_lectivo));
              return (
                <div
                  key={c.id_ciclo_lectivo}
                  style={css(
                    COLS + ' padding: 15px 20px;' + (i === 0 ? '' : ' border-top: 1px solid #f2f4f7;') + (usa ? ' background: #f3f6fc; box-shadow: inset 3px 0 0 ' + ACCENT + ';' : ''),
                  )}
                >
                  <span style={css('display: flex; align-items: center; gap: 10px;')}>
                    <span className="mono" style={css('font-size: 16px; font-weight: 600;')}>{c.anio_calendario}</span>
                    {usa && (
                      <span style={css('font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 9px; background: #14181f; color: #fff; letter-spacing: 0.03em;')}>EN USO</span>
                    )}
                  </span>
                  <span className="mono" style={css('font-size: 12.5px; color: #4a5462; align-self: center;')} title="Período de referencia: la API no guarda las fechas del ciclo.">
                    {dma(p.inicio) + ' al ' + dma(p.fin)}
                  </span>
                  <span style={css('align-self: center;')}>
                    <span style={css('font-size: 11.5px; font-weight: 600; padding: 4px 10px; border-radius: 13px; background: ' + e.fondo + '; color: ' + e.texto + ';')}>{est}</span>
                  </span>
                  <span className="mono" style={css('font-size: 12.5px; color: #4a5462; align-self: center; text-align: right;')}>{nCursos}</span>
                  <span className="mono" style={css('font-size: 12.5px; color: #4a5462; align-self: center;')}>{plan}</span>
                  <span style={css('align-self: center; display: flex; justify-content: flex-end;')}>
                    <button
                      onClick={() => !usa && ciclo.fijar(c.anio_calendario)}
                      style={css(
                        'height: 30px; padding: 0 12px; border-radius: 7px; font-size: 11.5px; font-weight: 600; white-space: nowrap;' +
                          (usa ? ' border: 1px solid #e2e6ec; background: #f4f6f8; color: #8b95a5; cursor: default;' : ' border: 1px solid ' + ACCENT + '; background: #fff; color: ' + ACCENT + ';'),
                      )}
                    >
                      {usa ? 'En uso' : 'Usar en la aplicación'}
                    </button>
                  </span>
                </div>
              );
            })}
          </div>

          <div style={css('display: flex; align-items: flex-start; gap: 11px; padding: 14px 16px; border-radius: 10px; border: 1px solid #e2e6ec; background: #fafbfc;')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8b95a5" strokeWidth="2" strokeLinecap="round" style={css('flex-shrink: 0; margin-top: 1px;')}>
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 11.5v5M12 8v.5"></path>
            </svg>
            <span style={css('font-size: 12.5px; color: #6b7482; line-height: 1.55;')}>
              El ciclo en uso es el que ven todas las pantallas: cursos, planificaciones, suplencias y horarios. Se cambia desde acá o desde el selector de la barra superior, que está en todas las pantallas. Un ciclo cerrado se puede consultar, pero su planificación ya no se modifica.
            </span>
          </div>
        </div>

        <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 16px;')}>
          <div style={css('display: flex; flex-direction: column; gap: 4px;')}>
            <div style={css('font-size: 15px; font-weight: 600;')}>Nuevo ciclo lectivo</div>
            <div style={css('font-size: 12px; color: #7a8393;')}>Los campos marcados con * son obligatorios</div>
          </div>

          <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
            <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Año calendario *</label>
            <input
              value={anio}
              onChange={(e) => {
                setAnio(e.target.value);
                setError(null);
                setAviso(null);
                alta.limpiarError();
              }}
              placeholder="Ej.: 2027"
              style={css(CAMPO)}
            />
          </div>
          {/* La API no guarda las fechas: se muestran las de referencia del año escrito, sin editar. */}
          <div style={css('display: grid; grid-template-columns: 1fr 1fr; gap: 12px;')} title="No disponible en la API: el ciclo no guarda fechas. Se muestra el período de referencia del año.">
            <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
              <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Inicio de clases</label>
              <input type="date" value={ref ? iso(ref.inicio) : ''} readOnly disabled style={css(CAMPO + ' color: #8b95a5;')} />
            </div>
            <div style={css('display: flex; flex-direction: column; gap: 7px;')}>
              <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>Fin de clases</label>
              <input type="date" value={ref ? iso(ref.fin) : ''} readOnly disabled style={css(CAMPO + ' color: #8b95a5;')} />
            </div>
          </div>

          <button
            onClick={() => setCopiar(!copiar)}
            style={css('display: flex; align-items: flex-start; gap: 11px; padding: 12px 13px; border-radius: 9px; border: 1px solid #e2e6ec; background: #fafbfc; text-align: left;')}
          >
            <span style={css(caja(copiar))}>{copiar ? '✓' : ''}</span>
            <span style={css('display: flex; flex-direction: column; gap: 3px;')}>
              <span style={css('font-size: 13px; font-weight: 600; color: #14181f;')}>Copiar los cursos del ciclo anterior</span>
              <span style={css('font-size: 11.5px; color: #6b7482; line-height: 1.45;')}>
                {base ? 'Se crean los mismos cursos que en ' + base.anio_calendario + ', con sus materias y sin grilla armada.' : 'No hay un ciclo anterior para copiar.'}
              </span>
            </span>
          </button>

          <button
            onClick={() => setUsar(!usar)}
            style={css('display: flex; align-items: flex-start; gap: 11px; padding: 12px 13px; border-radius: 9px; border: 1px solid #e2e6ec; background: #fafbfc; text-align: left;')}
          >
            <span style={css(caja(usar))}>{usar ? '✓' : ''}</span>
            <span style={css('display: flex; flex-direction: column; gap: 3px;')}>
              <span style={css('font-size: 13px; font-weight: 600; color: #14181f;')}>Usarlo en la aplicación al crearlo</span>
              <span style={css('font-size: 11.5px; color: #6b7482; line-height: 1.45;')}>Todas las pantallas pasan a mostrar el ciclo nuevo.</span>
            </span>
          </button>

          {errorTexto && (
            <div style={css('font-size: 12.5px; color: #a63244; background: #fbf1f2; border: 1px solid #f1d3d8; border-radius: 8px; padding: 10px 12px; line-height: 1.45;')}>{errorTexto}</div>
          )}
          {aviso && (
            <div style={css('font-size: 12.5px; color: #245239; background: #eef6f0; border: 1px solid #cfe5d6; border-radius: 8px; padding: 10px 12px; line-height: 1.45;')}>{aviso}</div>
          )}

          <div style={css('display: flex; gap: 10px;')}>
            <button
              onClick={crear}
              disabled={alta.enCurso}
              style={css('flex-grow: 1; height: 40px; border-radius: 8px; border: none; background: ' + ACCENT + '; color: #fff; font-size: 13px; font-weight: 600;' + (alta.enCurso ? ' opacity: 0.7;' : ''))}
            >
              {alta.enCurso ? 'Dando de alta…' : 'Dar de alta el ciclo'}
            </button>
            <button onClick={limpiar} style={css('height: 40px; padding: 0 16px; border-radius: 8px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 13px; font-weight: 500;')}>
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
