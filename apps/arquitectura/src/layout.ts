/**
 * Posiciones de los diagramas, tomadas del diseño (canvas "SAHS Arquitectura").
 * Un servicio que no está acá (uno nuevo) cae al final: no hace falta tocar el layout
 * para que se vea, solo para que quede prolijo.
 */

export interface Caja {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Lámina 1 · Componentes
export const COMPONENTES = {
  usuarios: { x: 712, y: 160, w: 496, h: 80 },
  web: { x: 760, y: 288, w: 400, h: 80 },
  gateway: { x: 720, y: 416, w: 480, h: 80 },
  base: { x: 560, y: 872, w: 800, h: 96 },
  glosario: { x: 1296, y: 120, w: 560, h: 352 },
};

/** Orden de los servicios en la fila de la lámina 1. */
export const ORDEN_FILA = ['usuario', 'horarios', 'orientacion', 'planificacion', 'profesor-suplencias', 'pago'];

export function cajaEnFila(id: string, todos: string[]): Caja {
  const orden = [...ORDEN_FILA.filter((s) => todos.includes(s)), ...todos.filter((s) => !ORDEN_FILA.includes(s))];
  const i = orden.indexOf(id);
  return { x: 72 + i * 304, y: 584, w: 256, h: 168 };
}

export function bandaFila(cantidad: number): Caja {
  return { x: 48, y: 560, w: Math.max(1824, 48 + cantidad * 304), h: 240 };
}

// Lámina 2 · Comunicación
const GRILLA: Record<string, { x: number; y: number }> = {
  pago: { x: 600, y: 232 },
  planificacion: { x: 168, y: 432 },
  'profesor-suplencias': { x: 1032, y: 432 },
  usuario: { x: 1464, y: 432 },
  orientacion: { x: 600, y: 632 },
  horarios: { x: 1464, y: 632 },
};

export function cajaEnGrilla(id: string, todos: string[]): Caja {
  const fijo = GRILLA[id];
  if (fijo) return { ...fijo, w: 288, h: 104 };
  const extra = todos.filter((s) => !GRILLA[s]).indexOf(id);
  return { x: 168 + extra * 432, y: 872, w: 288, h: 104 };
}

/**
 * Lados por los que sale y llega cada llamada (ids de nodos.tsx). La clave es "de>a";
 * para los pares que se llaman entre sí, la de la dirección que se dibuja.
 */
export const RUTAS: Record<string, { sale: string; llega: string }> = {
  'pago>planificacion': { sale: 'l', llega: 't' },
  'pago>profesor-suplencias': { sale: 'r', llega: 't' },
  'planificacion>profesor-suplencias': { sale: 'r', llega: 'l' },
  'planificacion>orientacion': { sale: 'b2', llega: 'l' },
  'profesor-suplencias>orientacion': { sale: 'b1', llega: 'r' },
  'profesor-suplencias>usuario': { sale: 'r', llega: 'l' },
  'profesor-suplencias>horarios': { sale: 'b2', llega: 'l' },
  'planificacion>horarios': { sale: 'b1', llega: 'b' },
};
