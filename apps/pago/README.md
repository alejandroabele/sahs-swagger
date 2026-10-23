# Servicio Pago

Pagos, recibos de sueldo (con su PDF) y la liquidación de cada profesor.

- Prefijo de las rutas: `/pago`. Swagger: `/docs` y `/docs-json`.
- Puerto: 8082 en desarrollo, 3000 en Docker (`PORT`).
- Base: `DB_PATH` (en Docker, `/data/sahs.sqlite`). No corre migraciones: las aplica `db-init`.

## Tablas de las que es dueño

- `pago_pago`
- `pago_recibo_sueldo`
- `pago_concepto_recibo`
- `pago_parametro`
- `pago_valor_hora`

Entidades en `libs/entidades/src/pago/`.

## Dependencias (llamadas a otros servicios)

- `profesor_suplencias.get_profesor` → `crear_pago`, `calcular_monto_a_liquidar`, `firmar_recibo_de_sueldo`, `bajar_recibo_sueldo`
- `planificacion.get_ciclos_lectivos` → `crear_pago`, `calcular_monto_a_liquidar`
- `planificacion.get_propuestas` → `crear_pago`, `calcular_monto_a_liquidar`
- `planificacion.get_clases` → `crear_pago`, `calcular_monto_a_liquidar`
- `planificacion.get_cursos` → `crear_pago`, `calcular_monto_a_liquidar`
- `planificacion.get_anios_academicos` → `crear_pago`, `calcular_monto_a_liquidar`

Las URLs salen de `URL_<SERVICIO>` (por defecto `http://localhost:808x`).

## Correrlo solo

```bash
npm run build:libs && npm run build -w apps/pago
DB_PATH=../../data/sahs.sqlite npm run start -w apps/pago
```

Código: un controller y un service por tag del swagger (`src/<tag>/`), `src/dto/modelos.ts` (respuestas), `src/dto/entradas.ts` (bodies y queries con validación), `src/armado.ts` (respuestas con sus anidados).
