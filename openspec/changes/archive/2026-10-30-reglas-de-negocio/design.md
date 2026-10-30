## Context

- Los estados de la propuesta son filas del catálogo `planificacion_estado_propuesta` (`BOR`, `REV`, `VAL`, `CER`). Las transiciones están en `TRANSICIONES` (`apps/planificacion/src/reglas.ts`) y hay una copia en la web (`A13PlanificacionManual.tsx`).
- `asignar_estado_a_propuesta` ya exige el plan completo para `REV` y `VAL` (`cursosIncompletos`), pero solo detecta horas que faltan, y el mensaje nombra cursos sin materias. Al validar, la `VAL` anterior del ciclo ya pasa sola a `CER`.
- Ya existen y no cambian: "no se quita una materia de un curso con clases" (`curso.service.ts`), "la suplencia empieza antes o el mismo día en que termina" y "el suplente no es docente de la clase" (`suplencia.service.ts`).
- `Profesor` no tiene `activo` en `libs/entidades`. El diagrama de clases ya lo tiene (página `pknM_HXsGpK0AsRmnoCp`, clase PROFESOR).
- El generador (`propuesta/generacion.ts:168`) limita cada materia a 2 horas por día en el curso.
- PLANIFICACIÓN ya ofrece `get_clases?id_profesor=` y `get_propuestas?id_estado=` (con `ids_clases`).
- El documento del grupo no tiene ninguna sección de reglas de negocio.

## Goals / Non-Goals

**Goals:**
- Que cada regla esté en un solo lugar: el servicio dueño del dato. La web y el prototipo muestran el `409` que devuelve la API.
- Que el modelo de estados diga cuál es la planificación vigente de cada ciclo y cuáles lo fueron.
- Baja lógica de profesor, con reactivación.

**Non-Goals:**
- Reglas que no son propias del dominio, como el tope diario por materia.
- Cambiar el artifact de diseño: solo se toca la copia local `prototipo/index.html`.
- Reglas de integridad que ya existen (nombres únicos, no borrar algo en uso). No se documentan como reglas de negocio.

## Decisions

### 1. Los estados se renombran, no se agregan

`VAL` pasa a `VIG` (Vigente) y `CER` pasa a `FVG` (Fue vigente) con una migración que hace `UPDATE` sobre el catálogo. Los `id_estado` no cambian, así que las propuestas existentes conservan su estado.

- *Alternativa:* agregar `VIG` y `FVG` y mantener `VAL` y `CER`. Se descarta porque el grupo confirmó que Validada desaparece, y dejaría estados sin uso.

`TRANSICIONES` queda `{ BOR: ['REV'], REV: ['VIG', 'BOR'], VIG: [], FVG: [] }`. El paso `VIG → FVG` no es una transición manual: lo hace `asignar_estado_a_propuesta` en la misma transacción que pasa otra propuesta del ciclo a `VIG`. Pedirlo a mano da `409` con el mensaje "Una propuesta Vigente pasa a Fue vigente sola, cuando otra del ciclo pasa a Vigente".

### 2. "Plan completo" compara por igualdad y explica qué falta

`cursosIncompletos` se reemplaza por `diferenciasDeHoras(idPropuesta, idCiclo)`, que devuelve, para cada curso del ciclo y cada materia del curso, las horas puestas (franjas de las clases de la propuesta) y las requeridas (`horas_semanales` del curso), solo cuando son distintas. El `409` las lista:

```
La planificación no está completa: 1A: Matemática 3 de 5 h; 2B: Historia 4 de 3 h.
Se envía a revisión y pasa a Vigente con cada materia en sus horas semanales.
```

Si son muchas, el mensaje muestra las primeras 10 y "y N más", para que se pueda leer en la pantalla.

### 3. Tope de horas al cargar una clase

En `Reglas` se agrega `validarHorasMateria(idPropuesta, idClase, idCurso, idMateria, cantidadFranjas)`: suma las franjas de las otras clases de la misma materia y curso en la propuesta, más las de la clase, y si superan `horas_semanales` da `409` ("Matemática en 1A ya tiene 5 de 5 h: la clase suma 2 más"). Se llama donde hoy se llama `validarChoques`: en `asignar_clase_a_propuesta`, `editar_clase` y `asignar_curso_a_clase`. `crear_clase` no lo necesita porque una clase recién creada todavía no está en ninguna propuesta.

### 4. Baja lógica con una sola operación

`asignar_activo_profesor`: `PUT /profesor-suplencias/profesores/{id}/activo` con body `{ activo: boolean }`, que devuelve el `Profesor`. Sirve para dar de baja y para reactivar.

