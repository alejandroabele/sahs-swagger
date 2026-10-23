## Why

Se cruzaron las 20 pantallas del diseño (A1 a A16 y P1 a P4) con los 6 contratos y aparecieron diferencias de modelo entre el prototipo y el swagger. Según el caso, se decidió que mande el swagger y se corrige el prototipo, o que mande el diseño y se agrega al swagger. Además, ningún listado del swagger tiene filtros, así que las pantallas del profesor (P1, P2 y P4) no se pueden armar con el contrato actual.

## What Changes

**Swagger (`tools/generar_specs.py` → `specs/*.json`)**

- **Orientación del curso:** `Curso.id_orientacion` pasa a ser obligatorio y se saca la nota "Null en ciclo básico". "Básica" es un dato más del catálogo de orientaciones. **BREAKING**
- **Materia y orientación, de N:M a 1:N:**
  - `Materia` lleva `id_orientacion` y `orientacion` anidada, en lugar de `orientaciones[]`.
  - `crear_materia` recibe `id_orientacion`.
  - `asignar_materia_orientacion` pasa a `PUT` sobre la materia.
  - Se elimina `quitar_materia_orientacion`.
  - **BREAKING**
- **Horas por curso:**
  - El curso define qué materias dicta y cuántas horas tiene cada una: `asignar_materia_a_curso`, `quitar_materia_curso` y `cambiar_horas_materia_curso`.
  - `Curso.materias` devuelve las horas del curso.
- **Recibos de sueldo:**
  - El recibo trae conceptos (haberes y descuentos), total bruto, total de descuentos, neto y los datos del emisor.
  - Se define la relación Pago–Recibo como 1:1, con el recibo anidado en el pago.
  - **BREAKING:** `monto` pasa a `neto` y se elimina `get_pago_recibos_de_sueldo`.
- **Estados de propuesta:**
  - El catálogo sigue siendo gestionado (`crear_estado_propuesta`).
  - Se documenta la carga inicial: Borrador, En revisión, Validada y Cerrada.
  - La propuesta se crea en Borrador y se valida completa, no curso por curso.
- **Filtros opcionales por query en los listados:**

  | Listado | Filtros |
  |---|---|
  | `get_clases` | `id_profesor`, `id_curso`, `id_propuesta` |
  | `get_profesores` | `id_usuario` |
  | `get_pagos` | `id_profesor`, `periodo` |
  | `get_recibos_de_sueldo` | `id_profesor`, `periodo` |
  | `get_suplencias` | `fecha_desde`, `fecha_hasta`, `id_profesor`, `id_curso` |
  | `get_propuestas` | `id_ciclo_lectivo`, `id_estado` |
  | `get_cursos` | `id_ciclo_lectivo` |

- **README:** cada cambio se anota en "Cambios respecto del documento" y se suma la convención de filtros.

**Prototipo (artifact de diseño → `prototipo/admin.html` y `prototipo/profesor.html`)**

- **Clase como en el swagger:**
  - En A13 los docentes se asignan a la clase (curso + materia) y valen para todas sus franjas. Ya no se eligen por celda.
  - En A4 la suplencia cubre la clase entera, no una hora suelta.
- **Franjas como en el swagger:**
  - Cada franja pertenece a un día.
  - Los recreos son franjas con `es_recreo`.
  - La grilla sale del turno del curso, así que se saca la grilla fija de 7:50 a 11:50 de A2, A3, A13, P2 y P3.
  - La disponibilidad se marca por franja.
- **Estados de la planificación:**
  - La planilla se valida completa.
  - Se saca el estado por curso de A3 y A10.
- **Firma del recibo:** se saca "Deshacer firma" de P4.
- **Exportación:** se documenta y se deja repetible cómo se arman `admin.html` y `profesor.html` a partir de los `.dc.html`.

**Fuera de alcance**

- **EPA:** queda como está. Es una materia propia y su clase tiene varios profesores, cosa que `ids_profesores` ya permite.
- **Datos del diseño que el swagger no modela:** quedan como están. Por ejemplo, los años en que aplica una orientación y el código de turno. El swagger define la estructura, no todos los valores ni todos los casos de uso.
- **Pantallas que faltan:** login, usuarios, pagos del administrativo, áreas y días lectivos van en otro change.

## Capabilities

### New Capabilities
- `prototipo-modelo`: reglas de modelo que el prototipo respeta para estar alineado con el swagger (clase, franjas, estados y firma).

### Modified Capabilities
- `api-conventions`: se agregan los filtros opcionales por query en los listados.
- `orientacion-api`: materia con una sola orientación.
- `planificacion-api`: orientación obligatoria, materias y horas por curso, catálogo de estados y filtros.
- `pago-api`: detalle del recibo, relación 1:1 con el pago y filtros.
- `profesor-suplencias-api`: filtros en `get_profesores` y `get_suplencias`.
- `prototipo-web`: `admin.html` y `profesor.html` se exportan del diseño actualizado con un procedimiento documentado.

## Impact

- **Archivos:**
  - `tools/generar_specs.py`: soporte de query params opcionales y los cambios de modelo.
  - `specs/orientacion.json`, `specs/planificacion.json`, `specs/pago.json` y `specs/profesor_suplencias.json` se regeneran.
  - `README.md`.
- **Diseño:** se modifican los `.dc.html` del artifact "Planilla de Horarios SAHS" y se republica.
- **Prototipo:** `prototipo/admin.html` y `prototipo/profesor.html` se reexportan.
- **Cambios BREAKING:** solo afectan a los contratos, porque todavía no hay backend.
