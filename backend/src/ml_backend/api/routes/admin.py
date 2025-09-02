import json
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Tuple, Type

from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId

from ml_backend.api.services import get_mongo_client
from ml_backend.api.security import verify_token
from ml_backend.databases import MongoDBConnector


router = APIRouter(dependencies=[Depends(verify_token)])


# Collections backed by JSON files
CollectionName = Literal[
    "projects", "articles", "experiences", "studies", "resume"
]


def _data_dir() -> Path:
    # current file: backend/src/ml_backend/api/routes/admin.py
    # target dir:   backend/src/ml_backend/databases/data
    here = Path(__file__).resolve()
    return here.parents[2] / "databases" / "data"


def _file_for(collection: CollectionName) -> Path:
    name = f"{collection}.json"
    return _data_dir() / name


def _load_json(path: Path) -> Any:
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {path.name}")
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Invalid JSON in {path.name}") from exc


def _write_json(path: Path, data: Any) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    tmp.replace(path)


def _slugify(title: str) -> str:
    import re

    s = title.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or "item"


def _index_by_id(items: List[Dict[str, Any]]) -> Dict[str, int]:
    idx: Dict[str, int] = {}
    for i, it in enumerate(items):
        idv = str(it.get("id", ""))
        if idv:
            idx[idv] = i
    return idx


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
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    categories: Optional[List[str]] = None
    status: Optional[str] = None
    isFeatured: Optional[bool] = None
    imageUrl: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    projectUrl: Optional[str] = None
    repoUrl: Optional[str] = None
    links: Optional[Dict[str, Any]] = None
    media: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    role: Optional[str] = None
    client: Optional[str] = None
    teamSize: Optional[int] = None
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
    isFeatured: Optional[bool] = None
    imageUrl: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    links: Optional[Dict[str, Any]] = None
    media: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None


class UpsertResponse(BaseModel):
    ok: bool
    id: Optional[str] = None
    item: Optional[Dict[str, Any]] = None


