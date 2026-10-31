## 1. Base de datos

- [x] 1.1 Agregar `activo` (boolean, default `true`) a `ProfesorEntidad` en `libs/entidades/src/profesor-suplencias/index.ts`
- [x] 1.2 Migración `ReglasDeNegocio` en `apps/db/src/migraciones`: columna `profesor_profesor.activo`, `VAL → VIG 'Vigente'` y `CER → FVG 'Fue vigente'` en `planificacion_estado_propuesta`, con su `down`
- [x] 1.3 Seeds (`apps/db/src/seeds/datos.ts`): `ESTADOS_PROPUESTA` y las propuestas de ejemplo con `VIG` y `FVG`, y los profesores con `activo: true`
- [x] 1.4 Confirmar que los seeds no tienen franjas superpuestas en un mismo día lectivo; corregirlas si las hay

## 2. PLANIFICACIÓN: estados y plan completo

- [x] 2.1 `reglas.ts`: `TRANSICIONES = { BOR: ['REV'], REV: ['VIG', 'BOR'], VIG: [], FVG: [] }` y `NOMBRE_ESTADO` con Vigente y Fue vigente
- [x] 2.2 `asignar_estado_a_propuesta`: al pasar a `VIG`, la `VIG` del mismo ciclo pasa a `FVG` en la misma transacción; un pedido sobre una `VIG` da `409` con el mensaje del diseño
- [x] 2.3 Reemplazar `cursosIncompletos` por `diferenciasDeHoras` (igualdad exacta) y armar el `409` con `<curso>: <materia> <puestas> de <requeridas> h`, con un máximo de 10 diferencias y "y N más"
- [x] 2.4 Reemplazar `'VAL'`/`'CER'` en todo `apps/planificacion` (`grep -rn "'VAL'\|'CER'"`)

## 3. PLANIFICACIÓN: clases y generador

- [x] 3.1 `Reglas.validarHorasMateria` y llamarla en `asignar_clase_a_propuesta`, `editar_clase` y `asignar_curso_a_clase`
- [x] 3.2 `Reglas.validarClase`: rechazar a un docente con `activo: false` ("<Nombre Apellido> está dado de baja")
- [x] 3.3 `generacion.ts`: quitar el tope `enDia(...) >= 2`, descartar profesores inactivos y no superar las horas semanales
- [x] 3.4 Swagger de `generar_planilla` y `asignar_estado_a_propuesta`: textos sin el tope diario y con las reglas nuevas (descripción del `409`)

## 4. PROFESOR Y SUPLENCIAS

- [x] 4.1 `Profesor.activo` y `ProfesorResumen.activo` en `dto/modelos.ts` y `libs/contratos`; `crear_profesor` deja `activo: true`
- [x] 4.2 `asignar_activo_profesor` (`PUT /profesores/{id}/activo`, DTO `{ activo }` en `dto/entradas.ts`, interfaz en `libs/contratos`), con el control de la propuesta Vigente por `get_posibles_estados_de_propuestas`, `get_propuestas?id_estado=` y `get_clases?id_profesor=`, y el `Invoca:` en la descripción
- [x] 4.3 `get_profesores`: filtro opcional `activo`
- [x] 4.4 `crear_suplencia`: suplente activo, habilitado en la materia y disponible en las franjas de cada clase (`409`)

## 5. ORIENTACIÓN y HORARIOS

- [x] 5.1 `get_profesores_materia` y `get_profesores_area`: solo profesores activos
- [ ] 5.2 `crear_franja_horaria`: `409` si se superpone con otra franja del mismo día lectivo. Pendiente para un cambio aparte: los turnos distintos comparten horarios (85 pares en los seeds, ninguno dentro de un mismo turno); la propuesta es controlarlo dentro de un mismo turno

## 6. Verificación de la API

- [x] 6.1 Agregar `asignar_activo_profesor` a `AGREGADOS` en `tools/verificar_contratos.mjs`
- [x] 6.2 Tests de cada regla nueva (transiciones, `VIG → FVG` automático, horas exactas con el mensaje, tope por clase, baja bloqueada, suplente, franjas superpuestas, generador sin tope)
- [x] 6.3 `node tools/generar_cliente_web.mjs`, `npm test` y `npm run verificar-contratos` sin errores

## 7. Web

- [x] 7.1 `A13PlanificacionManual`: `TRANSICIONES` igual a la API, sin el botón para cerrar, "Marcar como vigente" en lugar de validar, nombres de estado del catálogo; el `409` de plan incompleto se ve entero
- [x] 7.2 Las demás pantallas que nombran `VAL`, `CER`, Validada o Cerrada (`grep -rn` en `apps/web/src`)
- [x] 7.3 `A7Profesores`: etiqueta "Dado de baja" en la lista. Las acciones "Dar de baja" y "Reactivar" (`asignar_activo_profesor`) y el `409` quedaron en la ficha (`A9ProfesorDetalle`), donde están las demás acciones del profesor. A6 tampoco ofrece inactivos al habilitar
- [x] 7.4 Listas para elegir docente (A13) y suplente (A4): sin inactivos

## 8. Prototipo local

- [x] 8.1 `prototipo/index.html`: estados Borrador, En revisión, Vigente y Fue vigente, sin acción para cerrar, error de plan incompleto con curso, materia y horas
- [x] 8.2 `prototipo/index.html`: baja y reactivación en A7 e inactivos fuera de las listas de docentes y suplentes. Quitar el tope de 2 horas del generador del prototipo

## 9. Documentación

- [x] 9.1 README: "Cambios respecto del documento" (estados Vigente y Fue vigente, `asignar_activo_profesor`, `activo` en `Profesor`, generador sin tope) y la tabla de errores `409` si cambia
- [ ] 9.2 Pestaña "Reglas de negocio" en el documento del grupo (texto acordado en la exploración). Necesita el conector de Google Docs
- [ ] 9.3 Probar la app con `docker compose up -d --build`: pasar una propuesta incompleta a Vigente (ver el error), pasar una completa (la anterior queda Fue vigente), dar de baja a un profesor de la Vigente (ver el error)
