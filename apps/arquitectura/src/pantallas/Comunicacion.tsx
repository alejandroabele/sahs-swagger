import { useMemo } from 'react';
import { Panel, type Edge, type Node } from '@xyflow/react';
import { COLOR, Diagrama, estiloArista } from '../Diagrama';
import { RUTAS, cajaEnGrilla } from '../layout';
import { llamadas, servicios, type Llamada, type Marca } from '../modelo';
import type { Salud } from '../salud';

/** Une A→B y B→A en una sola arista con flecha en las dos puntas. */
function aristasDeLlamadas(lista: Llamada[]): Edge[] {
  const hechas = new Set<string>();
  const aristas: Edge[] = [];
  for (const l of lista) {
    const ida = `${l.de}>${l.a}`;
    const vuelta = `${l.a}>${l.de}`;
    if (hechas.has(ida)) continue;
    const otra = lista.find((x) => x.de === l.a && x.a === l.de);
    hechas.add(ida);
    if (otra) hechas.add(vuelta);

    // Para un par mutuo se dibuja la dirección que tiene ruta en el layout.
    const [de, a] = otra && !RUTAS[ida] && RUTAS[vuelta] ? [l.a, l.de] : [l.de, l.a];
    const ruta = RUTAS[`${de}>${a}`] ?? { sale: 'r', llega: 'l' };
    const marcas = [l.marca, otra?.marca].filter(Boolean) as Marca[];
    const marca: Marca = marcas.find((m) => m !== 'validado') ?? 'validado';
    aristas.push({
      id: `${de}>${a}`,
      source: de,
      target: a,
      sourceHandle: `s-${ruta.sale}`,
      targetHandle: `t-${ruta.llega}`,
      type: 'smoothstep',
      ...estiloArista(otra ? COLOR.mutua : COLOR.linea, marca, Boolean(otra)),
    });
  }
  return aristas;
}

export function Comunicacion({ salud, presentacion }: { salud: Record<string, Salud>; presentacion: boolean }) {
  const { nodos, aristas } = useMemo(() => {
    const ids = servicios.map((s) => s.id);
    const nodos: Node[] = servicios.map((s) => {
      const c = cajaEnGrilla(s.id, ids);
      return {
        id: s.id,
        type: 'servicio',
        data: { servicio: s, salud: salud[s.id], mostrarSalud: !presentacion, forma: 'fila' },
        position: { x: c.x, y: c.y },
        width: c.w,
        height: c.h,
        style: { width: c.w, height: c.h },
      };
    });
    return { nodos, aristas: aristasDeLlamadas(llamadas) };
  }, [salud, presentacion]);

  return (
    <Diagrama nodos={nodos} aristas={aristas} presentacion={presentacion}>
      <Panel position="bottom-left" className="leyenda">
        <span>
          <i style={{ background: COLOR.linea }} /> llama a otro servicio
        </span>
        <span>
          <i style={{ background: COLOR.mutua }} /> se llaman entre sí
        </span>
      </Panel>
    </Diagrama>
  );
}
