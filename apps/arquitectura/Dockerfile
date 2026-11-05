# Imagen de la vista de arquitectura: build de Vite servido por nginx bajo /arquitectura/.
# El build genera el modelo desde el código (compose, servicios y entidades), así que
# copia apps/ y libs/ además de la app. Se construye desde la raíz del repo:
#   docker build -f apps/arquitectura/Dockerfile .

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
COPY apps/arquitectura/package.json apps/arquitectura/
RUN npm ci --no-audit --no-fund --ignore-scripts
COPY docker-compose.yml ./
COPY tools/arquitectura.mjs tools/
COPY libs libs
COPY apps apps
RUN npm run build -w apps/arquitectura

FROM nginx:1.27.5-alpine
COPY apps/arquitectura/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/arquitectura/dist /usr/share/nginx/html/arquitectura
EXPOSE 80
