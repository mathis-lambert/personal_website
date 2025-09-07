import os
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from ml_backend.api.services import get_mongo_client
from ml_backend.databases import MongoDBConnector

router = APIRouter()


def _iso_date(value: Optional[str]) -> str:
    try:
        if value:
            # Accept YYYY-MM-DD or any ISO-ish string; fallback to today on error
            return datetime.fromisoformat(value[:10]).date().isoformat()
    except Exception:
        pass
    return datetime.now(timezone.utc).date().isoformat()


@router.get("/sitemap.xml", include_in_schema=False)
async def sitemap(
    mongodb: MongoDBConnector = Depends(get_mongo_client),
):
    """Generate a dynamic sitemap from projects and articles.

    Exposed at `/api/sitemap.xml` once included by the API router.
    """
    try:
        base_url = os.getenv("PUBLIC_BASE_URL", "https://mathislambert.fr").rstrip("/")

        db = mongodb.get_database()

        projects = (
            await db["projects"]
            .find({}, {"slug": 1, "date": 1, "_id": 0})
            .to_list(length=None)
        )
        articles = (
            await db["articles"]
            .find({}, {"slug": 1, "date": 1, "_id": 0})
            .to_list(length=None)
        )

        static_paths: List[tuple[str, str]] = [
            (f"{base_url}/", _iso_date(None)),
            (f"{base_url}/projects", _iso_date(None)),
            (f"{base_url}/blog", _iso_date(None)),
            (f"{base_url}/resume", _iso_date(None)),
        ]

        project_paths: List[tuple[str, str]] = [
            (f"{base_url}/projects/{p.get('slug')}", _iso_date(p.get("date")))
            for p in (projects or [])
            if p.get("slug")
        ]
        article_paths: List[tuple[str, str]] = [
            (f"{base_url}/blog/{a.get('slug')}", _iso_date(a.get("date")))
            for a in (articles or [])
            if a.get("slug")
        ]

        entries = []
        for loc, lastmod in static_paths + project_paths + article_paths:
            entries.append(
                f"  <url>\n"
                f"    <loc>{loc}</loc>\n"
                f"    <lastmod>{lastmod}</lastmod>\n"
                f"    <changefreq>weekly</changefreq>\n"
                f"    <priority>0.8</priority>\n"
                f"  </url>"
            )

        xml = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "\n".join(entries)
            + "\n</urlset>\n"
        )

        return Response(content=xml, media_type="application/xml")
    except HTTPException:
        raise
    except Exception:
        # Return a minimal valid sitemap on failure to avoid crawler errors
        fallback = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            f"  <url>\n    <loc>{os.getenv('PUBLIC_BASE_URL', 'https://mathislambert.fr').rstrip('/')}/</loc>\n    <lastmod>{datetime.utcnow().date().isoformat()}</lastmod>\n  </url>\n"
            "</urlset>\n"
        )
        return Response(content=fallback, media_type="application/xml")