- *Alternativa:* `DELETE /profesores/{id}`, como `eliminarProfesor()` del documento. Se descarta porque un `DELETE` que no borra confunde, y la reactivación necesitaría otra operación.

Al pasar a `activo: false`, profesor-suplencias averigua si el profesor está en la propuesta Vigente usando queries que ya existen:
1. `GET /planificacion/estados-propuesta` → `id_estado` de `VIG`;
2. `GET /planificacion/propuestas?id_estado=<VIG>` → `ids_clases`;
3. `GET /planificacion/clases?id_profesor=<id>` → si alguna clase está en esos `ids_clases`, da `409` ("<Nombre Apellido> es docente de <código> en la planificación Vigente <código>: no se puede dar de baja").

No hace falta una query nueva. La dependencia se declara en el swagger (`Invoca: planificacion.get_posibles_estados_de_propuestas, planificacion.get_propuestas, planificacion.get_clases`).

### 5. Dónde se controla "inactivo"

- `get_profesores` y `get_profesor` siguen devolviendo inactivos, con `activo: false`, para que A7 pueda reactivarlos. `get_profesores` suma el filtro opcional `activo`.
- `get_profesores_materia` y `get_profesores_area` (ORIENTACIÓN) filtran `activo: true`. Son las listas de "habilitados".
- `Reglas.validarClase` (PLANIFICACIÓN) rechaza a un profesor inactivo ("<Nombre> está dado de baja"). Ya recibe el `Profesor` completo de `profesoresPorId`.
- `crear_suplencia` rechaza a un suplente inactivo.
- El generador descarta inactivos al elegir docentes.

### 6. El suplente, como el titular

En `crear_suplencia`, para cada clase (ya se trae con `get_clase`): el suplente MUST tener la `id_materia` de la clase en `lista_materias_habilitadas` y MUST tener en su disponibilidad todas las `ids_franjas_horarias` de la clase. Es la misma regla que aplica `validarClase` a los titulares.

### 7. Franjas que no se superponen

`crear_franja_horaria` compara contra las franjas del mismo `id_dia_lectivo`: se superponen si `inicio < otra.fin && otra.inicio < fin`. Si dos franjas solo se tocan (una termina 08:40 y otra empieza 08:40), no se superponen. Antes de aplicar la regla hay que confirmar que los seeds no tengan franjas superpuestas (los turnos comparten días). Si las tienen, se corrigen los seeds.

### 8. El generador sin tope diario

Se quita la condición `enDia(...) >= 2` de `generacion.ts` y la mención al tope en el swagger, el spec y el README. El generador sigue respetando la disponibilidad, los choques y ahora las horas exactas y los profesores activos.

### 9. La web y el prototipo

- A13: `TRANSICIONES` igual a la API, sin el botón para cerrar la propuesta. El botón de validar pasa a decir "Marcar como vigente" y los nombres de los estados salen del catálogo. Al pedir el cambio de estado, el `409` se muestra como hoy.
- A7: acción "Dar de baja" / "Reactivar", y la etiqueta "Inactivo" en la lista.
- Las listas para elegir docente (A13) y suplente (A4) ya usan habilitados y disponibilidad. Se agrega el filtro por activo donde la lista sale de `get_profesores`.
- Prototipo local: los mismos nombres de estados y transiciones, la baja en A7 y el texto del error de planificación incompleta.

## Risks / Trade-offs

- **Propuestas guardadas como `VAL` con horas de más** → la regla nueva no las invalida: solo se aplica al cambiar de estado. La migración no toca las clases.
- **Llamadas extra al dar de baja** (3 GET a planificación) → la baja es una operación poco frecuente. Si planificación no responde, `503`, como en el resto.
- **Seeds con franjas superpuestas** → verificarlo antes de activar la regla 7 (tarea 1.x).
- **Copia de `TRANSICIONES` en la web** → hoy ya está duplicada. Queda igual que antes, con el comentario que remite a la API.

## Migration Plan

1. Migración `ReglasDeNegocio`: `ALTER TABLE profesor_profesor ADD COLUMN activo boolean NOT NULL DEFAULT 1`; `UPDATE planificacion_estado_propuesta SET codigo='VIG', nombre='Vigente' WHERE codigo='VAL'`; lo mismo con `CER → FVG, 'Fue vigente'`. El `down` hace lo inverso.
2. Seeds: `ESTADOS_PROPUESTA` y las propuestas de ejemplo con `VIG` y `FVG`.
3. Deploy normal: `db-init` corre la migración antes de los servicios.
