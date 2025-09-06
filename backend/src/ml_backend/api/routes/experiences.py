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
async def get_all_experiences(
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    try:
        db = mongodb.get_database()
        experiences = await db["experiences"].find({}).to_list(length=None)

        await mongodb.log_event("N/A", "get_all_experiences", {})

        return {"experiences": [mongodb.serialize(exp) for exp in experiences]}
    except aiohttp.ClientResponseError as e:
        logger.error(f"Erreur de réponse de l'API : {e}")
        raise HTTPException(status_code=e.status, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erreur lors du traitement de la requête : {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
