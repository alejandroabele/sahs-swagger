## Why

Las reglas de negocio de SAHS están repartidas en el código de cada servicio y no están escritas en ninguna fuente de verdad. Algunas faltan o están a medias: una planificación puede quedar "completa" con horas de más en una materia, el error de planificación incompleta no dice qué materia falta, no hay un estado que diga cuál es la planificación vigente de un ciclo, no se puede dar de baja a un profesor y el suplente no se controla como el titular. El grupo definió las reglas propias del dominio. Hay que implementarlas en los servicios, el swagger, la web y el prototipo local, y dejarlas escritas en la pestaña "Reglas de negocio" del documento del grupo.

## What Changes

- **BREAKING** Los estados de la propuesta pasan a ser Borrador (`BOR`), En revisión (`REV`), **Vigente** (`VIG`) y **Fue vigente** (`FVG`). `VAL` se renombra a `VIG` y `CER` a `FVG` con una migración de datos.
- **BREAKING** Las transiciones quedan así: `BOR → REV` y `REV → VIG | BOR`. Una propuesta Vigente no cambia de estado a mano: pasa sola a Fue vigente cuando otra del mismo ciclo lectivo pasa a Vigente. Desaparece el paso manual `VAL → CER`.
- Para pasar a En revisión o a Vigente, cada materia de cada curso del ciclo MUST tener asignadas en clases **exactamente** sus horas semanales (hoy solo se detectan las que faltan). El `409` detalla curso, materia y horas ("1A: Matemática 3 de 5 h").
- Una clase no puede hacer que una materia supere sus horas semanales en el curso (`crear_clase`, `editar_clase`, `asignar_clase_a_propuesta`).
- Se agrega el atributo `activo` a `Profesor` (ya está en el diagrama de clases) y la operación `asignar_activo_profesor` (`PUT /profesor-suplencias/profesores/{id}/activo`, body `{ activo }`) para dar de baja (baja lógica) y reactivar.
- No se puede dar de baja a un profesor que es docente de una clase de una propuesta Vigente.
- Un profesor inactivo no se devuelve como habilitado para una materia (`get_profesores_materia`, `get_profesores_area`), y la API rechaza asignarlo a una clase o como suplente.
- El suplente MUST estar activo, habilitado en la materia de cada clase y disponible en sus franjas.
- Las franjas horarias de un mismo día lectivo no se pueden superponer.
- Se quita el tope de 2 horas diarias por materia del generador automático, porque no es una regla de la escuela.
- Documentación: README ("Cambios respecto del documento"), specs, y la pestaña "Reglas de negocio" del documento del grupo.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `planificacion-api`: estados y transiciones nuevos, la regla de horas exactas con el detalle del error, el tope de horas por clase, el profesor activo en las clases y la generación sin tope diario.
- `profesor-suplencias-api`: `Profesor.activo`, la operación `asignar_activo_profesor`, la baja bloqueada por la propuesta Vigente y las reglas del suplente.
- `orientacion-api`: `get_profesores_materia` y `get_profesores_area` devuelven solo profesores activos.
- `horarios-api`: sin cambios en este cambio. La regla de franjas superpuestas quedó para un cambio aparte: en el modelo, turnos distintos (Doble turno con Mañana y Tarde) comparten horarios.
- `prototipo-modelo`: los estados de la planificación pasan a ser Borrador, En revisión, Vigente y Fue vigente.
- `base-de-datos`: migración `ReglasDeNegocio` y seeds con los estados nuevos.
- `microservicios-nest`: transiciones de estado con Vigente y Fue vigente.

## Impact

- **Servicios:** `apps/planificacion` (`reglas.ts`, `propuesta.service.ts`, `generacion.ts`, `clase.service.ts`), `apps/profesor-suplencias` (profesor y suplencia), `apps/orientacion` (`materia.service.ts`, `area.service.ts`) y `apps/horarios` (`franja-horaria.service.ts`). También los DTOs y `libs/contratos`.
- **Llamadas entre servicios:** profesor-suplencias le pregunta a planificación si el profesor está en una clase de la propuesta Vigente, y además la materia, las franjas y los docentes de cada clase de una suplencia (ya llama a `get_clase`).
- **Base de datos:** una migración que agrega `profesor_profesor.activo` (default `true`) y renombra en el catálogo `VAL → VIG` y `CER → FVG`. Se actualizan los seeds.
- **Web:** `A13PlanificacionManual` (transiciones, botones y nombres de estados), `A7Profesores` (baja y reactivación, profesor marcado como inactivo), y las listas para elegir docente o suplente. Se regenera el cliente.
- **Prototipo local:** `prototipo/index.html` (estados, mensajes y baja de profesor). El artifact de diseño no se toca.
- **Verificador:** `asignar_activo_profesor` se agrega a `AGREGADOS` en `tools/verificar_contratos.mjs`.
- **Documento del grupo:** pestaña nueva "Reglas de negocio".
