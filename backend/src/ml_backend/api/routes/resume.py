import aiohttp
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from ml_backend.api.services import get_mongo_client
from ml_backend.databases import MongoDBConnector
from ml_backend.api.services.resume_pdf import load_resume_from_file, ResumePDFExporter

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


@router.get("/export", response_class=Response)
async def export_resume_pdf() -> Response:
    """Generate a one-page PDF resume from local JSON data."""
    try:
        resume = load_resume_from_file()
        pdf_bytes = ResumePDFExporter(resume).build_pdf()
        headers = {
            "Content-Disposition": 'attachment; filename="mathis_lambert_resume.pdf"'
        }
        return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"Resume data not found: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
