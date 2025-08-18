import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ml_backend.api import api_router
from ml_backend.utils import CustomLogger, ensure_starting

load_dotenv()

logger = CustomLogger().get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code de démarrage
    mongodb, apiclient = await ensure_starting()

    populate_mongo = os.getenv("POPULATE_MONGODB", "false").lower() == "true"

    app.mongodb_client = mongodb

    if populate_mongo:
        await mongodb.insert_initial_data()

    app.apiclient = apiclient
    logger.info("Clients MongoDB and API initialized.")

    yield
    # Code d'arrêt
    app.mongodb_client.get_client().close()
    await app.apiclient.close()


app = FastAPI(
    title="Backend API for Mathis LAMBERT's Personal Website",
    description="This is the backend webservice for Mathis LAMBERT's personal website.",
    version="0.1.0",
    openapi_url="/api/v1/openapi.json",  # Chemin personnalisé pour le fichier OpenAPI
    docs_url="/swagger",  # Chemin personnalisé pour la documentation Swagger UI
    redoc_url="/api-docs",  # Chemin personnalisé pour la documentation ReDoc
    lifespan=lifespan,
)

# Configuration des origines autorisées
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://mathislambert.fr")
origins = [origin.strip() for origin in ALLOWED_ORIGINS.split(",")]

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vérifiez si le mode maintenance est activé via une variable d'environnement
MAINTENANCE_MODE = os.getenv("MAINTENANCE_MODE", "false").lower() == "true"


@app.middleware("http")
async def check_maintenance(request, call_next):
    if MAINTENANCE_MODE:
        return JSONResponse(
            status_code=503, content={"detail": "Service en maintenance"}
        )
    response = await call_next(request)
    return response


# Inclure les routes pour chaque version
app.include_router(api_router, prefix="/api")


@app.get("/")
def read_root():
    return {
        "message": "Oups, you shouldn't be here. Please go back to https://mathislambert.fr"
    }


# Gestion des erreurs
@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"message": "Internal server error"})


@app.exception_handler(404)
async def not_found_exception_handler(request, exc):
    return JSONResponse(status_code=404, content={"message": "Not found"})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8081, reload=True)
