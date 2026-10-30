## MODIFIED Requirements

### Requirement: Prototipo servido con Docker
El `docker-compose.yml` SHALL incluir solo el servicio `prototipo`, basado en nginx con una versión de imagen fija, que sirva el contenido de `prototipo/` en `http://localhost:8090`. Debe montar la carpeta en modo solo lectura.

#### Scenario: Levantar el prototipo
- **WHEN** se ejecuta `docker compose up -d` en `swagger/`
- **THEN** `http://localhost:8090` muestra el Login del prototipo

#### Scenario: Bajar el prototipo
- **WHEN** se ejecuta `docker compose down` en `swagger/`
- **THEN** se detiene el contenedor del prototipo

#### Scenario: Cambios sin reconstruir
- **WHEN** se modifica un archivo dentro de `prototipo/` con el entorno levantado
- **THEN** alcanza con recargar la página para ver el cambio
