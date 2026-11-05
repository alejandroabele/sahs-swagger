/**
 * Modelo que dibujan los diagramas: lo validado (validado.json) más lo que el código tiene
 * y nadie aprobó todavía (generado.json), marcado para que se vea distinto.
 */
import validadoJson from '../modelo/validado.json';
import generadoJson from '../modelo/generado.json';
import { diferencias } from '../modelo/diferencias.mjs';
import type { Componente, Diferencia, ModeloGenerado, ModeloValidado } from '../modelo/diferencias.mjs';

export type Marca = 'validado' | 'nuevo' | 'eliminado';

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  tablas: number;
  marca: Marca;
}

export interface Llamada {
  de: string;
  a: string;
  marca: Marca;
}

export const validado = validadoJson as ModeloValidado;
export const generado = generadoJson as ModeloGenerado;
export const pendientes: Diferencia[] = diferencias(generado, validado);

const marcaDe = (clave: string): Marca => {
  const d = pendientes.find((p) => p.clave === clave);
  return d?.cambio === 'nuevo' ? 'nuevo' : d?.cambio === 'eliminado' ? 'eliminado' : 'validado';
};

export const componentes: ModeloValidado['componentes'] = validado.componentes;

export const servicios: Servicio[] = [
  ...validado.servicios.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    descripcion: s.descripcion,
    icono: s.icono,
    tablas: s.tablas.length,
    marca: marcaDe(`servicio:${s.id}`),
  })),
  ...generado.servicios
    .filter((s) => !validado.servicios.some((v) => v.id === s.id))
    .map((s) => ({ id: s.id, nombre: s.id, descripcion: '', icono: 'servicio', tablas: s.tablas.length, marca: 'nuevo' as const })),
];

export const llamadas: Llamada[] = [
  ...validado.llamadas.map((l) => ({ ...l, marca: marcaDe(`llamada:${l.de}>${l.a}`) })),
  ...pendientes
    .filter((d) => d.tipo === 'llamada' && d.cambio === 'nuevo')
    .map((d) => ({ de: d.de!, a: d.a!, marca: 'nuevo' as const })),
];

export type { Componente, Diferencia };
