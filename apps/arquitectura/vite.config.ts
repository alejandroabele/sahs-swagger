import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** La app vive bajo /arquitectura/ (el nginx de web la pasa a su contenedor). */
export default defineConfig({
  base: '/arquitectura/',
  plugins: [react()],
  server: { port: 5174 },
  preview: { port: 4174 },
  build: { outDir: 'dist', sourcemap: false },
});
