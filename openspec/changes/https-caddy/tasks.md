## 1. Caddy

- [x] 1.1 Crear `caddy/Caddyfile` con el sitio `{$SAHS_DOMINIO}`, `encode zstd gzip` y `reverse_proxy web:80`
- [x] 1.2 En `docker-compose.yml`, agregar el servicio `caddy` (`caddy:2.10.0-alpine`): puertos `80:80`, `443:443` y `443:443/udp`, `SAHS_DOMINIO: ${SAHS_DOMINIO:-localhost}`, el `Caddyfile` montado en modo solo lectura, los volúmenes `caddy-data` y `caddy-config`, la red `interna` y `depends_on: web`
- [x] 1.3 Publicar `web` solo en `127.0.0.1:8100` y actualizar el comentario de cabecera del compose

## 2. Documentación

- [x] 2.1 README "Aplicación": la URL pública por HTTPS, `SAHS_DOMINIO` en el `.env`, `https://localhost` con la CA interna, `8100` solo local, y el contenedor `caddy` en la tabla
- [x] 2.2 Agregar `.env.example` con `SAHS_DOMINIO` y `JWT_SECRET` (sin valores reales)

## 3. Verificación local

- [x] 3.1 `docker compose config` sin errores y `docker compose up -d` levanta `caddy`
- [x] 3.2 `curl -k https://localhost/docs/pago-json` devuelve el OpenAPI y `http://localhost/docs/` redirige a `https://`
- [x] 3.3 `docker compose ps`: `web` publica `127.0.0.1:8100` y `caddy` publica 80/443; `http://localhost:8100` sigue respondiendo
- [x] 3.4 Recrear `caddy` no emite un certificado nuevo (los logs no muestran otra emisión)

## 4. VPS (al mergear)

- [ ] 4.1 Agregar `SAHS_DOMINIO=vps-6558769-x.dattaweb.com` al `.env` de `/root/sahs-swagger` antes de mergear
- [ ] 4.2 Después del deploy, `https://vps-6558769-x.dattaweb.com/` muestra el Login con certificado válido y `http://149.50.131.66:8100` ya no responde desde afuera
