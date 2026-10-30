## MODIFIED Requirements

### Requirement: Commands de PAGO
El servicio SHALL exponer, con prefijo `/pago`:
- `crear_pago` (`POST /pagos`), con body `{ id_profesor, periodo }`. Responde `201` y genera el único recibo del pago, con sus conceptos.
- `validar_pago` (`POST /pagos/{id}/validacion`), que hace el administrativo. El body `{ id_usuario }` completa `firma_emisor` y deja `validado` en `true`.
- `bajar_recibo_sueldo` (`GET /recibos-de-sueldo/{id}/pdf`), que responde `application/pdf`.
- `calcular_monto_a_liquidar` (`GET /profesores/{id}/monto-a-liquidar?periodo=AAAA-MM`), con `{id}` = profesor y `periodo` como query obligatorio. Devuelve `{ id_profesor, periodo, monto }`.
- `firmar_recibo_de_sueldo` (`POST /recibos-de-sueldo/{id}/firma`), con body `{ id_usuario }`, que completa `firma_receptor`. La firma MUST NOT poder revertirse: no existe una operación para quitarla.

#### Scenario: Descarga del recibo
- **WHEN** se llama `GET /pago/recibos-de-sueldo/{id}/pdf`
- **THEN** la respuesta `200` es `application/pdf` en formato binario

#### Scenario: Cálculo sin body
- **WHEN** se llama `GET /pago/profesores/12/monto-a-liquidar?periodo=2026-03`
- **THEN** devuelve `MontoLiquidar`, y la operación no declara `requestBody`

#### Scenario: Firma definitiva
- **WHEN** se buscan las operaciones del contrato
- **THEN** no hay ninguna que borre `firma_receptor`

### Requirement: Queries y dependencias de PAGO
El servicio SHALL exponer con `GET` y prefijo `/pago`:
- `get_pagos` (`/pagos`), con los filtros opcionales `id_profesor` y `periodo`
- `get_recibos_de_sueldo` (`/recibos-de-sueldo`), con los filtros opcionales `id_profesor` y `periodo`

`get_pago_recibos_de_sueldo` MUST NOT existir, porque el recibo viene anidado en el pago.

MUST declarar la dependencia con PROFESOR Y SUPLENCIAS `get_profesor`, que usan `crear_pago` y `calcular_monto_a_liquidar`.

#### Scenario: Dependencia declarada
- **WHEN** se revisa `info.x-dependencias` de `pago.json`
- **THEN** figura `profesor_suplencias.get_profesor`

#### Scenario: Recibos de un profesor
- **WHEN** se llama `GET /pago/recibos-de-sueldo?id_profesor=12`
- **THEN** devuelve solo los recibos del profesor 12
