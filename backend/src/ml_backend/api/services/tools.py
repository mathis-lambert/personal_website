# tools_self.py
from __future__ import annotations

__all__ = [
    "get_self_info",
    "get_self_projects",
    "get_self_experiences",
    "get_self_projects_by_slug",
    "get_self_articles",
    "get_self_articles_by_slug",
]

import os
from datetime import datetime
from typing import Any, Dict, List

from bson import ObjectId
from ml_api_client import APIClient
from ml_api_client.models import VectorStoreSearchRequest
from ml_backend.utils import CustomLogger
from ml_backend.databases import MongoDBConnector

# --- singletons (créés une fois) ---
_logger = CustomLogger().get_logger(__name__)
_api = APIClient(api_key=os.getenv("ML_API_KEY"))
_mongo = MongoDBConnector(logger=_logger)
_db = _mongo.get_database()  # Motor DB async


# --- utils JSON ---
def _to_jsonable(x: Any) -> Any:
    if isinstance(x, ObjectId):
        return str(x)
    if isinstance(x, datetime):
        return x.isoformat()
    if isinstance(x, dict):
        return {k: _to_jsonable(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [_to_jsonable(v) for v in x]
    return x


def _dump(obj: Any) -> Any:
    if hasattr(obj, "model_dump"):  # Pydantic v2
        obj = obj.model_dump()
    elif hasattr(obj, "dict"):  # Pydantic v1
        obj = obj.dict()
    return _to_jsonable(obj)


# --- tools ---
async def get_self_info(query: str) -> Dict[str, Any]:
    """Recherche bio courte dans le vector store 'mathis_bio_store'."""
    try:
        q = (query or "").strip()
        if not q:
            return {"error": "Invalid 'query' argument"}
        res = await _api.vector_stores.search_vector_store(
            "mathis_bio_store",
            VectorStoreSearchRequest(query=q, limit=3),
        )
        return _dump(res)
    except Exception as e:
        _logger.exception("get_self_info failed")
        return {"error": f"{type(e).__name__}: {e}"}


async def get_self_projects() -> List[Dict[str, Any]]:
    """Liste des projets (projection légère)."""
    try:
        cursor = _db["projects"].find(
            {},
            {
                "_id": 0,
                "title": 1,
                "slug": 1,
                "tags": 1,
                "subtitle": 1,
                "links": 1,
                "date": 1,
                "ai_context": 1,
            },
        )
        docs = await cursor.to_list(length=200)
        return _to_jsonable(docs)
    except Exception as e:
        _logger.exception("get_self_projects failed")
        return [{"error": f"{type(e).__name__}: {e}"}]


async def get_self_projects_by_slug(slug: str) -> Dict[str, Any]:
    """Get a project by slug."""
    try:
        project = await _db["projects"].find_one(
            {"slug": slug}, {"_id": 0, "ai_context": 1}
        )
        return {
            "project_content": _to_jsonable(
                project
                if project
                else "Wrong slug, you might have mistyped it. Please use get_self_projects to get the list of all projects."
            ),
            "project_slug": slug,
        }
    except Exception as e:
        _logger.exception("get_self_projects_by_slug failed")
        return {"error": f"{type(e).__name__}: {e}"}


async def get_self_articles() -> List[Dict[str, Any]]:
    """Liste des articles (projection légère)."""
    try:
        cursor = _db["articles"].find(
            {},
            {
                "_id": 0,
                "title": 1,
                "slug": 1,
                "excerpt": 1,
                "tags": 1,
                "links": 1,
                "date": 1,
                "author": 1,
                "ai_context": 1,
            },
        )
        docs = await cursor.to_list(length=200)
        return _to_jsonable(docs)
    except Exception as e:
        _logger.exception("get_self_articles failed")
        return [{"error": f"{type(e).__name__}: {e}"}]


async def get_self_articles_by_slug(slug: str) -> Dict[str, Any]:
    """Get a article by slug."""
    try:
        article = await _db["articles"].find_one(
            {"slug": slug}, {"_id": 0, "ai_context": 1}
        )
        return {
            "article_content": _to_jsonable(
                article
                if article
                else "Wrong slug, you might have mistyped it. Please use get_self_articles to get the list of all articles."
            ),
            "article_slug": slug,
        }
    except Exception as e:
        _logger.exception("get_self_articles_by_slug failed")
        return {"error": f"{type(e).__name__}: {e}"}


async def get_self_experiences() -> Dict[str, Any]:
    """
    Renvoie expériences et études. Tolère l'absence d'une collection.
    """
    try:
        exps = await _db["experiences"].find({}, {"_id": 0}).to_list(length=500)
    except Exception:
        exps = []

    try:
        studies = await _db["studies"].find({}, {"_id": 0}).to_list(length=500)
    except Exception:
        studies = []

    return _to_jsonable({"experiences": exps, "studies": studies})
