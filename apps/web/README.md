# Web (React + Vite)

La app de SAHS: las pantallas del prototipo (`prototipo/index.html`) con datos reales de la API.

- **Desarrollo:** `npm run dev -w apps/web` → http://localhost:5173. Vite hace de proxy hacia los servicios (puertos 8081 a 8086), así la web llama siempre por el mismo origen (`/usuario/...`, `/pago/...`).
- **Producción:** `apps/web/Dockerfile` hace el build y lo sirve con nginx (`nginx.conf`), que redirige cada prefijo a su servicio. En el compose: http://localhost:8100.

## Estructura

```
src/
  api/          cliente tipado de la API (generado: node tools/generar_cliente_web.mjs)
  app/          pantallas y privilegios (pantallas.ts), rutas (rutas.ts), ruteo (App.tsx), navegación (navegar.ts)
  estado/       sesión (sessionStorage), ciclo lectivo global, consultas y commands (TanStack Query)
  componentes/  cabecera, lienzo que escala la pantalla, avisos de carga y de error
  lib/          css() para copiar los estilos del diseño, formatos
  pantallas/    una pantalla por código del diseño (L1, A1 a A18, P2 a P4)
```

## Convenciones

- Cada pantalla tiene rutas semánticas, declaradas en `app/rutas.ts` (`RUTAS`): `/materias`, `/materias/:id`, `/cursos/nuevo`, `/planificaciones/:id/cursos/:idCurso`… Los códigos de pantalla (A5, P2) son internos y no aparecen en las URLs. Sin sesión, cualquier ruta muestra el Login. Si el rol no tiene el privilegio de la pantalla o la ruta no existe, se vuelve al inicio.
- Se navega con `const ir = useIr()` y las funciones de `rutas` (`ir(rutas.profesor(3))`), nunca con rutas escritas a mano. El id de una ficha va como parámetro de ruta y se lee con `useParamRuta('id')`; las query strings no identifican recursos.
- Cada pantalla consulta su servicio. A otro solo para mostrar el nombre de un id, para un selector que una acción necesita (pedido recién al abrir esa acción) o cuando cruzar datos es su función. Sin totales calculados cruzando servicios ni textos de ayuda o de demo.
- Las pantallas ocupan el ancho de la ventana. En tablet (≤ 1100 px) y celular (≤ 700 px) se reacomodan con las clases `r-*` de `src/estilos.css` (apilar columnas, desplazar tablas y grillas, márgenes) y, si hace falta, con un `responsive.css` propio de la pantalla. En escritorio se ven como el diseño.
- Los estilos se copian del diseño con `css('display: flex; ...')`.
- Las consultas se piden con `useConsulta([servicio, operación, ...])` y los commands con `useAccion(fn, [servicios])`, que al terminar invalida las consultas de esos servicios. Así, por ejemplo, quitar un privilegio en `/roles` actualiza el menú del inicio sin recargar.
- Los errores de la API (`Error.mensaje`) se muestran dentro de la pantalla, nunca con diálogos del navegador.
