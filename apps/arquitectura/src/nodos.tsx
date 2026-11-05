import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Icono } from './iconos';
import type { Componente, Servicio } from './modelo';
import type { Salud } from './salud';

/**
 * Puntos de conexión de cada nodo. Cada lado tiene uno de salida (s-) y uno de llegada (t-);
 * abajo hay tres (b1 a 1/3, b en el medio y b2 a 2/3) para que dos aristas no salgan juntas.
 * Los ids los usa layout.ts.
 */
const LADOS: { id: string; pos: Position; estilo?: React.CSSProperties }[] = [
  { id: 't', pos: Position.Top },
  { id: 'b', pos: Position.Bottom },
  { id: 'b1', pos: Position.Bottom, estilo: { left: '33%' } },
  { id: 'b2', pos: Position.Bottom, estilo: { left: '67%' } },
  { id: 'l', pos: Position.Left },
  { id: 'r', pos: Position.Right },
];

function Conexiones() {
  return (
    <>
      {LADOS.flatMap(({ id, pos, estilo }) => [
        <Handle key={`s-${id}`} id={`s-${id}`} type="source" position={pos} style={estilo} className="conexion" isConnectable={false} />,
        <Handle key={`t-${id}`} id={`t-${id}`} type="target" position={pos} style={estilo} className="conexion" isConnectable={false} />,
      ])}
    </>
  );
}

const TIPO: Record<Componente['tipo'], string> = {
  personas: 'personas',
  cliente: 'cliente',
  servidor: 'servidor',
  almacenamiento: 'almacenamiento',
};

export type NodoComponente = Node<{ componente: Componente; oscuro?: boolean }, 'componente'>;

export function NodoComponente({ data }: NodeProps<NodoComponente>) {
  const { componente: c, oscuro } = data;
  return (
    <div className={`tarjeta tarjeta-componente${oscuro ? ' oscura' : ''}`}>
      <Conexiones />
      <span className="icono">
        <Icono nombre={c.icono} tamanio={28} />
      </span>
      <span className="texto">
        <span className="titulo">
          <b>{c.nombre}</b> <span className="tipo">{TIPO[c.tipo]}</span>
        </span>
        <span className="descripcion">{c.descripcion}</span>
      </span>
    </div>
  );
}

export type NodoServicio = Node<
  { servicio: Servicio; salud?: Salud; mostrarSalud: boolean; forma: 'columna' | 'fila' },
  'servicio'
>;

const TEXTO_SALUD: Record<Salud, string> = {
  arriba: 'en línea',
  caido: 'sin respuesta',
  desconocido: 'consultando',
};

export function NodoServicio({ data }: NodeProps<NodoServicio>) {
  const { servicio: s, salud = 'desconocido', mostrarSalud, forma } = data;
  return (
    <div className={`tarjeta tarjeta-servicio ${forma} marca-${s.marca}`}>
      <Conexiones />
      <span className="icono verde">
        <Icono nombre={s.icono} />
      </span>
      <span className="texto">
        <span className="titulo">
          <b>{s.nombre}</b>
          {mostrarSalud && (
            <span className={`salud salud-${salud}`} title={TEXTO_SALUD[salud]} role="img" aria-label={TEXTO_SALUD[salud]} />
          )}
        </span>
        <span className="descripcion">
          {s.marca === 'nuevo' ? 'Nuevo en el código: falta validarlo' : s.marca === 'eliminado' ? 'Ya no está en el código' : s.descripcion}
        </span>
      </span>
    </div>
  );
}

export type NodoBanda = Node<{ titulo: string }, 'banda'>;

export function NodoBanda({ data }: NodeProps<NodoBanda>) {
  return (
    <div className="banda">
      <span className="banda-titulo">{data.titulo}</span>
    </div>
  );
}

const GLOSARIO: { icono: string; termino: string; texto: string; verde?: boolean }[] = [
  { icono: 'cliente', termino: 'Cliente', texto: 'el programa que usa la persona. Acá, la aplicación web en el navegador de una computadora o un celular.' },
  { icono: 'servidor', termino: 'Servidor', texto: 'un programa que espera pedidos por la red y los responde.' },
  { icono: 'gateway', termino: 'API Gateway', texto: 'el servidor que recibe todos los pedidos del cliente y le pasa cada uno al microservicio que corresponde.' },
  { icono: 'microservicio', termino: 'Microservicio', texto: 'un servidor chico e independiente que resuelve una parte del negocio con su propia API.', verde: true },
  { icono: 'base', termino: 'Base de datos', texto: 'donde quedan guardados los datos.' },
];

export type NodoGlosario = Node<Record<string, never>, 'glosario'>;

export function NodoGlosario() {
  return (
    <div className="glosario">
      <span className="glosario-titulo">Qué es cada pieza</span>
      {GLOSARIO.map((g) => (
        <span key={g.termino} className="glosario-item">
          <span className={g.verde ? 'verde' : ''}>
            <Icono nombre={g.icono} tamanio={20} />
          </span>
          <span>
            <b>{g.termino}:</b> {g.texto}
          </span>
        </span>
      ))}
    </div>
  );
}

export const tiposDeNodo = {
  componente: NodoComponente,
  servicio: NodoServicio,
  banda: NodoBanda,
  glosario: NodoGlosario,
};
