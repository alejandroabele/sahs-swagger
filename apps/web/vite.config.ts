import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * En desarrollo, Vite hace de proxy hacia cada servicio (puertos 8081 a 8086), igual
 * que el nginx de producción. Así la web siempre llama por el mismo origen.
 * La API va bajo /api (las rutas /planificaciones/... también son pantallas de la web)
 * y el proxy le quita el /api antes de pasarla al servicio.
 */
const SERVICIOS: Record<string, number> = {
  usuario: 8081,
  pago: 8082,
  horarios: 8083,
  planificacion: 8084,
  orientacion: 8085,
  profesor_suplencias: 8086,
};

/** Prefijos de ruta de cada servicio. Planificación publica además /planificaciones. */
const PREFIJOS: [string, number][] = [
  ...Object.entries(SERVICIOS).map(([s, p]): [string, number] => [s.replace(/_/g, '-'), p]),
  ['planificaciones', SERVICIOS.planificacion],
];

// Con SAHS_API (por ejemplo http://localhost:8100, la web de Docker) todo va a esa dirección,
// que ya espera el /api; si no, va directo a cada servicio sin el /api.
const base = process.env.SAHS_API;
const proxy = Object.fromEntries(
  PREFIJOS.map(([prefijo, p]) => [
    `/api/${prefijo}/`,
    base
      ? { target: base, changeOrigin: true }
      : { target: `http://localhost:${p}`, changeOrigin: true, rewrite: (ruta: string) => ruta.replace(/^\/api/, '') },
  ]),
);

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
  build: { outDir: 'dist', sourcemap: false },
});
