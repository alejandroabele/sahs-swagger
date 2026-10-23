// P4 · Mis recibos. Prototipo: <template id="tpl-misrecibos"> y DC.registrar("misrecibos") en prototipo/index.html.
// Recibos del profesor de la sesión (pago.get_recibos_de_sueldo), detalle con sus conceptos,
// firma de conformidad (firmar_recibo_de_sueldo, definitiva) y descarga del PDF (bajar_recibo_sueldo).
import { useState } from 'react';
import type { ConceptoRecibo, ReciboSueldo } from '@sahs/contratos';
import { pago } from '../api';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useAccion, useConsulta } from '../estado/consultas';
import { useSesion } from '../estado/sesion';
import { css } from '../lib/css';
import { descargar, fecha, nombrePeriodo, pesos } from '../lib/formato';

const ACCENT = '#2f5fd0';

/** Las horas cátedra se cuentan en horas; el resto de los conceptos (antigüedad, SAC, aportes) en porcentaje. */
const esHoras = (c: ConceptoRecibo) => /^horas c[aá]tedra/i.test(c.descripcion);
const cantidadDe = (c: ConceptoRecibo) => (c.cantidad == null ? '' : `${c.cantidad.toLocaleString('es-AR')} ${esHoras(c) ? 'h' : '%'}`);

