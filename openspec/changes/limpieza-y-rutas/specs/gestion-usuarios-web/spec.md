## MODIFIED Requirements

### Requirement: Menú armado con privilegios para todos los roles
El inicio (`/`) SHALL ser el mismo para todos los roles y mostrar una tarjeta por cada privilegio con pantalla del rol del usuario que entró, en una lista plana y sin títulos de grupo. El título de cada tarjeta MUST ser la `descripcion_privilegio`. Las tarjetas se obtienen con `login` → `usuario.rol.id_rol` → `get_rol_privilegios`. Cada tarjeta MUST llevar a la ruta de su pantalla según el `id_privilegio`. Los privilegios que no tienen pantalla MUST NOT mostrarse. MUST NOT existir un menú aparte para el profesor.

#### Scenario: Menú del administrativo
- **WHEN** se entra como `secretaria`
- **THEN** el inicio muestra las 10 tarjetas con pantalla del rol Administrativo, incluida "Disponibilidad de profesores"

#### Scenario: Menú del profesor
- **WHEN** se entra como `jramirez`
- **THEN** el inicio muestra "Mi grilla horaria", "Mi disponibilidad" y "Mis recibos"

#### Scenario: Tarjeta lleva a su pantalla
- **WHEN** se toca la tarjeta "Cambio de clase"
- **THEN** se abre `/suplencias`

#### Scenario: Privilegio sin pantalla
- **WHEN** el rol tiene el privilegio "Áreas", que no tiene pantalla
- **THEN** el inicio no muestra una tarjeta "Áreas" ni ninguna tarjeta "Pendiente"

#### Scenario: Quitar un privilegio cambia el menú
- **WHEN** en `/roles` se le quita al rol Administrativo el privilegio "Cursos" y se vuelve al inicio
- **THEN** la tarjeta "Cursos" ya no aparece
