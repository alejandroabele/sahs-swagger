// A8 · Alta de profesor. Prototipo: <template id="tpl-profesoralta"> y DC.registrar("profesoralta") en prototipo/index.html.
// crear_profesor (no crea usuario) → editar_profesor (para cargar el legajo, que el alta no recibe)
// → asignar_materias_habilitadas → abre la ficha (A9).
import { useState, type ChangeEvent } from 'react';
import type { Profesor } from '@sahs/contratos';
import { orientacion, planificacion, profesorSuplencias } from '../api';
import { useNavegar } from '../app/navegar';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useAccion, useConsulta } from '../estado/consultas';
import { css } from '../lib/css';
import { ACCENT, colorArea, correoValido, gruposDeMaterias } from './a7/comun';

const CAMPO_BASE = 'width: 100%; box-sizing: border-box; height: 42px; padding: 0 12px; border-radius: 8px; font-size: 13px; color: #14181f; background: #fcfdfe;';
const VACIO = { nombre: '', apellido: '', documento: '', legajo: '', telefono: '', correo: '', direccion: '' };
type Datos = typeof VACIO;

const soloDigitos = (s: string) => s.replace(/\D/g, '');

export default function A8ProfesorAlta() {
  const ir = useNavegar();
  const [d, setD] = useState<Datos>(VACIO);
  const [materias, setMaterias] = useState<Set<number>>(new Set());
  const [errorDoc, setErrorDoc] = useState<string | null>(null);
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);
  const [errorLegajo, setErrorLegajo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Profesor ya creado cuando falló un paso posterior (legajo o materias). */
  const [creado, setCreado] = useState<Profesor | null>(null);

  const qMat = useConsulta(['orientacion', 'get_materias'], () => orientacion.get_materias());
  const qAnios = useConsulta(['planificacion', 'get_anios_academicos'], () => planificacion.get_anios_academicos());
  const qProf = useConsulta(['profesor_suplencias', 'get_profesores'], () => profesorSuplencias.get_profesores());

  const crear = useAccion(profesorSuplencias.crear_profesor, ['profesor_suplencias']);
  const editar = useAccion(profesorSuplencias.editar_profesor, ['profesor_suplencias']);
  const habilitar = useAccion(profesorSuplencias.asignar_materias_habilitadas, ['profesor_suplencias']);
  const enCurso = crear.enCurso || editar.enCurso || habilitar.enCurso;

  const cambiar = (k: keyof Datos) => (e: ChangeEvent<HTMLInputElement>) => {
    setD((x) => ({ ...x, [k]: e.target.value }));
    if (k === 'documento') setErrorDoc(null);
    if (k === 'correo') setErrorCorreo(null);
    if (k === 'legajo') setErrorLegajo(null);
    setError(null);
  };

  const grupos = gruposDeMaterias(qMat.data, qAnios.data);
  const elegidas = materias.size;
  const t = (s: string) => s.trim();

  const nombreOk = t(d.nombre) !== '' && t(d.apellido) !== '';
  const docOk = t(d.documento).length >= 7;
  const legajoOk = t(d.legajo) !== '';
  const correoOk = correoValido(d.correo);
  const materiasOk = elegidas > 0;
  const listo = nombreOk && docOk && legajoOk && correoOk && materiasOk && !enCurso;

  const item = (ok: boolean, label: string) => ({ label, color: ok ? '#2f6b45' : '#a8b0bb', icono: ok ? 'M20 6L9 17l-5-5' : 'M12 5v14M5 12h14' });
  const checklist = [
    item(nombreOk, 'Nombre y apellido'),
    item(docOk && legajoOk, 'Documento y legajo'),
    item(correoOk, 'Correo electrónico'),
    item(materiasOk, 'Al menos una materia habilitada'),
  ];

  const nombreCompleto =
    t(d.apellido) !== '' || t(d.nombre) !== '' ? t(d.apellido) + (t(d.apellido) && t(d.nombre) ? ', ' : '') + t(d.nombre) : 'Sin datos todavía';
  const ini = ((t(d.nombre).charAt(0) || '') + (t(d.apellido).charAt(0) || '')).toUpperCase();

  async function alta() {
    if (!listo) return;
    const otros = qProf.data ?? [];
    const doc = soloDigitos(d.documento);
    if (otros.some((p) => soloDigitos(p.documento) === doc)) {
      setErrorDoc('Ya hay un profesor registrado con ese documento. No se puede repetir.');
      return;
    }
    const legajo = t(d.legajo);
    const dueño = otros.find((p) => (p.legajo ?? '').toLowerCase() === legajo.toLowerCase());
    if (dueño) {
      setErrorLegajo(`El legajo ${legajo} ya es de ${dueño.apellido}, ${dueño.nombre}.`);
      return;
    }
    if (!correoOk) {
      setErrorCorreo('El correo no tiene un formato válido.');
      return;
    }
    setError(null);
    const p = await crear.ejecutar({
      nombre: t(d.nombre),
      apellido: t(d.apellido),
      documento: t(d.documento),
      correo_electronico: t(d.correo),
      telefono: t(d.telefono) || undefined,
      direccion: t(d.direccion) || undefined,
    });
    if (!p) return; // el mensaje queda en crear.error
    const conLegajo = await editar.ejecutar(p.id_profesor, {
      nombre: p.nombre,
      apellido: p.apellido,
      documento: p.documento,
      correo_electronico: p.correo_electronico ?? t(d.correo),
      telefono: p.telefono ?? '',
      direccion: p.direccion ?? '',
      legajo,
      cargo_asociado: null,
    });
    if (!conLegajo) {
      setCreado(p);
      return;
    }
    const conMaterias = await habilitar.ejecutar(p.id_profesor, { ids_materias: [...materias] });
    if (!conMaterias) {
      setCreado(p);
      return;
    }
    ir('A9', { id_profesor: p.id_profesor });
  }

  function limpiar() {
    setD(VACIO);
    setMaterias(new Set());
    setErrorDoc(null);
    setErrorCorreo(null);
    setErrorLegajo(null);
    setError(null);
    setCreado(null);
    crear.limpiarError();
    editar.limpiarError();
    habilitar.limpiarError();
  }

  const errorApi = crear.error ?? editar.error ?? habilitar.error ?? error;

  return (
    <div style={css('width: 1440px; min-height: 980px; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir('A7')} style={css('display: flex; align-items: center; gap: 6px; color: #2f5fd0; cursor: pointer;')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6"></path>
              </svg>
              Volver al listado
            </span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span>Profesores</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span style={css('color: #14181f; font-weight: 500;')}>Nuevo</span>
          </div>
          <div style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Alta de profesor</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <div style={css('font-size: 12.5px; color: #6b7482;')}>Los campos marcados con * son obligatorios</div>
      </div>

      <div style={css('display: flex; gap: 18px; padding: 20px 28px 28px; align-items: flex-start;')}>
        <div style={css('flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px;')}>
          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Datos personales</div>
            </div>
            <div style={css('padding: 20px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px;')}>
              <Campo label="Nombre *" valor={d.nombre} cambiar={cambiar('nombre')} ayuda="Por ejemplo: Laura" />
              <Campo label="Apellido *" valor={d.apellido} cambiar={cambiar('apellido')} ayuda="Por ejemplo: Sosa" />
              <Campo label="Documento *" valor={d.documento} cambiar={cambiar('documento')} ayuda="Sin puntos" error={errorDoc} />
              <Campo label="Legajo *" valor={d.legajo} cambiar={cambiar('legajo')} ayuda="FAI-0000" error={errorLegajo} />
              <Campo label="Teléfono" valor={d.telefono} cambiar={cambiar('telefono')} ayuda="299 400-0000" />
              <Campo label="Correo electrónico *" valor={d.correo} cambiar={cambiar('correo')} ayuda="nombre@donbosco.edu.ar" error={errorCorreo} />
              <Campo label="Dirección" valor={d.direccion} cambiar={cambiar('direccion')} ayuda="Calle, número, ciudad" ancho />
            </div>
          </div>

          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('display: flex; align-items: center; gap: 12px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('display: flex; flex-direction: column; gap: 3px;')}>
                <div style={css('font-size: 13px; font-weight: 600;')}>Materias que está habilitado a dictar *</div>
                <div style={css('font-size: 12px; color: #6b7482;')}>
                  Del catálogo de materias, agrupadas por año y orientación. Define en qué puede ser asignado y a quién puede suplantar
                </div>
              </div>
              <div style={css('flex-grow: 1;')}></div>
              <div
                style={css(
                  'font-size: 11.5px; font-weight: 600; padding: 5px 11px; border-radius: 13px;' +
                    (elegidas > 0 ? ' background: #e9f2ec; color: #2f6b45;' : ' background: #f2f4f7; color: #7a8393;'),
                )}
              >
                {elegidas === 0 ? 'Ninguna elegida' : elegidas === 1 ? '1 materia elegida' : `${elegidas} materias elegidas`}
              </div>
            </div>
            <div style={css('padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 16px;')}>
              {(qMat.isLoading || qAnios.isLoading) && <Cargando />}
              <MensajeError mensaje={qMat.error?.message ?? qAnios.error?.message} />
              {grupos.map((g) => (
                <div key={g.nombre} style={css('display: flex; flex-direction: column; gap: 9px;')}>
                  <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393; letter-spacing: 0.02em;')}>{g.nombre}</div>
                  <div style={css('display: flex; flex-wrap: wrap; gap: 7px;')}>
                    {g.materias.map((m) => {
                      const a = colorArea(m.area?.nombre_area);
                      const activa = materias.has(m.id_materia);
                      return (
                        <button
                          key={m.id_materia}
                          onClick={() => {
                            const ms = new Set(materias);
                            if (activa) ms.delete(m.id_materia);
                            else ms.add(m.id_materia);
                            setMaterias(ms);
                          }}
                          style={css(
                            'height: 32px; padding: 0 13px; border-radius: 16px; font-size: 12px; font-weight: 500;' +
                              ' border: 1px solid ' + (activa ? 'transparent' : '#e2e6ec') + ';' +
                              ' background: ' + (activa ? a.fondo : '#fff') + ';' +
                              ' color: ' + (activa ? a.texto : '#6b7482') + ';' +
                              (activa ? ' box-shadow: inset 0 0 0 1.5px ' + a.texto + ';' : ''),
                          )}
                        >
                          {m.nombre_materia}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={css('width: 360px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;')}>
          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; gap: 15px;')}>
            <div style={css('font-size: 13px; font-weight: 600;')}>Resumen del alta</div>
            <div style={css('display: flex; align-items: center; gap: 12px;')}>
              <span
                style={css(
                  'width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600;' +
                    ' background: ' + (ini ? ACCENT : '#eef1f5') + '; color: ' + (ini ? '#fff' : '#a8b0bb') + ';',
                )}
              >
                {ini || '—'}
              </span>
              <div style={css('display: flex; flex-direction: column; gap: 3px; min-width: 0;')}>
                <div style={css('font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')}>{nombreCompleto}</div>
                <div className="mono" style={css('font-size: 11.5px; color: #8b95a5;')}>
                  {t(d.legajo) !== '' ? t(d.legajo) : 'Sin legajo'}
                </div>
              </div>
            </div>
            <div style={css('display: flex; flex-direction: column; gap: 9px;')}>
              {checklist.map((c) => (
                <div key={c.label} style={css('display: flex; align-items: center; gap: 9px;')}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={css('flex-shrink: 0;')}>
                    <path d={c.icono}></path>
                  </svg>
                  <span style={css('font-size: 12.5px; color: ' + c.color + ';')}>{c.label}</span>
                </div>
              ))}
            </div>
            <button
              onClick={alta}
              disabled={!listo || !!creado}
              style={css(
                'height: 44px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600;' +
                  ' background: ' + (listo && !creado ? ACCENT : '#e2e6ec') + '; color: ' + (listo && !creado ? '#fff' : '#a8b0bb') + ';',
              )}
            >
              {enCurso ? 'Dando de alta…' : 'Dar de alta el profesor'}
            </button>
            <button
              onClick={limpiar}
              style={css('height: 38px; border-radius: 8px; border: 1px solid #dfe4ea; background: #fff; color: #4a5462; font-size: 12.5px; font-weight: 500;')}
            >
              Limpiar formulario
            </button>
          </div>

          {errorApi && <MensajeError mensaje={errorApi} />}

          {creado && (
            <div style={css('border-radius: 10px; padding: 15px 16px; background: #fdf6ec; border: 1px solid #f1dfc0; display: flex; flex-direction: column; gap: 10px;')}>
              <span style={css('font-size: 12.5px; color: #7a5310; line-height: 1.55;')}>
                {creado.apellido}, {creado.nombre} quedó registrado, pero no se pudo completar el alta (legajo o materias habilitadas). Terminalo desde su ficha.
              </span>
              <button
                onClick={() => ir('A9', { id_profesor: creado.id_profesor })}
                style={css(`align-self: flex-start; height: 32px; padding: 0 12px; border-radius: 7px; border: none; background: ${ACCENT}; color: #fff; font-size: 12px; font-weight: 600;`)}
              >
                Abrir la ficha
              </button>
            </div>
          )}

          <div style={css('border-radius: 10px; padding: 14px 16px; background: #fafbfc; border: 1px solid #e2e6ec;')}>
            <div style={css('display: flex; gap: 10px; align-items: flex-start;')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b95a5" strokeWidth="2" strokeLinecap="round" style={css('flex-shrink: 0; margin-top: 1px;')}>
                <path d="M12 8v5M12 16.5v.5"></path>
                <circle cx="12" cy="12" r="9"></circle>
              </svg>
              <span style={css('font-size: 12px; color: #6b7482; line-height: 1.55;')}>
                El alta no crea el usuario para ingresar al sistema. Se asigna después, desde la ficha del profesor, eligiendo uno de los usuarios creados en Usuarios.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Campo({
  label,
  valor,
  cambiar,
  ayuda,
  error,
  ancho,
}: {
  label: string;
  valor: string;
  cambiar: (e: ChangeEvent<HTMLInputElement>) => void;
  ayuda: string;
  error?: string | null;
  ancho?: boolean;
}) {
  return (
    <div style={css('display: flex; flex-direction: column; gap: 7px;' + (ancho ? ' grid-column: span 2;' : ''))}>
      <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>{label}</label>
      <input type="text" value={valor} onChange={cambiar} placeholder={ayuda} style={css(CAMPO_BASE + ' border: 1px solid ' + (error ? '#e0a9a2' : '#dfe4ea') + ';')} />
      {error && <span style={css('font-size: 11.5px; color: #b03a2e; line-height: 1.45;')}>{error}</span>}
    </div>
  );
}
