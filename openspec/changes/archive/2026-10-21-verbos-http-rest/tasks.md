## 1. Generador

- [x] 1.1 Cambiar los helpers de `tools/generar_specs.py` para que acepten el verbo (`post`, `put`, `patch`, `delete`, `get`), el código de respuesta (`201`/`200`/`204`), un segundo parámetro de ruta y parámetros de query
- [x] 1.2 Aplicar el mapeo D2 del design a las operaciones de USUARIO, PAGO y HORARIOS
- [x] 1.3 Aplicar el mapeo D2 a las operaciones de PLANIFICACIÓN, ORIENTACIÓN y PROFESOR Y SUPLENCIAS
- [x] 1.4 Pasar `bajar_recibo_sueldo` a `GET`, y `calcular_monto_a_liquidar` a `GET` con `periodo` como query
- [x] 1.5 Pasar el id secundario a la ruta en `quitar_materia_area`, `quitar_materia_orientacion` y `eliminar_franja_horaria_turno`, sin body

## 2. Verificación

- [x] 2.1 Regenerar `specs/*.json` y validarlos con `redocly/cli lint` sin errores
- [x] 2.2 Comprobar con un script que cada operación tenga el verbo y el código de la tabla D2, que ningún `GET` ni `DELETE` tenga `requestBody` y que no cambien las rutas ni los `operationId` respecto de la versión anterior
- [x] 2.3 Recargar Swagger UI y verificar que los 6 servicios muestran los verbos nuevos

## 3. Documentación

- [x] 3.1 Actualizar la sección "Convenciones" del `README.md` con la tabla de verbos y la excepción del id secundario en `DELETE`; quitar la nota de que `bajar_recibo_sueldo` es `POST`
