# pago-api Specification

## Purpose
TBD - created by archiving change swagger-microservicios-sahs. Update Purpose after archive.
## Requirements
### Requirement: Modelos de PAGO
`pago.json` SHALL definir estos schemas:
- `Pago { id_pago, id_profesor, periodo, validado, recibo_sueldo: ReciboSueldo }`. Cada pago tiene exactamente un recibo, que viene anidado.
- `ReciboSueldo { id_recibo_sueldo, id_pago, id_profesor, periodo, fecha_pago, emisor: Emisor, conceptos: ConceptoRecibo[], total_bruto, total_descuentos, neto, firma_emisor: Firma, firma_receptor: Firma }`
- `ConceptoRecibo { descripcion, cantidad (nullable), importe, tipo }`, con `tipo` en `haber` o `descuento`
- `Emisor { razon_social, cuit }`
- `Firma { id_usuario, fecha }`, que puede ser `null` mientras no se haya firmado

`ReciboSueldo` MUST NOT tener `monto`.

#### Scenario: Recibo sin firmar
- **WHEN** se consulta un recibo que el profesor todavía no firmó
- **THEN** `firma_receptor` es `null`

#### Scenario: Detalle del recibo
- **WHEN** se consulta un recibo
- **THEN** incluye `conceptos`, `total_bruto`, `total_descuentos`, `neto` y `emisor`

#### Scenario: Pago con su recibo
- **WHEN** se consulta un pago en `get_pagos`
- **THEN** trae su `recibo_sueldo` anidado

### Requirement: Commands de PAGO
El servicio SHALL exponer, con prefijo `/pago`:
- `POST crear_pago`, con body `{ id_profesor, periodo }`. Responde `201` y genera el único recibo del pago, con sus conceptos.
- `POST validar_pago/{id}`, que hace el administrativo. El body `{ id_usuario }` completa `firma_emisor` y deja `validado` en `true`.
- `GET bajar_recibo_sueldo/{id}`, que responde `application/pdf`.
- `GET calcular_monto_a_liquidar/{id}?periodo=AAAA-MM`, con `{id}` = profesor y `periodo` como query obligatorio. Devuelve `{ id_profesor, periodo, monto }`.
- `POST firmar_recibo_de_sueldo/{id}`, con body `{ id_usuario }`, que completa `firma_receptor`. La firma MUST NOT poder revertirse: no existe una operación para quitarla.

#### Scenario: Descarga del recibo
- **WHEN** se llama `GET /pago/bajar_recibo_sueldo/{id}`
- **THEN** la respuesta `200` es `application/pdf` en formato binario

#### Scenario: Cálculo sin body
- **WHEN** se llama `GET /pago/calcular_monto_a_liquidar/12?periodo=2026-03`
- **THEN** devuelve `MontoLiquidar`, y la operación no declara `requestBody`

#### Scenario: Firma definitiva
- **WHEN** se buscan las operaciones del contrato
- **THEN** no hay ninguna que borre `firma_receptor`

### Requirement: Queries y dependencias de PAGO
El servicio SHALL exponer con `GET` y prefijo `/pago`:
- `get_pagos`, con los filtros opcionales `id_profesor` y `periodo`
- `get_recibos_de_sueldo`, con los filtros opcionales `id_profesor` y `periodo`

`get_pago_recibos_de_sueldo` MUST NOT existir, porque el recibo viene anidado en el pago.

MUST declarar la dependencia con PROFESOR Y SUPLENCIAS `get_profesor`, que usan `crear_pago` y `calcular_monto_a_liquidar`.

#### Scenario: Dependencia declarada
- **WHEN** se revisa `info.x-dependencias` de `pago.json`
- **THEN** figura `profesor_suplencias.get_profesor`

#### Scenario: Recibos de un profesor
- **WHEN** se llama `GET /pago/get_recibos_de_sueldo?id_profesor=12`
- **THEN** devuelve solo los recibos del profesor 12

