## Why

La actividad de la facultad pide pasar la especificación de microservicios del sistema SAHS (pestaña "Microservicios" del Google Doc del grupo) a documentos Swagger/OpenAPI navegables. Hoy la especificación es solo una lista de funciones por servicio, con duplicados, huecos e inconsistencias que ya fueron aclarados con el grupo y que hay que dejar plasmados en un contrato formal.

## What Changes

- Se crea un archivo OpenAPI 3.0 en JSON **por cada microservicio** de la pestaña "Microservicios": USUARIO, PAGO, HORARIOS, PLANIFICACIÓN, ORIENTACIÓN y PROFESOR Y SUPLENCIAS.
- Cada función del documento se traduce a **una ruta por función**: `POST` para commands y `GET` para queries, con el nombre tal cual (snake_case, sin tildes), el id del recurso en la ruta y el resto de los datos en el body.
- Los modelos (schemas) salen de la hoja "diagrama_de_clases_actual" del diagrama de clases del grupo.
- Se aplican las correcciones acordadas:
  - Se quita el `eliminar_rol` duplicado y `asignar_roles` pasa a `asignar_rol`, porque cada usuario tiene un solo rol.
  - Se agregan `login` (sin seguridad), los listados que faltaban, `eliminar_materia` y la disponibilidad del profesor.
  - De cada par de duplicados (estado de propuesta, suplencia a clase) queda una sola función.
  - Las queries que devuelven **un solo dato relacionado** se eliminan, porque ese dato pasa a venir anidado en la entidad. Esto vale en los 6 servicios.
  - Se declaran las dependencias que faltaban: PAGO→PROFESOR, PROFESOR→USUARIO, PROFESOR→HORARIOS y PLANIFICACIÓN→disponibilidad.
- Se agrega un `docker-compose.yml` que levanta **Swagger UI** con un selector para cambiar entre los 6 servicios.
- Queda afuera la propagación de cambios por eventos entre servicios (pregunta abierta del documento).

## Capabilities

### New Capabilities
- `api-conventions`: Convenciones comunes a los 6 contratos: rutas por función, métodos, nombres, parámetros, errores, health check y dependencias entre servicios.
- `swagger-ui-docker`: Entorno Docker con Swagger UI que publica los 6 JSON con un selector de servicio.
- `usuario-api`: Contrato del servicio USUARIO (usuarios, roles, privilegios y login).
- `pago-api`: Contrato del servicio PAGO (pagos, recibos de sueldo, firma y descarga en PDF).
- `horarios-api`: Contrato del servicio HORARIOS (días lectivos, franjas horarias con recreos y turnos).
- `planificacion-api`: Contrato del servicio PLANIFICACIÓN (propuestas, estados, ciclos lectivos, años académicos, cursos y clases).
- `orientacion-api`: Contrato del servicio ORIENTACIÓN (orientaciones, áreas y materias).
- `profesor-suplencias-api`: Contrato del servicio PROFESOR Y SUPLENCIAS (profesores, cargos, materias habilitadas, disponibilidad y suplencias).

### Modified Capabilities
<!-- Ninguna: no hay specs previas en openspec/specs/. -->

## Impact

- Archivos nuevos en `swagger/`: `docker-compose.yml`, `specs/*.json` (6 archivos) y un `README.md` con instrucciones de uso.
- Dependencia externa: imagen Docker `swaggerapi/swagger-ui`, con versión fija.
- No se toca el prototipo HTML que está en `sahs-prototipo/`.
- Los servidores que figuran en cada contrato son ilustrativos: no hay backend, así que "Try it out" va a fallar al ejecutarse.
