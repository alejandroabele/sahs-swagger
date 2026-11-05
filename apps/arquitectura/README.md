# @sahs/arquitectura

Vista de arquitectura de SAHS (React + Vite + React Flow), publicada en http://localhost:8100/arquitectura/.

- `/arquitectura/`: Componentes (usuarios → aplicación web → API Gateway → microservicios → base de datos).
- `/arquitectura/comunicacion`: llamadas HTTP entre microservicios. Cada servicio lleva su color (`COLORES` en `src/clases.tsx`), el mismo de las láminas de clases.
- `/arquitectura/clases`: el diagrama de clases del grupo, sin agrupar y sin colores.
- `/arquitectura/clases-por-microservicio`: las mismas clases, en el mismo lugar, dentro del recuadro del microservicio dueño de su tabla y con el color que usa el draw.io. Las relaciones entre microservicios van punteadas.
- `/arquitectura/validar`: cambios del código que todavía no aprobó una persona. No tiene pestaña: se entra por la URL.

La app está siempre en modo presentación: sin estado de los servicios, avisos ni controles de zoom.

## Modelo

- `modelo/generado.json`: lo escribe `tools/arquitectura.mjs generar` a partir del código (corre solo antes de `dev` y `build`). No va al repo.
- `modelo/validado.json`: lo que muestran los diagramas. Se aprueba con `npm run arquitectura:validar` desde la raíz; el nombre, el tipo, la descripción y el ícono de cada pieza se escriben a mano.
- `modelo/diferencias.mjs`: compara los dos; lo usan la herramienta y la app.
- `modelo/clases.json`: las clases, atributos y relaciones (con su cardinalidad) del diagrama de clases del grupo, copiados a mano de la página `diagrama_de_clases_actual` del draw.io (link en `docs/referencias.md`). No sale del código: muestra lo diseñado. Si cambia el draw.io, se actualiza este archivo; una clase nueva necesita además su lugar en `CLASES` y sus relaciones en `RUTAS_CLASES` de `src/layout.ts`. La relación de PLANIFICACION consigo misma no tiene etiqueta en el draw.io y no se dibuja.

## Código

- `src/layout.ts`: posiciones de los diagramas (tomadas del diseño) y lados por los que entra y sale cada llamada.
- `src/nodos.tsx`: nodos de React Flow (componente, servicio, banda y glosario).
- `src/clases.tsx`: nodos y arista de la lámina de clases (clase, recuadro de servicio, leyenda y relación con su cardinalidad) y los colores de cada servicio.
- `src/pantallas/Comunicacion.tsx`: `NO_SE_DIBUJAN` lista las llamadas validadas que no se dibujan para simplificar la lámina (hoy `pago → planificacion`).

## Desarrollo

```bash
npm run dev:arquitectura   # http://localhost:5174/arquitectura/
```
