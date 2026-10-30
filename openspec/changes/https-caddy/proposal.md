## Why

En la VPS, SAHS se sirve por HTTP plano en `http://149.50.131.66:8100`, así que el login (usuario, contraseña y token) viaja sin cifrar. Hace falta HTTPS con un certificado válido y renovación automática, sin tener que administrar certbot a mano.

## What Changes

- Se agrega un servicio `caddy` al compose. Publica los puertos 80 y 443 (IPv4 e IPv6), saca y renueva solo el certificado (Let's Encrypt, y ZeroSSL si Let's Encrypt falla) y hace de proxy hacia `web:80`.
- El dominio sale de la variable `SAHS_DOMINIO`. En la VPS va en el `.env` (`vps-6558769-x.dattaweb.com`). Si no está definida, se usa `localhost`, con un certificado de la CA interna de Caddy, para probar localmente.
- `http://` redirige a `https://`.
- **BREAKING** El puerto `8100` de `web` pasa a publicarse solo en `127.0.0.1`. Desde afuera ya no se entra por `http://<ip>:8100`, solo por `https://<dominio>`. En la máquina local y en el chequeo del deploy, `http://localhost:8100` sigue funcionando.
- README: la sección de HTTPS y la variable `SAHS_DOMINIO`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `despliegue-docker`: el compose suma `caddy`; los puertos publicados pasan a ser 80 y 443 (`caddy`) y `127.0.0.1:8100` (`web`); nuevo requisito de HTTPS; la documentación de uso explica `SAHS_DOMINIO`.

## Impact

- **Docker:** `docker-compose.yml` (servicio `caddy`, volúmenes `caddy-data` y `caddy-config`, puerto de `web`) y un archivo nuevo, `caddy/Caddyfile`.
- **VPS:** agregar `SAHS_DOMINIO=vps-6558769-x.dattaweb.com` al `.env` antes del deploy. Los puertos 80 y 443 tienen que estar abiertos, también en el firewall del panel del proveedor.
- **Workflow de deploy:** no cambia; sigue chequeando `http://localhost:8100` desde la propia VPS.
- **Código de la app:** no cambia. La web usa rutas relativas y nginx hace redirecciones relativas, así que funciona detrás del proxy.