# Helpers
def _resolve_item_index(data: List[Dict[str, Any]], item_id: str) -> Tuple[int, bool]:
    """Return (index, by_id) for an item in a list collection.

    - Tries to locate by "id" first (by_id=True).
    - Falls back to index addressing: "index-<n>" or "<n>" (by_id=False).
    - Raises HTTPException 404 if not found or invalid index.
    """
    idx_map = _index_by_id(data)
    if item_id in idx_map:
        return idx_map[item_id], True

    # try index-based addressing: "index-<n>" or just "<n>"
    try:
        if item_id.startswith("index-"):
            i = int(item_id.split("-", 1)[1])
        else:
            i = int(item_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Item not found")

    if i < 0 or i >= len(data):
        raise HTTPException(status_code=404, detail="Item not found")

    return i, False


async def _mongo_update_list_collection(
    mongodb: MongoDBConnector,
    collection: str,
    data: List[Dict[str, Any]],
    by_id: bool,
    item_id: str,
    updated: Dict[str, Any],
) -> None:
    db = mongodb.get_database()
    if by_id:
        await db[collection].update_one({"id": item_id}, {"$set": updated})
    else:
        await db[collection].delete_many({})
        if data:
            await db[collection].insert_many(data)


async def _mongo_delete_list_collection(
    mongodb: MongoDBConnector,
    collection: str,
    data: List[Dict[str, Any]],
    by_id: bool,
    item_id: str,
) -> None:
    db = mongodb.get_database()
    if by_id:
        await db[collection].delete_one({"id": item_id})
    else:
        await db[collection].delete_many({})
        if data:
            await db[collection].insert_many(data)


@router.get("/admin/collections")
async def list_collections():
    data_dir = _data_dir()
    files = sorted([p.name for p in data_dir.glob("*.json")])
    return {
        "collections": [
            {
                "name": p.replace(".json", ""),
                "file": p,
            }
            for p in files
        ]
    }


@router.get("/admin/data/{collection}")
async def read_collection(collection: CollectionName):
    content = _load_json(_file_for(collection))
    return {"collection": collection, "data": content}


@router.put("/admin/data/{collection}")
async def replace_collection(
    collection: CollectionName,
    payload: Any = Body(...),
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    # Write file
    path = _file_for(collection)
    _write_json(path, payload)

    # Sync MongoDB (replace content)
    db = mongodb.get_database()
    col = db[collection]
    await col.delete_many({})
    try:
        if isinstance(payload, list):
            if payload:
                await col.insert_many(payload)
        elif isinstance(payload, dict):
            # Store as a single document with a fixed key
            await col.insert_one(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Mongo sync failed: {exc}")

    return {"ok": True}


def _ensure_unique_slug(items: List[Dict[str, Any]], base: str) -> str:
    s = base
    taken = {str(it.get("slug", "")) for it in items}
    if s not in taken:
        return s
    i = 2
    while True:
        cand = f"{s}-{i}"
        if cand not in taken:
            return cand
        i += 1


def _ensure_unique_id(items: List[Dict[str, Any]], base: str) -> str:
    taken = {str(it.get("id", "")) for it in items}
    if base not in taken:
        return base
    i = 2
    while True:
        cand = f"{base}-{i}"
        if cand not in taken:
            return cand
        i += 1


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
    path = _file_for(collection)
    data = _load_json(path)
    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="Collection is not a list")

    # Validate and fill defaults (Pydantic v2: model_dump)
    schema = SCHEMA_BY_COLLECTION[collection]
    obj = schema(**item).model_dump(exclude_none=True)
    base_fallback = "project" if collection == "projects" else "article"
    base_id = obj.get("id") or _slugify(obj["title"]) or base_fallback

    obj_id = _ensure_unique_id(data, str(base_id))
    obj["id"] = obj_id

    # Slug
    title = obj.get("title", obj_id)
    slug = obj.get("slug") or _slugify(title)
    obj["slug"] = _ensure_unique_slug(data, slug)

    # Append and persist
    data.append(obj)
    _write_json(path, data)

    # Mongo insert
    db = mongodb.get_database()
    # Insert a copy to avoid PyMongo mutating our in-memory object with _id
    await db[collection].insert_one(dict(obj))

    return UpsertResponse(ok=True, id=obj_id, item=obj)


@router.patch("/admin/{collection}/{item_id}")
async def update_item(
    collection: CollectionName,
    item_id: str,
    patch: Dict[str, Any] = Body(...),
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    # List collections
    path = _file_for(collection)
    data = _load_json(path)
    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="Collection is not a list")
    i, by_id = _resolve_item_index(data, item_id)
    current = data[i]
    if not isinstance(current, dict):
        raise HTTPException(status_code=500, detail="Invalid item format")

    # Do not allow changing id to empty
    if "id" in patch and not str(patch["id"]).strip():
        raise HTTPException(status_code=400, detail="id cannot be empty")

    # Apply patch
    updated = {**current, **patch}

    # Keep slug unique if changed
    if updated.get("slug") and updated.get("slug") != current.get("slug"):
        updated["slug"] = _ensure_unique_slug(
            [it for j, it in enumerate(data) if j != i], str(updated["slug"]) or "item"
        )

    data[i] = updated
    _write_json(path, data)

    # Mongo update
    await _mongo_update_list_collection(
        mongodb=mongodb,
        collection=collection,
        data=data,
        by_id=by_id,
        item_id=item_id,
        updated=updated,
    )

    return {"ok": True, "item": updated}


@router.patch("/admin/resume")
async def update_resume(
    patch: Dict[str, Any] = Body(...),
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    # Dedicated endpoint for updating resume without an item_id
    path = _file_for("resume")
    original = _load_json(path)
    if not isinstance(patch, dict):
        raise HTTPException(status_code=400, detail="Patch must be an object")

    # Extract current object regardless of storage shape
    if isinstance(original, list):
        current_obj = dict(original[0]) if original else {}
        new_shape = "list"
    elif isinstance(original, dict):
        current_obj = dict(original)
        new_shape = "dict"
    else:
        raise HTTPException(status_code=400, detail="Invalid resume JSON format")

    # Apply shallow merge
    merged = {**current_obj, **patch}
    # Ensure we don't keep any Mongo-specific _id in file/response
    if isinstance(merged, dict) and "_id" in merged:
        # Accept either string or ObjectId; drop it to keep file format clean
        merged.pop("_id", None)

    # Persist, keeping original shape
    to_write: Any = [merged] if new_shape == "list" else merged
    _write_json(path, to_write)

    # Mongo: store as a single document (the merged object)
    db = mongodb.get_database()
    await db["resume"].delete_many({})
    # Important: PyMongo mutates the passed dict by adding _id (ObjectId) on the passed document.
    # Insert a shallow copy to avoid mutating the in-memory object used for the response.
    await db["resume"].insert_one(dict(merged))

    # Encode response safely: convert any ObjectId to string if present in nested structures
    response_payload = {"ok": True, "item": merged}
    return jsonable_encoder(response_payload, custom_encoder={ObjectId: str})


@router.delete("/admin/{collection}/{item_id}")
async def delete_item(
    collection: CollectionName,
    item_id: str,
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    if collection == "resume":
        raise HTTPException(status_code=400, detail="Cannot delete resume")

    path = _file_for(collection)
    data = _load_json(path)
    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="Collection is not a list")
    i, by_id = _resolve_item_index(data, item_id)
    removed = data.pop(i)
    _write_json(path, data)

    await _mongo_delete_list_collection(
        mongodb=mongodb,
        collection=collection,
        data=data,
        by_id=by_id,
        item_id=item_id,
    )

    return {"ok": True, "item": removed}
