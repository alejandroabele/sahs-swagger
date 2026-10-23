# prototipo-web Specification

## Purpose
Servir el prototipo HTML de SAHS (una sola aplicación con login, en `prototipo/index.html`) desde el mismo `docker compose` que Swagger UI.
## Requirements
### Requirement: Prototipo servido con Docker
El `docker-compose.yml` SHALL incluir un servicio `prototipo` basado en nginx, con una versión de imagen fija, que sirva el contenido de `prototipo/` en `http://localhost:8090`. Debe montar la carpeta en modo solo lectura. Se levanta y se baja junto con Swagger UI.

#### Scenario: Levantar todo con un comando
- **WHEN** se ejecuta `docker compose up -d` en `swagger/`
- **THEN** `http://localhost:8080` muestra Swagger UI y `http://localhost:8090` muestra el Login del prototipo

#### Scenario: Bajar todo
- **WHEN** se ejecuta `docker compose down` en `swagger/`
- **THEN** se detienen tanto el contenedor de Swagger UI como el del prototipo

#### Scenario: Cambios sin reconstruir
- **WHEN** se modifica un archivo dentro de `prototipo/` con el entorno levantado
- **THEN** alcanza con recargar la página para ver el cambio

### Requirement: Contenido del prototipo
La carpeta `prototipo/` SHALL contener un único archivo ejecutable, `index.html`, con toda la aplicación: el Login (L1), el inicio (A1), las pantallas A2 a A18 y P2 a P4. `index.html` MUST generarse a partir de los `.dc.html` del artifact de diseño, con un procedimiento documentado en el README, y MUST NOT editarse a mano, salvo el armazón. El armazón MUST NOT tener elementos de navegación propios: ni franja superior, ni pestañas con códigos de pantalla, ni pie "Ir a", ni enlaces "Ver como…".

#### Scenario: Una sola aplicación
- **WHEN** se lista la carpeta `prototipo/`
- **THEN** solo está `index.html`, y `admin.html` y `profesor.html` no existen

#### Scenario: Una sola cabecera
- **WHEN** se abre cualquier pantalla con una sesión iniciada
- **THEN** arriba se ve solo la cabecera del diseño, sin pestañas ni pie de navegación

#### Scenario: Reexportar después de cambiar el diseño
- **WHEN** se modifica un `.dc.html` y se sigue el procedimiento de exportación del README
- **THEN** `prototipo/index.html` refleja el cambio, y el artifact de diseño publicado tiene el mismo contenido

### Requirement: Instrucciones del prototipo
El `README.md` SHALL incluir una sección "Prototipo" que indique la URL `http://localhost:8090`, cómo entrar (cualquier usuario de ejemplo con una contraseña no vacía) y cómo cambiar de rol (cerrar sesión y entrar con otro usuario). También debe aclarar que las fuentes de diseño (`*.dc.html`, la planilla y los diagramas) no forman parte del repo.

#### Scenario: Lectura del README
- **WHEN** alguien del grupo abre `README.md`
- **THEN** encuentra la sección "Prototipo" con la URL, cómo entrar, cómo cambiar de rol y la aclaración sobre las fuentes de diseño

