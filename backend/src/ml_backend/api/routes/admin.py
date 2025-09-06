from typing import Any, Dict, List, Literal, Optional, Type

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from ml_backend.api.security import verify_token
from ml_backend.api.services import get_mongo_client
from ml_backend.databases import MongoDBConnector
from ml_backend.utils import CustomLogger

logger = CustomLogger().get_logger(__name__)

router = APIRouter(dependencies=[Depends(verify_token)])


# Supported Mongo collections for admin
CollectionName = Literal["projects", "articles", "experiences", "studies", "resume"]


def _slugify(title: str) -> str:
    import re

    s = title.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or "item"


class ProjectIn(BaseModel):
    # Pydantic v2 config: allow unknown fields, keep flexible shape
    model_config = ConfigDict(extra="allow")

    id: Optional[str] = None
    slug: Optional[str] = None
    title: str
    date: str
    technologies: List[str] = Field(default_factory=list)
    # Optional fields – keep loose to match current data
    subtitle: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    startDate: Optional[str] = None  # noqa: N815
    endDate: Optional[str] = None  # noqa: N815
    categories: Optional[List[str]] = None
    status: Optional[str] = None
    isFeatured: Optional[bool] = None  # noqa: N815
    imageUrl: Optional[str] = None  # noqa: N815
    thumbnailUrl: Optional[str] = None  # noqa: N815
    projectUrl: Optional[str] = None  # noqa: N815
    repoUrl: Optional[str] = None  # noqa: N815
    links: Optional[Dict[str, Any]] = None
    media: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    role: Optional[str] = None
    client: Optional[str] = None
    teamSize: Optional[int] = None  # noqa: N815
    highlights: Optional[List[str]] = None
    color: Optional[str] = None


class ArticleIn(BaseModel):
    # Pydantic v2 config: allow unknown fields, keep flexible shape
    model_config = ConfigDict(extra="allow")

    id: Optional[str] = None
    slug: Optional[str] = None
    title: str
    excerpt: str
    content: str
    date: str
    tags: List[str] = Field(default_factory=list)
    author: Optional[str] = None
    categories: Optional[List[str]] = None
    isFeatured: Optional[bool] = None  # noqa: N815
    imageUrl: Optional[str] = None  # noqa: N815
    thumbnailUrl: Optional[str] = None  # noqa: N815
    links: Optional[Dict[str, Any]] = None
    media: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None


class UpsertResponse(BaseModel):
    ok: bool
    id: Optional[str] = None
    item: Optional[Dict[str, Any]] = None


def _parse_index(item_id: str) -> Optional[int]:
    """Return zero-based index if item_id encodes an index (e.g. 'index-3' or '3').
    Otherwise return None.
    """
    try:
        if item_id.startswith("index-"):
            return int(item_id.split("-", 1)[1])
        # plain integer
        return int(item_id)
    except Exception:
        return None


async def _ensure_unique_slug_mongo(
    mongodb: MongoDBConnector,
    collection: str,
    base: str,
    exclude_object_id: Any = None,
) -> str:
    db = mongodb.get_database()
    slug = base
    i = 2
    while True:
        query: Dict[str, Any] = {"slug": slug}
        if exclude_object_id is not None:
            query["_id"] = {"$ne": exclude_object_id}
        exists = await db[collection].find_one(query)
        if not exists:
            return slug
        slug = f"{base}-{i}"
        i += 1


async def _ensure_unique_id_mongo(
    mongodb: MongoDBConnector,
    collection: str,
    base: str,
    exclude_object_id: Any = None,
) -> str:
    db = mongodb.get_database()
    candidate = base
    i = 2
    while True:
        query: Dict[str, Any] = {"id": candidate}
        if exclude_object_id is not None:
            query["_id"] = {"$ne": exclude_object_id}
        exists = await db[collection].find_one(query)
        if not exists:
            return candidate
        candidate = f"{base}-{i}"
        i += 1


@router.get("/admin/collections")
async def list_collections():
    # List available Mongo collections (limited to known set)
    collections: List[str] = [
        "projects",
        "articles",
        "experiences",
        "studies",
        "resume",
    ]
    return {"collections": [{"name": c} for c in collections]}


