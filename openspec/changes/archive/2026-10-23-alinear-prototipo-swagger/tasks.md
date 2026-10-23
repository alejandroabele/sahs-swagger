## 1. Generador: filtros opcionales

- [x] 1.1 En `Servicio._add` de `tools/generar_specs.py`, aceptar un cuarto elemento opcional `required` en cada `query_params` (por defecto `True`).
- [x] 1.2 Agregar `get_clases?id_profesor,id_curso,id_propuesta`, `get_propuestas?id_ciclo_lectivo,id_estado` y `get_cursos?id_ciclo_lectivo` como filtros opcionales.
- [x] 1.3 Agregar `get_profesores?id_usuario` y `get_suplencias?fecha_desde,fecha_hasta,id_profesor,id_curso` como filtros opcionales.
- [x] 1.4 Agregar `get_pagos?id_profesor,periodo` y `get_recibos_de_sueldo?id_profesor,periodo` como filtros opcionales.

## 2. Generador: orientación y materias

- [x] 2.1 `Curso.id_orientacion`: hacerlo obligatorio y no nullable, y sacar la nota "Null en ciclo básico".
- [x] 2.2 `Materia`: reemplazar `orientaciones[]` por `id_orientacion` (obligatorio) y `orientacion` anidada. Sumar `id_orientacion` como obligatorio en el body de `crear_materia`.
- [x] 2.3 `asignar_materia_orientacion`: pasarlo a `PUT` con `{id}` = materia y body `{ id_orientacion }`. Eliminar `quitar_materia_orientacion` y su entrada en `VERBOS`, si la tiene.

## 3. Generador: horas por curso

- [x] 3.1 Crear el schema `MateriaCurso { id_materia, nombre_materia, horas_semanales }` y usarlo en `Curso.materias`.
- [x] 3.2 Agregar `POST asignar_materia_a_curso/{id}`, `PATCH cambiar_horas_materia_curso/{id}` y `DELETE quitar_materia_curso/{id}/{id_materia}`, que devuelven el `Curso`.
- [x] 3.3 Declarar la dependencia de `orientacion.get_materia` para `asignar_materia_a_curso`.

## 4. Generador: estados y recibos

- [x] 4.1 Documentar en `EstadoPropuesta` la carga inicial (BOR, REV, VAL, CER) y en `crear_propuesta` que la propuesta nace en Borrador. Actualizar la descripción del tag.
- [x] 4.2 Crear los schemas `Emisor` y `ConceptoRecibo` (`tipo`: enum haber/descuento).
- [x] 4.3 Rehacer `ReciboSueldo` con `id_profesor`, `periodo`, `fecha_pago`, `emisor`, `conceptos`, `total_bruto`, `total_descuentos` y `neto`, sin `monto`.
- [x] 4.4 Agregar `recibo_sueldo` anidado en `Pago`. Eliminar `get_pago_recibos_de_sueldo`. Aclarar en `firmar_recibo_de_sueldo` que la firma no se revierte.

## 5. Regenerar, validar y documentar el swagger

- [x] 5.1 Regenerar con `python3 tools/generar_specs.py specs` y validar con redocly sin errores.
- [x] 5.2 Revisar en Swagger UI (http://localhost:8080) los servicios que cambiaron.
- [x] 5.3 README: agregar la convención de filtros en "Convenciones" y cada cambio en "Cambios respecto del documento" (materia 1:N, orientación obligatoria, horas por curso, recibo 1:1 con detalle, estados, filtros). Revisar "A revisar por el grupo" (el punto 1 de recibos queda resuelto).

## 6. Exportación del prototipo

- [x] 6.1 Comparar `prototipo/admin.html` con los `.dc.html` de `sahs-prototipo/` para entender cómo se embebieron las pantallas y cómo se reemplazó `support.js`.
- [x] 6.2 Dejar el procedimiento repetible: un script en `tools/` o pasos manuales. Probarlo regenerando el `admin.html` actual sin cambios y comparando el resultado.
- [x] 6.3 Documentar el procedimiento en el README (sección "Prototipo") y en `docs/referencias.md` ("Cómo se baja cada cambio").

## 7. Prototipo: franjas por turno

- [x] 7.1 En el `Catalogo` compartido, generar las franjas por día con los recreos como franjas `es_recreo`.
- [x] 7.2 A2 y P3 (disponibilidad): dibujar la grilla con las franjas de los turnos, sin la grilla fija de 7:50. Los recreos no se pueden marcar.
- [x] 7.3 A3 y A13: tomar la grilla del turno del curso. Los recreos no se pueden ocupar.
- [x] 7.4 P2 y A9 (mini grilla): usar las franjas del turno.
- [x] 7.5 A16: mostrar los recreos como franjas propias del turno (no como huecos) y explicar que las franjas son por día.

## 8. Prototipo: clase, suplencia, estados y firma

- [x] 8.1 A13: modelo de grilla por clase (curso + materia → una lista de docentes para todas las franjas). El panel de la celda edita los docentes de la clase y avisa que el cambio vale para todas sus horas.
- [x] 8.2 A4: registrar la suplencia con el ausente, el período, el motivo, las clases afectadas (enteras) y un suplente por clase.
- [x] 8.3 A3 y A10: sacar el estado de validación por curso. Dejar el avance y el estado de la planificación completa.
- [x] 8.4 P4: sacar "Deshacer" la firma.

## 9. Publicar y verificar

- [x] 9.1 Volver a leer el artifact, republicarlo con los `.dc.html` modificados y verificar que abra bien.
- [x] 9.2 Reexportar `admin.html` y `profesor.html` a `prototipo/` y recorrer A1 a A16 y P1 a P4 en http://localhost:8090, sin errores en la consola.
- [x] 9.3 Validar el change con `openspec validate alinear-prototipo-swagger`.
