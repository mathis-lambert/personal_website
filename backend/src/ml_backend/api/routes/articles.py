from typing import Any, Dict, List, Optional

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
async def get_all_articles(
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    try:
        db = mongodb.get_database()
        articles = await db["articles"].find({}).to_list(length=None)

        await mongodb.log_event("N/A", "get_all_articles", {})

        return {"articles": [mongodb.serialize(exp) for exp in articles]}
    except aiohttp.ClientResponseError as e:
        logger.error(f"Erreur de réponse de l'API : {e}")
        raise HTTPException(status_code=e.status, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Erreur lors du traitement de la requête : {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{article_slug}")
async def get_article_by_slug(
    article_slug: str,
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    try:
        db = mongodb.get_database()
        article = await db["articles"].find_one({"slug": article_slug})

        await mongodb.log_event("N/A", "get_article_by_slug", {"slug": article_slug})

        return {"article": mongodb.serialize(article)}
    except aiohttp.ClientResponseError as e:
        logger.error(f"Erreur de réponse de l'API : {e}")
        raise HTTPException(status_code=e.status, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du traitement de la requête : {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


class ArticleEventPayload(BaseModel):
    id: Optional[str] = None
    slug: Optional[str] = None


@router.post("/event/{event_type}")
async def post_article_event(
    event_type: str,
    payload: ArticleEventPayload,
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    try:
        event_map = {
            "like": "metrics.likes",
            "share": "metrics.shares",
            "read": "metrics.views",
        }

        if event_type not in event_map:
            raise HTTPException(status_code=400, detail="Unsupported event type")

        if not payload.id and not payload.slug:
            raise HTTPException(status_code=400, detail="'id' or 'slug' is required")

        db = mongodb.get_database()
        query: Dict[str, Any] = {}
        if payload.id:
            query = {"id": str(payload.id)}
        elif payload.slug:
            query = {"slug": payload.slug}

        # Incrément atomique de la métrique correspondante
        update_field = event_map[event_type]
        result = await db["articles"].update_one(query, {"$inc": {update_field: 1}})

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Article not found")

        # Retourner les métriques à jour (facultatif côté frontend)
        updated = await db["articles"].find_one(query)
        serialized = mongodb.serialize(updated)
        metrics = (serialized or {}).get("metrics", {}) or {}
        return {"ok": True, "metrics": metrics}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/metrics")
async def get_article_metrics(
    id: Optional[str] = None,
    slug: Optional[str] = None,
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    try:
        if not id and not slug:
            raise HTTPException(status_code=400, detail="Query param 'id' or 'slug' is required")
        if id and slug:
            raise HTTPException(status_code=400, detail="Provide only one of 'id' or 'slug'")

        db = mongodb.get_database()
        query: Dict[str, Any] = {"id": str(id)} if id else {"slug": slug}
        doc = await db["articles"].find_one(query, projection={"metrics": 1, "_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Article not found")
        metrics = (doc or {}).get("metrics", {}) or {}

        # Défaut à 0 si manquants
        metrics = {
            "views": int(metrics.get("views", 0) or 0),
            "likes": int(metrics.get("likes", 0) or 0),
            "shares": int(metrics.get("shares", 0) or 0),
        }
        return {"metrics": metrics}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du traitement de la requête : {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
