import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * La app vive bajo /arquitectura/ (el nginx de web la pasa a su contenedor).
 * En desarrollo, Vite hace lo mismo que el nginx de arquitectura con la salud de cada
 * servicio: /arquitectura/salud/<servicio> → http://localhost:808x/actuator/health.
 */
const PUERTOS: Record<string, number> = {
  usuario: 8081,
  pago: 8082,
  horarios: 8083,
  planificacion: 8084,
  orientacion: 8085,
  'profesor-suplencias': 8086,
};

const proxy = Object.fromEntries(
  Object.entries(PUERTOS).map(([svc, puerto]) => [
    `/arquitectura/salud/${svc}`,
    { target: `http://localhost:${puerto}`, changeOrigin: true, rewrite: () => '/actuator/health' },
  ]),
);

export default defineConfig({
  base: '/arquitectura/',
  plugins: [react()],
  server: { port: 5174, proxy },
  preview: { port: 4174, proxy },
  build: { outDir: 'dist', sourcemap: false },
});
