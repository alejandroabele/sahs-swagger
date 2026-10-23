## Why

Hoy todos los commands usan `POST`, incluidos los que eliminan o modifican, y eso no respeta la semántica de HTTP. El grupo quiere que el swagger sea REST en el uso de los verbos, pero sin perder el mapeo 1 a 1 con las funciones del documento (opción A: se mantienen las rutas con el nombre de la función).

## What Changes

- **BREAKING**: cada command cambia su método HTTP según lo que hace:
  - `crear_*` → `POST`, que responde `201 Created`.
  - `eliminar_*` y `quitar_*` → `DELETE`.
  - `cambiar_*` y `modificar_*` → `PATCH`.
  - `asignar_*` que reemplaza un valor o una lista completa → `PUT`.
  - `asignar_*` que agrega un elemento a una colección → `POST`.
  - Acciones que no son CRUD (`login`, `validar_pago`, `firmar_recibo_de_sueldo`) → `POST`.
- **BREAKING**: `bajar_recibo_sueldo` y `calcular_monto_a_liquidar` pasan a `GET`, porque no modifican nada. El `periodo` de `calcular_monto_a_liquidar` pasa del body a un parámetro de query.
- **BREAKING**: las operaciones `DELETE` que quitan un elemento de una colección llevan el id secundario en la ruta, porque `DELETE` no lleva body: `/{id}/{id_secundario}`.
- `eliminar_cargo` pasa a `DELETE` y sigue devolviendo el profesor con `cargo_asociado: null`.
- Las rutas, los `operationId`, los schemas y las queries (`GET`) no cambian.
- Se actualizan el README y el generador `tools/generar_specs.py`.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `api-conventions`: la regla de métodos pasa de "POST para commands" a verbos según la semántica, y se agrega la excepción del id secundario en la ruta para `DELETE`.
- `usuario-api`: métodos de los commands.
- `pago-api`: métodos de los commands; `bajar_recibo_sueldo` y `calcular_monto_a_liquidar` pasan a `GET`.
- `horarios-api`: métodos de los commands; `eliminar_franja_horaria_turno` lleva el id de la franja en la ruta.
- `planificacion-api`: métodos de los commands.
- `orientacion-api`: métodos de los commands; los `quitar_*` llevan el id de la materia en la ruta.
- `profesor-suplencias-api`: métodos de los commands.

## Impact

- `tools/generar_specs.py`, los 6 archivos de `specs/*.json` y `README.md`.
- No cambian ni `docker-compose.yml` ni `redocly.yaml`.
