import aiohttp
from fastapi import APIRouter, Depends, HTTPException

from ml_backend.api.services import get_mongo_client
from ml_backend.databases import MongoDBConnector

router = APIRouter()


@router.get("")
async def get_resume(
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    try:
        db = mongodb.get_database()
        resume = await db["resume"].find_one({})
        return {"resume": mongodb.serialize(resume)}
    except aiohttp.ClientResponseError as e:
        # Gestion spécifique des erreurs HTTP de l’API
        print(f"Erreur de réponse de l'API : {e}")
        raise HTTPException(status_code=e.status, detail=str(e))
    except Exception as e:
        # Gestion générique des autres erreurs
        raise HTTPException(status_code=500, detail=str(e))
