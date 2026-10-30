## MODIFIED Requirements

### Requirement: Mismas rutas en el prototipo
El prototipo (`prototipo/index.html`) SHALL usar las mismas rutas que la app, en el hash (`#/materias/5`). Las direcciones `#<id-de-pantalla>` (`#materias`) MUST NOT existir.

#### Scenario: Ficha en el prototipo
- **WHEN** en el prototipo, con sesión, se abre `http://localhost:8100/prototipo/#/materias/5`
- **THEN** se ve la ficha de la materia 5

#### Scenario: Hash viejo
- **WHEN** en el prototipo, con sesión, se abre `http://localhost:8100/prototipo/#materias`
- **THEN** se muestra el inicio
