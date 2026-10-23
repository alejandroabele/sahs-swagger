import { Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Lienzo } from '../componentes/Lienzo';
import { Cargando } from '../componentes/Estados';
import { useSesion } from '../estado/sesion';
import { PANTALLAS, puedeVer } from './pantallas';

/**
 * Muestra la pantalla de la URL (/A5, /P2...). Sin sesión, cualquier ruta muestra el Login.
 * Con sesión, si el rol no tiene el privilegio de la pantalla, vuelve al inicio.
 */
function Pantalla() {
  const { codigo = 'A1' } = useParams();
  const sesion = useSesion();
  const def = PANTALLAS[codigo];

  useEffect(() => {
    if (def) document.title = 'SAHS · ' + def.titulo;
  }, [def]);

  if (!sesion.iniciada) return codigo === 'L1' ? <Mostrar codigo="L1" /> : <Navigate to="/L1" replace />;
  if (codigo === 'L1') return <Navigate to="/A1" replace />;
  if (sesion.cargando) return <Lienzo ancho={1440}><Cargando /></Lienzo>;
  if (!def || !puedeVer(codigo, sesion.privilegios)) return <Navigate to="/A1" replace />;
  return <Mostrar codigo={codigo} />;
}

function Mostrar({ codigo }: { codigo: string }) {
  const def = PANTALLAS[codigo];
  const C = def.componente;
  return (
    <Lienzo ancho={def.ancho} key={codigo}>
      <Suspense fallback={<Cargando />}>
        <C />
      </Suspense>
    </Lienzo>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/A1" replace />} />
      <Route path="/login" element={<Navigate to="/L1" replace />} />
      <Route path="/:codigo" element={<Pantalla />} />
      <Route path="*" element={<Navigate to="/A1" replace />} />
    </Routes>
  );
}
