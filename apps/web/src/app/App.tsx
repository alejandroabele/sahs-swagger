import { Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Lienzo } from '../componentes/Lienzo';
import { Cargando } from '../componentes/Estados';
import { useSesion } from '../estado/sesion';
import { PANTALLAS, puedeVer } from './pantallas';
import { RUTAS, rutas } from './rutas';

/**
 * Muestra la pantalla de una ruta. Sin sesión, cualquier ruta lleva al Login.
 * Con sesión, si el rol no tiene el privilegio de la pantalla, vuelve al inicio.
 */
function Pantalla({ codigo }: { codigo: string }) {
  const sesion = useSesion();
  const def = PANTALLAS[codigo];

  useEffect(() => {
    document.title = 'SAHS · ' + def.titulo;
  }, [def]);

  if (!sesion.iniciada) return codigo === 'L1' ? <Mostrar codigo="L1" /> : <Navigate to={rutas.login()} replace />;
  if (codigo === 'L1') return <Navigate to={rutas.inicio()} replace />;
  if (sesion.cargando) return <Lienzo ancho={1440}><Cargando /></Lienzo>;
  if (!puedeVer(codigo, sesion.privilegios)) return <Navigate to={rutas.inicio()} replace />;
  return <Mostrar codigo={codigo} />;
}

function Mostrar({ codigo }: { codigo: string }) {
  const def = PANTALLAS[codigo];
  const C = def.componente;
  // Al cambiar de URL (otra ficha, otro curso) la pantalla arranca de cero.
  const { pathname } = useLocation();
  return (
    <Lienzo ancho={def.ancho} key={pathname}>
      <Suspense fallback={<Cargando />}>
        <C />
      </Suspense>
    </Lienzo>
  );
}

export function App() {
  return (
    <Routes>
      {Object.entries(RUTAS).flatMap(([codigo, patrones]) =>
        patrones.map((path) => <Route key={path} path={path} element={<Pantalla codigo={codigo} />} />),
      )}
      <Route path="*" element={<Navigate to={rutas.inicio()} replace />} />
    </Routes>
  );
}
