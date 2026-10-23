## Context

- **Origen:** el grupo cambió la sección PROFESOR Y SUPLENCIAS del documento y dejó el pedido de cambios al final de la pestaña "Microservicios". Las dudas se resolvieron con Adriano el 22/10/2026.
- **Swagger:** los contratos se generan con `tools/generar_specs.py`. Los verbos que no salen del prefijo del nombre están en el mapa `VERBOS`. Las dependencias se declaran con `sv.dep(servicio, operacion, [usadas_por])`.
- **Wireframe:** el diseño vive en el artifact "Planilla de Horarios SAHS" y en las copias `*.dc.html` de `/home/jano/sahs-prototipo/`. `prototipo/admin.html` se regenera con `tools/exportar_prototipo.py`.
- **Change pendiente:** `alinear-prototipo-swagger` está completo pero sin archivar. Sus deltas tocan las mismas specs (`profesor-suplencias-api`, `planificacion-api`) y crean `prototipo-modelo`. Los deltas de este change parten del estado que deja ese change.

## Goals / Non-Goals

**Goals:**
- Que `profesor_suplencias.json` tenga exactamente los commands y queries que pidió el grupo.
- Que cada servicio escriba solo sus propios datos: Profesor no edita usuarios y Suplencias no escribe en Planificación.
- Que el wireframe muestre cómo se asigna y se edita el usuario de un profesor.

**Non-Goals:**
- Cambiar la pantalla de Suplencias. La opción elegida respeta su comportamiento actual.
- Agregar `eliminar_profesor` u otros commands que el pedido no menciona.
- Editar el diagrama de clases: lo actualiza el grupo.
- Agregar en Usuarios (A17) una acción para editar usuarios. `editar_usuario` se usa desde la ficha del profesor.

## Decisions

### D1. Suplencia con varias clases y un suplente
- **Body de `crear_suplencia`:** `{ fecha_inicio, fecha_fin, motivo, id_profesor, ids_clases[] }`. Todo es obligatorio y `ids_clases` tiene al menos un elemento.
- **Modelo:** `Suplencia` no cambia de forma. Ya tiene `id_profesor`, `profesor`, `ids_clases[]` y `clases[]`. Lo único que cambia es que se cargan al crearla y no con commands aparte.
- **Inmutable:** sin `asignar_profesor_suplencia` ni `asignar_suplencia_a_clase`, una suplencia no se modifica después de creada.
- **Alternativa descartada:** un solo `id_clase` por suplencia. Obliga a cambiar el schema y la pantalla, que hoy arma una suplencia por suplente con todas sus clases.

### D2. La referencia Clase–Suplencia la guarda Suplencia
- **Escritura:** solo Suplencia guarda `ids_clases`. `Clase.suplencia` sigue como dato de solo lectura que arma `get_clase`.
- **Lectura:** `get_clase` llama a `profesor_suplencias.get_suplencias?id_clase=<id>&fecha_desde=<hoy>&fecha_hasta=<hoy>` y anida la suplencia vigente, si la hay.
- **Por qué:**
  - Una clase validada no se edita.
  - Una clase acumula suplencias a lo largo del año.
  - Así Suplencias no necesita escribir en Planificación.
- **Alternativa descartada:** guardar `id_suplencia` en Clase, como dibuja hoy el diagrama. Obliga a un command de PLANIFICACIÓN por cada suplencia y no guarda historial.

### D3. Usuario del profesor
- **Alta:** `crear_profesor` ya no crea el usuario. `Profesor.id_usuario` pasa a ser nullable y deja de ser obligatorio en el schema.
- **Vínculo:** `PUT asignar_usuario_profesor/{id}` con `{ id_usuario }` reemplaza el usuario vinculado. Invoca `usuario.get_usuario` para validar que exista y devuelve el `Profesor`.
- **Rol:** el rol se maneja en USUARIO (`asignar_rol`). Profesor deja de pedir roles, así que sale `asignar_rol_profesor`.
- **`get_profesores?id_usuario=`** sigue sirviendo para el profesor logueado. Si el usuario no está vinculado, devuelve una lista vacía.
- **Alternativa descartada:** que `asignar_usuario_profesor` cree el usuario si no existe. Mezcla dos responsabilidades.

### D4. `editar_usuario` va en USUARIO (camino b)
- **Endpoint:** `PUT /usuario/editar_usuario/{id}` con `{ nombre_user, email }`, que devuelve el `Usuario`. No toca la contraseña (`cambiar_contrasenia`) ni el rol (`asignar_rol`).
- **Uso:** la ficha del profesor lo llama con `profesor.id_usuario`.
- **Alternativa descartada:** un pasamanos `profesor_suplencias.editar_usuario` que invoque a USUARIO. Suma una ruta y una dependencia sin aportar nada.

### D5. `editar_*` es `PUT`
- **Convención:** `editar_profesor` y `editar_usuario` mandan todos los datos editables de la entidad y reemplazan los anteriores, así que se publican como `PUT` con respuesta `200`.
- **README y spec:** la convención se agrega al README y a `api-conventions`. `cambiar_*` sigue siendo `PATCH` porque cambia un solo dato.
- **Body de `editar_profesor`:** `{ nombre, apellido, documento, correo_electronico, telefono, direccion, legajo, cargo_asociado }`. `legajo` y `cargo_asociado` son nullable, y mandar `null` deja el profesor sin legajo o sin cargo.

### D6. Dependencias resultantes de PROFESOR Y SUPLENCIAS

```
 usuario.get_usuario             ← asignar_usuario_profesor
 orientacion.get_materia         ← asignar_materias_habilitadas, get_profesor
 planificacion.get_clase         ← crear_suplencia, get_suplencias
 horarios.get_franja_horaria     ← asignar_disponibilidad, get_disponibilidad_profesor
```

### D7. Wireframe
- **A8 (alta):** se reemplaza la nota "Al dar de alta se le crea el usuario..." por "El usuario para ingresar al sistema se asigna después, desde la ficha del profesor".
- **A9 (ficha):**
  - Nuevo bloque "Usuario" en la columna izquierda, arriba de los botones.
  - Si el profesor tiene usuario, muestra `nombre_user` y `email` y un botón "Editar usuario" (`usuario.editar_usuario`).
  - Si no tiene, dice "Sin usuario asignado" y tiene un selector de usuarios existentes (`usuario.get_usuarios`) con el botón "Asignar" (`asignar_usuario_profesor`).
  - "Editar datos" abre el formulario con todos los datos (`editar_profesor`).
- **Orden:** primero se cambian los `.dc.html`, después se republica el artifact y al final se regenera `admin.html`.

## Risks / Trade-offs

- **Archivo con conflictos:** si se archiva este change antes que `alinear-prototipo-swagger`, se pierden los filtros de `get_suplencias`. → Archivar primero `alinear-prototipo-swagger` (tarea 1.1).
- **Profesor sin usuario:** un profesor puede quedar sin poder ingresar. → La ficha lo marca como "Sin usuario asignado".
- **Suplencias inmutables:** corregir una suplencia mal cargada obliga a borrarla y crearla de nuevo, y no hay `eliminar_suplencia`. → Se anota en "A revisar por el grupo" del README.
- **Diagrama desactualizado:** hasta que el grupo invierta la flecha, el diagrama y el swagger no coinciden. → Se anota en "A revisar por el grupo".

## Open Questions

- ¿Hace falta `eliminar_suplencia`? El documento nuevo lo tiene en "7. Suplencias" (`DELETE /suplencias/{id}`), pero la sección PROFESOR Y SUPLENCIAS no. Queda fuera de este change.
