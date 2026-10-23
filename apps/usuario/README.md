# Servicio Usuario

Usuarios, roles y privilegios, y el login.

- Prefijo de las rutas: `/usuario`. Swagger: `/docs` y `/docs-json`.
- Puerto: 8081 en desarrollo, 3000 en Docker (`PORT`).
- Base: `DB_PATH` (en Docker, `/data/sahs.sqlite`). No corre migraciones: las aplica `db-init`.

## Tablas de las que es dueño

- `usuario_usuario`
- `usuario_rol`
- `usuario_privilegio`
- `usuario_rol_privilegio`

Entidades en `libs/entidades/src/usuario/`.

## Dependencias (llamadas a otros servicios)

Ninguna.

Las URLs salen de `URL_<SERVICIO>` (por defecto `http://localhost:808x`).

## Correrlo solo

```bash
npm run build:libs && npm run build -w apps/usuario
DB_PATH=../../data/sahs.sqlite npm run start -w apps/usuario
```

Código: un controller y un service por tag del swagger (`src/<tag>/`), `src/dto/modelos.ts` (respuestas), `src/dto/entradas.ts` (bodies y queries con validación), `src/mapeo.ts` (entidad → respuesta).