@router.get("/admin/data/{collection}")
async def read_collection(
    collection: CollectionName,
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    db = mongodb.get_database()
    # Exclude _id for admin consumption
    docs = await db[collection].find({}, {"_id": 0}).to_list(length=2000)
    return {"collection": collection, "data": docs}


@router.put("/admin/data/{collection}")
async def replace_collection(
    collection: CollectionName,
    payload: Any = Body(...),
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    # Replace the entire Mongo collection with provided payload
    db = mongodb.get_database()
    col = db[collection]
    await col.delete_many({})
    try:
        if isinstance(payload, list):
            if payload:
                await col.insert_many(payload)
        elif isinstance(payload, dict):
            await col.insert_one(payload)
        else:
            raise HTTPException(status_code=400, detail="Payload must be a list or an object")
    except Exception as exc:
        logger.error(f"Mongo replace failed: {exc}")
        raise HTTPException(status_code=500, detail=f"Mongo replace failed: {exc}") from exc

    return {"ok": True}


SCHEMA_BY_COLLECTION: Dict[str, Type[BaseModel]] = {
    "projects": ProjectIn,
    "articles": ArticleIn,
}


@router.post("/admin/{collection}")
async def create_item(
    collection: Literal["projects", "articles"],
    item: Dict[str, Any] = Body(...),
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    # Validate and fill defaults (Pydantic v2: model_dump)
    schema = SCHEMA_BY_COLLECTION[collection]
    obj = schema(**item).model_dump(exclude_none=True)
    base_fallback = "project" if collection == "projects" else "article"
    base_id = obj.get("id") or _slugify(obj["title"]) or base_fallback

    # Ensure unique id and slug against Mongo
    db = mongodb.get_database()
    obj_id = await _ensure_unique_id_mongo(mongodb, collection, str(base_id))
    obj["id"] = obj_id

    title = obj.get("title", obj_id)
    slug = obj.get("slug") or _slugify(title)
    obj["slug"] = await _ensure_unique_slug_mongo(mongodb, collection, slug)

    # Insert into Mongo
    await db[collection].insert_one(dict(obj))
    return UpsertResponse(ok=True, id=obj_id, item=obj)


@router.patch("/admin/{collection}/{item_id}")
async def update_item(
    collection: CollectionName,
    item_id: str,
    patch: Dict[str, Any] = Body(...),
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    if collection == "resume":
        raise HTTPException(status_code=400, detail="Use PATCH /admin/resume for resume updates")

    # Do not allow changing id to empty
    if "id" in patch and not str(patch["id"]).strip():
        raise HTTPException(status_code=400, detail="id cannot be empty")

    db = mongodb.get_database()

    # Determine selection: by index (index-<n> or <n>) or by 'id'
    idx = _parse_index(item_id)
    if idx is not None:
        # Find nth document (sorted by _id asc for stability)
        docs = await db[collection].find({}, {}).sort("_id", 1).skip(idx).to_list(length=1)
        if not docs:
            raise HTTPException(status_code=404, detail="Item not found")
        current = docs[0]
        filter_q = {"_id": current["_id"]}
    else:
        current = await db[collection].find_one({"id": item_id})
        if not current:
            raise HTTPException(status_code=404, detail="Item not found")
        filter_q = {"_id": current["_id"]}

    updates: Dict[str, Any] = dict(patch)

    # Keep slug unique if changed
    if "slug" in updates and updates.get("slug"):
        new_slug = await _ensure_unique_slug_mongo(
            mongodb, collection, str(updates["slug"]), exclude_object_id=current["_id"]
        )
        updates["slug"] = new_slug

    # Keep id unique if changed
    if "id" in updates and updates.get("id"):
        new_id = await _ensure_unique_id_mongo(
            mongodb, collection, str(updates["id"]), exclude_object_id=current["_id"]
        )
        updates["id"] = new_id

    await db[collection].update_one(filter_q, {"$set": updates})
    updated_doc = await db[collection].find_one(filter_q, {"_id": 0})
    return {"ok": True, "item": updated_doc}


@router.patch("/admin/resume")
async def update_resume(
    patch: Dict[str, Any] = Body(...),
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    if not isinstance(patch, dict):
        raise HTTPException(status_code=400, detail="Patch must be an object")

    db = mongodb.get_database()
    existing = await db["resume"].find_one({})
    if existing:
        await db["resume"].update_one({"_id": existing["_id"]}, {"$set": patch})
        updated = await db["resume"].find_one({"_id": existing["_id"]}, {"_id": 0})
    else:
        await db["resume"].insert_one(dict(patch))
        updated = await db["resume"].find_one({}, {"_id": 0})

    return {"ok": True, "item": updated}


@router.delete("/admin/{collection}/{item_id}")
async def delete_item(
    collection: CollectionName,
    item_id: str,
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    if collection == "resume":
        raise HTTPException(status_code=400, detail="Cannot delete resume")

    db = mongodb.get_database()
    idx = _parse_index(item_id)
    if idx is not None:
        docs = await db[collection].find({}, {}).sort("_id", 1).skip(idx).to_list(length=1)
        if not docs:
            raise HTTPException(status_code=404, detail="Item not found")
        current = docs[0]
        filter_q = {"_id": current["_id"]}
        removed_payload = await db[collection].find_one(filter_q, {"_id": 0})
    else:
        current = await db[collection].find_one({"id": item_id})
        if not current:
            raise HTTPException(status_code=404, detail="Item not found")
        filter_q = {"_id": current["_id"]}
        removed_payload = await db[collection].find_one(filter_q, {"_id": 0})

    await db[collection].delete_one(filter_q)
    return {"ok": True, "item": removed_payload}
