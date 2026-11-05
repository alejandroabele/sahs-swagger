# @sahs/arquitectura

Vista de arquitectura de SAHS (React + Vite + React Flow), publicada en http://localhost:8100/arquitectura/.

- `/arquitectura/`: Componentes (usuarios → aplicación web → API Gateway → microservicios → base de datos).
- `/arquitectura/comunicacion`: llamadas HTTP entre microservicios.
- `/arquitectura/validar`: cambios del código que todavía no aprobó una persona.
- `?presentacion`: oculta el estado y los avisos.

## Modelo

- `modelo/generado.json`: lo escribe `tools/arquitectura.mjs generar` a partir del código (corre solo antes de `dev` y `build`). No va al repo.
- `modelo/validado.json`: lo que muestran los diagramas. Se aprueba con `npm run arquitectura:validar` desde la raíz; el nombre, el tipo, la descripción y el ícono de cada pieza se escriben a mano.
- `modelo/diferencias.mjs`: compara los dos; lo usan la herramienta y la app.

## Código

- `src/layout.ts`: posiciones de los diagramas (tomadas del diseño) y lados por los que entra y sale cada llamada.
- `src/nodos.tsx`: nodos de React Flow (componente, servicio, banda y glosario).
- `src/salud.ts`: estado de cada servicio, cada 10 s, por `/arquitectura/salud/<servicio>`, que el `nginx.conf` de esta app pasa a `/actuator/health`.

## Desarrollo

```bash
npm run dev:arquitectura   # http://localhost:5174/arquitectura/ (la salud va a los servicios en 8081 a 8086)
```
