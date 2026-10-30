# Referencias del proyecto

Estas son las tres fuentes de verdad de SAHS. Cuando algo cambia, se cambia primero ahí y después se baja a este repo. Si hay que actualizar un link, se hace en este archivo y en ningún otro lado.

| Fuente | Link | Qué define | Qué se actualiza en este repo |
|---|---|---|---|
| **Diseño (prototipo)** | [Planilla de Horarios SAHS](https://claude.ai/artifact/1peTae5Ze8UpZFfu5abtap) | Pantallas de la aplicación: Login (L1), inicio y administrativo (A1 a A18) y profesor (P2 a P4) | `prototipo/index.html` (referencia) y `apps/web/src/pantallas` |
| **Documento del grupo** | [Google Docs](https://docs.google.com/document/d/1CdFpup5nIRFGYRROJfJ2qOeiiH8gNqxpNCxshALeYzI/edit?tab=t.rerp7lf3e18q) | Microservicios, commands y queries (pestaña "Microservicios") | Código de `apps/<servicio>` (su swagger) |
| **Diagrama de clases** | [draw.io](https://app.diagrams.net/#G1PGFgOKMctXy1Y-aMYAJT6kI6zAuABv2d#%7B%22pageId%22%3A%22pknM_HXsGpK0AsRmnoCp%22%7D) | Entidades, atributos y relaciones | `libs/entidades` (y su migración) y los DTOs de cada servicio |

Datos útiles:

- El diagrama está guardado en Google Drive (id `1PGFgOKMctXy1Y-aMYAJT6kI6zAuABv2d`) y el link abre la página `pknM_HXsGpK0AsRmnoCp`.
- Los archivos `diagrama_con_clases.drawio` y `pagina3-*.xml` de la carpeta `sahs-prototipo/` son copias locales que pueden quedar viejas. Manda el link.

## Cómo se baja cada cambio

```
 Diseño (artifact) ──► prototipo/index.html (referencia) ───────────────────────────────► http://localhost:8100/prototipo/
                         └─► apps/web (React) ─────────────────────────────────────────► http://localhost:8100
 Documento ──────────┐
                     ├─► apps/<servicio> (NestJS) ──► swagger de cada servicio ──────────► http://localhost:8100/docs/
 Diagrama de clases ─┘   libs/entidades + migración ──► base sahs.sqlite (volumen sahs-data)
```

- **Diseño:** se actualizan los `*.dc.html` de `sahs-prototipo/` con el contenido del artifact (o al revés, si el cambio se hizo localmente y después se republica el artifact). Luego se corre `python3 tools/exportar_prototipo.py ..` y se recarga el prototipo (http://localhost:8100/prototipo/, con la app levantada con `docker compose up -d --build`). Después se lleva el cambio a la pantalla React correspondiente de `apps/web/src/pantallas`.
- **Documento:** se cambia el controller y los DTOs del servicio (y su interfaz en `libs/contratos`). El swagger del servicio se actualiza solo. Si la API se aparta del documento, se anota en "Cambios respecto del documento" del README.
- **Diagrama de clases:** se cambian las entidades de `libs/entidades` y se genera una migración (ver "Mantenimiento" en el README).
- `specs/*.json` y `tools/generar_specs.py` quedaron congelados: son el contrato del corte inicial, contra el que compara `npm run verificar-contratos`.
