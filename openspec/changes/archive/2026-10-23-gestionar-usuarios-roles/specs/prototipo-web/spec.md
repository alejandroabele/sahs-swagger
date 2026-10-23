## MODIFIED Requirements

### Requirement: Contenido del prototipo
La carpeta `prototipo/` SHALL contener únicamente los archivos ejecutables del prototipo: `index.html`, `admin.html` y `profesor.html`. `admin.html` y `profesor.html` deben ser copias sin modificar de los originales de `/home/jano/sahs-prototipo`.

#### Scenario: Vista del administrativo
- **WHEN** se abre `http://localhost:8090/admin.html`
- **THEN** se muestra el menú del administrativo y se puede navegar entre sus pantallas (A1 a A18), incluidas Usuarios (A17) y Cambiar mi contraseña (A18)

#### Scenario: Vista del profesor
- **WHEN** se abre `http://localhost:8090/profesor.html`
- **THEN** se muestra el menú del profesor y se puede navegar entre sus pantallas (P1 a P5), incluida Cambiar mi contraseña (P5)

#### Scenario: Cambio de rol
- **WHEN** en `admin.html` se usa el enlace "Ver como profesor"
- **THEN** se abre `profesor.html` sin errores, y el enlace inverso de `profesor.html` vuelve a `admin.html`
