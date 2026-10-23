# Imagen de la web: build de Vite servido por nginx, que además hace de proxy hacia
# los servicios. Se construye desde la raíz del repo:
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

FROM nginx:1.27.5-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
