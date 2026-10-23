## Context

- **Swagger:** los contratos se generan con `tools/generar_specs.py`. `Servicio._add` acepta `query_params`, pero todos salen obligatorios (`required: True`), así que hoy no se pueden declarar filtros opcionales.
- **Prototipo:** `prototipo/admin.html` y `prototipo/profesor.html` son exportaciones de los `.dc.html` del artifact "Planilla de Horarios SAHS". Las copias locales del diseño están en `/home/jano/sahs-prototipo/`. No hay un script de exportación: cada pantalla quedó embebida en el HTML con el comentario `A<n> · <título> — lógica original de <archivo>.dc.html`.
- **Decisiones del grupo:** salen del análisis previo y definen, en cada diferencia, si manda el swagger (clase, franjas) o el diseño (horas por curso, recibos, estados gestionados).

## Goals / Non-Goals

**Goals:**
- Que la estructura del prototipo (clase, franja, suplencia, estados) se pueda representar con el swagger.
- Que el swagger cubra lo que el diseño necesita en horas por curso, recibos y filtros.
- Que la exportación del prototipo sea repetible.

**Non-Goals:**
- Crear pantallas nuevas (login, usuarios, pagos del administrativo, áreas, días lectivos).
- Modelar en el swagger todos los valores del diseño (años de una orientación, código de turno, reglas de negocio como el tope de 36 h).
- Agregar los `modificar_*` que faltan, salvo `cambiar_horas_materia_curso`.

## Decisions

### D1. Filtros opcionales en los listados
- **Cambio en el generador:** `_add` acepta una cuarta posición opcional en cada `query_params`: `(nombre, schema, descripcion, required=True)`. Los filtros de listado se declaran con `required=False`.
- **Combinación:** los filtros se combinan con AND. Si se omiten todos, el listado devuelve todo, como hoy.
- **Errores:** solo los listados con filtros suman la respuesta `400`, para cuando un filtro no es válido.
- **Alternativa descartada:** crear queries nuevas (`get_clases_profesor`…). Rompe el 1 a 1 con el documento y multiplica las rutas.

### D2. Materia 1:N con orientación
- **Schema:** `Materia { id_orientacion (obligatorio), orientacion: OrientacionResumen }` en lugar de `orientaciones[]`.
- **Asignación:** `PUT /orientacion/asignar_materia_orientacion/{id}`, donde `{id}` es la materia, con body `{ id_orientacion }`. Se invierte respecto de hoy (el `{id}` era la orientación), porque un `PUT` reemplaza un valor único de la entidad de la ruta.
- **Se elimina `quitar_materia_orientacion`:** la orientación es obligatoria, así que no se puede dejar una materia sin orientación.
- **Se mantiene `get_materias_orientacion/{id}`.**
- **Alternativa descartada:** mantener N:M y que el prototipo use una sola orientación. "Matemática 4° Economía" y "Matemática 4° Educación" tienen horas distintas, así que son materias distintas.

### D3. Horas por curso
- **Dónde vive:** en PLANIFICACIÓN, que es el dueño de Curso.
- **Schema nuevo `MateriaCurso { id_materia, nombre_materia, horas_semanales }`:** `horas_semanales` es la del curso. Si no se define, toma la de la materia.
- **`Curso.materias`:** pasa a ser `MateriaCurso[]`.
- **Commands:**
  - `POST asignar_materia_a_curso/{id}` con body `{ id_materia, horas_semanales? }`. Devuelve el `Curso`.
  - `DELETE quitar_materia_curso/{id}/{id_materia}`. Devuelve el `Curso`.
  - `PATCH cambiar_horas_materia_curso/{id}` con body `{ id_materia, horas_semanales }`. Devuelve el `Curso`.
- **Dependencia nueva:** PLANIFICACIÓN → `orientacion.get_materia`, que usa `asignar_materia_a_curso`.
- **Alternativa descartada:** guardar las horas en la Clase. La clase existe recién al planificar, y el curso necesita el plan de horas antes (A3, A11).

