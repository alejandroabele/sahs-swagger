import { useEffect, useState, type MouseEvent } from 'react';
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

// Validar no tiene pestaña: se entra por /arquitectura/validar.
const PESTANAS: [Pantalla, string][] = [
  ['componentes', 'Componentes'],
  ['comunicacion', 'Comunicación'],
];

function leerPantalla(): Pantalla {
  const resto = location.pathname.startsWith(BASE) ? location.pathname.slice(BASE.length).replace(/\/$/, '') : '';
  return (Object.keys(RUTA) as Pantalla[]).find((p) => RUTA[p] === resto) ?? 'componentes';
}

const href = (p: Pantalla) => `${BASE}${RUTA[p]}`;

export function App() {
  const [pantalla, setPantalla] = useState(leerPantalla);

  useEffect(() => {
    const alVolver = () => setPantalla(leerPantalla());
    window.addEventListener('popstate', alVolver);
    return () => window.removeEventListener('popstate', alVolver);
  }, []);

  const ir = (p: Pantalla) => (e: MouseEvent) => {
    e.preventDefault();
    history.pushState(null, '', href(p));
    setPantalla(p);
  };

  return (
    <div className="app">
      <header className="cabecera">
        <div className="cabecera-titulo">
          <h1>Arquitectura de SAHS</h1>
          <p>{SUBTITULO[pantalla]}</p>
        </div>
        <div className="cabecera-acciones">
          <nav className="pestanas" aria-label="Pantallas">
            {PESTANAS.map(([p, texto]) => (
              <a key={p} href={href(p)} onClick={ir(p)} aria-current={p === pantalla ? 'page' : undefined}>
                {texto}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="contenido">
        {pantalla === 'componentes' && <Componentes key="c" />}
        {pantalla === 'comunicacion' && <Comunicacion key="m" />}
        {pantalla === 'validar' && <Validar />}
      </main>
    </div>
  );
}
