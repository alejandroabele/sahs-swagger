## Context

- El servicio USUARIO (`tools/generar_specs.py`, función `usuario()`) expone hoy 22 operaciones, entre ellas el ABM de privilegios y queries individuales que el grupo decidió no usar. Los privilegios se cargan por configuración: el sistema no los crea, no los modifica y no los borra.
- En el prototipo, la tarjeta "Usuarios" del menú del administrativo (A1) figura como `listo: false` ("Todavía sin prototipar").
- El menú A1 (`Menu.dc.html`) agrupa 11 tarjetas en "Procesos del ciclo" (2) y "Parametrización" (9). Cada tarjeta es un privilegio del rol, así que los títulos de grupo no corresponden a nada del modelo.
- Flujo del diseño: artifact → `*.dc.html` de `sahs-prototipo/` → `tools/exportar_prototipo.py` → `prototipo/*.html`. Las copias locales pueden estar viejas respecto del artifact.
- Este cambio se aparta del Google Doc, que no se modifica. Las diferencias se anotan en el README.

## Goals / Non-Goals

**Goals:**
- Dejar el contrato USUARIO con solo las funciones que usa el prototipo, y agregar `quitar_privilegio`.
- Prototipar la gestión de usuarios y roles (A17) y el cambio de la propia contraseña (A18 y P5).
- Que el menú del administrativo refleje el modelo, con una tarjeta por privilegio y sin grupos.

**Non-Goals:**
- Modificar el Google Doc o el diagrama de clases. El schema `Privilegio` no cambia.
- Pantallas para crear, editar o borrar privilegios.
- Cambiar el menú del profesor.
- Seguridad o autenticación real. Sigue sin `securitySchemes`.

## Decisions

1. **`quitar_privilegio` con el segundo id en la ruta.** `DELETE /usuario/quitar_privilegio/{id}/{id_privilegio}` devuelve `200` con el `Rol`. El README ya fija que `DELETE` no lleva body y que los `quitar_*` devuelven la entidad modificada (por ejemplo, `quitar_materia_area`).
   - Alternativa descartada: mandar `{ id_privilegio }` en el body. Va contra la convención y algunos clientes HTTP descartan el body en `DELETE`.
   - Se implementa como los otros `quitar_*` del generador: va en `VERBOS` como `_DEL` y se define con un parámetro de ruta extra.

2. **El menú se arma con los privilegios del rol, sin campo nuevo.** El título de cada tarjeta es `descripcion_privilegio`. Cada tarjeta lleva a su pantalla según el `id_privilegio`, y ese mapeo lo resuelve el front (en el prototipo, `CONFIG.enlaces`).
   - Alternativa descartada: agregar un campo `codigo` a `Privilegio`. Obliga a cambiar el diagrama de clases, y el grupo eligió mostrar solo la descripción.

3. **Pantalla Usuarios única (A17) con dos pestañas.**
   - **Usuarios:** tabla armada con `get_usuarios` (nombre, email y el rol anidado). Tiene alta (`crear_usuario`), selector de rol (`asignar_rol`), resetear contraseña (`cambiar_contrasenia`) y eliminar (`eliminar_usuario`, con confirmación dentro de la pantalla).
   - **Roles:** a la izquierda, la lista de roles (`get_roles`) con alta, renombrar y eliminar. A la derecha, todos los privilegios (`get_privilegios`) como checkboxes, con tildados los que trae `get_rol_privilegios`. Al tildar se llama a `asignar_privilegio` y al destildar, a `quitar_privilegio`.
   - Alternativa descartada: pantallas separadas para usuarios y para roles. Suman navegación y en el menú hay una sola tarjeta "Usuarios".

4. **"Cambiar mi contraseña" como pantalla propia en cada vista** (A18 en admin y P5 en profesor). Usa el mismo `PATCH /usuario/cambiar_contrasenia/{id}` con el id del usuario logueado y se abre desde un enlace del armazón (la cabecera). El reseteo que hace el administrativo desde A17 usa el mismo endpoint con el id de otro usuario.
   - Alternativa descartada: un modal en el armazón. El exportador trabaja por pantallas (`*.dc.html` → `<template>`), así que una pantalla nueva entra en el flujo sin tocar el runtime.

5. **Orden de trabajo:** primero se lee el artifact y se compara con los `*.dc.html` locales. Después se edita el diseño, se republica el artifact, se exporta y al final se actualiza el swagger. Así se respeta la regla de que el diseño manda.

## Risks / Trade-offs

- [Las copias locales `*.dc.html` están desactualizadas respecto del artifact] → Leer el artifact al empezar y partir de esa versión.
- [El mapeo de `id_privilegio` a pantalla queda implícito en el front] → Documentarlo en el README, en la sección del prototipo.
- [Sin `get_usuario_privilegios`, para armar el menú hacen falta dos llamadas (`login` y `get_rol_privilegios`)] → Es aceptable para el prototipo y lo pidió el grupo.
- [Destildar un privilegio que el propio administrativo necesita lo puede dejar sin acceso] → En el prototipo se muestra un aviso. No se bloquea.

## Migration Plan

Es un contrato de prototipo y no tiene consumidores. Se regenera `specs/usuario.json`, se valida con redocly y se recarga Swagger UI. Para volver atrás, se restaura `tools/generar_specs.py` y se regenera.

## Open Questions

- Ninguna bloqueante. El grupo confirmó: un solo rol por usuario, menú del profesor sin cambios y documento sin modificar.
