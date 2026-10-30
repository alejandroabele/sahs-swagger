# Imagen de la web: build de Vite servido por nginx, que además hace de proxy hacia
# los servicios. También sirve el Swagger UI unificado (/docs/, con swagger-ui-dist,
# que viene con @nestjs/swagger) y el prototipo de referencia (/prototipo/).
# Se construye desde la raíz del repo:
#   docker build -f apps/web/Dockerfile .

FROM node:22.16.0-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY libs/contratos/package.json libs/contratos/
COPY libs/comun/package.json libs/comun/
COPY libs/entidades/package.json libs/entidades/
COPY apps/db/package.json apps/db/
COPY apps/usuario/package.json apps/usuario/
COPY apps/pago/package.json apps/pago/
COPY apps/horarios/package.json apps/horarios/
COPY apps/planificacion/package.json apps/planificacion/
COPY apps/orientacion/package.json apps/orientacion/
COPY apps/profesor-suplencias/package.json apps/profesor-suplencias/
COPY apps/web/package.json apps/web/
RUN npm ci --no-audit --no-fund --ignore-scripts
COPY libs/contratos libs/contratos
COPY apps/web apps/web
RUN npm run build -w libs/contratos && npm run build -w apps/web
# Swagger UI: solo los archivos que usa index.html, con el initializer de SAHS.
RUN mkdir -p /app/docs \
 && cd node_modules/swagger-ui-dist \
 && cp index.html index.css swagger-ui.css swagger-ui-bundle.js swagger-ui-standalone-preset.js \
       favicon-16x16.png favicon-32x32.png oauth2-redirect.html oauth2-redirect.js /app/docs/ \
 && cp /app/apps/web/swagger/swagger-initializer.js /app/docs/

FROM nginx:1.27.5-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY --from=build /app/docs /usr/share/nginx/html/docs
COPY prototipo /usr/share/nginx/html/prototipo
EXPOSE 80
