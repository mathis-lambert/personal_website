# Utilise une image de base officielle Python
FROM python:3.13-slim

# Installe Git et nettoie le cache d'apt pour réduire la taille de l'image
RUN apt-get update && \
    apt-get install -y git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Définit les variables d'environnement pour éviter le buffering de Python
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Définit le répertoire de travail dans le conteneur
WORKDIR /app

# Copie le fichier de dépendances dans le conteneur
COPY pyproject.toml ./

# Copie le reste de l'application dans le conteneur
COPY . .

# Installe les dépendances du projet
RUN pip install --no-cache-dir .

# Expose le port sur lequel l'application va tourner
EXPOSE 8081

# Commande pour exécuter l'application avec Uvicorn
CMD ["uvicorn", "ml_backend.main:app", "--host", "0.0.0.0", "--port", "8081"]
