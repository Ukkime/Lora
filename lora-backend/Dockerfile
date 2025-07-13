# Establecer la imagen base de Node.js
FROM node:18

ENV TZ=Europe/Madrid

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Establecer el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copiar el package.json y package-lock.json (si existe) al contenedor
COPY package*.json ./

# Instalar las dependencias de la aplicación
RUN npm install

RUN npm install express-unless@1.0

# Copiar todo el código de la aplicación al contenedor
COPY . .

# Exponer el puerto que la aplicación escuchará
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["node", "index.ts"]
