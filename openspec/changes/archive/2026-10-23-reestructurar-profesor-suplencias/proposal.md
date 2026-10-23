## Why

El grupo simplificó el servicio PROFESOR Y SUPLENCIAS en el documento. Había un command por cada dato del profesor, la suplencia se armaba en tres pasos y el usuario quedaba atado al alta del profesor. Ahora los datos se editan con un solo endpoint, la suplencia se crea completa y el usuario se asigna después. El swagger y el wireframe tienen que reflejar esas decisiones.

## What Changes

**PROFESOR Y SUPLENCIAS (`profesor_suplencias.json`)**

- **Se eliminan:**
  - `asignar_profesor_suplencia` y `asignar_suplencia_a_clase`. Los reemplaza el body de `crear_suplencia`.
  - `cambiar_correo`, `cambiar_direccion` y `asignar_legajo`. Los reemplaza `editar_profesor`.
  - `asignar_cargo`, `cambiar_cargo` y `eliminar_cargo`. El cargo también se edita con `editar_profesor`.
  - `asignar_materias_area`. Se usa `asignar_materias_habilitadas`.
  - `get_suplencia`. Se usa `get_suplencias` con filtros.
  - `asignar_rol_profesor`. Lo reemplaza `asignar_usuario_profesor`.
  - **BREAKING**
- **Se agregan:**
  - `PUT editar_profesor/{id}`: reemplaza todos los datos del profesor.
  - `PUT asignar_usuario_profesor/{id}` con body `{ id_usuario }`: vincula un usuario existente al profesor.
- **`crear_suplencia`:** el body suma `id_profesor` (suplente) e `ids_clases[]`. **BREAKING**
- **`crear_profesor`:** deja de crear el usuario y no recibe `usuario` en el body. `Profesor.id_usuario` pasa a ser opcional y nullable. **BREAKING**
- **`get_suplencias`:** suma el filtro opcional `id_clase`.
- **Dependencias:**
  - Se van `usuario.crear_usuario`, `usuario.asignar_rol` y `orientacion.get_materias_area`.
  - Entra `usuario.get_usuario` para `asignar_usuario_profesor`.
  - `planificacion.get_clase` pasa a usarse en `crear_suplencia` y `get_suplencias`.

**USUARIO (`usuario.json`)**

- Se agrega `PUT editar_usuario/{id}`, que reemplaza `nombre_user` y `email`. No toca la contraseña ni el rol.

**PLANIFICACIÓN (`planificacion.json`)**

- `get_clase` arma `Clase.suplencia` con `profesor_suplencias.get_suplencias?id_clase=`, en lugar de `get_suplencia`.

**Wireframe (artifact "Planilla de Horarios SAHS" y `prototipo/admin.html`)**

- **Alta de profesor (A8):** ya no dice que se crea el usuario. Avisa que el usuario se asigna desde la ficha.
- **Ficha del profesor (A9):**
  - Suma un bloque "Usuario" que muestra el usuario vinculado y deja asignarlo (`asignar_usuario_profesor`) y editarlo (`usuario.editar_usuario`).
  - "Editar datos" edita todos los datos juntos (`editar_profesor`).
- **Suplencias:** no cambia. Ya arma una suplencia por suplente con sus clases.

**Documentación**

- README: "Cambios respecto del documento" y los ejemplos de la tabla de convenciones, que hoy usan `asignar_materias_area` y `eliminar_cargo`.
- Pedirle al grupo que invierta en el diagrama de clases la relación Clase–Suplencia: la referencia la guarda Suplencia.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `profesor-suplencias-api`: cambian los modelos (`Profesor.id_usuario` opcional), los commands, las queries (`get_suplencia` sale y `get_suplencias` suma `id_clase`) y las dependencias.
- `usuario-api`: se agrega `editar_usuario`.
- `planificacion-api`: la dependencia de `get_clase` pasa de `get_suplencia` a `get_suplencias`.
- `api-conventions`: se suma `editar_*` a la tabla de verbos, como `PUT` porque reemplaza todos los datos editables de la entidad.
- `prototipo-modelo`: el alta (A8) no crea el usuario y la ficha del profesor (A9) suma el bloque "Usuario". Esta capability la crea el change `alinear-prototipo-swagger`, así que ese change se archiva primero.

## Impact

- **Código:** `tools/generar_specs.py` (servicios `profesor_suplencias`, `usuario` y `planificacion`, y el mapa `VERBOS`) y los `specs/*.json` regenerados.
- **Diseño:** `ProfesorAlta.dc.html` y `ProfesorDetalle.dc.html` en `/home/jano/sahs-prototipo/`, el artifact publicado y `prototipo/admin.html`, que se regenera con `tools/exportar_prototipo.py`.
- **Docs:** `README.md`.
- **Fuera del repo:** el diagrama de clases (draw.io) lo actualiza el grupo.