export default function P4MisRecibos() {
  const { profesor, usuario } = useSesion();
  const idProfesor = profesor?.id_profesor;
  const q = useConsulta(['pago', 'get_recibos_de_sueldo', { id_profesor: idProfesor }], () => pago.get_recibos_de_sueldo({ id_profesor: idProfesor }), {
    enabled: idProfesor != null,
  });
  const [selId, setSelId] = useState<number | null>(null);
  const [descargado, setDescargado] = useState<number | null>(null);
  const [errorPdf, setErrorPdf] = useState<string | null>(null);
  const [bajando, setBajando] = useState(false);
  const firmar = useAccion((id: number, idUsuario: number) => pago.firmar_recibo_de_sueldo(id, { id_usuario: idUsuario }), ['pago']);

  const recibos: ReciboSueldo[] = [...(q.data ?? [])].sort((a, b) => b.periodo.localeCompare(a.periodo));
  const r = recibos.find((x) => x.id_recibo_sueldo === selId) ?? recibos[0] ?? null;
  const pendientes = recibos.filter((x) => !x.firma_receptor).length;
  const firmado = r?.firma_receptor ?? null;
  const horasCatedra = r ? r.conceptos.filter(esHoras).reduce((s, c) => s + (c.cantidad ?? 0), 0) : 0;
  const nombreCompleto = profesor ? `${profesor.nombre} ${profesor.apellido}` : '';

  const elegir = (id: number) => {
    setSelId(id);
    setDescargado(null);
    setErrorPdf(null);
    firmar.limpiarError();
  };

  const bajarPdf = async () => {
    if (!r || bajando) return;
    setErrorPdf(null);
    setBajando(true);
    try {
      const blob = await pago.bajar_recibo_sueldo(r.id_recibo_sueldo);
      descargar(blob, `recibo-${r.periodo}.pdf`);
      setDescargado(r.id_recibo_sueldo);
    } catch (e) {
      setErrorPdf(e instanceof Error ? e.message : 'No se pudo descargar el recibo.');
    } finally {
      setBajando(false);
    }
  };

  const filaBase = 'padding: 10px 12px; border-bottom: 1px solid #f2f4f7;';
  const yaDescargado = r != null && descargado === r.id_recibo_sueldo;

  return (
    <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera conCiclo={false} />

      <div style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span>{profesor?.legajo ? `Legajo ${profesor.legajo}` : 'Sin legajo'}</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span>Ciclo lectivo {new Date().getFullYear()}</span>
          </div>
          <div style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Mis recibos de sueldo</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        {recibos.length > 0 && (
          <div
            style={css(
              'display: flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: 20px;' +
                ' border: 1px solid ' +
                (pendientes === 0 ? '#c2e0cd' : '#f0d3ae') +
                ';' +
                ' background: ' +
                (pendientes === 0 ? '#ecf5ef' : '#fdf1e3') +
                ';',
            )}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={pendientes === 0 ? '#2f6b45' : '#8a4b12'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
            <span style={css(`font-size: 12.5px; font-weight: 600; color: ${pendientes === 0 ? '#2f6b45' : '#8a4b12'};`)}>
              {pendientes === 0 ? 'Todos los recibos firmados' : pendientes + (pendientes === 1 ? ' recibo sin firmar' : ' recibos sin firmar')}
            </span>
          </div>
        )}
      </div>

      {!profesor ? (
        <div style={css('padding: 20px 28px;')}>
          <div style={css('font-size: 12.5px; color: #a56a10; background: #fdf6ec; border: 1px solid #f1dfc0; border-radius: 8px; padding: 12px 14px;')}>
            Tu usuario no está vinculado a ningún profesor, así que no hay recibos para mostrar. El vínculo se asigna desde la ficha del profesor.
          </div>
        </div>
      ) : q.isLoading ? (
        <Cargando />
      ) : q.isError ? (
        <div style={css('padding: 20px 28px;')}>
          <MensajeError mensaje={q.error.message} />
        </div>
      ) : !r ? (
        <div style={css('padding: 20px 28px;')}>
          <div style={css('font-size: 12.5px; color: #6b7482; background: #fafbfc; border: 1px solid #e2e6ec; border-radius: 8px; padding: 12px 14px;')}>
            Todavía no tenés recibos de sueldo liquidados.
          </div>
        </div>
      ) : (
        <div style={css('display: flex; gap: 18px; padding: 20px 28px 28px; align-items: flex-start;')}>
          <div style={css('width: 352px; flex-shrink: 0; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('padding: 14px 16px 12px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Períodos disponibles</div>
            </div>
            {recibos.map((x) => {
              const activo = x.id_recibo_sueldo === r.id_recibo_sueldo;
              const f = !!x.firma_receptor;
              return (
                <button
                  key={x.id_recibo_sueldo}
                  onClick={() => elegir(x.id_recibo_sueldo)}
                  style={css(
                    'display: flex; align-items: center; gap: 11px; width: 100%; padding: 12px 16px; border: none;' +
                      ' border-left: 3px solid ' +
                      (activo ? ACCENT : 'transparent') +
                      ';' +
                      ' border-bottom: 1px solid #f4f6f8;' +
                      ' background: ' +
                      (activo ? '#f3f6fc' : '#fff') +
                      '; text-align: left;',
                  )}
                >
                  <span style={css('display: flex; flex-direction: column; gap: 4px; text-align: left; flex-grow: 1; min-width: 0;')}>
                    <span style={css('font-size: 13.5px; font-weight: 600;')}>{nombrePeriodo(x.periodo)}</span>
                    <span className="mono" style={css('font-size: 12px; color: #6b7482;')}>
                      {pesos(x.neto)} neto
                    </span>
                  </span>
                  <span
                    style={css(
                      'font-size: 10.5px; font-weight: 600; padding: 3px 9px; border-radius: 11px; flex-shrink: 0;' +
                        (f ? ' background: #e9f2ec; color: #2f6b45;' : ' background: #fdf1e3; color: #8a4b12;'),
                    )}
                  >
                    {f ? 'Firmado' : 'Sin firmar'}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={css('flex-grow: 1; min-width: 0; background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('display: flex; align-items: center; gap: 14px; padding: 15px 22px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('display: flex; flex-direction: column; gap: 2px;')}>
                <div style={css('font-size: 14px; font-weight: 600;')}>Recibo de haberes · {nombrePeriodo(r.periodo)}</div>
                <div style={css('font-size: 12px; color: #6b7482;')}>
                  {r.emisor.razon_social} · CUIT {r.emisor.cuit}
                </div>
              </div>
              <div style={css('flex-grow: 1;')}></div>
              <button
                onClick={bajarPdf}
                disabled={bajando}
                style={css(
                  'display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 15px;' +
                    ' border-radius: 7px; font-size: 12.5px; font-weight: 600;' +
                    (yaDescargado ? ' border: 1px solid #c2e0cd; background: #ecf5ef; color: #2f6b45;' : ' border: 1px solid #d3d9e2; background: #fff; color: #14181f;'),
                )}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0;')}>
                  <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M4.5 19.5h15"></path>
                </svg>
                {bajando ? 'Descargando…' : yaDescargado ? 'Descargado' : 'Descargar PDF'}
              </button>
            </div>

            <div style={css('padding: 22px 22px 24px;')}>
              {errorPdf && (
                <div style={css('margin-bottom: 16px;')}>
                  <MensajeError mensaje={errorPdf} alCerrar={() => setErrorPdf(null)} />
                </div>
              )}

              <div style={css('display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background: #eef1f5; border: 1px solid #eef1f5; border-radius: 9px; overflow: hidden; margin-bottom: 20px;')}>
                <div style={css('background: #fafbfc; padding: 12px 14px;')}>
                  <div style={css('font-size: 11px; color: #7a8393; margin-bottom: 3px;')}>Apellido y nombre</div>
                  <div style={css('font-size: 13px; font-weight: 500;')}>
                    {profesor.apellido}, {profesor.nombre}
                  </div>
                </div>
                <div style={css('background: #fafbfc; padding: 12px 14px;')}>
                  <div style={css('font-size: 11px; color: #7a8393; margin-bottom: 3px;')}>DNI</div>
                  <div className="mono" style={css('font-size: 13px; font-weight: 500;')}>
                    {profesor.documento}
                  </div>
                </div>
                <div style={css('background: #fafbfc; padding: 12px 14px;')}>
                  <div style={css('font-size: 11px; color: #7a8393; margin-bottom: 3px;')}>Cargo</div>
                  <div style={css('font-size: 13px; font-weight: 500;')}>
                    {(profesor.cargo_asociado || 'Profesor') + (horasCatedra ? ` · ${horasCatedra} h cátedra` : '')}
                  </div>
                </div>
                <div style={css('background: #fafbfc; padding: 12px 14px;')}>
                  <div style={css('font-size: 11px; color: #7a8393; margin-bottom: 3px;')}>Fecha de pago</div>
                  <div className="mono" style={css('font-size: 13px; font-weight: 500;')}>
                    {fecha(r.fecha_pago)}
                  </div>
                </div>
              </div>

              <div style={css('display: grid; grid-template-columns: 1fr 120px 150px; gap: 0; font-size: 12.5px;')}>
                <div style={css('padding: 9px 12px; background: #f6f8fa; font-weight: 600; font-size: 11.5px; color: #4a5462; border-radius: 6px 0 0 0;')}>Concepto</div>
                <div style={css('padding: 9px 12px; background: #f6f8fa; font-weight: 600; font-size: 11.5px; color: #4a5462; text-align: right;')}>Cantidad</div>
                <div style={css('padding: 9px 12px; background: #f6f8fa; font-weight: 600; font-size: 11.5px; color: #4a5462; text-align: right; border-radius: 0 6px 0 0;')}>Importe</div>
                {[...r.conceptos.filter((c) => c.tipo === 'haber'), ...r.conceptos.filter((c) => c.tipo === 'descuento')].map((c, i) => {
                  const resta = c.tipo === 'descuento';
                  return [
                    <div key={`n${i}`} style={css(filaBase + ' color: ' + (resta ? '#8a4b12' : '#14181f') + ';')}>
                      {c.descripcion}
                    </div>,
                    <div key={`c${i}`} className="mono" style={css(filaBase + ' text-align: right; color: #6b7482;')}>
                      {cantidadDe(c)}
                    </div>,
                    <div key={`i${i}`} className="mono" style={css(filaBase + ' text-align: right; font-weight: 500; color: ' + (resta ? '#8a4b12' : '#14181f') + ';')}>
                      {(resta ? '− ' : '') + pesos(c.importe)}
                    </div>,
                  ];
                })}
              </div>

              <div style={css('display: flex; gap: 16px; margin-top: 20px; align-items: stretch;')}>
                <div style={css('flex-grow: 1; display: flex; gap: 16px;')}>
                  <div style={css('flex-grow: 1; padding: 14px 16px; border-radius: 9px; background: #fafbfc; border: 1px solid #eef1f5;')}>
                    <div style={css('font-size: 11.5px; color: #7a8393; margin-bottom: 4px;')}>Total bruto</div>
                    <div className="mono" style={css('font-size: 18px; font-weight: 600;')}>
                      {pesos(r.total_bruto)}
                    </div>
                  </div>
                  <div style={css('flex-grow: 1; padding: 14px 16px; border-radius: 9px; background: #fafbfc; border: 1px solid #eef1f5;')}>
                    <div style={css('font-size: 11.5px; color: #7a8393; margin-bottom: 4px;')}>Descuentos</div>
                    <div className="mono" style={css('font-size: 18px; font-weight: 600; color: #8a4b12;')}>
                      − {pesos(r.total_descuentos)}
                    </div>
                  </div>
                  <div style={css('flex-grow: 1; padding: 14px 16px; border-radius: 9px; background: #f0f5f2; border: 1px solid #cfe3d7;')}>
                    <div style={css('font-size: 11.5px; color: #55705f; margin-bottom: 4px;')}>Neto a cobrar</div>
                    <div className="mono" style={css('font-size: 18px; font-weight: 700; color: #245239;')}>
                      {pesos(r.neto)}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={css(
                  'display: flex; align-items: center; margin-top: 20px; padding: 16px 18px; border-radius: 10px;' +
                    ' border: 1px solid ' +
                    (firmado ? '#c2e0cd' : '#e2e6ec') +
                    ';' +
                    ' background: ' +
                    (firmado ? '#ecf5ef' : '#fafbfc') +
                    ';',
                )}
              >
                {!firmado ? (
                  <div style={css('display: flex; flex-direction: column; gap: 12px; width: 100%;')}>
                    <div style={css('display: flex; align-items: center; gap: 14px; width: 100%;')}>
                      <button
                        onClick={() => usuario && firmar.ejecutar(r.id_recibo_sueldo, usuario.id_usuario)}
                        disabled={firmar.enCurso || !usuario}
                        style={css(
                          `display: flex; align-items: center; gap: 10px; height: 42px; padding: 0 18px; border-radius: 8px; border: none; background: ${ACCENT}; color: #fff; font-size: 13px; font-weight: 600; flex-shrink: 0;` +
                            (firmar.enCurso ? ' opacity: 0.7;' : ''),
                        )}
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5"></path>
                        </svg>
                        {firmar.enCurso ? 'Firmando…' : 'Firmar conformidad'}
                      </button>
                      <span style={css('font-size: 12px; color: #6b7482; line-height: 1.5;')}>
                        Al firmar dejás constancia de que recibiste el recibo y estás de acuerdo con los importes. Si no coinciden, no lo firmes y avisá a secretaría.
                      </span>
                    </div>
                    <MensajeError mensaje={firmar.error} alCerrar={firmar.limpiarError} />
                  </div>
                ) : (
                  <div style={css('display: flex; align-items: center; gap: 13px; width: 100%;')}>
                    <span style={css('width: 34px; height: 34px; border-radius: 50%; background: #2f6b45; display: flex; align-items: center; justify-content: center; flex-shrink: 0;')}>
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                    </span>
                    <span style={css('display: flex; flex-direction: column; gap: 2px;')}>
                      <span style={css('font-size: 13px; font-weight: 600; color: #245239;')}>Conformidad firmada</span>
                      <span style={css('font-size: 12px; color: #3d6b4f;')}>
                        Firmada el {fecha(firmado.fecha)} por {nombreCompleto} · DNI {profesor.documento}
                      </span>
                    </span>
                    <span style={css('flex-grow: 1;')}></span>
                    <span style={css('font-size: 11.5px; color: #3d6b4f;')}>La firma es definitiva</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
