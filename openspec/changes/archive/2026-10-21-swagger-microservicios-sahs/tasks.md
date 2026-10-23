## 1. Base del proyecto

- [x] 1.1 Crear `swagger/specs/` y `swagger/docker-compose.yml` con `swaggerapi/swagger-ui` (versión fija), el puerto `8080:8080`, el volumen `./specs:/usr/share/nginx/html/specs`, `URLS` con los 6 servicios y `URLS_PRIMARY_NAME=Usuario`
- [x] 1.2 Definir el bloque común que se copia en cada JSON: `openapi: 3.0.3`, `info` con `x-dependencias`, `servers` (`localhost:808X`), el schema `Error`, las respuestas `400` y `404` y `GET /actuator/health`

## 2. Servicios sin dependencias

- [x] 2.1 Escribir `specs/usuario.json`: schemas Usuario, Rol y Privilegio; `login` + 13 commands; 8 queries (ver `specs/usuario-api`)
- [x] 2.2 Escribir `specs/horarios.json`: schemas DiaLectivo, FranjaHoraria (con `es_recreo`) y Turno; 7 commands; 7 queries (ver `specs/horarios-api`)

## 3. Servicios con dependencias

- [x] 3.1 Escribir `specs/orientacion.json`: schemas Orientacion, Area y Materia, más el resumen local ProfesorResumen; 13 commands; 10 queries; 4 dependencias (ver `specs/orientacion-api`)
- [x] 3.2 Escribir `specs/profesor_suplencias.json`: schemas Profesor y Suplencia, más los resúmenes MateriaResumen, FranjaHorariaResumen y ClaseResumen; 14 commands; 5 queries; 6 dependencias (ver `specs/profesor-suplencias-api`)
- [x] 3.3 Escribir `specs/planificacion.json`: schemas Propuesta, EstadoPropuesta, CicloLectivo, AnioAcademico, Curso y Clase, más los resúmenes; 10 commands; 14 queries; 7 dependencias (ver `specs/planificacion-api`)
- [x] 3.4 Escribir `specs/pago.json`: schemas Pago, ReciboSueldo y Firma; 5 commands (`bajar_recibo_sueldo` responde `application/pdf`); 3 queries; 1 dependencia (ver `specs/pago-api`)

## 4. Verificación

- [x] 4.1 Validar los 6 JSON con un linter de OpenAPI en Docker (por ejemplo `redocly/cli lint`) y corregir los errores
- [x] 4.2 Comprobar con un script que no existen las operaciones eliminadas (D4 y D5) y que cada `operationId` coincide con el nombre de su ruta
- [x] 4.3 Ejecutar `docker compose up -d`, abrir `http://localhost:8080` y verificar que el selector carga los 6 servicios

## 5. Documentación

- [x] 5.1 Escribir `swagger/README.md`: cómo levantar y bajar el entorno, las convenciones (una ruta por función, POST/GET, id en la ruta, datos anidados), el aviso de que "Try it out" no tiene backend, el ciclo de dependencias y los criterios a revisar (open questions del design)
