import { useEffect, type ReactNode } from 'react';
import { MarkerType, ReactFlow, ReactFlowProvider, useReactFlow, type Edge, type Node } from '@xyflow/react';
import { tiposDeNodo } from './nodos';
import type { Marca } from './modelo';

export const COLOR = {
  linea: '#7a8393',
  mutua: '#2e5aa8',
  pendiente: '#c08430',
};

/** Estilo de una arista según su color y si está validada. */
export function estiloArista(color: string, marca: Marca, dobleFlecha = false): Pick<Edge, 'style' | 'markerEnd' | 'markerStart'> {
  const c = marca === 'validado' ? color : COLOR.pendiente;
  const flecha = { type: MarkerType.ArrowClosed, color: c, width: 18, height: 18 };
  return {
    style: {
      stroke: c,
      strokeWidth: 2,
      strokeDasharray: marca === 'validado' ? undefined : '6 6',
      opacity: marca === 'eliminado' ? 0.55 : 1,
    },
    markerEnd: flecha,
    markerStart: dobleFlecha ? flecha : undefined,
  };
}

/** Vuelve a encuadrar el diagrama cuando cambia el tamaño de la ventana. */
function Encuadre() {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const ajustar = () => fitView({ padding: 0.04 });
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
  }, [fitView]);
  return null;
}

export function Diagrama({
  nodos,
  aristas,
  children,
}: {
  nodos: Node[];
  aristas: Edge[];
  children?: ReactNode;
}) {
  return (
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodos}
        edges={aristas}
        nodeTypes={tiposDeNodo}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.04 }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Encuadre />
        {children}
      </ReactFlow>
    </ReactFlowProvider>
  );
}
