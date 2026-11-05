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

// Lámina 3 · Clases (diagrama de clases del grupo, agrupado por microservicio)
export const ANCHO_CLASE = 208;

/** Alto de una clase según sus atributos (cabecera de 36, 20 por atributo y 12 de margen). */
export const altoClase = (atributos: number) => 48 + atributos * 20;

/** Esquina superior izquierda de cada clase (ids de modelo/clases.json). */
export const CLASES: Record<string, { x: number; y: number }> = {
  privilegios: { x: 64, y: 192 },
  rol: { x: 328, y: 192 },
  usuario: { x: 592, y: 182 },
  profesor: { x: 880, y: 112 },
  suplencia: { x: 1160, y: 240 },
  pago: { x: 1448, y: 140 },
  recibo: { x: 1712, y: 120 },
  dia_lectivo: { x: 64, y: 556 },
  franja: { x: 328, y: 536 },
  turno: { x: 328, y: 776 },
  estado: { x: 624, y: 566 },
  planificacion: { x: 888, y: 536 },
  clase: { x: 1160, y: 536 },
  ciclo: { x: 624, y: 776 },
  curso: { x: 888, y: 776 },
  anio: { x: 1160, y: 766 },
  materia: { x: 1448, y: 526 },
  area: { x: 1712, y: 526 },
  orientacion: { x: 1448, y: 756 },
};

/** Recuadro de cada microservicio. */
export const GRUPOS: Record<string, Caja> = {
  usuario: { x: 40, y: 40, w: 776, h: 352 },
  'profesor-suplencias': { x: 864, y: 40, w: 512, h: 352 },
  pago: { x: 1424, y: 40, w: 512, h: 352 },
  horarios: { x: 40, y: 464, w: 512, h: 496 },
  planificacion: { x: 600, y: 464, w: 784, h: 496 },
  orientacion: { x: 1424, y: 464, w: 512, h: 496 },
};

export const LEYENDA_CLASES: Caja = { x: 40, y: 992, w: 1896, h: 48 };

/**
 * Lados de cada relación (clave "de>a"). Los lados son t, b, l y r; con 1 y 2 a 1/3 y 2/3,
 * y con 3 y 4 cerca de las puntas. `centro` es la altura del tramo horizontal, para que dos
 * relaciones que salen juntas no se pisen. `angosta` parte el nombre en dos renglones cuando el tramo es corto.
 */
export const RUTAS_CLASES: Record<string, { sale: string; llega: string; centro?: number; angosta?: boolean }> = {
  'usuario>rol': { sale: 'l', llega: 'r' },
  'rol>privilegios': { sale: 'l', llega: 'r' },
  'profesor>usuario': { sale: 'l', llega: 'r' },
  'pago>profesor': { sale: 'l', llega: 'r1' },
  'pago>recibo': { sale: 'r', llega: 'l' },
  'suplencia>profesor': { sale: 'l', llega: 'r2', angosta: true },
  'suplencia>clase': { sale: 'b2', llega: 't2' },
  'profesor>clase': { sale: 'b1', llega: 't1', centro: 452 },
  'profesor>materia': { sale: 'b', llega: 't2', centro: 436 },
  'profesor>franja': { sale: 'b3', llega: 't1', centro: 428 },
  'area>profesor': { sale: 't', llega: 'b2', centro: 420 },
  'turno>franja': { sale: 't', llega: 'b' },
  'franja>dia_lectivo': { sale: 'l', llega: 'r' },
  'planificacion>estado': { sale: 'l', llega: 'r' },
  'planificacion>ciclo': { sale: 'b1', llega: 't', centro: 740 },
  'planificacion>clase': { sale: 'r1', llega: 'l' },
  'clase>franja': { sale: 't3', llega: 't2' },
  'clase>curso': { sale: 'b', llega: 't2', centro: 710 },
  'curso>turno': { sale: 'b1', llega: 'b' },
  'curso>ciclo': { sale: 'l', llega: 'r' },
  'anio>curso': { sale: 'l', llega: 'r' },
  'anio>orientacion': { sale: 'r', llega: 'l' },
  'materia>clase': { sale: 'l', llega: 'r' },
  'area>materia': { sale: 'l', llega: 'r' },
  'orientacion>materia': { sale: 't', llega: 'b' },
  'orientacion>curso': { sale: 'b', llega: 'b2' },
};
