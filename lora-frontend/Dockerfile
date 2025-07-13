# Etapa 1: Construir la aplicación Angular
FROM node:18 AS build

ENV TZ=Europe/Madrid

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Crear y establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos del proyecto
COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Construir la aplicación Angular
RUN npm run build --prod

# clean
RUN rm -rf /app/node_modules

# Etapa 2: Servir la aplicación usando Nginx
FROM nginx:alpine

# Copiar el archivo de configuración de Nginx personalizado
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar el archivo de tipos MIME personalizado
COPY mime.types /etc/nginx/mime.types

# Copiar los archivos construidos desde la etapa anterior
COPY --from=build /app/dist/lora-frontend/browser /usr/share/nginx/html

# Exponer los puertos 80 (HTTP) y 443 (HTTPS)
EXPOSE 80

# Comando por defecto para ejecutar Nginx
CMD ["nginx", "-g", "daemon off;"]
