# Servicio Horarios

Días lectivos, franjas horarias (horas cátedra y recreos) y turnos.

- Prefijo de las rutas: `/horarios`. Swagger: `/docs` y `/docs-json`.
- Puerto: 8083 en desarrollo, 3000 en Docker (`PORT`).
- Base: `DB_PATH` (en Docker, `/data/sahs.sqlite`). No corre migraciones: las aplica `db-init`.

## Tablas de las que es dueño

- `horarios_dia_lectivo`
- `horarios_franja_horaria`
- `horarios_turno`
- `horarios_turno_franja`

Entidades en `libs/entidades/src/horarios/`.

## Dependencias (llamadas a otros servicios)

Ninguna.

Las URLs salen de `URL_<SERVICIO>` (por defecto `http://localhost:808x`).

## Correrlo solo

```bash
npm run build:libs && npm run build -w apps/horarios
DB_PATH=../../data/sahs.sqlite npm run start -w apps/horarios
```

Código: un controller y un service por tag del swagger (`src/<tag>/`), `src/dto/modelos.ts` (respuestas), `src/dto/entradas.ts` (bodies y queries con validación), `src/mapeo.ts` (entidad → respuesta).
