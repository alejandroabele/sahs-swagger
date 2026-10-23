# monorepo Specification

## Purpose
TBD - created by archiving change monorepo-sahs. Update Purpose after archive.
## Requirements
### Requirement: Monorepo con npm workspaces
El repo SHALL tener un `package.json` raíz con `workspaces: ["apps/*", "libs/*"]` y estos paquetes:
- `apps/web`: React + Vite + TypeScript;
- `apps/usuario`, `apps/pago`, `apps/horarios`, `apps/planificacion`, `apps/orientacion` y `apps/profesor-suplencias`: NestJS;
- `apps/db`: migraciones, seeds y `db-init`;
- `libs/comun`, `libs/entidades` y `libs/contratos`.

`prototipo/`, `specs/`, `tools/` y `docker-compose.yml` MUST quedar en su lugar y sin cambios de comportamiento.

#### Scenario: Instalación única
- **WHEN** se ejecuta `npm ci` en la raíz
- **THEN** se instalan las dependencias de todos los paquetes en un solo `node_modules` raíz, y las librerías `@sahs/*` quedan enlazadas

#### Scenario: Prototipo intacto
- **WHEN** se compara `prototipo/index.html` y `docker-compose.yml` con la versión anterior al cambio
- **THEN** no tienen diferencias

### Requirement: Scripts raíz
El `package.json` raíz SHALL ofrecer:
- `build`: compila las libs y después todas las apps;
- `lint`;
- `test`;
- `verificar-contratos`;
- `dev:<app>`, que levanta una app en modo desarrollo.

#### Scenario: Build completo
- **WHEN** se ejecuta `npm run build` en la raíz después de `npm ci`
- **THEN** termina sin errores y cada app tiene su salida (`dist/` de cada servicio y de `db`, y `apps/web/dist/`)

### Requirement: Librerías compartidas
`@sahs/comun` SHALL contener el filtro de errores, el health check, la configuración de validación, la de swagger y el cliente HTTP entre servicios. `@sahs/entidades` SHALL contener las entidades TypeORM, en una carpeta por servicio. `@sahs/contratos` SHALL contener las interfaces TypeScript de los schemas de la API, que usan los DTOs de los servicios y la web.

#### Scenario: Tipos compartidos con la web
- **WHEN** cambia una propiedad de una interfaz en `@sahs/contratos`
- **THEN** el DTO del servicio que la implementa y el código de la web que la usa dejan de compilar hasta que se actualizan

