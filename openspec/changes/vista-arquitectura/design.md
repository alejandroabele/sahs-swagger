## Context

SAHS tiene 6 microservicios NestJS detrás del nginx de `web`, una base SQLite compartida (cada tabla con un servicio dueño) y una app React. La información de arquitectura ya está en el código: los servicios en `docker-compose.yml`, las llamadas entre ellos en `new ClienteServicio('<servicio>')` y las tablas en `@Entity('<prefijo>_...')` de `libs/entidades/src/<servicio>`. El diseño visual de referencia es el canvas https://claude.ai/artifact/1gPEKC5uJuERsYCWVEqAhF (láminas "1 · Componentes", "2 · Comunicación entre microservicios" y "Validar el modelo").

El público es la materia de especificación de software: la vista es de alto nivel (personas, cliente, servidores, almacenamiento), no de tecnologías (caddy, puertos, versiones).

## Goals / Non-Goals

**Goals:**
- Dos diagramas claros para proyectar, con íconos y el tipo de cada pieza.
- Que los datos estructurales (servicios, llamadas, tablas, contenedores) salgan del código y no se mantengan a mano.
- Que nada nuevo del código aparezca como validado sin que una persona lo apruebe.
- Ver si cada servicio responde, sin exponer puertos nuevos.

**Non-Goals:**
- Implementar la validación del token en el gateway. Se dibuja como se diseñó y se anota en el README.
- Editar el modelo desde el navegador (la página es estática).
- Mostrar infraestructura (caddy, nginx, puertos, versiones de imágenes).

## Decisions

### App y contenedor propios
`apps/arquitectura` es un workspace nuevo (`@sahs/arquitectura`, React 18 + Vite + `@xyflow/react`), con `base: '/arquitectura/'`. Se sirve con su propio nginx (`nginx:1.27.5-alpine`) en el servicio `arquitectura` del compose, en la red interna y sin puertos publicados. El nginx de `web` la publica con `location /arquitectura/ { proxy_pass http://$arq:80; }`, con el nombre en una variable para que se resuelva en cada pedido, como los servicios.
- *Alternativa:* copiar el build dentro de la imagen de `web` (como `/docs` y `/prototipo`). Es un contenedor menos, pero mezcla dos apps en una imagen y fue explícito el pedido de pasarla por el proxy.

### Rutas
`/arquitectura/` (Componentes), `/arquitectura/comunicacion` y `/arquitectura/validar`. El nginx de `arquitectura` devuelve `index.html` para cualquier ruta bajo `/arquitectura/`, y la app elige la pantalla por `location.pathname` (no hace falta `react-router` para tres pantallas).

### Modelo: generado y validado
- `tools/arquitectura.mjs generar` escribe `apps/arquitectura/modelo/generado.json` (no va al repo; se genera en `predev` y `prebuild`):
  - `servicios`: los servicios del compose con `build.args.APP` y sin `ENTRADA` (es decir, sin `db-init`), cada uno con sus `tablas` (los `@Entity` de `libs/entidades/src/<app>`);
  - `llamadas`: pares `{ de, a }` de `new ClienteServicio('<x>')` en `apps/<app>/src` (`profesor_suplencias` → `profesor-suplencias`);
  - `contenedores`: los nombres de servicio del compose.
- `apps/arquitectura/modelo/validado.json` va al repo. Tiene lo mismo, más lo que solo puede escribir una persona: nombre, tipo, descripción e ícono de cada componente y servicio, y la fecha de la última validación.
- `apps/arquitectura/modelo/diferencias.mjs` (función pura, usada por la herramienta y por la app) compara los dos y devuelve una lista de diferencias: servicio, llamada o contenedor nuevo o eliminado, y tablas agregadas o quitadas de un servicio.
- `npm run arquitectura:validar` muestra cada diferencia en la terminal y pregunta si se aprueba. Lo aprobado se escribe en `validado.json` (con la fecha) y entra al repo con un commit. Un servicio nuevo entra con su id como nombre y la descripción vacía, para completarla a mano.
- `npm run verificar-arquitectura` termina con error si hay diferencias. Sirve como control después de cambiar un servicio.
- *Alternativas:* aprobar con botones en la página (necesita un backend que escriba en el repo) o descargar el JSON aprobado (paso manual propenso a errores). Por comando, la aprobación queda en git, con autor y fecha.

### Diagramas con React Flow
Nodos personalizados (componente, servicio y banda de fondo) con posiciones fijas tomadas del diseño, en `src/layout.ts`. Un servicio que no está en el layout se ubica al final de la fila (lámina 1) o en una fila extra (lámina 2), así que un servicio nuevo se ve aunque nadie haya tocado el layout. Los nodos no se arrastran y la vista hace `fitView`.
- Lámina 1: aristas `smoothstep` de abajo hacia arriba, del gateway a cada servicio y de cada servicio a la base.
- Lámina 2: las llamadas de `validado.json` más las nuevas del generado. Si A llama a B y B llama a A, se dibuja una sola arista azul con flecha en las dos puntas. Cada par tiene asignados en el layout los lados de salida y de llegada (arriba, abajo en 1/3 o 2/3, izquierda o derecha), para que no se encimen.
- Lo que está en el generado y no en el validado se dibuja con borde o línea punteada ámbar; lo validado que ya no está en el código, punteado y tachado.

### Tipo de cada pieza
Cada componente tiene un `tipo` (`personas`, `cliente`, `servidor`, `almacenamiento`) que se muestra como etiqueta junto al nombre, y la lámina 1 tiene el recuadro "Qué es cada pieza" con un ícono por concepto (cliente, servidor, API Gateway, microservicio y base de datos). La banda de servicios dice "Microservicios (servidores)".

### Estado en vivo
El nginx de `arquitectura` publica `GET /arquitectura/salud/<servicio>` → `http://<servicio>:3000/actuator/health`, solo para los 6 nombres conocidos. La app consulta cada servicio cada 10 s: verde si responde `UP`, rojo si falla y gris mientras no hay dato. En desarrollo, el proxy de Vite apunta a los puertos 8081 a 8086.

### Modo presentación
Un botón en la cabecera alterna el modo y lo refleja en la URL (`?presentacion`). En ese modo se ocultan el estado, el aviso de cambios sin validar y la pestaña Validar; quedan los diagramas, la leyenda y el recuadro "Qué es cada pieza".

## Risks / Trade-offs

- [La detección por texto (`new ClienteServicio('x')`) no ve llamadas hechas de otra forma] → Es la única forma de llamar a otro servicio según AGENTS.md; si aparece otra, el generador se amplía.
- [Las aristas de React Flow no quedan tan prolijas como el dibujo a mano] → Lados de conexión fijos por par en el layout; lo nuevo cae en un lugar por defecto y se acomoda en el layout cuando se valida.
- [El diagrama muestra un gateway que valida el token y hoy no lo hace] → Decisión del grupo (se dibuja lo diseñado); queda en "A revisar por el grupo" del README.
- [Un agente podría aprobar el modelo] → AGENTS.md: la aprobación del modelo la hace una persona; un agente solo corre `verificar-arquitectura` y avisa.

## Migration Plan

`docker compose up -d --build` construye el contenedor nuevo; no hay cambios de base ni de API. Para volver atrás, se saca el servicio del compose y la `location` de nginx.

## Open Questions

- Ninguna bloqueante. Si el documento del grupo nombra distinto al API Gateway, se cambia en `validado.json`.
