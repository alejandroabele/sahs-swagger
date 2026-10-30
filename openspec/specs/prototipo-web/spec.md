# prototipo-web Specification

## Purpose
Servir el prototipo HTML de SAHS (una sola aplicación con login, en `prototipo/index.html`) desde el mismo `docker compose` que Swagger UI.
## Requirements
### Requirement: Prototipo servido con Docker
El nginx de `web` SHALL servir el contenido de `prototipo/` en `http://localhost:8100/prototipo/`. La imagen de `web` MUST incluir una copia de `prototipo/`, y el compose MUST montar además la carpeta `prototipo/` en modo solo lectura sobre esa copia, para que los cambios se vean sin reconstruir. `/prototipo` (sin barra) MUST redirigir a `/prototipo/`. El prototipo MUST NOT tener contenedor ni puerto propios.

#### Scenario: Levantar el prototipo
- **WHEN** se ejecuta `docker compose up -d --build` en `swagger/`
- **THEN** `http://localhost:8100/prototipo/` muestra el Login del prototipo

#### Scenario: Navegar dentro del prototipo
- **WHEN** en `http://localhost:8100/prototipo/` se entra con `secretaria` y se abre una pantalla del menú
- **THEN** la pantalla se ve igual que antes en `:8090`, sin recursos que respondan 404

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
El `README.md` SHALL incluir una sección "Prototipo" que indique la URL `http://localhost:8100/prototipo/`, cómo entrar (cualquier usuario de ejemplo con una contraseña no vacía) y cómo cambiar de rol (cerrar sesión y entrar con otro usuario). También debe aclarar que las fuentes de diseño (`*.dc.html`, la planilla y los diagramas) no forman parte del repo.

#### Scenario: Lectura del README
- **WHEN** alguien del grupo abre `README.md`
- **THEN** encuentra la sección "Prototipo" con la URL bajo `:8100`, cómo entrar, cómo cambiar de rol y la aclaración sobre las fuentes de diseño

