// A8 · Alta de profesor. Prototipo: <template id="tpl-profesoralta"> y DC.registrar("profesoralta") en prototipo/index.html.
// Plan de estudios (orientacion.get_plan_de_estudios: año → orientación → materias) para el selector de habilitadas.
// crear_profesor → editar_profesor (para cargar el legajo, que el alta no recibe) → asignar_materias_habilitadas
// → abre la ficha del profesor. Los duplicados de documento o legajo los rechaza la API (409) y se muestra su mensaje.
import { useState, type ChangeEvent } from 'react';
import type { Profesor } from '@sahs/contratos';
import { orientacion, profesorSuplencias } from '../api';
import { useIr } from '../app/navegar';
import { rutas } from '../app/rutas';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useAccion, useConsulta } from '../estado/consultas';
import { css } from '../lib/css';
import './a7/responsive.css';
import { ACCENT, colorArea, correoValido, gruposDelPlan } from './a7/comun';

const CAMPO_BASE = 'width: 100%; box-sizing: border-box; height: 42px; padding: 0 12px; border-radius: 8px; font-size: 13px; color: #14181f; background: #fcfdfe;';
const VACIO = { nombre: '', apellido: '', documento: '', legajo: '', telefono: '', correo: '', direccion: '' };
type Datos = typeof VACIO;

export default function A8ProfesorAlta() {
  const ir = useIr();
  const [d, setD] = useState<Datos>(VACIO);
  const [materias, setMaterias] = useState<Set<number>>(new Set());
  /** Profesor ya creado cuando falló un paso posterior (legajo o materias). */
  const [creado, setCreado] = useState<Profesor | null>(null);

  const qPlan = useConsulta(['orientacion', 'get_plan_de_estudios'], () => orientacion.get_plan_de_estudios());

  const crear = useAccion(profesorSuplencias.crear_profesor, ['profesor_suplencias']);
  const editar = useAccion(profesorSuplencias.editar_profesor, ['profesor_suplencias']);
  const habilitar = useAccion(profesorSuplencias.asignar_materias_habilitadas, ['profesor_suplencias']);
  const enCurso = crear.enCurso || editar.enCurso || habilitar.enCurso;

  const cambiar = (k: keyof Datos) => (e: ChangeEvent<HTMLInputElement>) => {
    setD((x) => ({ ...x, [k]: e.target.value }));
  };

  const grupos = gruposDelPlan(qPlan.data);
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
    const legajo = t(d.legajo);
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
    ir(rutas.profesor(p.id_profesor));
  }

  function limpiar() {
    setD(VACIO);
    setMaterias(new Set());
    setCreado(null);
    crear.limpiarError();
    editar.limpiarError();
    habilitar.limpiarError();
  }

  const errorApi = crear.error ?? editar.error ?? habilitar.error;

  return (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div className="r-margen r-envolver" style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir(rutas.profesores())} style={css('display: flex; align-items: center; gap: 6px; color: #2f5fd0; cursor: pointer;')}>
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
          <div className="r-titulo" style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Alta de profesor</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <div style={css('font-size: 12.5px; color: #6b7482;')}>Los campos marcados con * son obligatorios</div>
      </div>

      <div className="r-margen r-apilar" style={css('display: flex; gap: 18px; padding: 20px 28px 28px; align-items: flex-start;')}>
        <div style={css('flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px;')}>
          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div style={css('padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Datos personales</div>
            </div>
            <div className="r-una-columna-movil a7-campos" style={css('padding: 20px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px;')}>
              <Campo label="Nombre *" valor={d.nombre} cambiar={cambiar('nombre')} ayuda="Ej.: Laura" />
              <Campo label="Apellido *" valor={d.apellido} cambiar={cambiar('apellido')} ayuda="Ej.: Sosa" />
              <Campo label="Documento *" valor={d.documento} cambiar={cambiar('documento')} ayuda="Sin puntos" />
              <Campo label="Legajo *" valor={d.legajo} cambiar={cambiar('legajo')} ayuda="FAI-0000" />
              <Campo label="Teléfono" valor={d.telefono} cambiar={cambiar('telefono')} ayuda="299 400-0000" />
              <Campo label="Correo electrónico *" valor={d.correo} cambiar={cambiar('correo')} ayuda="nombre@donbosco.edu.ar" />
              <Campo label="Dirección" valor={d.direccion} cambiar={cambiar('direccion')} ayuda="Calle, número, ciudad" ancho />
            </div>
          </div>

          <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
            <div className="r-envolver" style={css('display: flex; align-items: center; gap: 12px; padding: 15px 20px 13px; border-bottom: 1px solid #eef1f5;')}>
              <div style={css('font-size: 13px; font-weight: 600;')}>Materias que está habilitado a dictar *</div>
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
              {qPlan.isLoading && <Cargando />}
              <MensajeError mensaje={qPlan.error?.message} />
              {grupos.map((g) => (
                <div key={g.nombre} style={css('display: flex; flex-direction: column; gap: 9px;')}>
                  <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393; letter-spacing: 0.02em;')}>{g.nombre}</div>
                  <div style={css('display: flex; flex-wrap: wrap; gap: 7px;')}>
                    {g.materias.map((m) => {
                      const a = colorArea(m.nombre_area);
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
                onClick={() => ir(rutas.profesor(creado.id_profesor))}
                style={css(`align-self: flex-start; height: 32px; padding: 0 12px; border-radius: 7px; border: none; background: ${ACCENT}; color: #fff; font-size: 12px; font-weight: 600;`)}
              >
                Abrir la ficha
              </button>
            </div>
          )}
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
  ancho,
}: {
  label: string;
  valor: string;
  cambiar: (e: ChangeEvent<HTMLInputElement>) => void;
  ayuda: string;
  ancho?: boolean;
}) {
  return (
    <div style={css('display: flex; flex-direction: column; gap: 7px;' + (ancho ? ' grid-column: span 2;' : ''))}>
      <label style={css('font-size: 12.5px; font-weight: 600; color: #4a5462;')}>{label}</label>
      <input type="text" value={valor} onChange={cambiar} placeholder={ayuda} style={css(CAMPO_BASE + ' border: 1px solid #dfe4ea;')} />
    </div>
  );
}
