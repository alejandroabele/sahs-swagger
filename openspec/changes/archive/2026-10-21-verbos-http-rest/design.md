## Context

Los contratos actuales (archivados en `2026-10-21-swagger-microservicios-sahs`) usan una ruta por función, con `POST` para todos los commands y `GET` para las queries. El grupo eligió la **opción A**: se mantienen las rutas con el nombre de la función y solo se ajustan los verbos HTTP. Se descartó la opción B, que pasaba a rutas por recursos (`/usuarios/{id}`).

## Goals / Non-Goals

**Goals:**
- Que cada operación use el verbo HTTP que corresponde a lo que hace.
- Que los contratos sigan siendo válidos en Redocly.

**Non-Goals:**
- Cambiar las rutas, los nombres, los schemas o las queries existentes.
- Unificar funciones (por ejemplo, `asignar_cargo` y `cambiar_cargo` siguen separadas).

## Decisions

### D1. Regla de verbos

| Tipo de función | Verbo | Respuesta OK |
|---|---|---|
| `crear_*` | `POST` | `201` + entidad |
| `get_*` | `GET` | `200` |
| `eliminar_*` de una entidad | `DELETE` | `204` |
| `cambiar_*` / `modificar_*` (cambio parcial) | `PATCH` | `200` + entidad |
| `asignar_*` que reemplaza un valor único o una lista completa | `PUT` | `200` + entidad |
| `asignar_*` que agrega un elemento a una colección | `POST` | `200` + entidad |
| `quitar_*` / `eliminar_X_de_Y` (sacar de una colección) | `DELETE` | `200` + entidad modificada |
| Acción de negocio que no es CRUD | `POST` | `200` |
| Acción sin efectos (solo lectura o cálculo) | `GET` | `200` |

- *Por qué `PUT` frente a `POST` en `asignar_*`:* `PUT` es idempotente y reemplaza un valor (el rol de un usuario, el estado de una propuesta). `POST` agrega un elemento a una colección (un privilegio a un rol, una clase a una propuesta).

### D2. Mapeo completo

**USUARIO**

| Verbo | Operaciones |
|---|---|
| `POST` | `login`, `crear_usuario` (201), `crear_rol` (201), `crear_privilegio` (201), `asignar_privilegio/{id}` |
| `PUT` | `asignar_rol/{id}` |
| `PATCH` | `cambiar_contrasenia/{id}`, `cambiar_email/{id}`, `cambiar_nombre/{id}`, `cambiar_nombre_rol/{id}`, `modificar_privilegio/{id}` |
| `DELETE` | `eliminar_usuario/{id}`, `eliminar_rol/{id}`, `eliminar_privilegio/{id}` (204) |

**PAGO**

| Verbo | Operaciones |
|---|---|
| `POST` | `crear_pago` (201), `validar_pago/{id}`, `firmar_recibo_de_sueldo/{id}` |
| `GET` | `bajar_recibo_sueldo/{id}` (`application/pdf`), `calcular_monto_a_liquidar/{id}?periodo=AAAA-MM` |

**HORARIOS**

| Verbo | Operaciones |
|---|---|
| `POST` | `crear_dia_lectivo` (201), `crear_franja_horaria` (201), `crear_turno` (201), `asignar_franja_a_turno/{id}` |
| `DELETE` | `eliminar_dia_lectivo/{id}`, `eliminar_turno/{id}` (204), `eliminar_franja_horaria_turno/{id}/{id_franja_horaria}` (200 + Turno) |

**PLANIFICACIÓN**

| Verbo | Operaciones |
|---|---|
| `POST` | `crear_propuesta`, `crear_estado_propuesta`, `crear_ciclo_lectivo`, `crear_curso`, `crear_clase`, `crear_anio_academico` (201); `asignar_clase_a_propuesta/{id}`, `asignar_curso_a_anio_academico/{id}` |
| `PUT` | `asignar_estado_a_propuesta/{id}`, `asignar_curso_a_clase/{id}` |

**ORIENTACIÓN**

| Verbo | Operaciones |
|---|---|
| `POST` | `crear_materia`, `crear_area`, `crear_orientacion` (201); `asignar_materia_area/{id}`, `asignar_materia_orientacion/{id}`, `asignar_curso_a_orientacion/{id}`, `asignar_clase_a_materia/{id}` |
| `PUT` | `asignar_anio_academico_a_materia/{id}` |
| `DELETE` | `eliminar_materia/{id}`, `eliminar_area/{id}`, `eliminar_orientacion/{id}` (204); `quitar_materia_area/{id}/{id_materia}`, `quitar_materia_orientacion/{id}/{id_materia}` (200 + Materia) |

**PROFESOR Y SUPLENCIAS**

| Verbo | Operaciones |
|---|---|
| `POST` | `crear_suplencia`, `crear_profesor` (201); `asignar_suplencia_a_clase/{id}`, `asignar_materias_area/{id}` |
| `PUT` | `asignar_profesor_suplencia/{id}`, `asignar_rol_profesor/{id}`, `asignar_legajo/{id}`, `asignar_cargo/{id}`, `asignar_materias_habilitadas/{id}`, `asignar_disponibilidad/{id}` |
| `PATCH` | `cambiar_correo/{id}`, `cambiar_direccion/{id}`, `cambiar_cargo/{id}` |
| `DELETE` | `eliminar_cargo/{id}` (200 + Profesor con `cargo_asociado: null`) |

Notas sobre algunos casos:
- `asignar_materias_area` **agrega** las materias del área a las habilitadas, así que es `POST`.
- `asignar_materias_habilitadas` **reemplaza** la lista completa, así que es `PUT`.

### D3. Id secundario en la ruta para `DELETE`
Como `DELETE` no debe llevar body, los `quitar_*` y `eliminar_franja_horaria_turno` agregan un segundo parámetro de ruta, con el nombre del id que antes iba en el body: `{id_materia}` o `{id_franja_horaria}`. El resto de las operaciones mantiene los ids secundarios en el body.

### D4. Parámetro de query en `calcular_monto_a_liquidar`
`periodo` pasa a ser un parámetro de query obligatorio, con el patrón `AAAA-MM`. La respuesta `400` se mantiene para un período inválido.

### D5. Implementación
Se cambia el generador: los métodos `command`, `query` y `eliminar` pasan a recibir el verbo y el código de respuesta, y se agrega soporte para parámetros de ruta adicionales y de query. Después se regeneran los JSON. El script de verificación pasa a comprobar el verbo esperado de cada operación según la tabla D2.

## Risks / Trade-offs

- [En las rutas el verbo repite lo que dice el nombre (`DELETE …/eliminar_…`), así que no es REST "puro"] → Es una decisión explícita del grupo (opción A) y se documenta en el README.
- [`bajar_recibo_sueldo` y `calcular_monto_a_liquidar` figuran como commands en el documento, pero ahora son `GET`] → Se aclara en la descripción de cada operación y en el README.
- [`quitar_*` con dos parámetros de ruta rompe la convención de "ids secundarios en el body"] → Es una excepción acotada a `DELETE` y está documentada en `api-conventions`.
