## 1. Modelo de arquitectura

- [x] 1.1 `apps/arquitectura/modelo/diferencias.mjs`: función pura que compara generado y validado (servicios, llamadas, contenedores y tablas) y devuelve la lista de diferencias
- [x] 1.2 `tools/arquitectura.mjs` con los comandos `generar`, `verificar` y `validar` (interactivo, con `--todo` para aprobar todo)
- [x] 1.3 `apps/arquitectura/modelo/validado.json` inicial con los componentes (tipo, descripción, ícono), los 6 servicios, sus tablas y las 11 llamadas. El contenedor `arquitectura` queda sin validar, para que lo apruebe una persona
- [x] 1.4 `generado.json` en `.gitignore`

## 2. Workspace y app

- [x] 2.1 Workspace `apps/arquitectura` (`package.json` con `predev`/`prebuild`, `tsconfig.json`, `vite.config.ts` con `base: '/arquitectura/'` y proxy de salud en desarrollo, `index.html` con IBM Plex), `@xyflow/react` instalado
- [x] 2.2 `package.json` raíz: workspace nuevo y scripts `dev:arquitectura`, `arquitectura:validar` y `verificar-arquitectura`; el build de apps incluye `apps/arquitectura`
- [x] 2.3 Modelo en la app: carga de validado y generado, diferencias y modelo a dibujar (lo validado más lo nuevo, marcado)
- [x] 2.4 Íconos (SVG en línea) y nodos de React Flow: componente con tipo, servicio con estado y banda de fondo
- [x] 2.5 Pantalla Componentes con su layout, la leyenda y el recuadro "Qué es cada pieza"
- [x] 2.6 Pantalla Comunicación con su layout, aristas grises y azules de doble punta, y leyenda
- [x] 2.7 Pantalla Validar con la lista de diferencias y el comando para aprobarlas
- [x] 2.8 Cabecera con pestañas, aviso de cambios sin validar y botón de modo presentación (`?presentacion`)
- [x] 2.9 Estado en vivo: consulta cada 10 s a `/arquitectura/salud/<servicio>`

## 3. Docker

- [x] 3.1 `apps/arquitectura/Dockerfile` (build + nginx) y `apps/arquitectura/nginx.conf` (app bajo `/arquitectura/` y salud de los 6 servicios)
- [x] 3.2 Servicio `arquitectura` en `docker-compose.yml`
- [x] 3.3 `apps/web/nginx.conf`: `/arquitectura` y `/arquitectura/` hacia el contenedor
- [x] 3.4 `apps/Dockerfile.servicio` y `apps/web/Dockerfile` copian el `package.json` del workspace nuevo

## 4. Documentación

- [x] 4.1 README: URL nueva, cómo validar el modelo y el gateway que todavía no valida el token ("A revisar por el grupo")
- [x] 4.2 AGENTS.md: después de cambiar un servicio, `npm run verificar-arquitectura`; las diferencias las aprueba una persona

## 5. Verificación

- [x] 5.1 `npm run build -w apps/arquitectura` y `npm run verificar-arquitectura` (muestra solo el contenedor `arquitectura` pendiente)
- [x] 5.2 `docker compose up -d --build` y revisar `/arquitectura/`, `/arquitectura/comunicacion`, `/arquitectura/validar`, la salud y el modo presentación
- [x] 5.3 `npm test` y `npm run verificar-contratos` siguen pasando
