## MODIFIED Requirements

### Requirement: Contenido del prototipo
La carpeta `prototipo/` SHALL contener únicamente los archivos ejecutables del prototipo: `index.html`, `admin.html` y `profesor.html`. `admin.html` y `profesor.html` MUST generarse a partir de los `.dc.html` del artifact de diseño, con un procedimiento documentado en el README, y MUST NOT editarse a mano.

#### Scenario: Vista del administrativo
- **WHEN** se abre `http://localhost:8090/admin.html`
- **THEN** se muestra el menú del administrativo y se puede navegar entre sus pantallas (A1 a A16)

#### Scenario: Vista del profesor
- **WHEN** se abre `http://localhost:8090/profesor.html`
- **THEN** se muestra el menú del profesor y se puede navegar entre sus pantallas (P1 a P4)

#### Scenario: Cambio de rol
- **WHEN** en `admin.html` se usa el enlace "Ver como profesor"
- **THEN** se abre `profesor.html` sin errores, y el enlace inverso de `profesor.html` vuelve a `admin.html`

#### Scenario: Reexportar después de cambiar el diseño
- **WHEN** se modifica un `.dc.html` y se sigue el procedimiento de exportación del README
- **THEN** `admin.html` o `profesor.html` reflejan el cambio, y el artifact de diseño publicado tiene el mismo contenido
