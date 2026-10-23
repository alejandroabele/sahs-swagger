## MODIFIED Requirements

### Requirement: Commands de PAGO
El servicio SHALL exponer, con prefijo `/pago`:
- `POST crear_pago`, con body `{ id_profesor, periodo }`. Responde `201` y genera el recibo del pago.
- `POST validar_pago/{id}`, que hace el administrativo. El body `{ id_usuario }` completa `firma_emisor` y deja `validado` en `true`.
- `GET bajar_recibo_sueldo/{id}`, que responde `application/pdf`.
- `GET calcular_monto_a_liquidar/{id}?periodo=AAAA-MM`, con `{id}` = profesor y `periodo` como query obligatorio. Devuelve `{ id_profesor, periodo, monto }`.
- `POST firmar_recibo_de_sueldo/{id}`, con body `{ id_usuario }`, que completa `firma_receptor`.

#### Scenario: Descarga del recibo
- **WHEN** se llama `GET /pago/bajar_recibo_sueldo/{id}`
- **THEN** la respuesta `200` es `application/pdf` en formato binario

#### Scenario: Cálculo sin body
- **WHEN** se llama `GET /pago/calcular_monto_a_liquidar/12?periodo=2026-03`
- **THEN** devuelve `MontoLiquidar`, y la operación no declara `requestBody`
