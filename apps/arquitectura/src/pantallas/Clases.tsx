import { useMemo } from 'react';
import { MarkerType, type Edge, type Node } from '@xyflow/react';
import { COLOR, Diagrama } from '../Diagrama';
import { LINEA_CRUZA, clases, relaciones } from '../clases';
import { ANCHO_CLASE, CLASES, GRUPOS, LEYENDA_CLASES, RUTAS_CLASES, altoClase } from '../layout';
import { validado } from '../modelo';

export function Clases() {
  const { nodos, aristas } = useMemo(() => {
    const servicioDe = new Map(clases.map((c) => [c.id, c.servicio]));
    const grupos: Node[] = Object.entries(GRUPOS).map(([id, g]) => {
      const s = validado.servicios.find((v) => v.id === id);
      return {
        id: `grupo-${id}`,
        type: 'grupo',
        data: { nombre: s?.nombre ?? id, icono: s?.icono ?? 'microservicio', servicio: id },
        position: { x: g.x, y: g.y },
        width: g.w,
        height: g.h,
        style: { width: g.w, height: g.h },
        zIndex: -1,
      };
    });
    const nodosClase: Node[] = clases.map((c) => {
      const p = CLASES[c.id] ?? { x: 0, y: 1000 };
      const h = altoClase(c.atributos.length);
      return { id: c.id, type: 'clase', data: { clase: c }, position: p, width: ANCHO_CLASE, height: h, style: { width: ANCHO_CLASE, height: h } };
    });
    const aristas: Edge[] = relaciones.map((r) => {
      const ruta = RUTAS_CLASES[`${r.de}>${r.a}`];
      const cruza = servicioDe.get(r.de) !== servicioDe.get(r.a);
      const color = cruza ? LINEA_CRUZA : COLOR.linea;
      return {
        id: `${r.de}>${r.a}`,
        source: r.de,
        target: r.a,
        sourceHandle: ruta ? `s-${ruta.sale}` : undefined,
        targetHandle: ruta ? `t-${ruta.llega}` : undefined,
        type: 'relacion',
        data: { relacion: r, centro: ruta?.centro, angosta: ruta?.angosta, cruza },
        style: { stroke: color, strokeWidth: 1.6, strokeDasharray: cruza ? '6 5' : undefined },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
      };
    });
    const L = LEYENDA_CLASES;
    const leyenda: Node = {
      id: 'leyenda',
      type: 'leyendaClases',
      data: { linea: COLOR.linea },
      position: { x: L.x, y: L.y },
      width: L.w,
      height: L.h,
      style: { width: L.w, height: L.h },
    };
    return { nodos: [...grupos, ...nodosClase, leyenda], aristas };
  }, []);

  return <Diagrama nodos={nodos} aristas={aristas} />;
}
