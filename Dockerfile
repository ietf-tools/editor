FROM nginx:alpine

COPY ./dist/pwa /usr/share/nginx/html
