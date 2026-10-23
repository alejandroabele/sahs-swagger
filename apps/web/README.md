# Web (React + Vite)

La app de SAHS: las pantallas del prototipo (`prototipo/index.html`) con datos reales de la API.

- **Desarrollo:** `npm run dev -w apps/web` → http://localhost:5173. Vite hace de proxy hacia los servicios (puertos 8081 a 8086), así la web llama siempre por el mismo origen (`/usuario/...`, `/pago/...`).
- **Producción:** `apps/web/Dockerfile` hace el build y lo sirve con nginx (`nginx.conf`), que redirige cada prefijo a su servicio. En el compose: http://localhost:8100.

## Estructura

```
src/
  api/          cliente tipado de la API (generado: node tools/generar_cliente_web.mjs)
  app/          pantallas y privilegios (pantallas.ts), ruteo (App.tsx), navegación (navegar.ts)
  estado/       sesión (sessionStorage), ciclo lectivo global, consultas y commands (TanStack Query)
  componentes/  cabecera, lienzo que escala la pantalla, avisos de carga y de error
  lib/          css() para copiar los estilos del diseño, formatos
  pantallas/    una pantalla por código del diseño (L1, A1 a A18, P2 a P4)
```

## Convenciones

- Cada pantalla tiene la ruta de su código (`/A5`, `/P2`). Sin sesión, cualquier ruta muestra el Login. Si el rol no tiene el privilegio de la pantalla, se vuelve al inicio.
- Los parámetros de una ficha van en la URL: `/A9?id_profesor=3`, `/A6?id_materia=1`, `/A11?id_curso=2` o `/A11?nuevo=1`, `/A13?id_propuesta=4&id_curso=2`.
- Las pantallas miden lo mismo que en el diseño (1440 px; A13, 1560 px) y se escalan al ancho de la ventana.
- Los estilos se copian del diseño con `css('display: flex; ...')`.
- Las consultas se piden con `useConsulta([servicio, operación, ...])` y los commands con `useAccion(fn, [servicios])`, que al terminar invalida las consultas de esos servicios. Así, por ejemplo, quitar un privilegio en A17 actualiza el menú del inicio sin recargar.
- Los errores de la API (`Error.mensaje`) se muestran dentro de la pantalla, nunca con diálogos del navegador.
