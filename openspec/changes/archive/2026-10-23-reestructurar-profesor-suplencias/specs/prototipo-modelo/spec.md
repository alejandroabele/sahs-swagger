## ADDED Requirements

### Requirement: Alta de profesor sin usuario
El alta de profesor (A8) SHALL cargar solo los datos del profesor (`crear_profesor`) y MUST NOT crear un usuario. La pantalla MUST avisar que el usuario para ingresar al sistema se asigna después, desde la ficha del profesor.

#### Scenario: Nota del alta
- **WHEN** se abre el alta de profesor (A8)
- **THEN** no aparece el texto "se le crea el usuario" y sí el aviso de que el usuario se asigna desde la ficha

### Requirement: Usuario en la ficha del profesor
La ficha del profesor (A9) SHALL tener un bloque "Usuario":
- Si el profesor tiene usuario, muestra `nombre_user` y `email` y permite editarlos (`usuario.editar_usuario`).
- Si no tiene, muestra "Sin usuario asignado" y permite elegir un usuario existente (`usuario.get_usuarios`) y asignarlo (`asignar_usuario_profesor`).

"Editar datos" SHALL editar todos los datos del profesor en un solo formulario (`editar_profesor`), incluidos legajo y cargo.

#### Scenario: Asignar usuario desde la ficha
- **WHEN** en la ficha de un profesor sin usuario se elige un usuario y se toca "Asignar"
- **THEN** el bloque "Usuario" pasa a mostrar el `nombre_user` y el `email` elegidos, con el botón "Editar usuario"

#### Scenario: Editar el usuario del profesor
- **WHEN** en la ficha de un profesor con usuario se toca "Editar usuario", se cambia el email y se guarda
- **THEN** el bloque "Usuario" muestra el email nuevo

#### Scenario: Editar datos del profesor
- **WHEN** se toca "Editar datos" en la ficha
- **THEN** se abre un formulario con nombre, apellido, documento, correo, teléfono, dirección, legajo y cargo, y al guardar se actualizan todos
