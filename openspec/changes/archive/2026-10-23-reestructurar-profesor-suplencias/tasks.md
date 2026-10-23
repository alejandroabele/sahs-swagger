## 1. Preparación

- [x] 1.1 Archivar `alinear-prototipo-swagger` (`openspec archive alinear-prototipo-swagger`) para que sus deltas queden en las specs principales antes que los de este change.

## 2. Generador: PROFESOR Y SUPLENCIAS

- [x] 2.1 Eliminar los commands `asignar_profesor_suplencia`, `asignar_suplencia_a_clase`, `cambiar_correo`, `cambiar_direccion`, `asignar_legajo`, `asignar_cargo`, `cambiar_cargo`, `eliminar_cargo`, `asignar_materias_area` y `asignar_rol_profesor`, y la query `get_suplencia`.
- [x] 2.2 Quitar de `VERBOS` las entradas de las operaciones eliminadas y sumar `editar_profesor`, `editar_usuario` y `asignar_usuario_profesor` como `_PUT`.
- [x] 2.3 `crear_suplencia`: sumar `id_profesor` e `ids_clases` (con `minItems: 1`) como obligatorios en el body.
- [x] 2.4 `crear_profesor`: sacar `usuario` del body y aclarar en la descripción que el usuario se asigna después. En `Profesor`, hacer `id_usuario` nullable y sacarlo de `required`.
- [x] 2.5 Agregar `editar_profesor/{id}` con body `{ nombre, apellido, documento, correo_electronico, telefono, direccion, legajo (nullable), cargo_asociado (nullable) }`, que devuelve `Profesor`.
- [x] 2.6 Agregar `asignar_usuario_profesor/{id}` con body `{ id_usuario }`, que devuelve `Profesor`.
- [x] 2.7 `get_suplencias`: sumar el filtro opcional `id_clase`.
- [x] 2.8 Dependencias: sacar `usuario.crear_usuario`, `usuario.asignar_rol` y `orientacion.get_materias_area`; agregar `usuario.get_usuario` → `asignar_usuario_profesor`; `planificacion.get_clase` → `crear_suplencia`, `get_suplencias`.
- [x] 2.9 Actualizar la descripción del tag `Profesor`, que hoy menciona el cargo como algo aparte.

## 3. Generador: USUARIO y PLANIFICACIÓN

- [x] 3.1 USUARIO: agregar `editar_usuario/{id}` con body `{ nombre_user, email }`, que devuelve `Usuario`.
- [x] 3.2 PLANIFICACIÓN: cambiar la dependencia `profesor_suplencias.get_suplencia` por `profesor_suplencias.get_suplencias` para `get_clase`.

## 4. Regenerar y validar el swagger

- [x] 4.1 Regenerar con `python3 tools/generar_specs.py specs` y validar con redocly sin errores (ver "Mantenimiento" en el README).
- [x] 4.2 Comprobar con `grep` que en `specs/*.json` no quedan las operaciones eliminadas ni la dependencia `get_suplencia`.
- [x] 4.3 Revisar en Swagger UI (http://localhost:8080) los servicios PROFESOR Y SUPLENCIAS, USUARIO y PLANIFICACIÓN.

## 5. Wireframe

- [x] 5.1 `ProfesorAlta.dc.html` (A8): reemplazar la nota de creación del usuario por el aviso de que se asigna desde la ficha.
- [x] 5.2 `ProfesorDetalle.dc.html` (A9): agregar el bloque "Usuario", con estado vinculado ("Editar usuario") y sin vincular (selector de usuarios + "Asignar"), con datos de ejemplo de los dos casos.
- [x] 5.3 `ProfesorDetalle.dc.html` (A9): hacer que "Editar datos" abra un formulario con todos los datos del profesor, incluidos legajo y cargo.
- [x] 5.4 Republicar el artifact "Planilla de Horarios SAHS" con las dos pantallas cambiadas (leerlo antes con `Artifact` `action: "read"` y mergear si cambió).
- [x] 5.5 Regenerar el prototipo con `python3 tools/exportar_prototipo.py ..` y revisar A8 y A9 en http://localhost:8090/admin.html.

## 6. Documentación

- [x] 6.1 README, "Convenciones": sumar `editar_*` → `PUT` y reemplazar los ejemplos `asignar_materias_area` y `eliminar_cargo` por operaciones que sigan existiendo.
- [x] 6.2 README, "Cambios respecto del documento": anotar los commands eliminados, los nuevos, el body de `crear_suplencia`, el alta sin usuario, `editar_usuario` en USUARIO y el filtro `id_clase`. Corregir las líneas que ya no valen (duplicado `asignar_suplencia_a_clase`, dependencias de PROFESOR con USUARIO, query anidada `get_suplencia_clase`).
- [x] 6.3 README, "A revisar por el grupo": invertir en el diagrama de clases la relación Clase–Suplencia y definir si hace falta `eliminar_suplencia`.
