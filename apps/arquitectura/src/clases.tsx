/**
 * Lámina de clases: el diagrama de clases del grupo (modelo/clases.json, copiado del draw.io)
 * con cada clase dentro del recuadro del microservicio dueño de su tabla.
 */
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Handle,
  Position,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import clasesJson from '../modelo/clases.json';
import { Icono } from './iconos';

export interface Clase {
  id: string;
  nombre: string;
  servicio: string;
  atributos: string[];
}

export interface Relacion {
  de: string;
  a: string;
  nombre?: string;
  cardinalidad: string;
  /** Extremo junto al que va la cardinalidad: "de" (origen) o "a" (destino). */
  en: 'de' | 'a';
}

export const clases = clasesJson.clases as Clase[];
export const relaciones = clasesJson.relaciones as Relacion[];

/** Colores de cada microservicio, los mismos que usa el draw.io para sus clases. */
export const COLORES: Record<string, { fondo: string; cabecera: string; borde: string }> = {
  usuario: { fondo: '#eef4fd', cabecera: '#dae8fc', borde: '#6c8ebf' },
  'profesor-suplencias': { fondo: '#f3eef6', cabecera: '#e1d5e7', borde: '#9673a6' },
  pago: { fondo: '#fff5ea', cabecera: '#ffe6cc', borde: '#d79b00' },
  horarios: { fondo: '#fcebf4', cabecera: '#f6c9e1', borde: '#d80073' },
  planificacion: { fondo: '#fdeeed', cabecera: '#f8cecc', borde: '#b85450' },
  orientacion: { fondo: '#eef6ee', cabecera: '#d5e8d4', borde: '#82b366' },
};
const SIN_COLOR = { fondo: '#f7f8fa', cabecera: '#eef1f5', borde: '#c3cad4' };
export const colorDe = (servicio: string) => COLORES[servicio] ?? SIN_COLOR;

/** Puntos de conexión: en cada lado, al medio, a 1/3 y 2/3 (1 y 2) y cerca de las puntas (3 y 4). */
const LADOS: [string, Position][] = [
  ['t', Position.Top],
  ['b', Position.Bottom],
  ['l', Position.Left],
  ['r', Position.Right],
];
const PUESTOS: [string, string][] = [
  ['', '50%'],
  ['1', '33%'],
  ['2', '67%'],
  ['3', '15%'],
  ['4', '85%'],
];

function Conexiones() {
  return (
    <>
      {LADOS.flatMap(([lado, pos]) =>
        PUESTOS.flatMap(([n, donde]) => {
          const estilo = pos === Position.Top || pos === Position.Bottom ? { left: donde } : { top: donde };
          return [
            <Handle key={`s-${lado}${n}`} id={`s-${lado}${n}`} type="source" position={pos} style={estilo} className="conexion" isConnectable={false} />,
            <Handle key={`t-${lado}${n}`} id={`t-${lado}${n}`} type="target" position={pos} style={estilo} className="conexion" isConnectable={false} />,
          ];
        }),
      )}
    </>
  );
}

export type NodoClase = Node<{ clase: Clase }, 'clase'>;

export function NodoClase({ data }: NodeProps<NodoClase>) {
  const { clase: c } = data;
  const color = colorDe(c.servicio);
  return (
    <div className="clase" style={{ borderColor: color.borde }}>
      <Conexiones />
      <span className="clase-nombre" style={{ background: color.cabecera, borderColor: color.borde }}>
        {c.nombre}
      </span>
      <span className="clase-atributos">
        {c.atributos.map((a) => (
          <span key={a}>{a}</span>
        ))}
      </span>
    </div>
  );
}

export type NodoGrupo = Node<{ nombre: string; icono: string; servicio: string }, 'grupo'>;

export function NodoGrupo({ data }: NodeProps<NodoGrupo>) {
  const color = colorDe(data.servicio);
  return (
    <div className="grupo" style={{ background: color.fondo, borderColor: color.borde }}>
      <span className="grupo-titulo" style={{ color: color.borde }}>
        <Icono nombre={data.icono} tamanio={20} />
        {data.nombre}
      </span>
    </div>
  );
}

export type AristaRelacion = Edge<{ relacion: Relacion; centro?: number; angosta?: boolean; cruza: boolean }, 'relacion'>;

/** Lugar de la cardinalidad: un poco afuera del lado de la clase y corrida de la línea. */
function junto(x: number, y: number, pos: Position): [number, number] {
  if (pos === Position.Top) return [x + 11, y - 13];
  if (pos === Position.Bottom) return [x + 11, y + 13];
  if (pos === Position.Left) return [x - 13, y - 11];
  return [x + 13, y - 11];
}

export function AristaRelacion(props: EdgeProps<AristaRelacion>) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, style } = props;
  const [camino, nx, ny] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 6,
    offset: 20,
    centerY: data?.centro,
  });
  const r = data?.relacion;
  const [cx, cy] = r?.en === 'de' ? junto(sourceX, sourceY, sourcePosition) : junto(targetX, targetY, targetPosition);
  return (
    <>
      <BaseEdge path={camino} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        {r?.nombre && (
          <span className={`relacion-nombre${data?.angosta ? ' angosta' : ''}`} style={{ transform: `translate(-50%, -50%) translate(${nx}px, ${ny}px)` }}>
            {r.nombre}
          </span>
        )}
        {r && (
          <span className="relacion-cardinalidad" style={{ transform: `translate(-50%, -50%) translate(${cx}px, ${cy}px)` }}>
            {r.cardinalidad}
          </span>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export const LINEA_CRUZA = '#4a5462';

export type NodoLeyendaClases = Node<{ linea: string }, 'leyendaClases'>;

export function NodoLeyendaClases({ data }: NodeProps<NodoLeyendaClases>) {
  return (
    <div className="leyenda leyenda-clases">
      <span>
        <i style={{ background: data.linea }} /> relación dentro del microservicio (clave foránea)
      </span>
      <span>
        <i className="punteada" style={{ color: LINEA_CRUZA }} /> relación entre microservicios (se guarda el id, sin clave foránea)
      </span>
      <span>
        <b className="mono">1 · N · M</b> cardinalidad
      </span>
    </div>
  );
}

export const tiposDeArista = { relacion: AristaRelacion };
