import { useEffect, useState, type MouseEvent } from 'react';
import { pendientes, servicios } from './modelo';
import { useSalud } from './salud';
import { Componentes } from './pantallas/Componentes';
import { Comunicacion } from './pantallas/Comunicacion';
import { Validar } from './pantallas/Validar';

type Pantalla = 'componentes' | 'comunicacion' | 'validar';

const BASE = import.meta.env.BASE_URL; // '/arquitectura/'
const RUTA: Record<Pantalla, string> = { componentes: '', comunicacion: 'comunicacion', validar: 'validar' };
const SUBTITULO: Record<Pantalla, string> = {
  componentes: '1 · Componentes: de la entrada del usuario a los datos',
  comunicacion: '2 · Comunicación entre microservicios: llamadas HTTP síncronas (REST · JSON), sin pasar por el gateway',
  validar: 'Cambios del código que todavía no validó una persona',
};

function leerUbicacion(): { pantalla: Pantalla; presentacion: boolean } {
  const resto = location.pathname.startsWith(BASE) ? location.pathname.slice(BASE.length).replace(/\/$/, '') : '';
  const pantalla = (Object.keys(RUTA) as Pantalla[]).find((p) => RUTA[p] === resto) ?? 'componentes';
  return { pantalla, presentacion: new URLSearchParams(location.search).has('presentacion') };
}

const href = (p: Pantalla, presentacion: boolean) => `${BASE}${RUTA[p]}${presentacion ? '?presentacion' : ''}`;

export function App() {
  const [{ pantalla, presentacion }, setUbicacion] = useState(leerUbicacion);

  useEffect(() => {
    const alVolver = () => setUbicacion(leerUbicacion());
    window.addEventListener('popstate', alVolver);
    return () => window.removeEventListener('popstate', alVolver);
  }, []);

  const ir = (p: Pantalla, pres: boolean) => (e?: MouseEvent) => {
    e?.preventDefault();
    history.pushState(null, '', href(p, pres));
    setUbicacion({ pantalla: p, presentacion: pres });
  };

  const salud = useSalud(
    servicios.map((s) => s.id),
    !presentacion && pantalla !== 'validar',
  );

  const pestanas: [Pantalla, string][] = [
    ['componentes', 'Componentes'],
    ['comunicacion', 'Comunicación'],
    ...(presentacion ? [] : [['validar', 'Validar'] as [Pantalla, string]]),
  ];
  const pantallaVisible = presentacion && pantalla === 'validar' ? 'componentes' : pantalla;

  return (
    <div className="app">
      <header className="cabecera">
        <div className="cabecera-titulo">
          <h1>Arquitectura de SAHS</h1>
          <p>{SUBTITULO[pantallaVisible]}</p>
        </div>
        <div className="cabecera-acciones">
          {!presentacion && pendientes.length > 0 && (
            <a className="aviso" href={href('validar', false)} onClick={ir('validar', false)}>
              {pendientes.length === 1 ? '1 cambio del código sin validar' : `${pendientes.length} cambios del código sin validar`} →
            </a>
          )}
          <nav className="pestanas" aria-label="Pantallas">
            {pestanas.map(([p, texto]) => (
              <a
                key={p}
                href={href(p, presentacion)}
                onClick={ir(p, presentacion)}
                aria-current={p === pantallaVisible ? 'page' : undefined}
              >
                {texto}
              </a>
            ))}
          </nav>
          <button type="button" className="boton-presentacion" aria-pressed={presentacion} onClick={() => ir(pantallaVisible, !presentacion)()}>
            {presentacion ? 'Salir de presentación' : 'Modo presentación'}
          </button>
        </div>
      </header>
      <main className="contenido">
        {pantallaVisible === 'componentes' && <Componentes key="c" salud={salud} presentacion={presentacion} />}
        {pantallaVisible === 'comunicacion' && <Comunicacion key="m" salud={salud} presentacion={presentacion} />}
        {pantallaVisible === 'validar' && <Validar />}
      </main>
    </div>
  );
}
