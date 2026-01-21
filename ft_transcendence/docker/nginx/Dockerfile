FROM nginx:alpine

COPY ./conf.d /etc/nginx/conf.d
COPY ./certs /etc/nginx/certs

# copy built frontend dist from frontend image
COPY --from=ft_transcendence-frontend /app/dist /usr/share/nginx/html