### D4. Recibo de sueldo
- **Relación Pago–Recibo 1:1:** `Pago.recibo_sueldo` (anidado y readOnly). Se elimina `get_pago_recibos_de_sueldo`, porque la convención es que una relación de un elemento va anidada.
- **Schema `ReciboSueldo`:** `{ id_recibo_sueldo, id_pago, id_profesor, periodo, fecha_pago, emisor: Emisor, conceptos: ConceptoRecibo[], total_bruto, total_descuentos, neto, firma_emisor, firma_receptor }`.
  - Se suman `id_profesor` y `periodo`, copiados del pago, para poder filtrar los recibos sin pasar por el pago.
  - `fecha` se renombra `fecha_pago`.
- **Schema `ConceptoRecibo`:** `{ descripcion, cantidad (nullable), importe, tipo: enum[haber, descuento] }`.
- **Schema `Emisor`:** `{ razon_social, cuit }`.
- **Firma:** no se puede deshacer, así que no hay un endpoint para revertirla.
- **Alternativa descartada:** mantener la relación 1:N. El diseño muestra un recibo por mes, y 1:N no tiene uso en la interfaz.

### D5. Estados de propuesta gestionados
- **Se mantiene el catálogo:** siguen `crear_estado_propuesta` y `get_posibles_estados_de_propuestas`. La descripción de `EstadoPropuesta` documenta la carga inicial: Borrador (BOR), En revisión (REV), Validada (VAL) y Cerrada (CER).
- **`crear_propuesta`:** la propuesta nace en BOR.
- **Validación:** el estado es de toda la propuesta, no de cada curso.

### D6. Exportación del prototipo
- **Primera tarea:** descubrir cómo se armó `admin.html`, comparando las pantallas embebidas con sus `.dc.html` y viendo cómo se reemplaza el runtime `support.js`.
- **Resultado:** un script versionado o un procedimiento manual documentado. Se decide cuando se sepa cómo funciona hoy.
- **Orden de trabajo:**
  1. Se editan los `.dc.html` en `sahs-prototipo/`.
  2. Se republica el artifact con el contenido nuevo en `appifact-doc`.
  3. Se reexportan `admin.html` y `profesor.html` y se copian a `prototipo/`.

### D7. Clase y franjas en el prototipo
- **A13:**
  - Cada combinación curso–materia es una clase, con una sola lista de docentes.
  - Al ubicar una hora, se suma la franja a esa clase.
  - El panel de la celda muestra los docentes de la clase y, si se cambian, el cambio vale para todas sus franjas.
- **A4:**
  - Se elige el ausente, el período y el motivo.
  - Se marcan las clases afectadas, que quedan enteras.
  - Se elige un suplente por clase.
- **Franjas:**
  - Se generan por turno y por día (Lunes a Viernes).
  - Los recreos aparecen como franjas marcadas `es_recreo`.
  - Las grillas de A2, A3, A13, P2 y P3 se dibujan con las franjas del turno que corresponde: el turno del curso en A3 y A13, y los turnos donde da clase el profesor en A2, P2 y P3.

## Risks / Trade-offs

- **[No hay script de exportación]** → Lo primero es entender el proceso actual. Si hace falta, se exporta a mano y se documenta en el README.
- **[El artifact es la fuente de verdad y es grande (3 MB)]** → Se edita a partir de los `.dc.html` locales y se republica el artifact completo. Antes de publicar se vuelve a leer el artifact, para no pisar cambios de otros.
- **[Cambios BREAKING en los contratos]** → No hay backend, así que el impacto queda en la documentación. Se anotan en el README.
- **[Choques entre turnos]** → La disponibilidad por id de franja no detecta superposiciones de horario entre turnos distintos. Se acepta para mantener el modelo del swagger. Si hace falta, se revisa en otro change.
- **[A13 es la pantalla más grande (84 KB)]** → Se cambia en pasos: primero el modelo de datos de la grilla y después la interfaz del panel de la celda.

## Migration Plan

1. Primero se hacen los cambios del generador y se regeneran los contratos.
2. Se valida con redocly.
3. Después se cambia el prototipo.
4. Si algo sale mal: el artifact conserva sus versiones anteriores, y `prototipo/` y `specs/` se pueden restaurar desde las copias originales en `sahs-prototipo/`.

## Open Questions

- ¿El emisor del recibo es un dato fijo de la institución (configuración) o puede variar por recibo? Por ahora va anidado en el recibo.
- ¿Las horas por curso pueden superar las de la materia, o solo reducirse? Por ahora son libres, de 1 a 10.
