## Context

En `/home/jano/sahs-prototipo` hay tres tipos de archivos:

- `admin.html` (535 KB) y `profesor.html` (60 KB): son autónomos. Reimplementan el "runtime DC" adentro, traen todas sus pantallas y se enlazan entre sí con rutas relativas (`href="profesor.html"` / `href="admin.html"`). Lo único externo es Google Fonts.
- `*.dc.html` (20 archivos): son las fuentes de cada pantalla. Cargan `./support.js` y `./vendor/react.js`, que no existen, así que abiertos solos no funcionan.
- `planilla-horarios-sahs.html` (3,2 MB): el lienzo de Claude Design con los 20 artboards y el editor. Depende de unpkg.com.

El repo `swagger/` ya levanta Swagger UI con `docker compose up -d` en el puerto 8080.

## Goals / Non-Goals

**Goals:**
- Con un solo comando (`docker compose up -d`) quedan levantados Swagger UI y el prototipo.
- El prototipo queda versionado en el repo.
- Hay una portada que lleva a cada rol.

**Non-Goals:**
- Incluir las fuentes de diseño (`*.dc.html`, la planilla, drawio, `canvas.json`).
- Conectar el prototipo con los contratos o con un backend.
- Modificar `admin.html` o `profesor.html`.
- Hacer funcionar el prototipo sin internet (las fuentes tipográficas se siguen cargando desde Google Fonts).

## Decisions

### Servicio nginx dentro del mismo `docker-compose.yml`
Se usa la imagen `nginx:1.27.5-alpine` (versión fija, igual criterio que la de Swagger UI). Se monta `./prototipo` en `/usr/share/nginx/html` en modo `:ro` y se publica en `8090:80`.

- *Alternativa: `npx serve` desde un script npm.* Agrega una dependencia de Node y obliga a correr un segundo comando.
- *Alternativa: `python3 -m http.server`.* No requiere instalar nada, pero queda fuera del flujo del repo y es un segundo proceso que hay que recordar.
- *Alternativa: abrir los archivos con `file://`.* Hoy funciona, pero no es un "comando para levantar la app" y no deja una URL que se pueda compartir.

Montar la carpeta como volumen, en lugar de copiarla en una imagen propia, evita tener que reconstruir. Es el mismo patrón que ya se usa con `specs/`.

### Puerto 8090
El 8080 lo ocupa Swagger UI, y del 8081 al 8086 están reservados como servidores ilustrativos en los contratos. El 8090 queda libre y se distingue fácil.

### Copia literal de los HTML
`admin.html` y `profesor.html` se copian byte a byte. Para verificarlo alcanza con un `cmp` contra el original. Mantener los nombres conserva los enlaces relativos entre ambas vistas.

### Portada propia y mínima
`index.html` es un HTML estático sin JavaScript, con dos tarjetas que enlazan a cada vista. Usa IBM Plex Sans y la paleta del prototipo (`#f4f6f8` de fondo, `#14181f` de texto, `#2f5fd0` de acento) para que no se note el cambio de estilo.

- *Alternativa: redirigir la raíz a `admin.html`.* Esconde la vista del profesor.

## Risks / Trade-offs

- [Los HTML del repo se desactualizan respecto del diseño] → El README aclara que son copias exportadas y que el origen es la carpeta de diseño. Para actualizarlos se vuelven a copiar.
- [El puerto 8090 está ocupado en la máquina de alguien] → Se cambia una línea en `docker-compose.yml`. El README lo menciona.
- [Sin internet no cargan las fuentes] → La app sigue funcionando con la tipografía de reserva del sistema. Se acepta.
- [`restart: unless-stopped` deja el contenedor corriendo] → Es el mismo comportamiento que tiene Swagger UI. `docker compose down` lo baja.
