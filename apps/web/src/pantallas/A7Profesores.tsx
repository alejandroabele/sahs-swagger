// A7 · Profesores. Prototipo: <template id="tpl-profesoreslistado"> y DC.registrar("profesoreslistado") en prototipo/index.html.
// Listado de profesores (profesor_suplencias.get_profesores) con sus materias habilitadas, que vienen
// anidadas en cada profesor, y búsqueda por apellido, legajo o documento. Cada fila abre la ficha del profesor.
import { useMemo, useState } from 'react';
import { profesorSuplencias } from '../api';
import { useIr } from '../app/navegar';
import { rutas } from '../app/rutas';
import { Cabecera } from '../componentes/Cabecera';
import { Cargando, MensajeError } from '../componentes/Estados';
import { useConsulta } from '../estado/consultas';
import { css } from '../lib/css';
import { iniciales } from '../lib/formato';
import { ACCENT } from './a7/comun';

const COLS = 'display: grid; grid-template-columns: minmax(0, 1fr) 100px minmax(0, 1fr) 28px; gap: 12px;';

export default function A7Profesores() {
  const ir = useIr();
  const [busqueda, setBusqueda] = useState('');

  const qProf = useConsulta(['profesor_suplencias', 'get_profesores'], () => profesorSuplencias.get_profesores());
  const profesores = useMemo(
    () =>
      (qProf.data ?? []).map((p) => {
        const habilitadas: string[] = [];
        for (const m of p.lista_materias_habilitadas ?? []) if (m.nombre_materia && !habilitadas.includes(m.nombre_materia)) habilitadas.push(m.nombre_materia);
        return { p, habilitadas };
      }),
    [qProf.data],
  );

  const texto = busqueda.trim().toLowerCase();
  const visibles = profesores.filter(({ p }) => {
    return (
      texto === '' ||
      p.apellido.toLowerCase().includes(texto) ||
      p.nombre.toLowerCase().includes(texto) ||
      (p.legajo ?? '').toLowerCase().includes(texto) ||
      p.documento.includes(texto) ||
      p.documento.replace(/\D/g, '').includes(texto)
    );
  });

  const resumen = visibles.length === profesores.length ? `${profesores.length} profesores` : `${visibles.length} de ${profesores.length} profesores`;
  const error = qProf.error;

  return (
    <div style={css('width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: #f4f6f8;')}>
      <Cabecera />

      <div className="r-margen r-envolver" style={css('display: flex; align-items: flex-end; gap: 24px; padding: 22px 28px 18px; background: #fff; border-bottom: 1px solid #e2e6ec; flex-shrink: 0;')}>
        <div style={css('display: flex; flex-direction: column; gap: 6px;')}>
          <div style={css('display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7482;')}>
            <span onClick={() => ir(rutas.inicio())} style={css('cursor: pointer;')}>Inicio</span>
            <span style={css('color: #c3cad4;')}>/</span>
            <span style={css('color: #14181f; font-weight: 500;')}>Profesores</span>
          </div>
          <div className="r-titulo" style={css('font-size: 24px; font-weight: 600; letter-spacing: -0.02em;')}>Profesores de la institución</div>
        </div>
        <div style={css('flex-grow: 1;')}></div>
        <button
          onClick={() => ir(rutas.profesorNuevo())}
          style={css(`display: flex; align-items: center; gap: 9px; height: 40px; padding: 0 17px; border-radius: 8px; border: none; background: ${ACCENT}; color: #fff; font-size: 13px; font-weight: 600;`)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          Nuevo profesor
        </button>
      </div>

      <div className="r-margen" style={css('padding: 20px 28px 28px;')}>
        {error && (
          <div style={css('margin-bottom: 14px;')}>
            <MensajeError mensaje={error.message} />
          </div>
        )}
        <div style={css('background: #fff; border: 1px solid #e2e6ec; border-radius: 10px; overflow: hidden;')}>
          <div className="r-envolver" style={css('display: flex; align-items: center; gap: 14px; padding: 15px 20px; border-bottom: 1px solid #eef1f5;')}>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por apellido, legajo o documento"
              className="r-ancho-movil"
              style={css('width: 310px; box-sizing: border-box; height: 34px; padding: 0 12px; border-radius: 7px; border: 1px solid #dfe4ea; font-size: 12.5px; background: #fcfdfe;')}
            />
            <div style={css('flex-grow: 1;')}></div>
            <span style={css('font-size: 12px; color: #6b7482;')}>{resumen}</span>
          </div>

          {/* Encabezado y filas se desplazan juntos en pantallas angostas para que la columna del nombre no quede aplastada. */}
          <div className="r-desplazar">
          <div className="r-min-600">
          <div style={css(COLS + ' padding: 10px 20px; background: #fafbfc; border-bottom: 1px solid #eef1f5;')}>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Profesor</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Legajo</div>
            <div style={css('font-size: 11.5px; font-weight: 600; color: #7a8393;')}>Habilitado en</div>
            <div></div>
          </div>

          <div>
            {qProf.isLoading && <Cargando />}
            {!qProf.isLoading && visibles.length === 0 && (
              <div style={css('padding: 22px 20px; font-size: 12.5px; color: #6b7482; border-top: 1px solid #f2f4f7;')}>
                {profesores.length === 0 ? 'No hay profesores cargados.' : 'Ningún profesor coincide con la búsqueda.'}
              </div>
            )}
            {visibles.map(({ p, habilitadas }) => {
              return (
                <button
                  key={p.id_profesor}
                  onClick={() => ir(rutas.profesor(p.id_profesor))}
                  style={css(
                    COLS + ' width: 100%; padding: 12px 20px; border: none; border-top: 1px solid #f2f4f7; text-align: left; background: #fff;',
                  )}
                >
                  <span style={css('display: flex; align-items: center; gap: 11px; min-width: 0; padding-right: 12px;')}>
                    <span
                      style={css(
                        'width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600;' +
                          ' background: #eef1f5; color: #5b6471;',
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
                  <span style={css('font-size: 12.5px; color: #6b7482; align-self: center; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 10px;')}>
                    {habilitadas.length ? habilitadas.join(', ') : 'Ninguna'}
                  </span>
                  <span style={css('align-self: center; display: flex; justify-content: flex-end;')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c3cad4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6"></path>
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
