# Stage 1: build frontend
FROM node:20-alpine AS frontend_build
WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build:docker

# Stage 2: nginx serves frontend + proxies backend
FROM nginx:alpine

COPY docker/nginx/conf.d /etc/nginx/conf.d
COPY docker/nginx/certs /etc/nginx/certs

COPY --from=frontend_build /app/dist /usr/share/nginx/html
