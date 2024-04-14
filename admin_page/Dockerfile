FROM nginx:alpine
COPY *.html /usr/share/nginx/html
ENV HOST 0.0.0.0
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
