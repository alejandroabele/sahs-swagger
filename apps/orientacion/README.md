# Servicio Orientación

Orientaciones (y la orientación de cada curso), áreas y materias.

- Prefijo de las rutas: `/orientacion`. Swagger: `/docs` y `/docs-json`.
- Puerto: 8085 en desarrollo, 3000 en Docker (`PORT`).
- Base: `DB_PATH` (en Docker, `/data/sahs.sqlite`). No corre migraciones: las aplica `db-init`.

## Tablas de las que es dueño

- `orientacion_orientacion`
- `orientacion_curso`
- `orientacion_area`
- `orientacion_materia`
- `orientacion_materia_clase`

Entidades en `libs/entidades/src/orientacion/`.

## Dependencias (llamadas a otros servicios)

- `profesor_suplencias.get_profesor` → `crear_area`, `get_area`, `get_areas`, `get_materia`, `get_materias`
- `profesor_suplencias.get_profesores` → `get_profesores_materia`, `get_profesores_area`
- `planificacion.get_clase` → `asignar_clase_a_materia`, `eliminar_materia`
- `planificacion.get_curso` → `asignar_curso_a_orientacion`
- `planificacion.get_anio_academico` → `crear_materia`, `asignar_anio_academico_a_materia`

Las URLs salen de `URL_<SERVICIO>` (por defecto `http://localhost:808x`).

## Correrlo solo

```bash
npm run build:libs && npm run build -w apps/orientacion
DB_PATH=../../data/sahs.sqlite npm run start -w apps/orientacion
```

Código: un controller y un service por tag del swagger (`src/<tag>/`), `src/dto/modelos.ts` (respuestas), `src/dto/entradas.ts` (bodies y queries con validación), `src/armado.ts` (respuestas con sus anidados).
