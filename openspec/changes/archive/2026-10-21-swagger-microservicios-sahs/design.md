## Context

- **Fuente de verdad:** la pestaña "Microservicios" del Google Doc del grupo (6 servicios con commands y queries). La pestaña "Microservicios SAHS" **no** se usa.
- **Modelos:** la hoja "diagrama_de_clases_actual" del diagrama de clases (draw.io en Drive).
- **Decisiones:** todas las dudas se aclararon con el usuario durante la exploración. Este documento las registra.
- **Entorno:** Docker 29 en Linux. No hay backend: el entregable es solo documentación navegable.

```
 swagger/
 ├── docker-compose.yml        Swagger UI en :8080 con selector de servicio
 ├── README.md
 └── specs/
     ├── usuario.json              prefijo /usuario              server :8081
     ├── pago.json                 prefijo /pago                 server :8082
     ├── horarios.json             prefijo /horarios             server :8083
     ├── planificacion.json        prefijo /planificacion        server :8084
     ├── orientacion.json          prefijo /orientacion          server :8085
     └── profesor_suplencias.json  prefijo /profesor_suplencias  server :8086
```

## Goals / Non-Goals

**Goals:**
- Que los 6 contratos OpenAPI 3.0 sean válidos y reflejen las funciones acordadas, una ruta por función.
- Que los schemas sean fieles a los atributos del diagrama de clases.
- Que las dependencias entre servicios queden visibles en cada contrato.
- Que todo se levante con un solo `docker compose up`.

**Non-Goals:**
- Implementar los servicios o un mock server.
- Seguridad: no se definen `securitySchemes`, y `login` devuelve el token como texto simple.
- Eventos o mensajería asíncrona entre servicios (pregunta 22: queda afuera).
- Operaciones asíncronas: todo es sincrónico.
- La pestaña "Microservicios SAHS".

## Decisions

### D1. Una ruta por función, `POST` para commands y `GET` para queries
`POST /<prefijo>/<nombre_funcion>[/{id}]` para commands y `GET /<prefijo>/<nombre_funcion>[/{id}]` para queries. Los `eliminar_*` también usan `POST`.
- *Por qué:* lo eligió el usuario para que el mapeo con el documento sea 1 a 1 (estilo RPC).
- *Alternativa descartada:* REST por recursos (`PATCH /usuarios/{id}/email`).

### D2. Nombres tal cual, en snake_case y sin tildes ni `ñ`
Ejemplos: `get_día_lectivo` → `get_dia_lectivo`, `crear_año_academico` → `crear_anio_academico`. El `operationId` es el mismo nombre de la función.
- *Atributos:* se aplica la misma regla: `contraseña` → `contrasenia`, `año_calendario` → `anio_calendario`, `año_curricular` → `anio_curricular`.

### D3. El id del recurso principal va en la ruta y los ids secundarios en el body
- `POST /usuario/asignar_rol/{id}` con body `{ "id_rol": 2 }`.
- `POST /horarios/eliminar_franja_horaria_turno/{id}`, donde `{id}` es el turno, con body `{ "id_franja_horaria": 5 }`.
- El parámetro de ruta se llama siempre `{id}` y su descripción indica de qué entidad es.

### D4. Las queries que devuelven un solo dato relacionado se anidan en la entidad
Si la query devolvía **un solo dato** relacionado, se elimina y ese dato viene anidado en la respuesta de la entidad. Si devuelve una **lista**, queda como endpoint. Se aplica en los 6 servicios. Las queries eliminadas son:
- **PLANIFICACIÓN:** `get_materia_clase`, `get_franja_horaria_clase`, `get_profesores_clase`, `get_turno_curso`, `get_franja_horarios_curso`, `get_orientacion_curso`, `get_curso_materias`, `get_suplencia_clase`. Además se unifica el duplicado `get_clases_curso` en `get_curso_clases`.
- **USUARIO:** `get_usuario_roles`.
- **ORIENTACIÓN:** `get_area_materia`, `get_orientacion_materia`.
- **HORARIOS:** `get_nombre_dia_lectivo`, `get_cantidad_franjas_total`.
- **PROFESOR Y SUPLENCIAS:** `get_profesor_suplencia`, `get_clase_suplencia`.

En los schemas el dato anidado se escribe como un objeto (por ejemplo `materia: Materia`) junto a su id (`id_materia`).
- *Alternativa descartada:* tener endpoints separados **y** el dato anidado (opción b).

### D5. Duplicados
- `eliminar_rol` aparecía dos veces: queda una sola.
- `asignar_estado_propuesta` y `asignar_estado_a_propuesta`: queda `asignar_estado_a_propuesta`.
- `asignar_suplencias_a_clase` (PLANIFICACIÓN) y `asignar_suplencia_a_clase` (PROFESOR Y SUPLENCIAS): queda la segunda, en el servicio dueño del modelo Suplencia.

