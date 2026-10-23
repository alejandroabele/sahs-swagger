# Servicio Profesor y Suplencias

Profesores (datos, usuario, materias habilitadas y disponibilidad) y suplencias.

- Prefijo de las rutas: `/profesor_suplencias`. Swagger: `/docs` y `/docs-json`.
- Puerto: 8086 en desarrollo, 3000 en Docker (`PORT`).
- Base: `DB_PATH` (en Docker, `/data/sahs.sqlite`). No corre migraciones: las aplica `db-init`.

## Tablas de las que es dueño

- `profesor_profesor`
- `profesor_materia_habilitada`
- `profesor_disponibilidad`
- `profesor_suplencia`
- `profesor_suplencia_clase`

Entidades en `libs/entidades/src/profesor-suplencias/`.

## Dependencias (llamadas a otros servicios)

- `usuario.get_usuario` → `asignar_usuario_profesor`
- `orientacion.get_materia` → `asignar_materias_habilitadas`
- `orientacion.get_materias` → `get_profesor`, `get_profesores`, `get_disponibilidad_profesor`
- `planificacion.get_clase` → `crear_suplencia`
- `planificacion.get_clases` → `crear_suplencia`, `get_suplencias`
- `horarios.get_franja_horaria` → `asignar_disponibilidad`
- `horarios.get_franjas_horarias` → `get_profesor`, `get_profesores`, `get_disponibilidad_profesor`

Las URLs salen de `URL_<SERVICIO>` (por defecto `http://localhost:808x`).

## Correrlo solo

```bash
npm run build:libs && npm run build -w apps/profesor-suplencias
DB_PATH=../../data/sahs.sqlite npm run start -w apps/profesor-suplencias
```

Código: un controller y un service por tag del swagger (`src/<tag>/`), `src/dto/modelos.ts` (respuestas), `src/dto/entradas.ts` (bodies y queries con validación), `src/armado.ts` (respuestas con sus anidados).
