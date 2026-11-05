## ADDED Requirements

### Requirement: App de arquitectura
El repo SHALL tener el workspace `apps/arquitectura` (`@sahs/arquitectura`), una app React + Vite que dibuja los diagramas con `@xyflow/react` y se publica bajo `/arquitectura/`. La app SHALL tener tres pantallas: Componentes (`/arquitectura/`), Comunicación (`/arquitectura/comunicacion`) y Validar (`/arquitectura/validar`), con pestañas para pasar de una a otra. Recargar cualquiera de esas rutas MUST devolver la app.

#### Scenario: Entrar a la vista
- **WHEN** con el compose levantado se abre `http://localhost:8100/arquitectura/`
- **THEN** se ve el diagrama de componentes con las pestañas Componentes, Comunicación y Validar

#### Scenario: Recargar una pantalla
- **WHEN** se recarga `http://localhost:8100/arquitectura/comunicacion`
- **THEN** se ve el diagrama de comunicación y no un 404 ni la app web de SAHS

### Requirement: Diagrama de componentes
La pantalla Componentes SHALL mostrar, de arriba hacia abajo: Usuarios (Administrativo, Coordinador de área, Profesor) → Aplicación web → API Gateway → los microservicios del modelo validado → Base de datos. Cada pieza MUST mostrar su ícono, su nombre, su tipo como etiqueta (`personas`, `cliente`, `servidor` o `almacenamiento`) y una descripción corta. La banda de los servicios SHALL decir que son servidores, y la pantalla SHALL tener el recuadro "Qué es cada pieza", que explica con un ícono qué es un cliente, un servidor, un API Gateway, un microservicio y una base de datos. La pantalla MUST NOT mostrar detalles de infraestructura (caddy, nginx, puertos, versiones).

#### Scenario: Piezas con su tipo
- **WHEN** se abre la pantalla Componentes
- **THEN** la Aplicación web tiene la etiqueta "cliente", el API Gateway y cada microservicio "servidor", y la Base de datos "almacenamiento"

#### Scenario: Glosario
- **WHEN** se abre la pantalla Componentes
- **THEN** el recuadro "Qué es cada pieza" explica cliente, servidor, API Gateway, microservicio y base de datos, cada uno con su ícono

#### Scenario: Gateway como se diseñó
- **WHEN** se mira el API Gateway
- **THEN** su descripción dice que valida el token y dirige cada pedido a su servicio, y Usuario dice que emite el token

### Requirement: Diagrama de comunicación
La pantalla Comunicación SHALL mostrar solo los microservicios y sus llamadas HTTP. Una llamada en un solo sentido MUST dibujarse en gris con una flecha; si dos servicios se llaman entre sí, MUST dibujarse una sola línea azul con flecha en las dos puntas. La pantalla SHALL tener una leyenda con los dos tipos de línea.

#### Scenario: Llamada en un sentido
- **WHEN** se abre la pantalla Comunicación
- **THEN** hay una flecha gris de Pago a Planificación

#### Scenario: Servicios que se llaman entre sí
- **WHEN** se abre la pantalla Comunicación
- **THEN** Planificación y Orientación están unidos por una sola línea azul con flecha en las dos puntas

### Requirement: Modelo generado desde el código
`tools/arquitectura.mjs generar` SHALL escribir `apps/arquitectura/modelo/generado.json` con:
- los servicios del compose que se construyen con `APP` (sin `db-init`), cada uno con sus tablas (`@Entity` de `libs/entidades/src/<servicio>`);
- las llamadas entre servicios (`new ClienteServicio('<servicio>')` en `apps/<servicio>/src`);
- los nombres de los contenedores del compose.

La app SHALL generar el modelo antes de `dev` y de `build`.

#### Scenario: Llamadas detectadas
- **WHEN** se ejecuta `node tools/arquitectura.mjs generar`
- **THEN** `generado.json` tiene 11 llamadas, entre ellas `pago → planificacion` y `profesor-suplencias → usuario`

#### Scenario: Tablas por servicio
- **WHEN** se ejecuta `node tools/arquitectura.mjs generar`
- **THEN** el servicio `planificacion` tiene 10 tablas, todas con el prefijo `planificacion_`

### Requirement: Validación humana del modelo
Los diagramas SHALL mostrar el modelo de `apps/arquitectura/modelo/validado.json`, que va en el repo. Las diferencias con el modelo generado (servicio, llamada o contenedor nuevo o eliminado, y tablas agregadas o quitadas) MUST aparecer en la pantalla Validar y, cuando se pueden dibujar, en los diagramas con línea o borde punteado ámbar. `npm run arquitectura:validar` SHALL mostrar cada diferencia en la terminal y preguntar si se aprueba; lo aprobado se escribe en `validado.json` junto con la fecha. `npm run verificar-arquitectura` SHALL terminar con error si hay diferencias. Un agente de IA MUST NOT aprobar diferencias.

#### Scenario: Cambio sin validar
- **WHEN** el código tiene un contenedor que no está en `validado.json`
- **THEN** la pantalla Validar lo lista con dónde se detectó y el comando para aprobarlo, y la cabecera avisa cuántos cambios hay sin validar

#### Scenario: Aprobar
- **WHEN** una persona corre `npm run arquitectura:validar` y aprueba todas las diferencias
- **THEN** `validado.json` queda igual al modelo del código, con la fecha de hoy, y `npm run verificar-arquitectura` termina sin error

#### Scenario: Verificación con diferencias
- **WHEN** hay diferencias sin aprobar y se corre `npm run verificar-arquitectura`
- **THEN** lista las diferencias y termina con código distinto de 0

### Requirement: Estado en vivo
Cada microservicio SHALL mostrar si responde: verde si `/actuator/health` devuelve `UP`, rojo si falla y gris mientras no hay dato. La app MUST consultarlo cada 10 segundos por `/arquitectura/salud/<servicio>`, que el nginx de `arquitectura` pasa a `http://<servicio>:3000/actuator/health` solo para los 6 servicios conocidos.

#### Scenario: Servicio activo
- **WHEN** con el compose levantado se abre la pantalla Componentes
- **THEN** los 6 servicios aparecen en verde

#### Scenario: Servicio caído
- **WHEN** se detiene el contenedor `pago` y pasan 10 segundos
- **THEN** Pago aparece en rojo, sin recargar la página

#### Scenario: Ruta de salud acotada
- **WHEN** se pide `http://localhost:8100/arquitectura/salud/otro`
- **THEN** responde 404

### Requirement: Modo presentación
La cabecera SHALL tener un botón "Modo presentación" que también se puede activar con `?presentacion` en la URL. En ese modo MUST ocultarse el estado de los servicios, el aviso de cambios sin validar y la pestaña Validar; los diagramas, la leyenda y el recuadro "Qué es cada pieza" se mantienen.

#### Scenario: Presentar
- **WHEN** se abre `http://localhost:8100/arquitectura/?presentacion`
- **THEN** no se ven los puntos de estado ni el aviso de cambios, y sí el diagrama y el recuadro "Qué es cada pieza"
