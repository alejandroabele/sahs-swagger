import { useMemo } from 'react';
import type { Edge, Node } from '@xyflow/react';
import { COLOR, Diagrama, estiloArista } from '../Diagrama';
import { COMPONENTES, bandaFila, cajaEnFila, type Caja } from '../layout';
import { componentes, servicios } from '../modelo';
import type { Salud } from '../salud';

const ubicar = (c: Caja) => ({ position: { x: c.x, y: c.y }, width: c.w, height: c.h, style: { width: c.w, height: c.h } });

export function Componentes({ salud, presentacion }: { salud: Record<string, Salud>; presentacion: boolean }) {
  const { nodos, aristas } = useMemo(() => {
    const ids = servicios.map((s) => s.id);
    const nodos: Node[] = [
      { id: 'banda', type: 'banda', data: { titulo: 'Microservicios (servidores)' }, zIndex: -1, ...ubicar(bandaFila(ids.length)) },
      { id: 'usuarios', type: 'componente', data: { componente: componentes.usuarios }, ...ubicar(COMPONENTES.usuarios) },
      { id: 'web', type: 'componente', data: { componente: componentes.web }, ...ubicar(COMPONENTES.web) },
      { id: 'gateway', type: 'componente', data: { componente: componentes.gateway, oscuro: true }, ...ubicar(COMPONENTES.gateway) },
      { id: 'base', type: 'componente', data: { componente: componentes.base }, ...ubicar(COMPONENTES.base) },
      {
        id: 'glosario',
        type: 'glosario',
        data: {},
        position: { x: COMPONENTES.glosario.x, y: COMPONENTES.glosario.y },
        width: COMPONENTES.glosario.w,
        style: { width: COMPONENTES.glosario.w },
      },
      ...servicios.map((s) => ({
        id: s.id,
        type: 'servicio',
        data: { servicio: s, salud: salud[s.id], mostrarSalud: !presentacion, forma: 'columna' },
        ...ubicar(cajaEnFila(s.id, ids)),
      })),
    ];
    const gris = estiloArista(COLOR.linea, 'validado');
    const aristas: Edge[] = [
      { id: 'usuarios-web', source: 'usuarios', target: 'web', sourceHandle: 's-b', targetHandle: 't-t', type: 'straight', ...gris },
      {
        id: 'web-gateway',
        source: 'web',
        target: 'gateway',
        sourceHandle: 's-b',
        targetHandle: 't-t',
        type: 'straight',
        label: 'HTTP · JSON',
        labelStyle: { fill: '#4a5462', fontSize: 13 },
        labelBgStyle: { fill: '#f7f8fa' },
        ...gris,
      },
      ...servicios.flatMap((s): Edge[] => [
        { id: `gateway-${s.id}`, source: 'gateway', target: s.id, sourceHandle: 's-b', targetHandle: 't-t', type: 'smoothstep', ...estiloArista(COLOR.linea, s.marca) },
        { id: `${s.id}-base`, source: s.id, target: 'base', sourceHandle: 's-b', targetHandle: 't-t', type: 'smoothstep', ...estiloArista(COLOR.linea, s.marca) },
      ]),
    ];
    return { nodos, aristas };
  }, [salud, presentacion]);

  return <Diagrama nodos={nodos} aristas={aristas} presentacion={presentacion} />;
}
