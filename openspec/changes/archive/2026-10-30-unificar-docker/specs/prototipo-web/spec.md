## MODIFIED Requirements

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

### Requirement: Instrucciones del prototipo
El `README.md` SHALL incluir una sección "Prototipo" que indique la URL `http://localhost:8100/prototipo/`, cómo entrar (cualquier usuario de ejemplo con una contraseña no vacía) y cómo cambiar de rol (cerrar sesión y entrar con otro usuario). También debe aclarar que las fuentes de diseño (`*.dc.html`, la planilla y los diagramas) no forman parte del repo.

#### Scenario: Lectura del README
- **WHEN** alguien del grupo abre `README.md`
- **THEN** encuentra la sección "Prototipo" con la URL bajo `:8100`, cómo entrar, cómo cambiar de rol y la aclaración sobre las fuentes de diseño
