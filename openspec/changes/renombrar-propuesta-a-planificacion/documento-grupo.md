# Cambios para el documento del grupo

Texto para pasar al documento del grupo (tarea 8.4) y al diagrama de clases (tarea 8.5) el renombre de "propuesta" a "planificación". Los links están en `docs/referencias.md`.

"Espacio de propuesta de área" (un tipo de materia) **no** cambia: es otro concepto.

---

## Pestaña "Microservicios", sección PLANIFICACIÓN

### Modelos del dominio

| Dice | Pasa a decir |
|---|---|
| Propuesta | Planificación |
| Estado_Propuesta | Estado_Planificación |

### Commands

| Dice | Pasa a decir |
|---|---|
| `crear_propuesta()` | `crear_planificacion()` |
| `crear_estado_propuesta()` | `crear_estado_planificacion()` |
| `asignar_estado_a_propuesta()` | `asignar_estado_a_planificacion()` |
| `asignar_clase_a_propuesta()` | `asignar_clase_a_planificacion()` |

### Queries

| Dice | Pasa a decir |
|---|---|
| `get_posibles_estados_de_propuestas()` | `get_posibles_estados_de_planificaciones()` |
| `get_estado_actual_de_propuesta()` | `get_estado_actual_de_planificacion()` |
| `get_propuestas()` | `get_planificaciones()` |
| `get_propuesta()` | `get_planificacion()` |

### Atributos

| Dice | Pasa a decir |
|---|---|
| `id_propuesta` | `id_planificacion` |
| `descripcion_propuesta` | `descripcion_planificacion` |

Si el documento describe el filtro de `get_clases` por propuesta, pasa a ser `id_planificacion`.

### Textos

Donde el documento dice "propuesta" para hablar de la grilla del ciclo ("la propuesta nace en Borrador", "las clases de la propuesta"), pasa a decir "planificación".

## Otras secciones de la pestaña "Microservicios"

PAGO y PROFESOR Y SUPLENCIAS no nombran funciones de propuesta en el documento. Si alguna invocación a PLANIFICACIÓN se agregó a mano (por ejemplo, la baja del profesor llama a `get_posibles_estados_de_propuestas`, `get_propuestas` y `get_clases`, y la liquidación de PAGO a `get_propuestas`), se usan los nombres nuevos de la tabla de arriba.

## Pestaña "Reglas de negocio"

No cambia: las 18 reglas ya dicen "planificación".

---

## Diagrama de clases (draw.io)

| Dice | Pasa a decir |
|---|---|
| Clase `Propuesta` | `Planificación` |
| Clase `EstadoPropuesta` | `EstadoPlanificación` |
| Atributo `id_propuesta` | `id_planificacion` |
| Atributo `descripcion_propuesta` | `descripcion_planificacion` |

Las relaciones no cambian.