### D6. Dependencias entre servicios
- **En cada contrato:** una extensión `x-dependencias` en `info`, con una lista de `{ servicio, endpoint, usado_por: [operationId] }`.
- **En cada operación:** la `description` agrega una línea "Invoca: <servicio>.<endpoint>".
- *Por qué:* OpenAPI no tiene un campo estándar para esto y Swagger UI muestra las descriptions.

### D7. Errores y health check
- **Errores:** un schema `Error { codigo: string, mensaje: string }`. Las operaciones con `{id}` responden `404`, las que tienen body responden `400` y los commands exitosos responden `200` con la entidad resultante, salvo los `eliminar_*`, que responden `204` sin cuerpo (excepción: `eliminar_cargo` y `eliminar_franja_horaria_turno` devuelven la entidad modificada).
- **Health check:** cada contrato incluye `GET /actuator/health`, sin prefijo, que responde `{ "status": "UP" }`.
- **Contraseña:** `contrasenia` se marca como `writeOnly` y nunca aparece en una respuesta.

### D8. Swagger UI con Docker
- Imagen `swaggerapi/swagger-ui` con versión fija (por ejemplo `v5.17.14`).
- `./specs` se monta en `/usr/share/nginx/html/specs` y el puerto es `8080:8080`.
- La variable `URLS` lista los 6 archivos (el selector "Select a definition") y `URLS_PRIMARY_NAME=Usuario`.
- *Alternativas descartadas:* Swagger Editor y Prism (mock).

### D9. Criterios de modelado del dominio, acordados en la exploración
- **Usuario:** tiene **un** rol (`id_rol` + `rol` anidado), aunque el diagrama marque "M".
- **Clase:** tiene `id_curso`, `id_materia`, `ids_franjas_horarias[]` e `ids_profesores[]`, porque una clase puede tener varios profesores (el caso EPA).
- **Propuesta:** tiene `id_ciclo_lectivo`. Sus estados son `borrador` y `validada`.
- **Pago:** tiene `id_profesor`. `validar_pago` lo hace el administrativo y completa `firma_emisor` en los recibos.
- **Recibo:** `firmar_recibo_de_sueldo` la hace el profesor y completa `firma_receptor`. Cada firma es `{ id_usuario, fecha }`.
- **Descarga:** `bajar_recibo_sueldo/{id}` descarga el PDF y responde `application/pdf` (binario). Es `POST` porque en el documento es un command.
- **Monto:** `calcular_monto_a_liquidar/{id}` recibe el id del profesor y el body `{ periodo }`. Devuelve `{ id_profesor, periodo, monto }` y el cálculo es interno.
- **Franja horaria:** `hora_inicio` y `hora_fin` (formato `HH:mm`) más `es_recreo: boolean`. Un día lectivo es un día de la semana.
- **Cargo:** es el atributo de texto `cargo_asociado` del profesor. `eliminar_cargo` lo deja en `null`.
- **Disponibilidad:** `asignar_disponibilidad/{id}` con body `{ ids_franjas_horarias[] }` y `get_disponibilidad_profesor/{id}`.
- **Login:** `POST /usuario/login` con body `{ email, contrasenia }`. Devuelve `{ token, usuario }`.
- **Área:** tiene `id_profesor_coordinador` y el coordinador va anidado (`coordinador: ProfesorResumen`).

## Risks / Trade-offs

- [El estilo RPC con `POST` para eliminar no es REST idiomático] → Es una decisión explícita del usuario y se documenta en el README.
- ["Try it out" falla porque no hay backend] → Se aclara en `info.description` y en el README.
- [Hay dependencias cíclicas: PLANIFICACIÓN ⇄ ORIENTACIÓN ⇄ PROFESOR] → Se documentan tal como están y se señalan en el README como observación de diseño.
- [Repetir schemas entre archivos (por ejemplo, `Materia` anidada en PLANIFICACIÓN) genera duplicación] → Cada JSON es autocontenido; el servicio consumidor define un schema "resumen" (`MateriaResumen`) con los campos que necesita.

## Open Questions

Se resuelven durante la implementación con un criterio explícito y quedan señaladas en el README para que el grupo las revise:
- **Recibos:** el documento no tiene un command para crear recibos. Criterio: `crear_pago` genera el recibo del pago y calcula el monto con `calcular_monto_a_liquidar`.
- **Clase sin asignaciones:** no hay commands para asignar materia, franjas o profesores a una clase. Criterio: van en el body de `crear_clase`, que consulta `get_disponibilidad_profesor`.
- **`get_estado_actual_de_propuesta`:** devuelve un solo dato, pero no figuraba en la tabla de eliminadas que confirmó el usuario. Criterio: se mantiene y además el estado viene anidado en la propuesta.
