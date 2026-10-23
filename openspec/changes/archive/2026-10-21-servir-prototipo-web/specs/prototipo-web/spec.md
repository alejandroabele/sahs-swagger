## ADDED Requirements

### Requirement: Prototipo servido con Docker
El `docker-compose.yml` SHALL incluir un servicio `prototipo` basado en nginx, con una versión de imagen fija, que sirva el contenido de `prototipo/` en `http://localhost:8090`. Debe montar la carpeta en modo solo lectura. Se levanta y se baja junto con Swagger UI.

#### Scenario: Levantar todo con un comando
- **WHEN** se ejecuta `docker compose up -d` en `swagger/`
- **THEN** `http://localhost:8080` muestra Swagger UI y `http://localhost:8090` muestra la portada del prototipo

#### Scenario: Bajar todo
- **WHEN** se ejecuta `docker compose down` en `swagger/`
- **THEN** se detienen tanto el contenedor de Swagger UI como el del prototipo

#### Scenario: Cambios sin reconstruir
- **WHEN** se modifica un archivo dentro de `prototipo/` con el entorno levantado
- **THEN** alcanza con recargar la página para ver el cambio

### Requirement: Contenido del prototipo
La carpeta `prototipo/` SHALL contener únicamente los archivos ejecutables del prototipo: `index.html`, `admin.html` y `profesor.html`. `admin.html` y `profesor.html` deben ser copias sin modificar de los originales de `/home/jano/sahs-prototipo`.

#### Scenario: Vista del administrativo
- **WHEN** se abre `http://localhost:8090/admin.html`
- **THEN** se muestra el menú del administrativo y se puede navegar entre sus pantallas (A1 a A16)

#### Scenario: Vista del profesor
- **WHEN** se abre `http://localhost:8090/profesor.html`
- **THEN** se muestra el menú del profesor y se puede navegar entre sus pantallas (P1 a P4)

#### Scenario: Cambio de rol
- **WHEN** en `admin.html` se usa el enlace "Ver como profesor"
- **THEN** se abre `profesor.html` sin errores, y el enlace inverso de `profesor.html` vuelve a `admin.html`

### Requirement: Portada de selección de rol
`prototipo/index.html` SHALL ser la página de inicio del prototipo y ofrecer un acceso a la vista del administrativo (`admin.html`) y otro a la vista del profesor (`profesor.html`). Debe usar la misma estética del prototipo (IBM Plex Sans, paleta clara).

#### Scenario: Entrar desde la raíz
- **WHEN** se abre `http://localhost:8090/`
- **THEN** se ve la portada con los accesos "Administrativo" y "Profesor"

#### Scenario: Elegir un rol
- **WHEN** se hace clic en "Profesor" en la portada
- **THEN** se abre `profesor.html`

### Requirement: Instrucciones del prototipo
El `README.md` SHALL incluir una sección "Prototipo" que indique la URL `http://localhost:8090` y qué vistas contiene. También debe aclarar que las fuentes de diseño (`*.dc.html`, la planilla y los diagramas) no forman parte del repo.

#### Scenario: Lectura del README
- **WHEN** alguien del grupo abre `README.md`
- **THEN** encuentra la sección "Prototipo" con la URL y la aclaración sobre las fuentes de diseño
