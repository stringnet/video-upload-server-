# Dockerfile
# Usa una imagen base oficial de Node.js (elige una versión LTS estable, ej. 18 o 20)
FROM node:18-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia package.json y package-lock.json (si existe)
# Esto aprovecha el cacheo de capas de Docker: si estos archivos no cambian,
# no se reinstalarán las dependencias innecesariamente.
COPY package*.json ./

# Instala las dependencias del proyecto
# --only=production para no instalar devDependencies si las tuvieras
RUN npm install --only=production

# Copia el resto de los archivos de la aplicación al directorio de trabajo
COPY . .

# El script server.js crea la carpeta 'uploads' si no existe.
# En Easypanel, gestionarás los volúmenes y permisos para 'uploads' externamente.
# No es estrictamente necesario crearla aquí si Easypanel maneja el volumen.

# Expone el puerto en el que la aplicación se ejecuta (el que usa server.js)
EXPOSE 3000

# Comando para iniciar la aplicación cuando el contenedor arranque
CMD [ "node", "server.js" ]
