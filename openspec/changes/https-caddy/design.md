## Context

- La VPS (Dattaweb) tiene el hostname `vps-6558769-x.dattaweb.com`, con A → `149.50.131.66` y AAAA → `2800:6c0:5::aad`. Los puertos 80 y 443 están libres y `ufw` está inactivo.
- Hoy el único puerto publicado es `8100`, el de `web` (nginx), por HTTP.
- El deploy automático (`.github/workflows/deploy.yml`) chequea `http://localhost:8100` desde la VPS.
- `dattaweb.com` no está en la Public Suffix List. Para Let's Encrypt, todos los hostnames de clientes de Dattaweb cuentan como un mismo dominio registrado, con un límite de 50 certificados por semana compartido entre todos.

## Goals / Non-Goals

**Goals:**
- HTTPS con certificado válido y renovación automática en la VPS.
- Que nadie entre desde afuera sin HTTPS.
- Que en local siga funcionando todo igual (`http://localhost:8100`) y que también se pueda probar HTTPS.

**Non-Goals:**
- Un dominio propio. Se puede cambiar después con `SAHS_DOMINIO`, sin tocar código.
- Cambiar el nginx de `web` o la app.
- HSTS u otros encabezados de seguridad. Se pueden agregar después en el `Caddyfile`.

## Decisions

### 1. Caddy delante de `web`

Se agrega un servicio `caddy` (`caddy:2.10.0-alpine`) en la red `interna`, con `reverse_proxy web:80`. Caddy saca el certificado, lo renueva, redirige HTTP a HTTPS y manda `X-Forwarded-*`.

- *Alternativa:* certbot con el nginx de `web`. Se descarta porque obliga a montar certificados en la imagen, a tener un proceso o cron de renovación y a recargar nginx.
- *Alternativa:* Traefik. Hace lo mismo con más configuración, y no hacen falta sus funciones extra.

Una razón más para elegir Caddy: si Let's Encrypt rechaza el pedido (por ejemplo, por el límite compartido de `dattaweb.com`), pasa solo a ZeroSSL.

### 2. Dominio por variable

El `Caddyfile` usa `{$SAHS_DOMINIO}`, y el compose le pasa `SAHS_DOMINIO: ${SAHS_DOMINIO:-localhost}`. docker compose lee el `.env` de la carpeta del proyecto, así que en la VPS alcanza con una línea en el `.env` que ya existe, el que tiene `JWT_SECRET`. Con `localhost`, Caddy usa su CA interna, y localmente se prueba con `curl -k https://localhost/`.

### 3. `8100` solo en `127.0.0.1`

`web` pasa de `"8100:80"` a `"127.0.0.1:8100:80"`. Desde afuera solo se entra por Caddy (HTTPS). En la misma máquina, en cambio, siguen andando el chequeo del deploy, `tools/generar_cliente_web.mjs --url http://localhost:8100/docs`, `SAHS_API` de Vite y la validación con redocly del README.

### 4. Volúmenes de Caddy

`caddy-data:/data`, que tiene los certificados y la cuenta ACME, y `caddy-config:/config`. Sin `caddy-data`, cada deploy pediría un certificado nuevo y se agotaría el límite enseguida.

### 5. Puertos e IPv6

`80:80`, `443:443` y `443:443/udp` (HTTP/3). Docker publica también en `[::]`, así que la validación por IPv6 que usa Let's Encrypt cuando hay AAAA llega a Caddy.

## Risks / Trade-offs

- [El firewall del panel de Dattaweb bloquea 80/443 (no se ve desde la VPS)] → Si no sale el certificado, `docker compose logs caddy` muestra el error de validación, y hay que abrir los puertos en el panel.
- [Límite de Let's Encrypt compartido en `dattaweb.com`] → Caddy pasa solo a ZeroSSL. Con un dominio propio se evita del todo.
- [IPv6 no llega desde afuera aunque la VPS tenga dirección] → Let's Encrypt reintenta por IPv4 solo en algunos casos. Si falla por eso, el log lo dice, y se puede probar con `curl -6`.
- [Quien entraba por `http://149.50.131.66:8100` deja de poder entrar] → Es lo buscado. Se avisa en el README y en el PR.

## Migration Plan

1. En la VPS: `echo "SAHS_DOMINIO=vps-6558769-x.dattaweb.com" >> /root/sahs-swagger/.env`.
2. Mergear el PR. El deploy levanta `caddy` y recrea `web` con el puerto nuevo.
3. Comprobar `https://vps-6558769-x.dattaweb.com/` y `docker compose logs caddy`.

Rollback: revertir el PR. El deploy saca `caddy` (`--remove-orphans`) y vuelve a publicar `8100`.
