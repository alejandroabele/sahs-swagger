## MODIFIED Requirements

### Requirement: Dependencias de PLANIFICACIÓN
El contrato SHALL declarar estas dependencias:
- ORIENTACIÓN `get_materia`, que usan `get_clase`, `get_clases`, `get_curso`, `get_curso_clases` y `asignar_materia_a_curso`
- ORIENTACIÓN `get_orientacion`, que usa `get_curso`
- HORARIOS `get_franja_horaria`, que usan `get_clase` y `get_curso`
- HORARIOS `get_turno`, que usa `get_curso`
- PROFESOR Y SUPLENCIAS `get_profesor`, que usa `get_clase`
- PROFESOR Y SUPLENCIAS `get_suplencias`, que usa `get_clase` para anidar la suplencia vigente (`id_clase` y la fecha del día)
- PROFESOR Y SUPLENCIAS `get_disponibilidad_profesor`, que usa `crear_clase`

MUST NOT declarar una dependencia con `profesor_suplencias.get_suplencia`.

#### Scenario: Disponibilidad al crear una clase
- **WHEN** se lee la descripción de `crear_clase`
- **THEN** menciona "Invoca: profesor_suplencias.get_disponibilidad_profesor"

#### Scenario: Materia al armar el plan del curso
- **WHEN** se lee la descripción de `asignar_materia_a_curso`
- **THEN** menciona "Invoca: orientacion.get_materia"

#### Scenario: Suplencia vigente de la clase
- **WHEN** se lee la descripción de `get_clase`
- **THEN** menciona "Invoca: profesor_suplencias.get_suplencias" y no menciona `get_suplencia`
