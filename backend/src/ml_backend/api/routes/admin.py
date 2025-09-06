from collections import defaultdict
from datetime import datetime, timedelta, timezone
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


def _parse_dt(value: Optional[str], fallback: Optional[datetime] = None) -> datetime:
    if not value:
        assert fallback is not None
        return fallback
    vv = value.strip()
    # Support "Z" suffix
    if vv.endswith("Z"):
        vv = vv[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(vv)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid datetime: {value}") from e
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


# Fill any missing buckets with zeros for smoother charts
def _iter_buckets(start_dt: datetime, end_dt: datetime, granularity: Literal["hour", "day", "month"] = "day"):
    cur = start_dt
    step = {
        "hour": timedelta(hours=1),
        "day": timedelta(days=1),
        "month": None,
    }[granularity]
    if granularity == "month":
        cur = cur.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        while cur <= end_dt:
            yield cur.strftime("%Y-%m")
            # naive month increment
            year = cur.year + (cur.month // 12)
            month = 1 if cur.month == 12 else cur.month + 1
            cur = cur.replace(year=year, month=month)
    else:
        cur = cur.replace(minute=0, second=0, microsecond=0)
        if granularity == "day":
            cur = cur.replace(hour=0)
        while cur <= end_dt:
            if granularity == "hour":
                yield cur.strftime("%Y-%m-%dT%H:00Z")
            else:
                yield cur.strftime("%Y-%m-%d")
            cur = cur + step  # type: ignore


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


class EventOut(BaseModel):
    job_id: Optional[str] = None
    action: Optional[str] = None
    request_body: Optional[Dict[str, Any]] = None
    created_at: Optional[Any] = None


class EventsListResponse(BaseModel):
    ok: bool
    total: int
    items: List[EventOut]


class EventsAnalyticsResponse(BaseModel):
    ok: bool
    range: Dict[str, Any]
    actions: List[str]
    series: List[Dict[str, Any]]
    totals: Dict[str, Any]
    group_by: Literal["action", "location"] = "action"


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


# --- Analytics: events monitoring ---
@router.get("/admin/analytics/events", response_model=EventsAnalyticsResponse)
async def analytics_events(
    start: Optional[str] = None,
    end: Optional[str] = None,
    granularity: Literal["hour", "day", "month"] = "day",
    action: Optional[str] = None,
    group_by: Literal["action", "location"] = "action",
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    """Return aggregated website activity from 'events' collection.

    - start, end: ISO8601 timestamps (UTC). Defaults to last 7 days.
    - granularity: one of hour | day | month
    - action: filter by action. Multiple actions can be provided as a comma-separated list.
    """
    now = datetime.now(timezone.utc)
    default_start = now - timedelta(days=7)

    s_dt = _parse_dt(start, fallback=default_start)
    e_dt = _parse_dt(end, fallback=now)

    if s_dt > e_dt:
        raise HTTPException(status_code=400, detail="start must be <= end")

    # Normalize end to include the whole last bucket
    if granularity == "day":
        e_dt = e_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif granularity == "hour":
        e_dt = e_dt.replace(minute=59, second=59, microsecond=999999)

    actions_filter: Optional[List[str]] = None
    if action:
        actions_filter = [a.strip() for a in action.split(",") if a.strip()]

    db = mongodb.get_database()

    unit_map = {"hour": "hour", "day": "day", "month": "month"}
    unit = unit_map[granularity]

    match_stage: Dict[str, Any] = {
        "$match": {
            "created_at": {"$gte": s_dt, "$lte": e_dt},
        }
    }
    if actions_filter:
        match_stage["$match"]["action"] = {"$in": actions_filter}

    pipeline = [
        match_stage,
        {
            "$addFields": {
                "bucket": {
                    "$dateTrunc": {
                        "date": "$created_at",
                        "unit": unit,
                        "timezone": "UTC",
                    }
                }
            }
        },
        {
            "$group": {
                "_id": {"bucket": "$bucket", "group": "$action" if group_by == "action" else "$request_body.location"},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id.bucket": 1}},
    ]

    results = await db["events"].aggregate(pipeline).to_list(length=100_000)

    bucket_map: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    actions_set: set[str] = set()
    total_by_action: Dict[str, int] = defaultdict(int)
    total_all = 0

    for row in results:
        b_dt: datetime = row["_id"]["bucket"]
        act: str = row["_id"].get("group") or "unknown"
        cnt: int = int(row["count"])
        # Label bucket as ISO date/hour
        if granularity == "hour":
            label = b_dt.strftime("%Y-%m-%dT%H:00Z")
        elif granularity == "month":
            label = b_dt.strftime("%Y-%m")
        else:  # day
            label = b_dt.strftime("%Y-%m-%d")
        bucket_map[label][act] += cnt
        actions_set.add(act)
        total_by_action[act] += cnt
        total_all += cnt

    actions_list = sorted(actions_set)
    series: List[Dict[str, Any]] = []
    for label in _iter_buckets(s_dt, e_dt, granularity):
        by_act = bucket_map.get(label, {})
        item: Dict[str, Any] = {"bucket": label, "total": int(sum(by_act.values()))}
        for a in actions_list:
            item[a] = int(by_act.get(a, 0))
        series.append(item)

    return EventsAnalyticsResponse(
        ok=True,
        range={
            "start": s_dt.isoformat().replace("+00:00", "Z"),
            "end": e_dt.isoformat().replace("+00:00", "Z"),
            "granularity": granularity,
        },
        actions=actions_list,
        series=series,
        totals={
            "total": int(total_all),
            "byAction": {k: int(v) for k, v in total_by_action.items()},
        },
        group_by=group_by,
    )


@router.get("/admin/events", response_model=EventsListResponse)
async def list_events(
    start: Optional[str] = None,
    end: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    sort: Literal["asc", "desc"] = "desc",
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    """List raw events from 'events' collection."""
    q: Dict[str, Any] = {}
    s_dt = _parse_dt(start)
    e_dt = _parse_dt(end)

    if s_dt or e_dt:
        range_q: Dict[str, Any] = {}
        if s_dt:
            range_q["$gte"] = s_dt
        if e_dt:
            range_q["$lte"] = e_dt
        q["created_at"] = range_q

    if action:
        acts = [a.strip() for a in action.split(",") if a.strip()]
        if acts:
            q["action"] = {"$in": acts}

    db = mongodb.get_database()
    total = await db["events"].count_documents(q)

    cursor = db["events"].find(q, {"_id": 0})
    cursor = cursor.sort("created_at", -1 if sort == "desc" else 1)

    if skip:
        cursor = cursor.skip(skip)

    if limit:
        cursor = cursor.limit(max(1, min(limit, 500)))

    items = await cursor.to_list(length=limit or 50)
    return EventsListResponse(ok=True, total=total, items=items)
