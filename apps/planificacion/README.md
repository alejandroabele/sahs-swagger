# Servicio Planificación

Ciclos lectivos, años académicos, cursos y sus materias, clases y propuestas de planificación con sus estados.

- Prefijo de las rutas: `/planificacion`. Swagger: `/docs` y `/docs-json`.
- Puerto: 8084 en desarrollo, 3000 en Docker (`PORT`).
- Base: `DB_PATH` (en Docker, `/data/sahs.sqlite`). No corre migraciones: las aplica `db-init`.

## Tablas de las que es dueño

- `planificacion_ciclo_lectivo`
- `planificacion_anio_academico`
- `planificacion_curso`
- `planificacion_materia_curso`
- `planificacion_clase`
- `planificacion_clase_franja`
- `planificacion_clase_profesor`
- `planificacion_propuesta`
- `planificacion_propuesta_clase`
- `planificacion_estado_propuesta`

Entidades en `libs/entidades/src/planificacion/`.

## Dependencias (llamadas a otros servicios)

- `orientacion.get_materia` → `crear_clase`, `editar_clase`, `asignar_curso_a_clase`, `asignar_materia_a_curso`
- `orientacion.get_materias` → `get_clase`, `get_clases`, `get_curso_clases`, `get_curso`, `get_cursos`, `get_cursos_anio_academico`
- `orientacion.get_orientacion` → `crear_curso`
- `orientacion.get_orientaciones` → `get_curso`, `get_cursos`, `get_cursos_anio_academico`
- `orientacion.asignar_curso_a_orientacion` → `crear_curso`
- `orientacion.asignar_clase_a_materia` → `crear_clase`
- `horarios.get_turno` → `crear_curso`, `crear_clase`, `editar_clase`
- `horarios.get_turnos` → `get_curso`, `get_cursos`, `get_cursos_anio_academico`
- `horarios.get_franjas_horarias` → `get_clase`, `get_clases`, `get_curso_clases`, `crear_clase`, `editar_clase`, `asignar_clase_a_propuesta`
- `profesor_suplencias.get_profesores` → `get_clase`, `get_clases`, `get_curso_clases`, `crear_clase`, `editar_clase`
- `profesor_suplencias.get_suplencias` → `get_clase`
- `profesor_suplencias.get_disponibilidad_profesor` → `crear_clase`, `editar_clase`

Las URLs salen de `URL_<SERVICIO>` (por defecto `http://localhost:808x`).

## Correrlo solo

```bash
npm run build:libs && npm run build -w apps/planificacion
DB_PATH=../../data/sahs.sqlite npm run start -w apps/planificacion
```

Código: un controller y un service por tag del swagger (`src/<tag>/`), `src/dto/modelos.ts` (respuestas), `src/dto/entradas.ts` (bodies y queries con validación), `src/armado.ts` (respuestas con sus anidados).
