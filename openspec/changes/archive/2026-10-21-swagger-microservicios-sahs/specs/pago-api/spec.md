## ADDED Requirements

### Requirement: Modelos de PAGO
`pago.json` SHALL definir estos schemas:
- `Pago { id_pago, id_profesor, periodo, validado }`
- `ReciboSueldo { id_recibo_sueldo, id_pago, monto, fecha, firma_emisor: Firma, firma_receptor: Firma }`
- `Firma { id_usuario, fecha }`, que puede ser `null` mientras no se haya firmado

#### Scenario: Recibo sin firmar
- **WHEN** se consulta un recibo que el profesor todavía no firmó
- **THEN** `firma_receptor` es `null`

### Requirement: Commands de PAGO
El servicio SHALL exponer con `POST` y prefijo `/pago`:
- `crear_pago`, con body `{ id_profesor, periodo }`, que genera el recibo del pago
- `validar_pago/{id}`, que hace el administrativo; el body `{ id_usuario }` completa `firma_emisor` y deja `validado` en `true`
- `bajar_recibo_sueldo/{id}`, que responde `application/pdf`
- `calcular_monto_a_liquidar/{id}`, con `{id}` = profesor y body `{ periodo }`, que devuelve `{ id_profesor, periodo, monto }`
- `firmar_recibo_de_sueldo/{id}`, con body `{ id_usuario }`, que completa `firma_receptor`

#### Scenario: Descarga del recibo
- **WHEN** se llama `POST /pago/bajar_recibo_sueldo/{id}`
- **THEN** la respuesta `200` es `application/pdf` en formato binario

### Requirement: Queries y dependencias de PAGO
El servicio SHALL exponer con `GET` y prefijo `/pago`:
- `get_pago_recibos_de_sueldo/{id}`
- `get_pagos`
- `get_recibos_de_sueldo`

MUST declarar la dependencia con PROFESOR Y SUPLENCIAS `get_profesor`, que usan `crear_pago` y `calcular_monto_a_liquidar`.

#### Scenario: Dependencia declarada
- **WHEN** se revisa `info.x-dependencias` de `pago.json`
- **THEN** figura `profesor_suplencias.get_profesor`
