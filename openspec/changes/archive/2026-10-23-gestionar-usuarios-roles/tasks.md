## 1. Swagger USUARIO

- [x] 1.1 En `tools/generar_specs.py`, sacar de `usuario()` las funciones `cambiar_email`, `cambiar_nombre`, `crear_privilegio`, `modificar_privilegio`, `eliminar_privilegio`, `get_privilegio`, `get_rol` y `get_usuario_privilegios`, y limpiar sus entradas en `VERBOS`
- [x] 1.2 Agregar `quitar_privilegio` (tag Rol): `DELETE /usuario/quitar_privilegio/{id}/{id_privilegio}` → `200` con `Rol` y `404`, con el mismo patrón que `quitar_materia_area`, y sumarlo a `VERBOS` como `_DEL`
- [x] 1.3 Regenerar con `python3 tools/generar_specs.py specs` y validar con redocly (`lint specs/*.json`)
- [x] 1.4 Verificar en `specs/usuario.json` que no existe ninguna de las 8 operaciones sacadas, que `quitar_privilegio` no tiene `requestBody` y que no hay `securitySchemes`

## 2. README

- [x] 2.1 En "Cambios respecto del documento" → USUARIO, anotar las 8 funciones sacadas (los privilegios se cargan por configuración) y el agregado de `quitar_privilegio`
- [x] 2.2 Actualizar la lista de pantallas (A1 a A18, P1 a P5) y documentar que el menú del administrativo se arma con `get_rol_privilegios`: el título de cada tarjeta es `descripcion_privilegio` y el front mapea `id_privilegio` a la pantalla

## 3. Diseño (artifact y *.dc.html)

- [x] 3.1 Leer el artifact de diseño (link en `docs/referencias.md`) con `Artifact` `action: "read"` y comparar `Menu.dc.html`, `MenuProfesor.dc.html` y la lista de pantallas con las copias locales de `sahs-prototipo/`. Partir de la versión del artifact
- [x] 3.2 `Menu.dc.html`: sacar los títulos "Procesos del ciclo" y "Parametrización" y dejar una lista plana de tarjetas, una por privilegio. El título es la descripción y la tarjeta Usuarios pasa a `listo: true`
- [x] 3.3 Crear `Usuarios.dc.html` (A17), pestaña Usuarios: tabla, formulario de alta, selector de rol, resetear contraseña y eliminar con confirmación dentro de la pantalla
- [x] 3.4 En `Usuarios.dc.html`, pestaña Roles: lista de roles con alta, renombrar y eliminar, más los checkboxes de privilegios sin clasificación (tildar = asignar, destildar = quitar) y el aviso si el administrativo se quita un privilegio propio
- [x] 3.5 Crear la pantalla "Cambiar mi contraseña" para la vista del administrativo (A18) y la del profesor (P5), con contraseña nueva, repetición y validación de que coincidan
- [x] 3.6 Republicar el artifact de diseño con los cambios

## 4. Exportar el prototipo

- [x] 4.1 En el armazón de `prototipo/admin.html`, agregar A17 y A18 a `CONFIG.pantallas`, el enlace del menú a A17 y el acceso a A18 desde la cabecera
- [x] 4.2 En el armazón de `prototipo/profesor.html`, agregar P5 a `CONFIG.pantallas` y el acceso desde la cabecera
- [x] 4.3 Correr `python3 tools/exportar_prototipo.py ..` y después `--check`, que no debe informar diferencias
- [x] 4.4 Probar en `http://localhost:8090`: menú sin grupos, A17 con las dos pestañas, A18 y P5, y los enlaces "Ver como profesor" y el inverso, sin errores en la consola
