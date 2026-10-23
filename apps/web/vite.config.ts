import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * En desarrollo, Vite hace de proxy hacia cada servicio (puertos 8081 a 8086), igual
 * que el nginx de producción. Así la web siempre llama por el mismo origen.
 */
const SERVICIOS: Record<string, number> = {
  usuario: 8081,
  pago: 8082,
  horarios: 8083,
  planificacion: 8084,
  orientacion: 8085,
  profesor_suplencias: 8086,
};

const proxy = Object.fromEntries(
  Object.entries(SERVICIOS).map(([s, p]) => [`/${s}/`, { target: `http://localhost:${p}`, changeOrigin: true }]),
);

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
  build: { outDir: 'dist', sourcemap: false },
});
