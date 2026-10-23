## 1. Archivos del prototipo

- [x] 1.1 Crear `prototipo/` y copiar `admin.html` y `profesor.html` desde `/home/jano/sahs-prototipo`
- [x] 1.2 Verificar con `cmp` que las copias sean idénticas a los originales
- [x] 1.3 Crear `prototipo/index.html`: portada estática con accesos a "Administrativo" (`admin.html`) y "Profesor" (`profesor.html`), con IBM Plex Sans y la paleta del prototipo

## 2. Docker

- [x] 2.1 Agregar a `docker-compose.yml` el servicio `prototipo`: imagen `nginx:1.27.5-alpine`, `container_name: sahs-prototipo`, puerto `8090:80`, volumen `./prototipo:/usr/share/nginx/html:ro` y `restart: unless-stopped`
- [x] 2.2 Validar el compose con `docker compose config`

## 3. Documentación

- [x] 3.1 Agregar al `README.md` la sección "Prototipo": URL `http://localhost:8090`, vistas que incluye, cómo actualizar los HTML (volver a copiarlos) y la aclaración de que las fuentes de diseño no forman parte del repo
- [x] 3.2 Actualizar la sección "Cómo usarlo" para mencionar ambas URLs

## 4. Verificación

- [x] 4.1 `docker compose up -d` y comprobar que `curl -I` devuelve 200 para `http://localhost:8090/`, `/admin.html` y `/profesor.html`, y que Swagger UI sigue respondiendo en `:8080`
- [x] 4.2 Abrir la portada en el navegador y verificar la navegación: portada → admin → "Ver como profesor" → vuelta a admin
- [x] 4.3 `openspec validate servir-prototipo-web`
