export interface Llamada {
  de: string;
  a: string;
}

export interface ServicioGenerado {
  id: string;
  tablas: string[];
}

export interface ModeloGenerado {
  generado: string;
  servicios: ServicioGenerado[];
  llamadas: Llamada[];
  contenedores: string[];
}

export type TipoPieza = 'personas' | 'cliente' | 'servidor' | 'almacenamiento';

export interface Componente {
  nombre: string;
  tipo: TipoPieza;
  descripcion: string;
  icono: string;
}

export interface ServicioValidado extends ServicioGenerado {
  nombre: string;
  descripcion: string;
  icono: string;
}

export interface ModeloValidado {
  validado: string;
  componentes: Record<'usuarios' | 'web' | 'gateway' | 'base', Componente>;
  servicios: ServicioValidado[];
  llamadas: Llamada[];
  contenedores: string[];
}

export interface Diferencia {
  clave: string;
  tipo: 'servicio' | 'llamada' | 'contenedor' | 'tablas';
  cambio: 'nuevo' | 'eliminado' | 'cambiado';
  descripcion: string;
  origen: string;
  id?: string;
  de?: string;
  a?: string;
  agregadas?: string[];
  quitadas?: string[];
}

export function diferencias(generado: ModeloGenerado, validado: ModeloValidado): Diferencia[];
export function aplicar(validado: ModeloValidado, dif: Diferencia, generado: ModeloGenerado): ModeloValidado;
