from typing import Any, Dict, List

import aiohttp
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ml_backend.api.services import get_mongo_client
from ml_backend.databases import MongoDBConnector
from ml_backend.utils import CustomLogger

logger = CustomLogger().get_logger(__name__)

router = APIRouter()


class BackendCompletionsRequest(BaseModel):
    input: str
    history: List[Dict[str, Any]] = []


@router.get("/all")
async def get_all_projects(
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    try:
        db = mongodb.get_database()
        projects = (
            await db["projects"]
            .find({}, {"_id": 0, "ai_context": 0})
            .to_list(length=None)
        )
        return {"projects": [mongodb.serialize(exp) for exp in projects]}
    except aiohttp.ClientResponseError as e:
        # Gestion spécifique des erreurs HTTP de l’API
        logger.error(f"Erreur de réponse de l'API : {e}")
        raise HTTPException(status_code=e.status, detail=str(e)) from e
    except Exception as e:
        # Gestion générique des autres erreurs
        logger.error(f"Erreur lors du traitement de la requête : {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{project_slug}")
async def get_project_by_slug(
    project_slug: str,
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    try:
        db = mongodb.get_database()
        project = await db["projects"].find_one(
            {"slug": project_slug}, {"_id": 0, "ai_context": 0}
        )

        await mongodb.log_event("N/A", "get_project_by_slug", {"slug": project_slug})

        return {"project": mongodb.serialize(project)}
    except aiohttp.ClientResponseError as e:
        # Gestion spécifique des erreurs HTTP de l’API
        logger.error(f"Erreur de réponse de l'API : {e}")
        raise HTTPException(status_code=e.status, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du traitement de la requête : {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
