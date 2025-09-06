# Étape 1 : Construction de l’application
FROM node:24-alpine AS build
WORKDIR /app

# Copier les fichiers de configuration et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier l'ensemble du projet et lancer le build de production
COPY . .
# Variables d'environnement de build pour Vite
ARG VITE_API_URL
ARG VITE_MAINTENANCE_MODE
ARG VITE_MAPS_API_KEY
ENV VITE_API_URL=$VITE_API_URL \
    VITE_MAINTENANCE_MODE=$VITE_MAINTENANCE_MODE \
    VITE_MAPS_API_KEY=$VITE_MAPS_API_KEY
RUN npm run build

# Étape 2 : Image de production
FROM node:24-alpine
WORKDIR /app

# Installer un serveur statique pour servir le build (ici "serve")
RUN npm install -g serve

# Copier le dossier "dist" généré par Vite depuis l’étape de build
COPY --from=build /app/dist ./dist

# Exposer le port 8080 pour accéder à l’application
EXPOSE 8080

# Lancer le serveur statique sur le port 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
