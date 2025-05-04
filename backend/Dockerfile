# Utilise une image de base officielle Python
FROM python:3.13-slim

# Empêche Python de bufferer les logs et d'écrire les .pyc
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

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

# Copie le fichier de dépendances dans le conteneur et installe curl pour le HEALTHCHECK
COPY pyproject.toml ./
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Copie le reste de l'application dans le conteneur
COPY . .

# Installe les dépendances du projet
RUN pip install --no-cache-dir .

# Déclare une commande HEALTHCHECK intégrée à l'image
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://127.0.0.1:8081/api/health || exit 1

# Expose le port sur lequel l'application va tourner
EXPOSE 8081

# Commande pour exécuter l'application avec Uvicorn
CMD ["uvicorn", "ml_backend.main:app", "--host", "0.0.0.0", "--port", "8081"]
