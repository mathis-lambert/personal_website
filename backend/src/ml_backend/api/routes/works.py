from typing import Any, Dict, List

import aiohttp
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ml_backend.api.services import get_mongo_client
from ml_backend.databases import MongoDBConnector

router = APIRouter()


class BackendCompletionsRequest(BaseModel):
    input: str
    history: List[Dict[str, Any]] = []


@router.get("/all")
async def get_all_works(
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    try:
        db = mongodb.get_database()
        works = await db["works"].find({}).to_list(length=None)
        return {"works": [mongodb.serialize(exp) for exp in works]}
    except aiohttp.ClientResponseError as e:
        # Gestion spécifique des erreurs HTTP de l’API
        print(f"Erreur de réponse de l'API : {e}")
        raise HTTPException(status_code=e.status, detail=str(e))
    except Exception as e:
        # Gestion générique des autres erreurs
        raise HTTPException(status_code=500, detail=str(e))
