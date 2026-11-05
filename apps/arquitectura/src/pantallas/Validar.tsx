import { generado, pendientes, validado } from '../modelo';

const TIPO: Record<string, string> = {
  servicio: 'servicio',
  llamada: 'llamada',
  contenedor: 'contenedor',
  tablas: 'tablas',
};
const CAMBIO: Record<string, string> = { nuevo: 'nuevo', eliminado: 'eliminado', cambiado: 'cambió' };

/** "2026-11-05" es una fecha sin hora: se arma a mano para que la zona horaria no la corra un día. */
const fecha = (iso: string) => {
  if (iso.length === 10) {
    const [a, m, d] = iso.split('-');
    return `${Number(d)}/${Number(m)}/${a}`;
  }
  return new Date(iso).toLocaleDateString('es-AR');
};

export function Validar() {
  const tablas = validado.servicios.reduce((n, s) => n + s.tablas.length, 0);
  return (
    <div className="validar">
      <div className="validar-intro">
        <h2>Validar el modelo</h2>
        <p>
          Esto es lo que cambió en el código desde la última validación ({fecha(validado.validado)}). Los diagramas muestran lo
          validado; lo que está acá aparece con línea o borde punteado hasta que una persona lo apruebe.
        </p>
      </div>

      {pendientes.length === 0 ? (
        <p className="validar-vacio">El modelo validado coincide con el código (generado el {fecha(generado.generado)}).</p>
      ) : (
        <div className="validar-tabla" role="table" aria-label="Cambios sin validar">
          <div className="validar-fila encabezado" role="row">
            <span role="columnheader">Tipo</span>
            <span role="columnheader">Cambio</span>
            <span role="columnheader">Detectado en</span>
          </div>
          {pendientes.map((d) => (
            <div className="validar-fila" role="row" key={d.clave}>
              <span role="cell">
                <span className={`etiqueta cambio-${d.cambio}`}>
                  {TIPO[d.tipo]} {CAMBIO[d.cambio]}
                </span>
              </span>
              <span role="cell" className="mono">
                {d.descripcion}
              </span>
              <span role="cell" className="mono tenue">
                {d.origen}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="validar-caja">
        <b>Cómo se aprueba</b>
        <p>
          En la raíz del repo, corré <code>npm run arquitectura:validar</code>. Muestra cada cambio y pregunta si se aprueba; lo
          aprobado queda en <code>apps/arquitectura/modelo/validado.json</code>, que entra al repo con un commit. Un servicio nuevo
          entra sin descripción: completá su nombre, descripción e ícono en ese archivo.
        </p>
      </div>

      <div className="validar-resumen">
        <span>{validado.servicios.length} servicios</span>
        <span>{validado.llamadas.length} llamadas entre servicios</span>
        <span>{tablas} tablas</span>
        <span>{validado.contenedores.length} contenedores</span>
      </div>
    </div>
  );
}
